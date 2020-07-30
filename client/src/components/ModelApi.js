// Importing outside developed components.
import React, { useState } from "react";
// Promise based HTTP client - https://github.com/axios/axios.
const axios = require("axios");

export default function ModelApi(props) {
  // The responses from the backend we need to track in state:
  const [message, setMessage] = useState({ message: "" });
  const [modelResponse, setModelResponse] = useState({ model_response: "" });
  // eslint-disable-next-line
  const [percentileResponse, setPercentileResponse] = useState();
  console.log("ModelApi - selected route here: )", props.routeSelect[0]);

  // The Effect Hook used to perform side effects in this component.
  // https://reactjs.org/docs/hooks-effect.html.
  React.useEffect(
    () => {
      if (
        props.routeSelect[0] === undefined ||
        props.directionSelect === undefined
      ) {
        // initial render should be nothing.
        return undefined;
      } else
        axios
          .get(`/api/model_result`, {
            params: {
              chosenRoute: props.routeSelect[0],
              chosenDirection: props.directionSelect,
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
              props.routeSelect[0],
              props.directionSelect,
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
              chosenRoute: props.routeSelect[0],
              chosenDirection: props.directionSelect,
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
    // eslint-disable-next-line
    [props]
    // // React Hook React.useEffect has a missing dependency: 'modelResponse.model_response'. Either include it or remove the dependency array.
    // TODO - Receiving the above error, find a fix - have disabled with eslint disable next line for now.
  );

  return (
    <div>
      <p>{message.message}</p>
    </div>
  );
}
