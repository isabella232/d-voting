package types

import (
	"fmt"
	"go.dedis.ch/kyber/v3"
	"golang.org/x/xerrors"
	"math"
	"strconv"
	"strings"
)

type ID string

// todo : status should be string ?
type status uint16

const (
	Initial         status = 0
	Open            status = 1
	Closed          status = 2
	ShuffledBallots status = 3
	// DecryptedBallots = 4
	ResultAvailable status = 5
	Canceled        status = 6
)

// Election contains all information about a simple election
type Election struct {
	Configuration Configuration

	// ElectionID is the hex-encoded SHA256 of the transaction ID that creates
	// the election
	ElectionID string

	AdminID string
	Status  status // Initial | Open | Closed | Shuffling | Decrypting
	Pubkey  []byte

	// BallotSize represents the total size of one ballot. It is used to pad
	// smaller ballots such that all  ballots cast have the same size
	BallotSize int

	// EncryptedBallots is a map from User ID to their ballot ciphertext
	// EncryptedBallots map[string][]byte
	EncryptedBallots EncryptedBallots

	// ShuffleInstances is all the shuffles, along with their proof and identity
	// of shuffler.
	ShuffleInstances []ShuffleInstance

	// ShuffleThreshold is set based on the roster. We save it so we don't have
	// to compute it based on the roster each time we need it.
	ShuffleThreshold int

	DecryptedBallots []Ballot

	// roster is once set when the election is created based on the current
	// roster of the node stored in the global state. The roster won't change
	// during an election and will be used for DKG and Neff. Its type is
	// authority.Authority.
	RosterBuf []byte
}

// ShuffleInstance is an instance of a shuffle, it contains the shuffled ballots,
// the proofs and the identity of the shuffler.
type ShuffleInstance struct {
	// ShuffledBallots contains the list of shuffled ciphertext for this round
	ShuffledBallots []Ciphertexts

	// ShuffleProofs is the proof of the shuffle for this round
	ShuffleProofs []byte

	// ShufflerPublicKey is the key of the node who made the given shuffle.
	ShufflerPublicKey []byte
}

// Ballot contains all information about a simple ballot
type Ballot struct {

	// SelectResult contains the result of each Select question. The result of a
	// select is a list of boolean that says for each choice if it has been
	// selected or not.  The ID slice is used to map a question ID to its index
	// in the SelectResult slice
	SelectResultIDs []ID
	SelectResult    [][]bool

	// RankResult contains the result of each Rank question. The result of a
	// rank question is the list of ranks for each choice. A choice that hasn't
	// been ranked will have a value < 0. The ID slice is used to map a question
	// ID to its index in the RankResult slice
	RankResultIDs []ID
	RankResult    [][]int8

	// TextResult contains the result of each Text question. The result of a
	// text question is the list of text answer for each choice. The ID slice is
	// used to map a question ID to its index in the TextResult slice
	TextResultIDs []ID
	TextResult    [][]string
}

// Unmarshal decodes the given string according to the format described in
// "state of smart contract.md"
func (b *Ballot) Unmarshal(marshalledBallot string, e Election) error {
	if len(marshalledBallot) > e.BallotSize {
		return fmt.Errorf("ballot has an unexpected size %d, expected <= %d",
			len(marshalledBallot), e.BallotSize)
	}

	lines := strings.Split(marshalledBallot, "\n")

	b.SelectResultIDs = make([]ID, 0)
	b.SelectResult = make([][]bool, 0)

	b.RankResultIDs = make([]ID, 0)
	b.RankResult = make([][]int8, 0)

	b.TextResultIDs = make([]ID, 0)
	b.TextResult = make([][]string, 0)

	for _, line := range lines {
		question := strings.Split(line, ":")
		if len(question) != 3 {
			return fmt.Errorf("a line in the ballot has length != 3")
		}

		//TODO: check ID is valid (in each case)
		//TODO: check length of selections, ranks, texts is = to # of choices of the Q.

		switch question[0] {
		case "select":
			b.SelectResultIDs = append(b.SelectResultIDs, ID(question[1]))
			b.SelectResult = append(b.SelectResult, make([]bool, 0))
			index := len(b.SelectResult) - 1

			selections := strings.Split(question[2], ",")
			for _, selection := range selections {
				s, err := strconv.ParseBool(selection)
				if err != nil {
					return fmt.Errorf("could not parse selection value for Q.%s: %v",
						question[1], err)
				}

				b.SelectResult[index] = append(b.SelectResult[index], s)
			}

		case "rank":
			b.RankResultIDs = append(b.RankResultIDs, ID(question[1]))
			b.RankResult = append(b.RankResult, make([]int8, 0))
			index := len(b.RankResult) - 1

			ranks := strings.Split(question[2], ",")
			for _, rank := range ranks {
				r, err := strconv.ParseInt(rank, 10, 8)
				if err != nil {
					return fmt.Errorf("could not parse rank value for Q.%s : %v",
						question[1], err)
				}

				b.RankResult[index] = append(b.RankResult[index], int8(r))
			}

		case "text":
			b.TextResultIDs = append(b.TextResultIDs, ID(question[1]))
			b.TextResult = append(b.TextResult, make([]string, 0))
			index := len(b.TextResult) - 1

			texts := strings.Split(question[2], ",") //TODO: there can be a ',' in our string :(
			for _, text := range texts {
				b.TextResult[index] = append(b.TextResult[index], text)
			}

		default:
			return fmt.Errorf("question type is unknown")
		}

	}

	return nil
}

