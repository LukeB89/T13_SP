import React from "react";
import { Typeahead } from "react-bootstrap-typeahead";

// Return an autocomplete box containing each of the routes.
// Selecting a route will change map display to only
// all of the stops associated with that route.
function FilterRoute({ routeChoice, allRoutes }) {
  return (
    <div>
      <Typeahead
        id="basic-example"
        options={allRoutes}
        placeholder="Route filter..."
        onChange={(route) => {
          try {
            for (var i = 0; i < allRoutes.length; i++) {
              if (String(route) === allRoutes[i]) {
                const routeString = allRoutes[i];
                routeChoice({ routeString });
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
