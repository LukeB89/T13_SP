import React from "react";
import { Typeahead } from "react-bootstrap-typeahead";

// Return an autocomplete box containing each of the routes.
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
              if (route == allRoutes[i]) {
                const routeString = allRoutes[i];
                routeChoice({ routeString });
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

export default FilterRoute;
