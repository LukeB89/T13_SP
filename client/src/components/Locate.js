import React from "react";

const dublinCenter = require("../data/DublinCenter.json");

// Generate an icon when clicked and
// adjust the map to the users location.
function Locate({ panTo }) {
  return (
    <button
      className="locate"
      onClick={() => {
        navigator.geolocation.getCurrentPosition(
          // Hard coding Dublin for the time being.
          (position) => {
            panTo({
              // lat: position.coords.latitude,
              // lng: position.coords.longitude,
              lat: dublinCenter.lat,
              lng: dublinCenter.lng,
            });
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
