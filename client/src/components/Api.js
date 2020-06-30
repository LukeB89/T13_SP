import React, { useState, useEffect } from "react";
import axios from "axios";

const Api = (props) => {
  useEffect(() => {
    axios.get("/api/hello").then((res) => setState(res.data));
  }, []);

  const [state, setState] = useState("");

  return (
    <div>
      <p>Information from database:</p>
      <p>{state.response_text}</p>
    </div>
  );
};

export default Api;
