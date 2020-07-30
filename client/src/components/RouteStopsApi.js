// Importing outside developed components.
import React, { useState } from "react";
// Promise based HTTP client - https://github.com/axios/axios.
const axios = require("axios");

// A function to request a list of stops from a user selected route going
// in specified direction - each of these are received as input.
export default function RouteStopsApi(routeSelect, directionSelect) {
  // The response from the backend we need to track in state:
  const [routeStopsResponse, setRouteStopsResponse] = useState({
    route_stops_response: [],
  });

  // // React Hook React.useEffect has a missing dependency: 'routeSelect'. Either include it or remove the dependency array
  // // React Hook React.useEffect has a complex expression in the dependency array. Extract it to a separate variable so it can be statically checked
  // The variable below has been created to avoid the two errors above.
  const routeSelectMissingDependencyFix = routeSelect[0];

  // The Effect Hook used to perform side effects in this component.
  // https://reactjs.org/docs/hooks-effect.html.
  React.useEffect(
    () => {
      if (
        routeSelectMissingDependencyFix === undefined ||
        directionSelect === undefined
      ) {
        console.log("RouteStopsApi - undefined - got rendered");
        // initial render should be nothing.
        return undefined;
      } else
        console.log(
          "RouteStopsApi - got rendered with the following values: ",
          routeSelectMissingDependencyFix,
          directionSelect
        );
      axios
        .get(`/api/route_stops`, {
          params: {
            chosenRoute: routeSelectMissingDependencyFix,
            chosenDirection: directionSelect,
          },
        })
        .then((res) => {
          console.log(
            "route select made it THIS FAR!",
            routeSelectMissingDependencyFix
          );
          const routeStopsResponse = res.data;
          setRouteStopsResponse(routeStopsResponse);
        });
    },
    // Listening for changes in input values in order to
    // trigger a call to the API  to re-render the component.
    [routeSelectMissingDependencyFix, directionSelect]
  );

  return routeStopsResponse.route_stops_response;
}
