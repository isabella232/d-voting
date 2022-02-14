import React, { FC, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import kyber from "@dedis/kyber";
import PropTypes from "prop-types";
import { Buffer } from "buffer";

import useElection from "../utils/useElection";
import usePostCall from "../utils/usePostCall";
import { CAST_BALLOT_ENDPOINT } from "../utils/Endpoints";
import Modal from "../modal/Modal";
import { OPEN } from "../utils/StatusNumber";
import { encryptVote } from "./VoteEncrypt";
import "../../styles/Ballot.css";

const Ballot: FC = (props) => {
  var bytes: number[];
  const { t } = useTranslation();
  const { electionId } = useParams();
  const token = sessionStorage.getItem("token");
  const { loading, title, candidates, electionID, status, pubKey } =
    useElection(electionId, token);
  const [choice, setChoice] = useState("");
  const [userErrors, setUserErrors] = useState({ noCandidate: "" });
  const edCurve = kyber.curve.newCurve("edwards25519");
  const [postRequest, setPostRequest] = useState(null);
  const [postError, setPostError] = useState(null);
  const { postData } = usePostCall(setPostError);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState(t("voteSuccess") as string);

  useEffect(() => {
    if (postRequest !== null) {
      setPostError(null);
      postData(CAST_BALLOT_ENDPOINT, postRequest, setShowModal);
    }
  }, [postData, postRequest]);

  useEffect(() => {
    if (postError !== null) {
      if (postError.includes("ECONNREFUSED")) {
        setModalText(t("errorServerDown"));
      } else {
        setModalText(t("voteFailure"));
      }
    } else {
      setModalText(t("voteSuccess"));
    }
  }, [postError, t]);

  const handleCheck = (e) => {
    setChoice(e.target.value);
  };

  const hexToBytes = (hex) => {
    for (var c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
    return new Uint8Array(bytes);
  };

  const createBallot = (K, C) => {
    let vote = JSON.stringify({ K: Array.from(K), C: Array.from(C) });
    return {
      ElectionID: electionID,
      UserId: sessionStorage.getItem("id"),
      Ballot: Buffer.from(vote),
      Token: token,
    };
  };

  const sendBallot = async () => {
    const [K, C] = encryptVote(
      choice,
      Buffer.from(hexToBytes(pubKey).buffer),
      edCurve
    );

    //sending the ballot to evoting server
    let ballot = createBallot(K, C);
    let newRequest = {
      method: "POST",
      body: JSON.stringify(ballot),
    };
    setPostRequest(newRequest);
  };

  const handleClick = () => {
    if (choice === "") {
      userErrors.noCandidate = t("noCandidate");
      setUserErrors(userErrors);
      return;
    }
    sendBallot();
    userErrors.noCandidate = "";
    setUserErrors(userErrors);
  };

  const electionClosedDisplay = () => {
    return <div> {t("voteImpossible")}</div>;
  };

  const possibleChoice = (candidate) => {
    return (
      <div className="checkbox-full">
        <input
          type="checkbox"
          key={candidate}
          className="checkbox-candidate"
          value={candidate}
          checked={choice === candidate} //only one checkbox can be selected
          onChange={handleCheck}
        />
        <label className="checkbox-label">{candidate}</label>
      </div>
    );
  };

  const ballotDisplay = () => {
    return (
      <div>
        <h3 className="ballot-title">{title}</h3>
        <div className="checkbox-text">{t("pickCandidate")}</div>
        {candidates !== null && candidates.length !== 0 ? (
          candidates.map((candidate) => possibleChoice(candidate))
        ) : (
          <p>Default</p>
        )}
        {candidates !== null ? (
          <div>
            <div className="cast-ballot-error">{userErrors.noCandidate}</div>
            <button className="cast-ballot-btn" onClick={handleClick}>
              {t("castVote")}
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="ballot-wrapper">
      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        textModal={modalText}
        buttonRightText={t("close")}
      />
      {loading ? (
        <p className="loading">{t("loading")}</p>
      ) : (
        <div>
          {" "}
          {status === OPEN ? ballotDisplay() : electionClosedDisplay()}
          <Link to="/vote">
            <button className="back-btn">{t("back")}</button>
          </Link>
        </div>
      )}
    </div>
  );
};

Ballot.propTypes = {
  location: PropTypes.any,
};

export default Ballot;