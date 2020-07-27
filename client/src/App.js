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
import Button from "react-bootstrap/Button";
import styled from "styled-components";
// Importing self-developed components.
import CustomNavBar from "./components/CustomNavBar";
import FilterRoute from "./components/FilterRoute";
import StopSearch from "./components/StopSearch";
import Locate from "./components/Locate";
import JourneySearch from "./components/JourneySearch";
import PredictionInput from "./components/PredictionInput";
// import Api from "./components/Api";
import RtpiApi from "./components/RtpiApi";
import DateTimeSelector from "./components/DateTimeSelector";
// Importing outside developed css.
import "react-datepicker/dist/react-datepicker.css";
import "./styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@reach/combobox/styles.css";
// Importing Google Maps Api Key.
import googleMapApiKey from "./config";
// Defining libraries for Google Places
const libraries = ["places"];
// Defined styling for separation of page displayed.
const Wrapper = styled.main`
  width: 100%;
  height: 100%;
`;
// Importing the Dublin Bus API stops data
const data = require("./data/DublinBusStops.json");
// // consts: [53.349804, -6.260310] - Dublin
const dublinCenter = require("./data/DublinCenter.json");
// Importing custom styles to customize the style of Google Map...
// important for including and excluding certain place markers etc.
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

const dir1Nums46a = require("./data/46A_dir1_stops.json");

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
for (var j = 0; j < myStops.length; j++) {
  routesArray.push(myStops[j].properties.routes);
}
for (var k = 0; k < routesArray.length; k++) {
  for (var l = 0; l < routesArray[k].length; l++) {
    duplicateRoutes.push(routesArray[k][l]);
  }
}
const allRoutes = duplicateRoutes.filter(
  (a, b) => duplicateRoutes.indexOf(a) === b
);

