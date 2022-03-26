import { useEffect, useState } from 'react';

const useFillElectionFields = (electionData) => {
  const [electionTitle, setElectionTitle] = useState(null);
  const [configuration, setConfiguration] = useState(null);
  const [id, setId] = useState(null);
  const [status, setStatus] = useState(null);
  const [pubKey, setPubKey] = useState('');
  const [ballotSize, setBallotSize] = useState(0);
  const [result, setResult] = useState(null);
  const [isResultSet, setIsResultSet] = useState(false);

  useEffect(() => {
    if (electionData !== null) {
      setElectionTitle(electionData.Title);
      setConfiguration(electionData.Format);
      setId(electionData.ElectionID);
      setStatus(electionData.Status);
      setPubKey(electionData.Pubkey);
      setBallotSize(electionData.BallotSize);
      setResult(electionData.Result);
      if (electionData.Result.length > 0) {
        setIsResultSet(true);
      }
    }
  }, [electionData]);

  return {
    electionTitle,
    configuration,
    id,
    status,
    pubKey,
    ballotSize,
    result,
    setResult,
    setStatus,
    isResultSet,
    setIsResultSet,
  };
};

export default useFillElectionFields;
