import React from "react";
import { Marker, MarkerClusterer } from "@react-google-maps/api";

// Icons used when Markers are clustered.
const options = {
  imagePath:
    "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
};
const icon = require("../data/icon");
const stops = require("../data/myStops");
const myStops = stops.default;

// Function that renders all of the Dublin Bus stops in clustered form.
// props.markerSelection being set to True means that they will all be displayed on
// the first load. When a route is chosen from the RouteMarkers function above,
// props.markerSelection gets set to False and all of the markers are removed.
export default function ClusteredMarkers(props) {
  if (props.markerSelection === true) {
    return (
      <MarkerClusterer options={options} maxZoom={15} minimumClusterSize={4}>
        {(clusterer) =>
          myStops.map((stop) => (
            <Marker
              icon={icon.default}
              key={stop.properties.id}
              position={stop.geometry.pos}
              clusterer={clusterer}
              onLoad={(marker) => props.markerLoadHandler(marker, stop)}
              onClick={(event) => props.markerClickHandler(event, stop)}
            />
          ))
        }
      </MarkerClusterer>
    );
  } else {
    return null;
  }
}
