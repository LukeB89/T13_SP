// Importing outside developed components.
import React from "react";
import { Typeahead } from "react-bootstrap-typeahead";

// Generate a Typeahead search box that includes all of the stops.
// Choosing a stop will adjust the map to that stops location and place a red marker.
export default function StopSearch({
  // Receiving props - Functions defined in App.js.
  panTo,
  stopChoice,
  // Receiving props - Stop data defined in App.js.
  parsedStops,
  stopDescriptions,
}) {
  return (
    <div>
      <Typeahead
        // Inbuilt props: https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/API.md#typeahead.
        id="basic-example"
        options={stopDescriptions}
        maxVisible={2}
        placeholder="Choose a stop to locate on map..."
        onChange={(address) => {
          try {
            for (var i = 0; i < parsedStops.length; i++) {
              if (String(address) === parsedStops[i].description) {
                const lat = parsedStops[i].geometry.lat;
                const lng = parsedStops[i].geometry.lng;
                const id = parsedStops[i].id;
                panTo({ lat, lng });
                stopChoice({ id });
              }
            }
          } catch (error) {
            console.log("😱 Error: ", error);
          }
        }}
      />
    </div>
  );
}
