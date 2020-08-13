// Importing outside developed components.
import React from "react";
import DatePicker from "react-datepicker";
import { Typeahead } from "react-bootstrap-typeahead";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { setMinutes, setHours } from "date-fns";
import { TwitterTimelineEmbed } from "react-twitter-embed";
// Importing self-developed components.
import ModelApi from "./ModelApi";
// Importing outside developed css.
import ".././styles.css";
import "react-datepicker/dist/react-datepicker.css";

// Generating all of the GUI elements needed to provide the user with
// journey time prediction. e.g. Date and Time select, Route select, etc.
const PredictionInput = (props) => {
  // Tracking this in state in order to enable a submit button to trigger the ModelApi response.
  const [destinationSelected, setDestinationSelected] = React.useState([]);

  const directionIndicator = parseInt(props.getStops[0]);

  // for setting the date limits in date picker
  function addDays(date, days) {
    const copy = new Date(Number(date));
    copy.setDate(date.getDate() + days);
    return copy;
  }

  const date = new Date();
  const newDate = addDays(date, 6);

  return (
    <div style={{ height: "inherit" }}>
      <Form style={{ height: "50%", overflowY: "scroll" }}>
        <Form.Group controlId="formGridRoute" className="centerText">
          <Form.Label>Route</Form.Label>
          <Typeahead
            // Inbuilt props: https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/API.md#typeahead.
            id="routes"
            options={props.allRoutes}
            ref={props.refSelectedRoute}
            placeholder="Select a route: e.g. 46A"
            onChange={(route) => {
              try {
                for (var i = 0; i < props.allRoutes.length; i++) {
                  if (String(route) === props.allRoutes[i]) {
                    const routeString = props.allRoutes[i];
                    props.setStopMarkers([]);
                    props.setResponseValidator(false);
                    props.setSubMarkerSelection(false);
                    props.routeChoice({ routeString });
                    props.setRouteSelect(routeString);
                    props.setResponse(null);
                    props.originNumberChoice({ id: "0" });
                    props.destinationNumberChoice({ id: "0" });
                    props.setOrigin("");
                    props.setDestination("");
                    props.refUserOrigin.current.clear();
                    props.refUserDestination.current.clear();
                  }
                }
              } catch (error) {
                // console.log("😱 Error: ", error);
              }
            }}
          />
        </Form.Group>

        <Form.Group controlId="formTime" className="centerText">
          <Form.Label>
            {" "}
            <strong style={{ textAlign: "center" }}>
              When are you travelling?
            </strong>
          </Form.Label>
          <DatePicker
            selected={props.selectedTime}
            onChange={(date) => props.timeChoice(date)}
            showTimeSelect
            timeIntervals={15}
            minDate={date}
            minTime={setHours(setMinutes(date, 0), 6)}
            maxTime={setHours(setMinutes(date, 45), 23)}
            maxDate={newDate}
            dateFormat="MMMM d, yyyy h:mm aa"
            timeCaption="Hour"
          />
        </Form.Group>

        <Form.Row>
          <Form.Group
            as={Col}
            controlId="formGridDeparture"
            className="centerText"
          >
            <Form.Label>Departure</Form.Label>
            <Typeahead
              // Inbuilt props: https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/API.md#typeahead.
              id="basic-example"
              options={props.filteredStops}
              placeholder="e.g. Stop 334, D'Olier Street"
              ref={props.refUserOrigin}
              // use selected for reading information from the click event,
              // but how will this trigger the onChange function
              onChange={(address) => {
                try {
                  for (var i = 0; i < props.parsedStops.length; i++) {
                    if (String(address) === props.parsedStops[i].description) {
                      const id = props.parsedStops[i].id;
                      const lat = props.parsedStops[i].geometry.lat;
                      const lng = props.parsedStops[i].geometry.lng;
                      props.setStopMarkers([]);
                      props.destinationNumberChoice({ id: "0" });
                      props.refUserDestination.current.clear();
                      props.setResponseValidator(false);
                      props.originNumberChoice({ id });
                      props.originChoice({ lat, lng });
                      props.setDestination("");
                      setDestinationSelected([]);
                      props.panTo({ lat, lng });
                      props.setResponse(null);
                      props.setSubMarkerSelection(true);
                    }
                  }
                } catch (error) {
                  // console.log("😱 Error: ", error);
                }
              }}
            />
          </Form.Group>

          <Form.Group
            as={Col}
            controlId="formGridArrival"
            className="centerText"
          >
            <Form.Label>Arrival</Form.Label>
            <Typeahead
              // Inbuilt props: https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/API.md#typeahead.
              id="basic-example"
              options={props.routeDirectionStops.slice(1)}
              placeholder="e.g. Stop 2007, Stillorgan Road"
              ref={props.refUserDestination}
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
                  // console.log("😱 Error: ", error);
                }
              }}
            />
          </Form.Group>
        </Form.Row>

        <Form.Row>
          <Form.Group
            as={Col}
            controlId="formGridSubmit"
            className="predictButtons"
          >
            <Button
              // Inbuilt props: https://react-bootstrap.github.io/components/buttons/#button-props.
              style={{ width: "45%" }}
              onClick={() => {
                try {
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
                  // console.log("😱 Error: ", error);
                }
              }}
            >
              Submit
            </Button>
          </Form.Group>

          <Form.Group
            as={Col}
            controlId="formGridClear"
            className="predictButtons"
          >
            <Button
              // Inbuilt props: https://react-bootstrap.github.io/components/buttons/#button-props.
              variant="secondary"
              style={{ width: "45%" }}
              onClick={() => {
                props.setSubMarkerSelection(false);
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
                props.setSelectedTime(new Date());
                props.refSelectedRoute.current.clear();
                props.refUserOrigin.current.clear();
                props.refUserDestination.current.clear();
              }}
            >
              Clear
            </Button>
          </Form.Group>
        </Form.Row>
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

      <Card style={{ maxHeight: "48%", overflowY: "scroll" }}>
        <Card.Body>
          <Card.Title>Dublin Bus Twitter</Card.Title>

          <TwitterTimelineEmbed
            sourceType="profile"
            screenName="dublinbusnews"
            // autoHeight={true}
            borderColor="#CDDC39"
            options={{ height: "46vh" }}
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default PredictionInput;