// Configuration contains the configuration of a new poll.
type Configuration struct {
	MainTitle string
	Scaffold  []Subject
}

// MaxBallotSize returns the maximum number of bytes required to store a ballot
func (c *Configuration) MaxBallotSize() int {
	size := 0
	for _, subject := range c.Scaffold {
		size += subject.MaxEncodedSize()
	}
	return size
}

// Subject is a wrapper around multiple questions that can be of type "select",
// "rank", or "text".
type Subject struct {
	ID ID

	Title string

	// Order defines the order of the different question, which all have a unique
	// identifier. This is purely for display purpose.
	Order []ID

	Subjects []Subject
	Selects  []Select
	Ranks    []Rank
	Texts    []Text
}

// MaxEncodedSize returns the maximum amount of bytes taken to store the
// questions in this subject once encoded in a ballot
func (s *Subject) MaxEncodedSize() int {
	//TODO: Review & test
	size := 0

	for _, subject := range s.Subjects {
		size += subject.MaxEncodedSize()
	}

	for _, rank := range s.Ranks {
		size += len("rank::")
		size += len(rank.ID)
		// at most 4 bytes (-128) + ',' per rank
		size += len(rank.Choices) * 5
	}

	for _, selection := range s.Selects {
		size += len("select::")
		size += len(selection.ID)
		// 5 bytes ("false") + ',' per choice
		size += len(selection.Choices) * 6
	}

	for _, text := range s.Texts {
		size += len("text::")
		size += len(text.ID)
		size += (int(text.MaxLength)+1)*int(text.MaxN) +
			int(math.Max(float64(len(text.Choices)-int(text.MaxN)), 0))
	}

	// Last line doesn't have a '\n'
	size -= 1

	return size
}

// Select describes a "select" question, which requires the user to select one
// or multiple choices.
type Select struct {
	ID ID

	Title   string
	MaxN    int16
	MinN    int16
	Choices []string
}

// Rank describes a "rank" question, which requires the user to rank choices.
type Rank struct {
	ID ID

	Title   string
	MaxN    int16
	MinN    int16
	Choices []string
}

// Text describes a "text" question, which allows the user to enter free text.
type Text struct {
	ID ID

	Title     string
	MaxN      int16
	MinN      int16
	MaxLength int16
	Regex     string
	Choices   []string
}

// EncryptedBallots maintains a list of encrypted ballots with the associated
// user ID.
type EncryptedBallots struct {
	UserIDs []string
	Ballots []Ciphertexts
}

// CastVote updates a user's vote or add a new vote and its associated user.
func (e *EncryptedBallots) CastVote(userID string, encryptedVote Ciphertexts) {
	for i, u := range e.UserIDs {
		if u == userID {
			e.Ballots[i] = encryptedVote
			return
		}
	}

	e.UserIDs = append(e.UserIDs, userID)
	e.Ballots = append(e.Ballots, encryptedVote.Copy())
}

// GetBallotFromUser returns the ballot associated to a user. Returns nil if
// user is not found.
func (e *EncryptedBallots) GetBallotFromUser(userID string) (Ciphertexts, bool) {
	for i, u := range e.UserIDs {
		if u == userID {
			return e.Ballots[i].Copy(), true
		}
	}

	return Ciphertexts{}, false
}

// DeleteUser removes a user and its associated votes if found.
func (e *EncryptedBallots) DeleteUser(userID string) bool {
	for i, u := range e.UserIDs {
		if u == userID {
			e.UserIDs = append(e.UserIDs[:i], e.UserIDs[i+1:]...)
			e.Ballots = append(e.Ballots[:i], e.Ballots[i+1:]...)
			return true
		}
	}

	return false
}

// Ciphertexts represents a list of Ciphertext
type Ciphertexts []Ciphertext

// GetKsCs returns corresponding kyber.Points from the ciphertexts
func (c Ciphertexts) GetKsCs() (ks []kyber.Point, cs []kyber.Point, err error) {
	ks = make([]kyber.Point, len(c))
	cs = make([]kyber.Point, len(c))

	for i, ct := range c {
		k, c, err := ct.GetPoints()
		if err != nil {
			return nil, nil, xerrors.Errorf("failed to get points: %v", err)
		}

		ks[i] = k
		cs[i] = c
	}

	return ks, cs, nil
}

// Copy returns a deep copy of Ciphertexts
func (c Ciphertexts) Copy() Ciphertexts {
	ciphertexts := make([]Ciphertext, len(c))

	for i, ciphertext := range c {
		ciphertexts[i] = ciphertext.Copy()
	}

	return ciphertexts
}

// InitFromKsCs sets the ciphertext based on ks, cs
func (c *Ciphertexts) InitFromKsCs(ks []kyber.Point, cs []kyber.Point) error {
	if len(ks) != len(cs) {
		return xerrors.Errorf("ks and cs must have same length: %d != %d",
			len(ks), len(cs))
	}

	*c = make([]Ciphertext, len(ks))

	for i := range ks {
		var ct Ciphertext

		err := ct.FromPoints(ks[i], cs[i])
		if err != nil {
			return xerrors.Errorf("failed to init ciphertext: %v", err)
		}

		(*c)[i] = ct
	}

	return nil
}
