// Importing outside developed components.
import React, { useState } from "react";
// Promise based HTTP client - https://github.com/axios/axios.
const axios = require("axios");

// A function to request a list of stops from a user selected route going
// in specified direction - each of these are received as input.
export default function RouteStopsApi(routeSelect, originNumber) {
  // The response from the backend we need to track in state:
  const [routeStopsResponse, setRouteStopsResponse] = useState({
    route_stops_response: [],
  });
  // console.log("originNumber coming into RouteStopsApi", originNumber);

  // The Effect Hook used to perform side effects in this component.
  // https://reactjs.org/docs/hooks-effect.html.
  React.useEffect(
    () => {
      if (String(routeSelect) === "" || originNumber === 0) {
        // console.log("RouteStopsApi - undefined - got rendered");
        // initial render should be nothing.
        return undefined;
      } else if (originNumber === isNaN) {
        return undefined;
      } else {
        console.log(
          "RouteStopsApi - got rendered with the following values: ",
          routeSelect,
          originNumber
        );
        if (originNumber === 0) {
          setRouteStopsResponse({
            route_stops_response: [],
          });
        } else if (originNumber === isNaN) {
          setRouteStopsResponse({
            route_stops_response: [],
          });
        } else if (originNumber === "") {
          setRouteStopsResponse({
            route_stops_response: [],
          });
        } else {
          axios
            .get(`/api/route_stops`, {
              params: {
                chosenRoute: routeSelect,
                chosenStop: originNumber,
              },
            })
            .then((res) => {
              console.log("route select made it THIS FAR!", routeSelect);
              // const routeStopsResponse = res.data;
              setRouteStopsResponse(res.data);
            });
        }
      }
    },
    // Listening for changes in input values in order to
    // trigger a call to the API  to re-render the component.
    [routeSelect, originNumber]
  );

  return routeStopsResponse.route_stops_response;
}