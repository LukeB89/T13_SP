/*global google*/
import React, { Component } from "react";
// import { DirectionsRenderer } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";

import * as data from ".././data/db-small.json";

class Directions extends Component {
  state = {
    directions: null,
    selected: [],
  };

  render() {
    return (
      <div>
        {/* <Search /> */}
        <AltSearch />
        {/* <DirectionsRenderer directions={this.state.directions} /> */}
      </div>
    );
  }

  // componentDidMount() {
  //   const directionsService = new google.maps.DirectionsService();

  //   // we want to make these variable values, to be able to
  //   // pass this information from what has been selected above.
  //   const origin = { lat: 53.3472419444, lng: -6.2587911111 };
  //   const destination = { lat: 53.3466669444, lng: -6.258325 };

  //   directionsService.route(
  //     {
  //       origin: origin,
  //       destination: destination,
  //       travelMode: google.maps.TravelMode.WALKING,
  //     },
  //     (result, status) => {
  //       if (status === google.maps.DirectionsStatus.OK) {
  //         this.setState({
  //           directions: result,
  //         });
  //       } else {
  //         console.error(`error fetching directions ${result}`);
  //       }
  //     }
  //   );
  // }
}

export default Directions;

// function Search() {
//   const {
//     ready,
//     value,
//     suggestions: { status, data },
//     setValue,
//     clearSuggestions,
//   } = usePlacesAutocomplete({
//     requestOptions: {
//       location: { lat: () => 53.349804, lng: () => -6.26031 },
//       radius: 10 * 1000,
//     },
//   });

//   return (
//     <div className="search">
//       <Combobox
//         onSelect={(address) => {
//           console.log(address);
//         }}
//       >
//         <ComboboxInput
//           value={value}
//           console={console.log(value)}
//           onChange={(e) => {
//             setValue(e.target.value);
//           }}
//           disabled={!ready}
//           placeholder="Enter an address"
//         />
//         <ComboboxPopover>
//           <ComboboxList>
//             {status === "OK" &&
//               data.map(({ id, description }) => (
//                 <ComboboxOption key={id} value={description} />
//               ))}
//           </ComboboxList>
//         </ComboboxPopover>
//       </Combobox>
//     </div>
//   );
// }

// Using the json data for the search boxes
const rawData = data.results;
const nameOfStops = rawData.map((stop) => ({
  description: "Stop " + stop.stopid + ", " + stop.fullname,
  id: parseInt(stop.stopid),
  geometry: {
    type: "Point",
    pos: {
      lat: parseFloat(stop.latitude),
      lng: parseFloat(stop.longitude),
    },
  },
}));

console.log(nameOfStops);

const parsedStops = nameOfStops.map((parsed) => ({
  description: parsed.description,
  geometry: parsed.geometry.pos,
}));

console.log(parsedStops[0].geometry.lat, parsedStops[0].geometry.lng);
const lat = parsedStops[0].geometry.lat,
  lng = parsedStops[0].geometry.lng;

// function that uses the mystops data in the same
// way that the Search function above uses the usePlacesAutocomplete
function AltSearch() {
  // console.log(nameOfStops);
  // return <div>Cunt</div>;
  return (
    <div className="altSearch">
      <Combobox
        onSelect={(address) => {
          try {
            if (address === parsedStops[0].description) {
              const lat = parsedStops[0].geometry.lat,
                lng = parsedStops[0].geometry.lng;
              console.log(lat, lng);
            }
          } catch (error) {
            console.log("error");
          }
          // console.log(address);
        }}
      >
        <ComboboxInput
          // value={nameOfStops}
          options={nameOfStops}
          placeholder="Enter a stop"
        />
        <ComboboxPopover>
          <ComboboxList>
            {nameOfStops.map(({ id, description }) => (
              <ComboboxOption key={id} value={description} />
            ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
}
