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

  // Getting a list of stops and the direction from this api route.
  // Takes the users chosen route and origin stop as input.
  console.log(
    "originNumber going into RouteStipsApi from PredictionInput",
    props.originNumber
  );
  const getStops = RouteStopsApi(props.routeSelect, props.originNumber);
  console.log(
    "getStops is here in PredictionInput where the direction indicator is being delivered",
    getStops
  );

  // // console.log("PredictionInput received routeSelect", props.routeSelect);
  // For the Typeaheads containing bus route destination, user origin & user destination .
  const refUserOrigin = React.useRef();
  const refUserDestination = React.useRef();

  const directionIndicator = parseInt(getStops[0]);
  // console.log("this is the direction indicator.", directionIndicator);

  // getStops.splice(0, 1); // Removes the first element of getStops only if it is equal to 1 or 2.

  // console.log("PredictionInput: getStops triggered after splice: ", getStops);

  // Convert that array of strings to integers.
  // const a = getStops;
  // A map method for Arrays, applying a function to all elements of an array.
  for (var i = 1; i < getStops.length; i++) {
    console.log(getStops[i]);
  }
  const directionStopNumbers = getStops.slice(1).map(function (x) {
    return parseInt(x, 10);
  });

  console.log(directionStopNumbers);

  // console.log(
  //   "In PredictionInput - directionStopNumbers here",
  //   directionStopNumbers
  // );
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
          options={props.allRoutes}
          placeholder="Select a route: e.g. 46A"
          onChange={(route) => {
            try {
              for (var i = 0; i < props.allRoutes.length; i++) {
                if (String(route) === props.allRoutes[i]) {
                  const routeString = props.allRoutes[i];
                  props.routeChoice({ routeString });
                  props.setRouteSelect(routeString);
                  props.setResponse(null);
                  props.originNumberChoice({ id: "0" });
                  props.setOrigin("");
                  props.setDestination("");
                  refUserOrigin.current.clear();
                  refUserDestination.current.clear();
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
            options={props.filteredStops}
            placeholder="Departing from: e.g. Stop 334, D'Olier Street"
            ref={refUserOrigin}
            onChange={(address) => {
              try {
                for (var i = 0; i < props.parsedStops.length; i++) {
                  if (String(address) === props.parsedStops[i].description) {
                    const id = props.parsedStops[i].id;
                    const lat = props.parsedStops[i].geometry.lat;
                    const lng = props.parsedStops[i].geometry.lng;
                    props.originNumberChoice({ id });
                    props.originChoice({ lat, lng });
                    props.panTo({ lat, lng });
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
            ref={refUserDestination}
            onChange={(s) => {
              try {
                for (var i = 0; i < props.parsedStops.length; i++) {
                  if (String(s) === props.parsedStops[i].description) {
                    const lat = props.parsedStops[i].geometry.lat;
                    const lng = props.parsedStops[i].geometry.lng;
                    props.panTo({ lat, lng });
                    props.setDirectionSelect(directionIndicator);
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
