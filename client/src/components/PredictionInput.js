// Importing outside developed components.
import React from "react";
import DateTimePicker from "react-datetime-picker";
import { Typeahead } from "react-bootstrap-typeahead";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
// Importing self-developed components.
import ModelApi from "./ModelApi";
import RouteStopsApi from "./RouteStopsApi";
// Importing outside developed css.
import ".././styles.css";

// Generating all of the GUI elements needed to provide the user with
// journey time prediction. e.g. Date and Time select, Route select, etc.
const PredictionInput = (props) => {
  // Tracking this in state in order to enable a submit button to trigger the ModelApi response.
  const [destinationSelected, setDestinationSelected] = React.useState([]);

  // Getting a list of stops and the direction from this api route.
  // Takes the users chosen route and origin stop as input.
  // console.log(
  //   "originNumber going into RouteStipsApi from PredictionInput",
  //   props.originNumber
  // );
  const getStops = RouteStopsApi(props.routeSelect, props.originNumber);
  // console.log(
  //   "getStops is here in PredictionInput where the direction indicator is being delivered",
  //   getStops
  // );

  // // console.log("PredictionInput received routeSelect", props.routeSelect);
  // For the Typeaheads containing bus route destination, user origin & user destination .
  const refSelectedRoute = React.useRef();
  const refUserOrigin = React.useRef();
  const refUserDestination = React.useRef();

  const directionIndicator = parseInt(getStops[0]);
  // console.log("this is the direction indicator.", directionIndicator);

  // getStops.splice(0, 1); // Removes the first element of getStops only if it is equal to 1 or 2.

  // console.log("PredictionInput: getStops triggered after splice: ", getStops);

  // Convert that array of strings to integers.
  // A map method for Arrays, applying a function to all elements of an array.
  // Skips the first element, this is direction indicator.
  const directionStopNumbers = getStops.slice(1).map(function (x) {
    if (getStops.length > 1) {
      return parseInt(x, 10);
    } else {
      return getStops[1];
    }
  });

  // must not be an empty array. if it is an empty array, the page
  // will crash when user tries to select a destination before choosing departure point.
  const routeDirectionStops = ["Placeholder"];

  if (directionStopNumbers.length > 1) {
    for (var q = 0; q < props.parsedStops.length; q++) {
      for (var r = 0; r < directionStopNumbers.length; r++) {
        if (directionStopNumbers[r] === parseInt(props.parsedStops[q].id)) {
          routeDirectionStops.push(props.parsedStops[q].description);
        }
      }
    }
  } else if (directionStopNumbers.length === 1) {
    routeDirectionStops.push(getStops[1]);
  }

  // for setting the date limits in date picker
  function addDays(date, days) {
    const copy = new Date(Number(date));
    copy.setDate(date.getDate() + days);
    return copy;
  }

  const date = new Date();
  const newDate = addDays(date, 6);

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
          ref={refSelectedRoute}
          placeholder="Select a route: e.g. 46A"
          onChange={(route) => {
            try {
              for (var i = 0; i < props.allRoutes.length; i++) {
                if (String(route) === props.allRoutes[i]) {
                  props.setResponseValidator(false);
                  const routeString = props.allRoutes[i];
                  props.routeChoice({ routeString });
                  props.setRouteSelect(routeString);
                  props.setResponse(null);
                  props.originNumberChoice({ id: "0" });
                  props.destinationNumberChoice({ id: "0" });
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DateTimePicker
            // Inbuilt props: https://github.com/Hacker0x01/react-datepicker/blob/master/docs/index.md.
            value={props.selectedTime}
            onChange={(date) => props.timeChoice(date)}
            minDate={date}
            maxDate={newDate}
          />
        </div>

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
                    props.destinationNumberChoice({ id: "0" });
                    refUserDestination.current.clear();
                    props.setResponseValidator(false);
                    props.originNumberChoice({ id });
                    props.originChoice({ lat, lng });
                    props.panTo({ lat, lng });
                    props.setResponse(null);
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
            options={routeDirectionStops.slice(1)}
            placeholder="Destination: e.g. Stop 2007, Stillorgan Road"
            ref={refUserDestination}
            onChange={(s) => {
              try {
                for (var i = 0; i < props.parsedStops.length; i++) {
                  if (String(s) === props.parsedStops[i].description) {
                    const lat = props.parsedStops[i].geometry.lat;
                    const lng = props.parsedStops[i].geometry.lng;
                    props.setResponseValidator(false);
                    props.panTo({ lat, lng });
                    props.setDirectionSelect(directionIndicator);
                    props.setResponse(null);
                    setDestinationSelected(s);
                  }
                }
              } catch (error) {
                console.log("😱 Error: ", error);
              }
            }}
          />{" "}
          <Form.Group
            // CSS
            style={{ paddingTop: "1vh" }}
          >
            <Button
              // Inbuilt props: https://react-bootstrap.github.io/components/buttons/#button-props.
              style={{ width: "45%" }}
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
                      props.setResponseValidator(false);
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
            </Button>{" "}
            <Button
              // Inbuilt props: https://react-bootstrap.github.io/components/buttons/#button-props.
              variant="secondary"
              style={{ width: "45%", float: "right" }}
              onClick={() => {
                props.setResponseValidator(false);
                props.setRouteSelect("");
                props.setRouteString("");
                props.setFilteredStops([]);
                props.setMarkerSelection(true);
                props.setResponse(null);
                props.setOrigin("");
                props.setDestination("");
                props.originNumberChoice({ id: "0" });
                props.destinationNumberChoice({ id: "0" });
                props.setGeoMarkers([]);
                props.setStopMarkers([]);
                refSelectedRoute.current.clear();
                refUserOrigin.current.clear();
                refUserDestination.current.clear();
              }}
            >
              Clear
            </Button>
          </Form.Group>
        </Form.Group>
      </Form.Group>
      <ModelApi
        // Passing in props - Variables defined in App.js.
        distance={props.distance}
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
