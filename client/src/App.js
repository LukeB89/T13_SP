// Importing outside developed components.
import React, { useState } from "react";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  InfoWindow,
  MarkerClusterer,
  DirectionsRenderer,
  DirectionsService,
} from "@react-google-maps/api";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Typeahead } from "react-bootstrap-typeahead";
import styled from "styled-components";
import useSwr from "swr";
import usePlacesAutocomplete, { getGeocode } from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
// Importing self-developed components.
import Api from "./components/Api";
import DateTimeSelector from "./components/DateTimeSelector";
// Importing outside developed css.
import "bootstrap/dist/css/bootstrap.min.css";
import "@reach/combobox/styles.css";
// Importing the Dublin Bus API stops data
import * as data from "./data/DublinBusStops.json";
// Importing Google Maps Api Key.
import googleMapApiKey from "./config";
// Defining libraries for Google Places
const libraries = ["places"];
// Defined styling for separation of page displayed.
const Wrapper = styled.main`
  width: 100%;
  height: 100%;
`;
// Importing custom styles to customize the style of Google Map.
// Important for including and excluding certain place markers etc.
const styles = require("./data/GoogleMapStyles.json");
// Defined custom styles and location for Google Map.
const mapOptions = {
  styles: styles,
  disableDefaultUI: true,
  zoomControl: true,
  maxZoom: 17,
  minZoom: 11,
};
const mapContainerStyle = {
  height: "93vh",
};
// consts: [53.349804, -6.260310] - Dublin
const dublinCenter = {
  lat: 53.349804,
  lng: -6.30131,
};
// Icon used to represent a bus stop on the map.
const icon = {
  url: "/bus_icon.svg",
  scaledSize: { width: 18, height: 18 },
};
// Icons used when Markers are clustered.
const options = {
  imagePath:
    "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
};
// Parsing the Stops data into various object shapes.
const rawData = data.results;

const myStops = rawData.map((stop) => ({
  description: "Stop " + stop.stopid + ", " + stop.fullname,
  type: "Feature",
  properties: {
    id: stop.stopid,
    fullname: stop.fullname,
    routes: stop.operators[0].routes,
  },
  geometry: {
    type: "Point",
    pos: {
      lat: parseFloat(stop.latitude),
      lng: parseFloat(stop.longitude),
    },
  },
}));

const parsedStops = myStops.map((parsed) => ({
  id: parsed.properties.id,
  description: parsed.description,
  geometry: parsed.geometry.pos,
}));

const stopDescriptions = [];
for (var i = 0; i < parsedStops.length; i++) {
  stopDescriptions.push(parsedStops[i].description);
}

const routesArray = [];
const duplicateRoutes = [];
for (var i = 0; i < myStops.length; i++) {
  routesArray.push(myStops[i].properties.routes);
}
for (var i = 0; i < routesArray.length; i++) {
  for (var j = 0; j < routesArray[i].length; j++) {
    duplicateRoutes.push(routesArray[i][j]);
  }
}
const allRoutes = duplicateRoutes.filter(
  (a, b) => duplicateRoutes.indexOf(a) === b
);

