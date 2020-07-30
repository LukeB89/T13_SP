// Importing outside developed components.
import React from "react";
import { Typeahead } from "react-bootstrap-typeahead";

// Return an autocomplete box containing each of the routes.
// Selecting a route will change map display to only
// all of the stops associated with that route.
function FilterRoute({
  // Receiving props - Functions defined in App.js.
  routeChoice,
  panTwo,
  // Receiving props - Stop data defined in App.js.
  allRoutes,
}) {
  return (
    <div>
      <Typeahead
        // Inbuilt props: https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/API.md#typeahead.
        id="basic-example"
        options={allRoutes}
        placeholder="Route filter..."
        onChange={(route) => {
          try {
            for (var i = 0; i < allRoutes.length; i++) {
              if (String(route) === allRoutes[i]) {
                const routeString = allRoutes[i];
                routeChoice({ routeString });
                panTwo({ lat: 53.349804, lng: -6.30131 });
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

export default FilterRoute;
