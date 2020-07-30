// Importing outside developed components.
import React from "react";
import DatePicker from "react-datepicker";
import { Typeahead } from "react-bootstrap-typeahead";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
// Importing self-developed components.
import ModelApi from "./ModelApi";
import RouteStopsApi from "./RouteStopsApi";
// Importing outside developed css.
import "react-datepicker/dist/react-datepicker.css";
import ".././styles.css";

// Generating all of the GUI elements needed to provide the user with
// journey time prediction. e.g. Date and Time select, Route select, etc.
const PredictionInput = (props) => {
  // Tracking this in state in order to enable a submit button to trigger the ModelApi response.
  const [destinationSelected, setDestinationSelected] = React.useState([]);
  // Get an array of the stops associated with the users selected route
  const getStops = RouteStopsApi(props.routeSelect, props.directionSelect);
  // Convert that array of strings to integers.
  const a = getStops;
  // A map method for Arrays, applying a function to all elements of an array.
  const directionStopNumbers = a.map(function (x) {
    return parseInt(x, 10);
  });

  console.log(
    "In PredictionInput - directionStopNumbers here",
    directionStopNumbers
  );
  const routeDirectionStops = [];

  for (var q = 0; q < props.parsedStops.length; q++) {
    for (var r = 0; r < directionStopNumbers.length; r++) {
      if (directionStopNumbers[r] === parseInt(props.parsedStops[q].id)) {
        routeDirectionStops.push(props.parsedStops[q].description);
      }
    }
  }

  return (
    <Form>
      <Form.Group
        // Inbuilt props: https://react-bootstrap.github.io/components/forms/#form-group-props.
        controlId="formRoute"
      >
        <Typeahead
          // Inbuilt props: https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/API.md#typeahead.
          id="basic-example"
          options={["46A"]}
          maxVisible={2}
          placeholder="Select a route: e.g. 46A"
          onChange={(address) => {
            props.setRouteSelect(address);
          }}
        />
      </Form.Group>
      <Form.Group
        // Inbuilt props: https://react-bootstrap.github.io/components/forms/#form-group-props.
        controlId="formRoute"
      >
        <Typeahead
          // Inbuilt props: https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/API.md#typeahead.
          id="basic-example"
          options={["Phoenix Park", "Dun Laoghaire"]}
          maxVisible={2}
          placeholder="Select a direction: e.g. Phoenix Park"
          onChange={(address) => {
            if (String(address) === "Dun Laoghaire") {
              props.setDirectionSelect(1);
            } else {
              props.setDirectionSelect(2);
            }
          }}
        />
      </Form.Group>

      <Form.Group
        // Inbuilt props: https://react-bootstrap.github.io/components/forms/#form-group-props.
        controlId="formTimeOfTravel"
      >
        <div style={{ textAlign: "center" }}>
          <strong style={{ textAlign: "center" }}>
            When are you travelling?
          </strong>
        </div>

        <DatePicker
          // Inbuilt props: https://github.com/Hacker0x01/react-datepicker/blob/master/docs/index.md.
          selected={props.selectedTime}
          onChange={(date) => props.timeChoice(date)}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={60}
          timeCaption="time"
          dateFormat="MMMM d, yyyy h:mm aa"
          //  CSS - not working, find a fix.
          style={{ textAlign: "center" }}
        />

        <Form.Group
          // Inbuilt props: https://react-bootstrap.github.io/components/forms/#form-group-props.
          controlId="formDeparture"
          // CSS
          style={{ paddingTop: "2vh" }}
        >
          <Typeahead
            // Inbuilt props: https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/API.md#typeahead.
            id="basic-example"
            options={routeDirectionStops}
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

        <Form.Group
          // Inbuilt props: https://react-bootstrap.github.io/components/forms/#form-group-props.
          controlId="formArrival"
        >
          <Typeahead
            // Inbuilt props: https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/API.md#typeahead.
            id="basic-example"
            options={routeDirectionStops}
            placeholder="Destination: e.g. Stop 2007, Stillorgan Road"
            onChange={(s) => {
              try {
                // console.log("button triggered");
                for (var i = 0; i < props.parsedStops.length; i++) {
                  if (String(s) === props.parsedStops[i].description) {
                    const lat = props.parsedStops[i].geometry.lat;
                    const lng = props.parsedStops[i].geometry.lng;
                    props.panTo({ lat, lng });
                    setDestinationSelected(s);
                  }
                }
              } catch (error) {
                console.log("😱 Error: ", error);
              }
            }}
          />

          <Form.Group
            // CSS
            style={{ paddingTop: "1vh" }}
          >
            <Button
              // Inbuilt props: https://react-bootstrap.github.io/components/buttons/#button-props.
              style={{ width: "100%" }}
              onClick={() => {
                try {
                  // console.log("PredictionInput button triggered");
                  for (var i = 0; i < props.parsedStops.length; i++) {
                    if (
                      String(destinationSelected) ===
                      props.parsedStops[i].description
                    ) {
                      const id = props.parsedStops[i].id;
                      const lat = props.parsedStops[i].geometry.lat;
                      const lng = props.parsedStops[i].geometry.lng;
                      props.destinationChoice({ lat, lng });
                      props.destinationNumberChoice({ id });
                    }
                  }
                } catch (error) {
                  console.log("😱 Error: ", error);
                }
              }}
            >
              Submit
            </Button>
          </Form.Group>
        </Form.Group>
      </Form.Group>
      <ModelApi
        // Passing in props - Variables defined in App.js.
        originNumber={props.originNumber}
        destinationNumber={props.destinationNumber}
        timeDayMonth={props.timeDayMonth}
        routeSelect={props.routeSelect}
        directionSelect={props.directionSelect}
      ></ModelApi>
    </Form>
  );
};

export default PredictionInput;