// Main function to draw the Map/Page.
export default function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapApiKey,
    libraries,
  });
  const [center, setCenter] = useState(dublinCenter);
  const [zoom, setZoom] = useState(11);
  // The things we need to track in state:
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [markerMap, setMarkerMap] = useState({});
  const [infoOpen, setInfoOpen] = useState(false);
  const [markers, setMarkers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [stopNumber, setStopNumber] = React.useState(0);
  const [routeString, setRouteString] = React.useState("");
  // The things for Directions we need to track in state.
  const [response, setResponse] = useState(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(16);
    // Allowing only one marker on the map at a time.
    setMarkers((current) => []);
    setMarkers((current) => [...current, { lat: lat, lng: lng }]);
  }, []);
  // Changing stop realtime info based on user choice.
  const stopChoice = (number) => {
    setStopNumber(() => parseInt(number.id));
  };
  // Changing origin info based on user choice.
  const originChoice = (address) => {
    setOrigin(() => address.results[0].formatted_address);
  };
  // Changing destination info based on user choice.
  const destinationChoice = (address) => {
    setDestination(() => address.results[0].formatted_address);
  };
  // Changing stops of route displayed on based on user choice.
  const routeChoice = (route) => {
    setRouteString(() => route.routeString);
  };

  const directionsCallback = (response) => {
    if (response !== null) {
      if (response.status === "OK") {
        setResponse(() => ({
          response,
        }));
      } else {
      }
    }
  };

  // We have to create a mapping of our places to actual Marker objects
  const markerLoadHandler = (marker, stop) => {
    return setMarkerMap((prevState) => {
      return { ...prevState, [stop.properties.id]: marker };
    });
  };

  const markerClickHandler = (event, place) => {
    // Remember which stop was clicked
    setSelectedPlace(place);
    // Required so clicking a 2nd marker works as expected
    if (infoOpen) {
      setInfoOpen(false);
    }
    setInfoOpen(true);
  };

  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";

  return (
    <div>
      <Container fluid>
        <Navbar
          bg="dark"
          variant="dark"
          style={{ maxHeight: "7vh", paddingBottom: "1vh" }}
        >
          <Navbar.Brand href="#home">
            <img
              alt=""
              src="https://media.glassdoor.com/sqll/1043913/dublin-bus-squarelogo-1440748899751.png"
              width="30"
              height="30"
              className="d-inline-block align-top"
            />{" "}
            Dublin Bus
          </Navbar.Brand>
          <Nav className="mr-auto"></Nav>
          <Form style={{ paddingRight: "1vw" }}>
            <Form.Group
              controlId="formRealTime"
              style={{ paddingTop: "1.6vh", width: "15vw" }}
            >
              <SearchStop panTo={panTo} stopChoice={stopChoice} />
            </Form.Group>
          </Form>
          <Form style={{ paddingRight: "1vw" }}>
            <Form.Check
              type="switch"
              id="custom-switch"
              label="Tourist Mode"
              style={{ color: "white" }}
            />
          </Form>
          <Form style={{ paddingRight: "1vw" }}>
            <Form.Group
              controlId="formRealTime"
              style={{ paddingTop: "1.6vh", width: "6.5vw" }}
            >
              <FilterRoute routeChoice={routeChoice} />
            </Form.Group>
          </Form>
        </Navbar>

        <Wrapper style={{ width: "75%", float: "left" }}>
          {/* Render the Google Map */}
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={zoom}
            options={mapOptions}
            onLoad={onMapLoad}
          >
            <Locate panTo={panTo} />

            {/* Uncomment this section for route selection */}
            <RouteInfo
              route={routeString}
              markerLoadHandler={markerLoadHandler}
              markerClickHandler={markerClickHandler}
            ></RouteInfo>

            {/* Uncomment this section for all markers at once */}
            {/* <MarkerClusterer
              options={options}
              maxZoom={15}
              minimumClusterSize={4}
            >
              {(clusterer) =>
                myStops.map((stop) => (
                  <Marker
                    icon={icon}
                    key={stop.properties.id}
                    position={stop.geometry.pos}
                    clusterer={clusterer}
                    onLoad={(marker) => markerLoadHandler(marker, stop)}
                    onClick={(event) => markerClickHandler(event, stop)}
                  />
                ))
              }
            </MarkerClusterer> */}

            {infoOpen && selectedPlace && (
              <InfoWindow
                anchor={markerMap[selectedPlace.properties.id]}
                onCloseClick={() => setInfoOpen(false)}
              >
                <div>
                  <h3>Stop Number: {selectedPlace.properties.id}</h3>
                  <h5>Routes: {selectedPlace.properties.routes.join(", ")}</h5>
                  <StopInfo number={selectedPlace.properties.id} />
                </div>
              </InfoWindow>
            )}
            {/* Markers dropped when stop has been chosen or geolocation activated. */}
            {markers.map((marker) => (
              <Marker
                key={`${marker.lat}-${marker.lng}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                onClick={() => {
                  setSelected(marker);
                }}
              />
            ))}
            {destination !== "" && origin !== "" && (
              <DirectionsService
                // required
                options={{
                  destination: destination,
                  origin: origin,
                  travelMode: "TRANSIT",
                }}
                // required
                callback={directionsCallback}
              />
            )}
            {response !== null && (
              <DirectionsRenderer
                // required
                options={{
                  directions: response.response,
                }}
                panel={document.getElementById("panel")}
                // removing all displayed stops upon loading
                onLoad={() => {
                  setRouteString("");
                }}
              />
            )}
          </GoogleMap>
        </Wrapper>

        <Wrapper style={{ width: "25%", float: "right" }}>
          <Container style={{ paddingTop: "2vh" }}>
            <DateTimeSelector></DateTimeSelector>
            <Form>
              <Form.Group controlId="formDeparture">
                <SearchOrigin panTo={panTo} originChoice={originChoice} />
              </Form.Group>
            </Form>
            <Form>
              <Form.Group controlId="formArrival">
                <SearchDestination
                  panTo={panTo}
                  destinationChoice={destinationChoice}
                />
              </Form.Group>
            </Form>

            <div
              id="panel"
              style={{ maxHeight: "67vh", overflowY: "scroll" }}
            ></div>
          </Container>
        </Wrapper>
      </Container>
    </div>
  );
}

// Generate an icon when clicked and
// adjust the map to the users location.
function Locate({ panTo }) {
  return (
    <button
      className="locate"
      onClick={() => {
        navigator.geolocation.getCurrentPosition(
          // Hard coding Dublin for the time being.
          (position) => {
            panTo({
              // lat: position.coords.latitude,
              // lng: position.coords.longitude,
              lat: dublinCenter.lat,
              lng: dublinCenter.lng,
            });
          },
          () => null
        );
      }}
    >
      <img alt="compass" src="/compass.svg" />
    </button>
  );
}

// Generating the Origin search box with Google
// Places and Autocomplete.
function SearchOrigin({ originChoice }) {
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

    try {
      const results = await getGeocode({ address });
      originChoice({ results });
    } catch (error) {
      console.log("😱 Error: ", error);
    }
  };

  return (
    <div className="searchLocations">
      <Combobox onSelect={handleSelect}>
        <ComboboxInput
          value={value}
          onChange={handleInput}
          disabled={!ready}
          placeholder="Departure"
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

// Generating the Destination search box with Google
// Places and Autocomplete.
function SearchDestination({ destinationChoice }) {
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

  const handleInput = (e) => {
    setValue(e.target.value);
  };

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      destinationChoice({ results });
    } catch (error) {
      console.log("😱 Error: ", error);
    }
  };

  return (
    <div className="searchLocations">
      <Combobox onSelect={handleSelect}>
        <ComboboxInput
          value={value}
          onChange={handleInput}
          disabled={!ready}
          placeholder="Arrival"
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
      <br></br>
      <Button as="input" type="submit" value="Reset" />{" "}
    </div>
  );
}

// Generate a searchbox that includes all of the
// stops. Chosen stop will adjust the map to that
// stops location and display its realtime info.
function SearchStop({ panTo, stopChoice, setMarkerMap }) {
  return (
    <div>
      <Typeahead
        id="basic-example"
        options={stopDescriptions}
        maxVisible={2}
        placeholder="Choose a stop to locate on map..."
        onChange={(address) => {
          try {
            for (var i = 0; i < parsedStops.length; i++) {
              if (address == parsedStops[i].description) {
                const lat = parsedStops[i].geometry.lat;
                const lng = parsedStops[i].geometry.lng;
                const id = parsedStops[i].id;
                panTo({ lat, lng });
                stopChoice({ id });
                setMarkerMap({});
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

// Calls the realtime api and returns a table.
function StopInfo(props) {
  const fetcher = (...args) =>
    fetch(...args).then((response) => response.json());
  const url =
    "https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?stopid=" +
    props.number +
    "&operator=bac";
  const { data, error } = useSwr(url, { fetcher });
  const rawStopData =
    data && !error
      ? data
      : // creating a placeholder object while awaiting api response
        {
          results: [
            {
              arrivaldatetime: "08/07/2020 00:00:00",
              route: "",
              destination: "",
              duetime: "",
            },
          ],
        };
  const stopData = rawStopData.results;
  const realInfo = stopData.map((info) => ({
    id: info.arrivaldatetime,
    route: info.route,
    destination: info.destination,
    arrivaltime: info.duetime,
  }));

  return (
    <div style={{ maxHeight: "15vh", overflowY: "scroll" }}>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>Route</th>
            <th>Destination</th>
            <th>Arrival (mins)</th>
          </tr>
        </thead>
        <tbody>
          {realInfo.map((info) => {
            return (
              <tr key={info.id}>
                <td>{info.route}</td>
                <td>{info.destination}</td>
                <td>{info.arrivaltime}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

// Return an autocomplete box containing each of the routes.
function FilterRoute({ routeChoice }) {
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

// Function that filters the markers on the map
// according to a user selected route.
function RouteInfo(props, { markerLoadHandler, markerClickHandler }) {
  const filteredMarkers = [];

  for (var i = 0; i < myStops.length; i++) {
    for (var j = 0; j < myStops[i].properties.routes.length; j++) {
      if (myStops[i].properties.routes[j] == props.route) {
        filteredMarkers.push(myStops[i]);
        // } else if (props.route == "") {
        //   filteredMarkers.push(myStops[i]);
      }
    }
  }

  const uniqueMarkers = filteredMarkers.filter(
    (a, b) => filteredMarkers.indexOf(a) === b
  );

  return uniqueMarkers.map((stop) => (
    <Marker
      icon={icon}
      key={stop.properties.id}
      position={stop.geometry.pos}
      onLoad={(marker) => props.markerLoadHandler(marker, stop)}
      onClick={(event) => props.markerClickHandler(event, stop)}
    />
  ));
}
