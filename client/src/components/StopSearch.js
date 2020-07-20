import React from "react";
import { Typeahead } from "react-bootstrap-typeahead";

// Generate a searchbox that includes all of the
// stops. Chosen stop will adjust the map to that
// stops location and display its realtime info.
export default function StopSearch({
  panTo,
  stopChoice,
  stopDescriptions,
  parsedStops,
}) {
  return (
    <div>
      <Typeahead
        id="basic-example"
        options={stopDescriptions}
        maxVisible={2}
        placeholder="Choose a stop to locate on map..."
        onChange={(address) => {
          try {
            for (var i = 0; i < parsedStops.length; i++) {
              if (address == parsedStops[i].description) {
                const lat = parsedStops[i].geometry.lat;
                const lng = parsedStops[i].geometry.lng;
                const id = parsedStops[i].id;
                panTo({ lat, lng });
                stopChoice({ id });
              }
            }
          } catch (error) {
            console.log("error");
          }
        }}
      />
    </div>
  );
}
