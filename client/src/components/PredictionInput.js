import React from "react";
import DatePicker from "react-datepicker";
import { Typeahead } from "react-bootstrap-typeahead";
import Form from "react-bootstrap/Form";
import ModelApi from "./ModelApi";

import "react-datepicker/dist/react-datepicker.css";
import ".././styles.css";

const PredictionInput = (props) => {
  // Importing the Dublin Bus API stops data
  const dir1Nums46a = require("../data/46A_dir1_stops.json");
  const dir1Stops46a = [];

  // console.log(dir1Nums46a[0]);
  for (var q = 0; q < props.parsedStops.length; q++) {
    for (var r = 0; r < dir1Nums46a.length; r++) {
      // console.log(dir1Nums46a[r]);
      if (dir1Nums46a[r] == parseInt(props.parsedStops[q].id)) {
        dir1Stops46a.push(props.parsedStops[q].description);
        // console.log("yay", props.parsedStops[q].description);
      }
    }
  }

  return (
    <Form>
      <Form.Group controlId="formTimeOfTravel">
        <Form.Label>Time of Travel: </Form.Label>
        <DatePicker
          selected={props.selectedTime}
          // onSelect={props.timeChoice}
          onChange={props.timeChoice}
          // Problem here!: if using onSelect, the time value isn't picked up
          // using onChange means there's a click delay in the values being set.
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={60}
          timeCaption="time"
          dateFormat="MMMM d, yyyy h:mm aa"
        />
        <Form.Label style={{ paddingTop: "1vh" }}>Route: 46A</Form.Label>
        <Typeahead
          id="basic-example"
          options={dir1Stops46a}
          maxVisible={2}
          placeholder="Choose a departure stop..."
          onChange={(address) => {
            try {
              for (var i = 0; i < props.parsedStops.length; i++) {
                if (String(address) === props.parsedStops[i].description) {
                  const id = props.parsedStops[i].id;
                  props.originNumberChoice({ id });
                }
              }
            } catch (error) {
              console.log("😱 Error: ", error);
            }
          }}
        />
        <Typeahead
          id="basic-example"
          options={dir1Stops46a}
          maxVisible={2}
          placeholder="Choose an arrival stop..."
          onChange={(address) => {
            try {
              for (var i = 0; i < props.parsedStops.length; i++) {
                if (String(address) === props.parsedStops[i].description) {
                  const id = props.parsedStops[i].id;
                  props.destinationNumberChoice({ id });
                }
              }
            } catch (error) {
              console.log("😱 Error: ", error);
            }
          }}
        />
      </Form.Group>
      <ModelApi
        timeDayMonth={props.timeDayMonth}
        originNumber={props.originNumber}
        destinationNumber={props.destinationNumber}
      ></ModelApi>
    </Form>
  );
};

export default PredictionInput;

// // Generate a Typeahead search box that includes all of the stops.
// // Choosing a stop will adjust the map to that stops location and place a red marker.
// export default function StopSearch({
//   panTo,
//   stopChoice,
//   stopDescriptions,
//   parsedStops,
// }) {
//   return (
//     <div>
//       <Typeahead
//         id="basic-example"
//         options={stopDescriptions}
//         maxVisible={2}
//         placeholder="Choose a stop to locate on map..."
//         onChange={(address) => {
//           try {
//             for (var i = 0; i < parsedStops.length; i++) {
//               if (String(address) === parsedStops[i].description) {
//                 const lat = parsedStops[i].geometry.lat;
//                 const lng = parsedStops[i].geometry.lng;
//                 const id = parsedStops[i].id;
//                 panTo({ lat, lng });
//                 stopChoice({ id });
//               }
//             }
//           } catch (error) {
//             console.log("😱 Error: ", error);
//           }
//         }}
//       />
//     </div>
//   );
// }
