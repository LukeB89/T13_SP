// Importing outside developed components.
import React, { useState } from "react";
import ListGroup from "react-bootstrap/ListGroup";
// Promise based HTTP client - https://github.com/axios/axios.
const axios = require("axios");

export default function ModelApi(props) {
  // The responses from the backend we need to track in state:
  const [message, setMessage] = useState({
    message: "",
    distance: "",
    headsign: "",
    num_stops: "",
  });
  const [modelResponse, setModelResponse] = useState({ model_response: "" });
  // eslint-disable-next-line
  const [percentileResponse, setPercentileResponse] = useState();
  // Extracting information from the Google Directions response object.
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
              infoArray.push(
                props.distance.selectedRouteArray[i].legs[j].distance.text
              );
              infoArray.push(
                props.distance.selectedRouteArray[i].legs[j].steps[k].transit
                  .line.short_name
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

  // The Effect Hook used to perform side effects in this component.
  // https://reactjs.org/docs/hooks-effect.html.
  React.useEffect(
    () => {
      if (
        String(props.routeSelect) === "" ||
        props.directionSelect === undefined
      ) {
        // initial render should be nothing.

        return undefined;
      } else {
        axios
          // .get(`/model_result`, {
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
        // initial render should be nothing.
        setMessage({
          message: "",
          distance: "",
          headsign: "",
          num_stops: "",
        });
      } else {
        axios
          // .get(`/percentile_result`, {
          .get(`/api/percentile_result`, {
            params: {
              chosenRoute: props.routeSelect,
              chosenDirection: props.directionSelect,
              chosenTime: props.timeDayMonth[0],
              chosenDay: props.timeDayMonth[2],
              chosenMonth: props.timeDayMonth[3],
              origin: props.originNumber,
              destination: props.destinationNumber,
              modelResponse: modelResponse.model_response,
            },
          })
          .then((res) => {
            const percentileResponse = res.data;
            setPercentileResponse(percentileResponse);
            // In cases where there is no modelling data.
            if (
              typeof percentileResponse.percentile_response === "string" &&
              props.distance !== null
            ) {
              // Where no Google data exists to draw.
              if (props.distance.selectedRouteArray.length === 0) {
                setMessage({
                  message:
                    "😱 " + String(percentileResponse.percentile_response),
                  distance: "",
                  headsign: "",
                  num_stops: "",
                });
              }
              // Where Google data exists but not modelling data.
              else if (props.distance.selectedRouteArray !== 0) {
                setMessage({
                  message:
                    "😱 " + String(percentileResponse.percentile_response),
                  distance:
                    "The distance is approximately " + infoArray[0] + ",",
                  headsign:
                    "You can take the bus with the destination indicator " +
                    String(infoArray[1]).toUpperCase() +
                    " - " +
                    infoArray[2] +
                    ".",
                  num_stops:
                    "There will be " + infoArray[3] + " on this journey.",
                });
              }
            }
            // Normal case using a combination of modelling data and Google data for instructing user.
            else {
              setMessage({
                message:
                  "Your journey is estimated to take " +
                  Math.abs(percentileResponse.percentile_response) +
                  " minutes.",
                distance: "The distance is approximately " + infoArray[0] + ".",
                headsign:
                  "The destination indicator is " +
                  String(infoArray[1]).toUpperCase() +
                  " - " +
                  infoArray[2] +
                  ".",
                num_stops:
                  "There will be " + infoArray[3] + " on this journey.",
              });
            }
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
    <ListGroup variant="flush">
      <ListGroup.Item className="centerText">{message.message}</ListGroup.Item>
      <ListGroup.Item className="centerText">{message.headsign}</ListGroup.Item>
      <ListGroup.Item className="centerText">{message.distance}</ListGroup.Item>
      <ListGroup.Item className="centerText">
        {message.num_stops}
      </ListGroup.Item>
    </ListGroup>
  );
}
