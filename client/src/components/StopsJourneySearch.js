import React from "react";
import usePlacesAutocomplete, { getGeocode } from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";

// Generating a Search box with Google Places and Autocomplete.
// For use in selecting journey origin and destination points.
export default function StopsJourneySearch({
  originChoice,
  destinationChoice,
  placeholder,
  parsedStops,
}) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 53, lng: () => -6 },
      radius: 100 * 1000,
    },
  });

  const dir1Nums46a = require("../data/46A_dir1_stops.json");
  const dir1Stops46a = [];

  for (var q = 0; q < parsedStops.length; q++) {
    for (var r = 0; r < dir1Nums46a.length; r++) {
      if (dir1Nums46a[r] == parseInt(parsedStops[q].id)) {
        dir1Stops46a.push(parsedStops[q].description);
      }
    }
  }

  // https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompletionRequest

  const handleInput = (e) => {
    setValue(e.target.value);
  };

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    if (String(placeholder) === "Departure") {
      try {
        console.log("hey address", address);
        const results = await getGeocode({ address });
        console.log("first results", results);
        originChoice({ results });
      } catch (error) {
        console.log("😱 Error: ", error);
      }
    } else if (String(placeholder) === "Arrival") {
      try {
        const results = await getGeocode({ address });
        destinationChoice({ results });
      } catch (error) {
        console.log("😱 Error: ", error);
      }
    }
  };

  return (
    <div className="searchLocations">
      <Combobox onSelect={handleSelect}>
        <ComboboxInput
          value={value}
          onChange={handleInput}
          disabled={!ready}
          placeholder={placeholder}
        />
        <ComboboxPopover>
          <ComboboxList>
            {parsedStops.map(({ id, description }) => (
              <ComboboxOption key={id} value={description} />
            ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
}
