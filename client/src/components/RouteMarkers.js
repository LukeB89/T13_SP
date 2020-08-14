import React from "react";
import { Marker } from "@react-google-maps/api";

const icon = require("../data/icon");
const stops = require("../data/myStops");
const myStops = stops.default;

// Function that filters the markers on the map
// according to a user selected route.
export default function RouteMarkers(props) {
  const filteredMarkers = [];
  const filteredStopStrings = [];
  const filteredStopsCoords = [];

  for (var i = 0; i < myStops.length; i++) {
    if (
      String(props.routeString) !== "" &&
      props.subMarkerSelection === false
    ) {
      for (var j = 0; j < myStops[i].properties.routes.length; j++) {
        if (String(myStops[i].properties.routes[j]) === props.routeString) {
          filteredMarkers.push(myStops[i]);
          filteredStopStrings.push(myStops[i].description);
          filteredStopsCoords.push(myStops[i].geometry.pos);
        }
      }
    } else if (props.subMarkerSelection === true)
      for (var k = 0; k < props.directionStopNumbers.length; k++) {
        if (
          parseInt(myStops[i].properties.id) === props.directionStopNumbers[k]
        ) {
          filteredMarkers.push(myStops[i]);
          filteredStopStrings.push(myStops[i].description);
          filteredStopsCoords.push(myStops[i].geometry.pos);
        }
      }
  }

  const uniqueMarkers = filteredMarkers.filter(
    (a, b) => filteredMarkers.indexOf(a) === b
  );

  const bounds = new window.google.maps.LatLngBounds(); // create an empty new bounds object
  for (i = 0; i < filteredStopsCoords.length; i++) {
    bounds.extend(filteredStopsCoords[i]);
  }
  // To render every bus stop associated with the selected route.
  if (String(props.routeString) !== "" && props.subMarkerSelection === false) {
    return uniqueMarkers.map((stop) => (
      <Marker
        icon={icon.default}
        key={stop.properties.id}
        position={stop.geometry.pos}
        onLoad={(marker) => {
          props.filteredStopsLatLngChoice(filteredStopsCoords);
          props.filteredStopsChoice(filteredStopStrings);
          props.markerSelectionChoice(false);
          props.markerLoadHandler(marker, stop);
          // Changing the bounds to fit map to chosen route's markers.
          props.mapRef.current.fitBounds(bounds);
          // props.mapRef.current.setZoom(13);
        }}
        onClick={(event) => {
          props.markerClickHandler(event, stop);
        }}
        animation={window.google.maps.Animation.DROP}
      />
    ));
  }
  // To render only the bus stops associated with the selected stop on the selected route.
  else if (
    props.directionStopNumbers.length > 1 &&
    props.subMarkerSelection === true
  ) {
    return uniqueMarkers.map((stop) => (
      <Marker
        icon={icon.default}
        key={stop.properties.id}
        position={stop.geometry.pos}
        onLoad={(marker) => {
          props.filteredStopsLatLngChoice(filteredStopsCoords);
          props.filteredStopsChoice(filteredStopStrings);
          props.setRouteString("");
          props.markerLoadHandler(marker, stop);
          // Changing the bounds to fit map to chosen route's markers.
          props.mapRef.current.fitBounds(bounds);
          // props.mapRef.current.setZoom(13);
        }}
        onClick={(event) => {
          props.markerClickHandler(event, stop);
        }}
        animation={window.google.maps.Animation.DROP}
      />
    ));
  } else {
    return null;
  }
}
