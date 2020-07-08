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
import Form from "react-bootstrap/Form";
import { Typeahead } from "react-bootstrap-typeahead";
import styled from "styled-components";
import useSwr from "swr";
// Importing self-developed components.
import Api from "./components/Api";
import DateTimeSelector from "./components/DateTimeSelector";
import BrandBar from "./components/BrandBar";
import Directions from "./components/Directions";
// import Table from "./components/Table";
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
};
const mapContainerStyle = {
  height: "94vh",
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
// An array that contains only the names of all the stops.
const stopDescriptions = [];
for (var i = 0; i < parsedStops.length; i++) {
  stopDescriptions.push(parsedStops[i].description);
}

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

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(16);
    setMarkers((current) => [...current, { lat: lat, lng: lng }]);
  }, []);
  // Changing stop realtime info based on user choice.
  const stopChoice = React.useCallback((number) => {
    setStopNumber(() => parseInt(number.id));
  });

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
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={zoom}
            maxZoom={13}
            options={mapOptions}
            onLoad={onMapLoad}
          >
            <Locate panTo={panTo} />

            <MarkerClusterer
              options={options}
              maxZoom={16}
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
            {/* Markers dropped on selection box choice. */}
            {markers.map((marker) => (
              <Marker
                key={`${marker.lat}-${marker.lng}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                onClick={() => {
                  setSelected(marker);
                }}
              />
            ))}
            <Directions></Directions>
          </GoogleMap>
        </Wrapper>

        <Wrapper style={{ width: "25%", float: "right" }}>
          <Container style={{ paddingTop: "5vh" }}>
            <DateTimeSelector></DateTimeSelector>
            <Form>
              <Form.Group controlId="formDeparture">
                <Form.Label>Stop Information</Form.Label>
                <Search panTo={panTo} stopChoice={stopChoice} />
              </Form.Group>
            </Form>

            <StopInfo number={stopNumber} />

            <div id="panel"></div>
          </Container>
        </Wrapper>
      </Container>
    </div>
  );
}

// Generate an icon which when clicked
// will adjust the map to the users location.
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

// Generate a searchbox that includes all of the
// stops. Chosen stop will adjust the map to that
// stops location and display its realtime info.
function Search({ panTo, stopChoice }) {
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
                const lat = parsedStops[i].geometry.lat;
                const lng = parsedStops[i].geometry.lng;
                const id = parsedStops[i].id;
                panTo({ lat, lng });
                stopChoice({ id });
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
    <div>
      <table singleLine>
        <tr>
          <th>Route</th>
          <th>Destination</th>
          <th>Arrival</th>
        </tr>

        {realInfo.map((info) => {
          return (
            <tr key={info.id}>
              <td>{info.route}</td>
              <td>{info.destination}</td>
              <td>{info.arrivaltime} mins</td>
            </tr>
          );
        })}
      </table>
    </div>
  );
}
