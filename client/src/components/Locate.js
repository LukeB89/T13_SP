import React from "react";

const dublinCenter = require("../data/DublinCenter.json");

// A useful thing for this function would be to highlight all
// of the stops that are within, say, 50m of the user.
// Think about how to acheive this.

// Generate an icon for display at the top right hand
// corner of the map which when clicked will
// adjust the map to the users location.
function Locate({
  // Receiving props - Function defined in App.js.
  panToGeoMarker,
  // Receiving props - Variable defined in App.js.
  setResponse,
}) {
  return (
    <button
      className="locate"
      onClick={() => {
        navigator.geolocation.getCurrentPosition(
          // Hard coding Dublin for the time being.
          (position) => {
            panToGeoMarker({
              // lat: position.coords.latitude,
              // lng: position.coords.longitude,
              lat: dublinCenter.lat,
              lng: dublinCenter.lng,
            });
            setResponse(null);
          },
          () => null
        );
      }}
    >
      <img alt="compass" src="/compass.svg" />
    </button>
  );
}

export default Locate;
