// Importing outside developed components.
import React, { useState } from "react";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  InfoWindow,
  MarkerClusterer,
} from "@react-google-maps/api";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Typeahead } from "react-bootstrap-typeahead";
import styled from "styled-components";
// Importing self-developed components.
import Api from "./components/Api";
import DateTimeSelector from "./components/DateTimeSelector";
import BrandBar from "./components/BrandBar";
// Importing outside developed css.
import "bootstrap/dist/css/bootstrap.min.css";
import "@reach/combobox/styles.css";
// Importing the Dublin Bus API stops data
import * as data from "./data/db-stops.json";
// Importing Google Maps Api Key.
import googleMapApiKey from "./config";
// Defined styling for separation of page displayed.
const Wrapper = styled.main`
  width: 100%;
  height: 100%;
`;
// Importing custom styles to customize the style of Google Map.
const styles = require("./data/GoogleMapStyles.json");
// Defined custom styles to customize the style of Google Map.
const mapOptions = {
  styles: styles,
  disableDefaultUI: true,
  zoomControl: true,
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
  description: parsed.description,
  geometry: parsed.geometry.pos,
}));
// An array that contains only the names of all the stops.
const stopDescriptions = [];
for (var i = 0; i < parsedStops.length; i++) {
  stopDescriptions.push(parsedStops[i].description);
}

// Main function to draw the Map/Page.
export default function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapApiKey,
  });
  // consts: [53.349804, -6.260310] - Dublin
  const [center, setCenter] = useState({ lat: 53.349804, lng: -6.26031 });
  const [zoom, setZoom] = useState(11);
  // The things we need to track in state
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [markerMap, setMarkerMap] = useState({});
  const [infoOpen, setInfoOpen] = useState(false);

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(16);
  }, []);

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
        <BrandBar></BrandBar>
        <Wrapper style={{ width: "75%", float: "left" }}>
          {/* Render the Google Map */}
          <GoogleMap
            onLoad={onMapLoad}
            center={center}
            zoom={zoom}
            maxZoom={13}
            options={mapOptions}
            mapContainerStyle={{
              height: "94vh",
            }}
          >
            <Locate panTo={panTo} />

            <MarkerClusterer
              options={options}
              maxZoom={16}
              minimumClusterSize={6}
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
            </MarkerClusterer>

            {infoOpen && selectedPlace && (
              <InfoWindow
                anchor={markerMap[selectedPlace.properties.id]}
                onCloseClick={() => setInfoOpen(false)}
              >
                <div>
                  <h3>Stop Number: {selectedPlace.properties.id}</h3>
                  <h5>Routes: {selectedPlace.properties.routes.join(", ")}</h5>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </Wrapper>

        <Wrapper style={{ width: "25%", float: "right" }}>
          <Container style={{ paddingTop: "15vh" }}>
            <DateTimeSelector></DateTimeSelector>
            <Form>
              <Form.Group controlId="formDeparture">
                <Form.Label>Departure</Form.Label>
                <Search panTo={panTo} />
              </Form.Group>
            </Form>
            <Form>
              <Form.Group controlId="formArrival">
                <Form.Label>Arrival</Form.Label>
                <Search panTo={panTo} />
              </Form.Group>
            </Form>
            {/* need to add an onclick event that relates to the database here. */}
            <Button variant="primary" type="submit" onClick>
              Submit
            </Button>
            <Api></Api>
          </Container>
        </Wrapper>
      </Container>
    </div>
  );
}

// Function to adjust the map to user's location.
function Locate({ panTo }) {
  return (
    <button
      className="locate"
      onClick={() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            panTo({
              // lat: position.coords.latitude,
              // lng: position.coords.longitude,
              // Hard coding Dublin for the time being.
              lat: 53.343,
              lng: -6.2562,
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

// Function to adjust the map to user's chosen stop(s).
function Search({ panTo }) {
  return (
    <div>
      <Typeahead
        id="basic-example"
        options={stopDescriptions}
        maxVisible={2}
        placeholder="Choose a stop..."
        onChange={(address) => {
          try {
            for (var i = 0; i < parsedStops.length; i++) {
              if (address == parsedStops[i].description) {
                const lat = parsedStops[i].geometry.lat,
                  lng = parsedStops[i].geometry.lng;
                panTo({ lat, lng });
              }
            }
          } catch (error) {
            console.log("error");
          }
        }}
      />
      <Marker position={{ lat: 53.3522411111, lng: -6.263695 }} />
    </div>
  );
}
