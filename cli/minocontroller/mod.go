// Package controller implements a controller for minogrpc.
//
// The controller can be used in a CLI to inject a dependency for Mino. It will
// start the overlay on the start command, and make sure resources are cleaned
// when the CLI daemon is stopping.
//
// Documentation Last Review: 07.10.2020
//
package minocontroller

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"io"
	"math"
	"net"
	"path/filepath"
	"time"

	"go.dedis.ch/dela"
	"go.dedis.ch/dela/cli"
	"go.dedis.ch/dela/cli/node"
	"go.dedis.ch/dela/core/store/kv"
	"go.dedis.ch/dela/crypto/loader"
	"go.dedis.ch/dela/mino"
	"go.dedis.ch/dela/mino/minogrpc"
	"go.dedis.ch/dela/mino/minogrpc/certs"
	"go.dedis.ch/dela/mino/minogrpc/session"
	"go.dedis.ch/dela/mino/router/tree"
	"golang.org/x/xerrors"
)

const certKeyName = "cert.key"

// MiniController is an initializer with the minimum set of commands.
//
// - implements node.Initializer
type miniController struct {
	random io.Reader
	curve  elliptic.Curve
}

// NewController returns a new initializer to start an instance of Minogrpc.
func NewController() node.Initializer {
	return miniController{
		random: rand.Reader,
		curve:  elliptic.P521(),
	}
}

// Build implements node.Initializer. It populates the builder with the commands
// to control Minogrpc.
func (m miniController) SetCommands(builder node.Builder) {
	builder.SetStartFlags(
		cli.IntFlag{
			Name:  "port",
			Usage: "set the port to listen on",
			Value: 2000,
		},
		cli.BoolFlag{
			Name:  "externalip",
			Usage: "will try to get a non-loopback IP address, instead of 127.0.0.1",
			Value: false,
		},
	)

	cmd := builder.SetCommand("minogrpc")
	cmd.SetDescription("Network overlay administration")

	sub := cmd.SetSubCommand("certificates")
	sub.SetDescription("list the certificates of the server")
	sub.SetAction(builder.MakeAction(certAction{}))

	sub = cmd.SetSubCommand("token")
	sub.SetDescription("generate a token to share to others to join the network")
	sub.SetFlags(
		cli.DurationFlag{
			Name:  "expiration",
			Usage: "amount of time before expiration",
			Value: 24 * time.Hour,
		},
	)
	sub.SetAction(builder.MakeAction(tokenAction{}))

	sub = cmd.SetSubCommand("join")
	sub.SetDescription("join a network of participants")
	sub.SetFlags(
		cli.StringFlag{
			Name:     "token",
			Usage:    "secret token generated by the node to join",
			Required: true,
		},
		cli.StringFlag{
			Name:     "address",
			Usage:    "address of the node to join",
			Required: true,
		},
		cli.StringFlag{
			Name:     "cert-hash",
			Usage:    "certificate hash of the distant server",
			Required: true,
		},
	)
	sub.SetAction(builder.MakeAction(joinAction{}))
}

// OnStart implements node.Initializer. It starts the minogrpc instance and
// injects it in the dependency resolver.
func (m miniController) OnStart(ctx cli.Flags, inj node.Injector) error {

	port := ctx.Int("port")
	if port < 0 || port > math.MaxUint16 {
		return xerrors.Errorf("invalid port value %d", port)
	}

	rter := tree.NewRouter(minogrpc.NewAddressFactory())

	var err error
	ip := "127.0.0.1"

	if ctx.Bool("externalip") {
		ip, err = getExternalIP()
		if err != nil {
			return xerrors.Errorf("failed to get external IP address: %v", err)
		}
	}

	addr := minogrpc.ParseAddress(ip, uint16(port))

	var db kv.DB
	err = inj.Resolve(&db)
	if err != nil {
		return xerrors.Errorf("injector: %v", err)
	}

	certs := certs.NewDiskStore(db, session.AddressFactory{})

	key, err := m.getKey(ctx)
	if err != nil {
		return xerrors.Errorf("cert private key: %v", err)
	}

	opts := []minogrpc.Option{
		minogrpc.WithStorage(certs),
		minogrpc.WithCertificateKey(key, key.Public()),
	}

	o, err := minogrpc.NewMinogrpc(addr, rter, opts...)
	if err != nil {
		return xerrors.Errorf("couldn't make overlay: %v", err)
	}

	inj.Inject(o)

	dela.Logger.Info().Msgf("%v is running", o)

	return nil
}

// StoppableMino is an extension of Mino to allow one to stop the instance.
type StoppableMino interface {
	mino.Mino

	GracefulStop() error
}

// OnStop implements node.Initializer. It stops the network overlay.
func (m miniController) OnStop(inj node.Injector) error {
	var o StoppableMino
	err := inj.Resolve(&o)
	if err != nil {
		return xerrors.Errorf("injector: %v", err)
	}

	err = o.GracefulStop()
	if err != nil {
		return xerrors.Errorf("while stopping mino: %v", err)
	}

	return nil
}

func (m miniController) getKey(flags cli.Flags) (*ecdsa.PrivateKey, error) {
	loader := loader.NewFileLoader(filepath.Join(flags.Path("config"), certKeyName))

	keydata, err := loader.LoadOrCreate(newGenerator(m.random, m.curve))
	if err != nil {
		return nil, xerrors.Errorf("while loading: %v", err)
	}

	key, err := x509.ParseECPrivateKey(keydata)
	if err != nil {
		return nil, xerrors.Errorf("while parsing: %v", err)
	}

	return key, nil
}

// generator can generate a private key compatible with the x509 certificate.
//
// - implements loader.Generator
type generator struct {
	random io.Reader
	curve  elliptic.Curve
}

func newGenerator(r io.Reader, c elliptic.Curve) loader.Generator {
	return generator{
		random: r,
		curve:  c,
	}
}

// Generate implements loader.Generator. It returns the serialized data of a
// private key generated from the an elliptic curve. The data is formatted as a
// PEM block "EC PRIVATE KEY".
func (g generator) Generate() ([]byte, error) {
	priv, err := ecdsa.GenerateKey(g.curve, g.random)
	if err != nil {
		return nil, xerrors.Errorf("ecdsa: %v", err)
	}

	data, err := x509.MarshalECPrivateKey(priv)
	if err != nil {
		return nil, xerrors.Errorf("while marshaling: %v", err)
	}

	return data, nil
}

// getExternalIP returns an external IP, which is up and a loopback one. Taken
// from https://stackoverflow.com/a/23558495
func getExternalIP() (string, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return "", xerrors.Errorf("failed to get interfaces: %v", err)
	}

	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 {
			continue // interface down
		}
		if iface.Flags&net.FlagLoopback != 0 {
			continue // loopback interface
		}

		addrs, err := iface.Addrs()
		if err != nil {
			return "", xerrors.Errorf("failed to get addresses: %v", err)
		}

		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}

			if ip == nil || ip.IsLoopback() {
				continue
			}

			ip = ip.To4()
			if ip == nil {
				continue // not an ipv4 address
			}
			return ip.String(), nil
		}
	}
	return "", xerrors.New("no external IP found. Are you connected to a network?")
}