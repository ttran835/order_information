import React, { useState, useEffect } from 'react';
import { MDBBtn } from 'mdbreact';
import Axios from 'axios';

const postUrl = 'https://worker-test-centinela.herokuapp.com/api/v1/big-commerce/orders/post-job';
const getUrl = 'https://worker-test-centinela.herokuapp.com/api/v1/big-commerce/orders/get-jobs';

function Workers() {
  const [error, setError] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState('');

  const getJobs = async () => {
    try {
      const { data } = await Axios.get(getUrl);
      const lastJobs = data.slice(-20);
      setJobs([...lastJobs, ...jobs]);
    } catch (err) {
      console.error(err);
      setError(true);
      console.log(err.response);
      setErrMsg(err.response.data.message);
    }
  };

  useEffect(() => {
    (async () => getJobs())();
    // const interval = setInterval(() => getJobs(), 10000);
    // return () => clearInterval(interval);
  }, []);

  const sendRequest = async () => {
    try {
      const data = await Axios.post(postUrl);
      console.log({ data });
    } catch (err) {
      console.error(err);
      setError(true);
      setErrMsg(err.response.data.message);
    }
  };

  return (
    <>
      <MDBBtn onClick={sendRequest} color="primary">
        Send Request
      </MDBBtn>
      {jobs.map(({ id, progress }) => (
        <div key={id}>
          Jobid: {id}, progress: {progress}
        </div>
      ))}
      {error && <h2 className="text-red">{errMsg}</h2>}
    </>
  );
}

export default React.memo(Workers);
