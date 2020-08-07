// Importing outside developed components.
import React, { useState } from "react";
// Promise based HTTP client - https://github.com/axios/axios.
const axios = require("axios");

export default function ModelApi(props) {
  // The responses from the backend we need to track in state:
  const [message, setMessage] = useState({
    message: "",
    distance: "",
    instructions: "",
    num_stops: "",
  });
  const [modelResponse, setModelResponse] = useState({ model_response: "" });
  // eslint-disable-next-line
  const [percentileResponse, setPercentileResponse] = useState();
  // console.log("ModelApi - routeSelect here: ", props.routeSelect);
  // console.log("Here is directionSelect in ModelApi", props.directionSelect);
  const infoArray = [];
  if (props.distance !== null) {
    if (props.distance.selectedRouteArray[0] !== undefined) {
      for (var i = 0; i < props.distance.selectedRouteArray.length; i++) {
        for (
          var j = 0;
          j < props.distance.selectedRouteArray[i].legs.length;
          j++
        ) {
          for (
            var k = 0;
            k < props.distance.selectedRouteArray[i].legs[j].steps.length;
            k++
          ) {
            if (
              String(
                props.distance.selectedRouteArray[i].legs[j].steps[k]
                  .travel_mode
              ) === "TRANSIT"
            ) {
              // console.log("I made it this far");
              infoArray.push(
                props.distance.selectedRouteArray[i].legs[j].distance.text
              );
              infoArray.push(
                props.distance.selectedRouteArray[i].legs[j].steps[k]
                  .instructions
              );
              infoArray.push(
                props.distance.selectedRouteArray[i].legs[j].steps[k].transit
                  .headsign
              );
              infoArray.push(
                String(
                  props.distance.selectedRouteArray[i].legs[j].steps[k].transit
                    .num_stops
                ) + " stops"
              );
            }
          }
        }
      }
    }
  }
  console.log(infoArray);
  // The Effect Hook used to perform side effects in this component.
  // https://reactjs.org/docs/hooks-effect.html.
  React.useEffect(
    () => {
      if (
        String(props.routeSelect) === "" ||
        props.directionSelect === undefined
      ) {
        // initial render should be nothing.
        console.log("ModelApi - model_result (a) has been triggered");
        setModelResponse({
          model_response: "",
        });
        return undefined;
      } else {
        console.log(
          "ModelApi - model_result (c) has been triggered with: 1 routeSelect: ",
          props.routeSelect,
          "2: directionSelect",
          props.directionSelect
        );
        axios
          .get(`/api/model_result`, {
            params: {
              chosenRoute: props.routeSelect,
              chosenDirection: props.directionSelect,
              chosenTime: props.timeDayMonth[0],
              chosenMinute: props.timeDayMonth[1],
              chosenDay: props.timeDayMonth[2],
              chosenMonth: props.timeDayMonth[3],
            },
          })
          .then((res) => {
            const modelResponse = res.data;
            setModelResponse(modelResponse);

            console.log(
              "setModelResponse has been triggered with the following values - route:" +
                props.routeSelect,
              "direction:" + props.directionSelect,
              "hour:" + props.timeDayMonth[0],
              "minute:" + props.timeDayMonth[1],
              "day:" + props.timeDayMonth[2],
              "month" + props.timeDayMonth[3]
            );
          });
      }
    },
    // Listening for changes to props in order to
    // trigger a call to the API  to re-render the component.
    [props.routeSelect, props.directionSelect, props.timeDayMonth]
  );

  React.useEffect(
    () => {
      // Making sure nothing is renedered until stops have been chosen.
      if (
        props.directionSelect === undefined ||
        String(modelResponse.model_response) === "" ||
        props.destinationNumber === 0 ||
        props.originNumber === 0
      ) {
        console.log("ModelApi - percentile_result (a) has been triggered");
        // initial render should be nothing.
        setMessage({
          message: "",
          distance: "",
          instructions: "",
          num_stops: "",
        });
      } else {
        console.log(
          "And here is what ModelApi/percentile_result triggered with: 1 directionSelect: ",
          props.directionSelect,
          "2: modelResponse.model_response",
          modelResponse.model_response
        );
        axios
          .get(`/api/percentile_result`, {
            params: {
              chosenRoute: props.routeSelect,
              chosenDirection: props.directionSelect,
              chosenTime: props.timeDayMonth[0],
              chosenDay: props.timeDayMonth[2],
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
                distance: infoArray[0],
                instructions: infoArray[1],
                num_stops: infoArray[3],
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
      }
    },
    // Listening for changes to props in order to
    // trigger a call to the API  to re-render the component.
    // eslint-disable-next-line
    [
      props,
      modelResponse.model_response,
      props.routeSelect,
      props.originNumber,
      props.destinationNumber,
      props.distance,
    ]
    // // React Hook React.useEffect has a missing dependency: 'modelResponse.model_response'. Either include it or remove the dependency array.
    // TODO - Receiving the above error, find a fix - have disabled with eslint disable next line for now.
  );

  return (
    <div>
      <p>{message.message}</p>
      <p>{message.instructions}</p>
      <p>{message.distance}</p>
      <p>{message.num_stops}</p>
      {/* <p>{directionsResponse.directionsResponseMessage}</p> */}
    </div>
  );
}
