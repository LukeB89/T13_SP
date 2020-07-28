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

  for (var q = 0; q < props.parsedStops.length; q++) {
    for (var r = 0; r < dir1Nums46a.length; r++) {
      if (dir1Nums46a[r] === parseInt(props.parsedStops[q].id)) {
        dir1Stops46a.push(props.parsedStops[q].description);
      }
    }
  }

  return (
    <Form>
      <Form.Group controlId="formTimeOfTravel">
        <Form.Label>
          <strong>When are you travelling?</strong>
        </Form.Label>
        <DatePicker
          selected={props.selectedTime}
          onChange={(date) => props.timeChoice(date)}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={60}
          timeCaption="time"
          dateFormat="MMMM d, yyyy h:mm aa"
        />
        <Form.Label style={{ paddingTop: "1vh" }}>
          Route: <strong>46A</strong> Destination:{" "}
          <strong>Dun Laoghaire</strong>
        </Form.Label>
        <Form>
          <Form.Group controlId="formDeparture">
            <Typeahead
              id="basic-example"
              options={dir1Stops46a}
              maxVisible={2}
              placeholder="Departing from: e.g. Stop 334, D'Olier Street"
              onChange={(address) => {
                try {
                  for (var i = 0; i < props.parsedStops.length; i++) {
                    if (String(address) === props.parsedStops[i].description) {
                      const id = props.parsedStops[i].id;
                      const lat = props.parsedStops[i].geometry.lat;
                      const lng = props.parsedStops[i].geometry.lng;
                      props.originChoice({ lat, lng });
                      props.panTo({ lat, lng });
                      props.originNumberChoice({ id });
                    }
                  }
                } catch (error) {
                  console.log("😱 Error: ", error);
                }
              }}
            />
          </Form.Group>
        </Form>

        <Form>
          <Form.Group controlId="formArrival">
            <Typeahead
              id="basic-example"
              options={dir1Stops46a}
              maxVisible={2}
              placeholder="Destination: e.g. Stop 2007, Stillorgan Road"
              onChange={(address) => {
                try {
                  for (var i = 0; i < props.parsedStops.length; i++) {
                    if (String(address) === props.parsedStops[i].description) {
                      const id = props.parsedStops[i].id;
                      const lat = props.parsedStops[i].geometry.lat;
                      const lng = props.parsedStops[i].geometry.lng;
                      props.destinationChoice({ lat, lng });
                      props.panTo({ lat, lng });
                      props.destinationNumberChoice({ id });
                    }
                  }
                } catch (error) {
                  console.log("😱 Error: ", error);
                }
              }}
            />
          </Form.Group>
        </Form>
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