// Main function for the SPA, generating the Map/Page.
export default function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapApiKey,
    libraries,
  });
  const center = dublinCenter;
  // const [center, setCenter] = useState(dublinCenter);
  const [zoom, setZoom] = useState(11);
  // The general things we need to track in state:
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [markerMap, setMarkerMap] = useState({});
  const [infoOpen, setInfoOpen] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [stopNumber, setStopNumber] = useState(0);
  // Temporarily using these to track selected stop numbers
  const [originNumber, setOriginNumber] = useState(0);
  const [destinationNumber, setDestinationNumber] = useState(0);

  const originNumberChoice = (number) => {
    console.log("originNumberChoice", number);
    setOriginNumber(() => parseInt(number.id));
  };

  const destinationNumberChoice = (number) => {
    console.log("destinationNumberChoice", number);
    setDestinationNumber(() => parseInt(number.id));
  };
  // Temporarily using these to track selected stop numbers

  const [routeString, setRouteString] = useState("");
  // The things for Directions we need to track in state.
  const [response, setResponse] = useState(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  // This is TEMPORARILY being used to track in state which set of markers is displayed.
  const [checker, setChecker] = useState("True");
  // The things for selected time (Hour, Day, Month) we need to track in state.
  const [selectedTime, setSelectedTime] = useState(new Date());
  // const [timeDayMonth, setTimeDayMonth] = useState(["23", "Tue", "Jul"]);
  const [timeDayMonth, setTimeDayMonth] = useState([0]);

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Orient the map to selected location.
  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(16);
    // Allowing only one marker on the map at a time.
    setMarkers((current) => []);
    setMarkers((current) => [...current, { lat: lat, lng: lng }]);
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

  // For generating a directions route on the map.
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

  // This is being used for Marker display for the time being.
  const checkerChoice = () => {
    setChecker(() => "False");
  };

  const time = selectedTime.toTimeString().substring(0, 2);
  const [day, month] = selectedTime.toDateString().split(" ");

  // For setting the time in state.
  const timeChoice = (selectedTime) => {
    setSelectedTime(selectedTime);
    setTimeDayMonth([time, day, month]);
  };
  console.log("These are the time values: date-day-month", timeDayMonth);

  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";

  return (
    <div>
      <Container fluid>
        <CustomNavBar
          FilterRoute={FilterRoute}
          StopSearch={StopSearch}
          panTo={panTo}
          stopChoice={stopChoice}
          routeChoice={routeChoice}
          parsedStops={parsedStops}
          stopDescriptions={stopDescriptions}
          allRoutes={allRoutes}
        />

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

            <RouteInfo
              route={routeString}
              markerLoadHandler={markerLoadHandler}
              markerClickHandler={markerClickHandler}
              checkerChoice={checkerChoice}
            ></RouteInfo>

            <ClusteredMarkers
              myStops={myStops}
              markerLoadHandler={markerLoadHandler}
              markerClickHandler={markerClickHandler}
              checker={checker}
            ></ClusteredMarkers>

            {infoOpen && selectedPlace && (
              <InfoWindow
                anchor={markerMap[selectedPlace.properties.id]}
                onCloseClick={() => setInfoOpen(false)}
              >
                <div>
                  <h5>
                    {selectedPlace.properties.fullname +
                      ", stop " +
                      selectedPlace.properties.id}
                  </h5>
                  <RtpiApi number={selectedPlace.properties.id}></RtpiApi>
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
                  setChecker("False");
                }}
              />
            )}
          </GoogleMap>
        </Wrapper>

        <Wrapper
          style={{
            width: "25%",
            float: "right",
            maxHeight: "93vh",
            overflowY: "scroll",
          }}
        >
          <Container style={{ paddingTop: "2vh" }}>
            <PredictionInput
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              timeChoice={timeChoice}
              timeDayMonth={timeDayMonth}
              parsedStops={parsedStops}
              stopDescriptions={stopDescriptions}
              originNumberChoice={originNumberChoice}
              destinationNumberChoice={destinationNumberChoice}
              originNumber={originNumber}
              destinationNumber={destinationNumber}
            />
            {/* <DateTimeSelector
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              timeChoice={timeChoice}
              timeDayMonth={timeDayMonth}
            ></DateTimeSelector> */}
            <Form>
              <Form.Group controlId="formDeparture">
                <JourneySearch
                  panTo={panTo}
                  originChoice={originChoice}
                  placeholder={"Departure"}
                />
              </Form.Group>
            </Form>
            <Form>
              <Form.Group controlId="formArrival">
                <JourneySearch
                  panTo={panTo}
                  destinationChoice={destinationChoice}
                  placeholder={"Arrival"}
                />
              </Form.Group>
            </Form>
            <div id="panel"></div>
            <Button
              variant="secondary"
              size="lg"
              block
              onClick={() => window.location.reload(false)}
            >
              Reload
            </Button>
          </Container>
        </Wrapper>
      </Container>
    </div>
  );
}

// Function that filters the markers on the map
// according to a user selected route.
function RouteInfo(props) {
  const filteredMarkers = [];

  for (var i = 0; i < myStops.length; i++) {
    for (var j = 0; j < myStops[i].properties.routes.length; j++) {
      if (String(myStops[i].properties.routes[j]) === props.route) {
        filteredMarkers.push(myStops[i]);
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
      onLoad={(marker) => {
        // Will do for now - removing cluster upon selection of route.
        props.checkerChoice("False");
        props.markerLoadHandler(marker, stop);
      }}
      onClick={(event) => {
        props.markerClickHandler(event, stop);
      }}
    />
  ));
}

// Function that renders all of the Dublin Bus stops in clustered form.
// props.checker being set to True means that they will all be displayed on
// the first load. When a route is chosen from the RouteInfo function above,
// props.cheker gets set to False and all of the markers are removed. This solution
// is intended only to be temporary until something better comes up.
function ClusteredMarkers(props) {
  if (props.checker === "True") {
    return (
      <MarkerClusterer options={options} maxZoom={15} minimumClusterSize={4}>
        {(clusterer) =>
          props.myStops.map((stop) => (
            <Marker
              icon={icon}
              key={stop.properties.id}
              position={stop.geometry.pos}
              clusterer={clusterer}
              onLoad={(marker) => props.markerLoadHandler(marker, stop)}
              onClick={(event) => props.markerClickHandler(event, stop)}
            />
          ))
        }
      </MarkerClusterer>
    );
  } else {
    return null;
  }
}