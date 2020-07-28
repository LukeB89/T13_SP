import React, { useState } from "react";

const axios = require("axios");

export default function ModelApi(props) {
  const [message, setMessage] = useState({ message: "" });
  const [modelResponse, setModelResponse] = useState({ model_response: "" });
  const [percentileResponse, setPercentileResponse] = useState();

  React.useEffect(
    () => {
      if (parseInt(props.timeDayMonth) === 0) {
        // initial render should be nothing.
        return undefined;
      } else
        axios
          .get(`/api/model_result`, {
            params: {
              chosenTime: props.timeDayMonth[0],
              chosenDay: props.timeDayMonth[1],
              chosenMonth: props.timeDayMonth[2],
            },
          })
          .then((res) => {
            const modelResponse = res.data;
            setModelResponse(modelResponse);

            console.log(
              "setModelResponse has been triggered with the following values: ",
              props.timeDayMonth[0],
              props.timeDayMonth[1],
              props.timeDayMonth[2]
            );
          });
    },
    // Listening for changes to props in order to
    // trigger a call to the API  to re-render the component.
    [props]
  );

  React.useEffect(
    () => {
      // Making sure nothing is renedered until stops have been chosen.
      if (
        parseInt(props.originNumber) === 0 ||
        parseInt(props.destinationNumber) === 0
      ) {
        // initial render should be nothing.
        return undefined;
      } else
        axios
          .get(`/api/percentile_result`, {
            params: {
              chosenTime: props.timeDayMonth[0],
              chosenDay: props.timeDayMonth[1],
              // chosenMonth: props.timeDayMonth[2],
              origin: props.originNumber,
              destination: props.destinationNumber,
              modelResponse: modelResponse.model_response,
            },
          })
          .then((res) => {
            const percentileResponse = res.data;
            setPercentileResponse(percentileResponse);
            if (parseInt(percentileResponse.percentile_response) < 0) {
              setMessage({
                message: "Please enter a correct combination of stops",
              });
            } else if (parseInt(percentileResponse.percentile_response) === 1) {
              setMessage({
                message:
                  "This journey is estimated to take " +
                  percentileResponse.percentile_response +
                  " minute.",
              });
            } else {
              setMessage({
                message:
                  "This journey is estimated to take " +
                  percentileResponse.percentile_response +
                  " minutes.",
              });
            }

            console.log(
              "setPercentileResponse has been triggered with the following values: ",
              props.timeDayMonth[0],
              props.timeDayMonth[1],
              props.originNumber,
              props.destinationNumber,
              modelResponse.model_response
            );
          });
    },
    // Listening for changes to props in order to
    // trigger a call to the API  to re-render the component.
    [props]
  );

  return (
    <div>
      <p>{message.message}</p>
    </div>
  );
}
