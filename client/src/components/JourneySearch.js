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
export default function JourneySearch({
  originChoice,
  destinationChoice,
  placeholder,
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

  // https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompletionRequest

  const handleInput = (e) => {
    setValue(e.target.value);
  };

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    if (placeholder == "Departure") {
      try {
        const results = await getGeocode({ address });
        originChoice({ results });
      } catch (error) {
        console.log("😱 Error: ", error);
      }
    } else if (placeholder == "Arrival") {
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
            {status === "OK" &&
              data.map(({ id, description }) => (
                <ComboboxOption key={id} value={description} />
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
}
