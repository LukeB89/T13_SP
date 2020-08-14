// Importing outside developed components.
import React, { useState } from "react";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  InfoWindow,
  DirectionsRenderer,
  DirectionsService,
} from "@react-google-maps/api";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";
// Importing self-developed components.
import CustomNavBar from "./components/CustomNavBar";
import StopSearch from "./components/StopSearch";
import Locate from "./components/Locate";
import PredictionInput from "./components/PredictionInput";
import RouteStopsApi from "./components/RouteStopsApi";
import RtpiApi from "./components/RtpiApi";
import RouteMarkers from "./components/RouteMarkers";
import ClusteredMarkers from "./components/ClusteredMarkers";
// Importing outside developed css.
import "bootstrap/dist/css/bootstrap.min.css";
// const data = require("./data/DublinBusStops.json");
// // consts: [53.349804, -6.260310] - Dublin
const dublinCenter = require("./data/DublinCenter.json");
// Importing custom styles to customize the style of Google Map...
// important for including and excluding certain place markers etc.
const normalModeBasic = require("./data/NormalModeBasic");
const mapContainerStyle = {
  height: "92vh",
};
// Parsing the Stops data into various object shapes.
const stops = require("./data/myStops");

const myStops = stops.default;

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
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_API,
  });
  const center = dublinCenter;
  const [mapOptions, setMapOptions] = useState({
    styles: normalModeBasic,
    disableDefaultUI: true,
    zoomControl: true,
    maxZoom: 18,
    minZoom: 11,
  });
  // eslint-disable-next-line
  const [zoom, setZoom] = useState(11); // removing unwanted warning.

  // The general things we need to track in state:
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [markerMap, setMarkerMap] = useState({});
  const [infoOpen, setInfoOpen] = useState(false);
  const [geoMarkers, setGeoMarkers] = useState([]);
  const [stopMarkers, setStopMarkers] = useState([]);
  // eslint-disable-next-line
  const [selected, setSelected] = useState(null); // removing unwanted warning.
  // Consider removing this variable stopNumber, see if it can be merged with either originNumber or destinationNumber.
  // eslint-disable-next-line
  const [stopNumber, setStopNumber] = useState(0); // removing unwanted warning.
  // These are being used to track selected stop numbers
  const [originNumber, setOriginNumber] = useState(0);
  const [destinationNumber, setDestinationNumber] = useState(0);
  // This is used to track the string value of selected routes.
  const [routeString, setRouteString] = useState("");
  // The things for Directions (Service and Renderer) we need to track in state.
  const [response, setResponse] = useState(null);
  const [responseValidator, setResponseValidator] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const [distance, setDistance] = useState(null);
  // This is being used to track in state which set of markers is displayed. (Clusters or Route Markers)
  const [markerSelection, setMarkerSelection] = useState(true);
  const [subMarkerSelection, setSubMarkerSelection] = useState(false);
  // The things for selected time (Hour, Day, Month) we need to track in state.
  const [selectedTime, setSelectedTime] = useState(new Date());
  // Setting the time, day and month values as the current time.
  // This allows for user to make prediction for journey that occurs at
  // this time without having to select the time.
  const initialTime = selectedTime.toTimeString().substring(0, 2);
  const initialMinute = selectedTime.toTimeString().substring(3, 5);
  const [initialDay, initialMonth] = selectedTime.toDateString().split(" ");
  // An array containing time data for model input.
  const [timeDayMonth, setTimeDayMonth] = useState([
    initialTime,
    initialMinute,
    initialDay,
    initialMonth,
  ]);
  // Track state of user selected routes and directions.
  const [routeSelect, setRouteSelect] = useState("");
  const [directionSelect, setDirectionSelect] = useState(undefined);
  // Track state of filtered bus stops.
  const [filteredStops, setFilteredStops] = useState([]);
  const [filteredStopsLatLng, setFilteredStopsLatLng] = useState([]);
  // A flag to track whether Tourist Mode has been activated.
  const [touristModeFlag, setTouristModeFlag] = useState(false);
  // A flag to track whether Night Mode has been activated.
  const [nightModeFlag, setNightModeFlag] = useState(false);

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  const refSelectedRoute = React.useRef();
  const refUserOrigin = React.useRef();
  const refUserDestination = React.useRef();

  // Orient the map to selected location.
  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.setZoom(16);
    mapRef.current.panTo({ lat, lng });

    setDestination("");
    // how to render only a max number of two marker?
    setStopMarkers((current) => [
      ...current.slice(0, 1),
      { lat: lat, lng: lng },
    ]);
  }, []);

  // Orient the map to selected location.
  const panToGeoMarker = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(16);
    // Resetting the drawn route anytime this useCall is called.
    setDestination("");
    setGeoMarkers((current) => [...current, { lat: lat, lng: lng }]);
  }, []);

  // For generating a directions route on the map.
  const directionsCallback = React.useCallback(
    (response) => {
      // This is the array you want associated with
      // the response instead of the one that google assigns.
      const selectedRouteArray = [];
      const notSelectedRouteArray = [];
      var aCounter = 0;
      if (response !== null && responseValidator === false) {
        if (response.status === "OK") {
          for (var i = 0; i < response.routes.length; i++) {
            for (var j = 0; j < response.routes[i].legs.length; j++) {
              for (
                var k = 0;
                k < response.routes[i].legs[j].steps.length;
                k++
              ) {
                if (
                  // making sure that WALKING is excluded since it will not contain bus name information
                  String(response.routes[i].legs[j].steps[k].travel_mode) ===
                    "TRANSIT" &&
                  // locating the first occurence of the users selected route
                  String(
                    response.routes[i].legs[j].steps[k].transit.line.short_name
                  ) === routeSelect.toLowerCase()
                ) {
                  aCounter++;
                  selectedRouteArray.push(response.routes[i]);
                } else if (
                  // making sure that WALKING is excluded since it will not contain bus name information
                  String(response.routes[i].legs[j].steps[k].travel_mode) ===
                    "TRANSIT" &&
                  // locating the first occurence of the users selected route
                  String(
                    response.routes[i].legs[j].steps[k].transit.line.short_name
                  ) !== routeSelect
                ) {
                  notSelectedRouteArray.push(response.routes[i]);
                }
              }
            }
          }
          if (aCounter >= 1) {
            // setting the routes array to be the one containing our desired bus route.
            response.routes = selectedRouteArray;
          } else {
            // setting the routes array to be the next avaialable bus route
            response.routes = notSelectedRouteArray;
          }
          setResponse(() => ({
            response,
          }));
          setResponseValidator(true);
        }
        if (aCounter >= 1) {
          setDistance(() => ({
            selectedRouteArray: selectedRouteArray,
          }));
        } else {
          setDistance(() => ({
            selectedRouteArray: notSelectedRouteArray,
          }));
        }
      }
    },
    // // here we are listening for changes in response
    // // how about we make it to listen for changes in a variable
    // eslint-disable-next-line
    [response, distance, responseValidator] // react-hooks/exhaustive-deps
  );

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
    // panTo({ lat: place.geometry.pos.lat, lng: place.geometry.pos.lng });
  };

  // Changing stop realtime info based on user choice.
  const stopChoice = (number) => {
    setStopNumber(() => parseInt(number.id));
  };
  // Changing origin info based on user choice.
  const originChoice = (address) => {
    setOrigin(() => address);
  };
  // Changing destination info based on user choice.
  const destinationChoice = (address) => {
    setDestination(() => address);
  };
  // Changing stops of route displayed on based on user choice.
  const routeChoice = (route) => {
    setRouteString(() => route.routeString);
  };

  //  For which set of markers to display (Clusters or Route Markers).
  const markerSelectionChoice = () => {
    setMarkerSelection(() => false);
  };

  // For setting the selected origin stop number in state.
  const originNumberChoice = (number) => {
    setOriginNumber(() => parseInt(number.id));
  };
  // For setting the selected destination stop number in state.
  const destinationNumberChoice = (number) => {
    setDestinationNumber(() => parseInt(number.id));
  };

  // For setting the time in state.
  const timeChoice = (selectedTime) => {
    if (selectedTime === null) {
      const errorHandledDate = new Date();
      const time = errorHandledDate.toTimeString().substring(0, 2);
      const minute = errorHandledDate.toTimeString().substring(3, 5);
      const [day, month] = errorHandledDate.toDateString().split(" ");
      setSelectedTime(errorHandledDate);
      setTimeDayMonth([time, minute, day, month]);
    } else {
      const time = selectedTime.toTimeString().substring(0, 2);
      const minute = selectedTime.toTimeString().substring(3, 5);
      const [day, month] = selectedTime.toDateString().split(" ");
      setSelectedTime(selectedTime);
      setTimeDayMonth([time, minute, day, month]);
    }
  };

  const filteredStopsChoice = (filteredMarkers) => {
    setFilteredStops(() => filteredMarkers);
  };

  const filteredStopsLatLngChoice = (filteredMarkers) => {
    setFilteredStopsLatLng(() => filteredMarkers);
  };

  const getStops = RouteStopsApi(routeSelect, originNumber);
  const directionStopNumbers = getStops.slice(1).map(function (x) {
    if (getStops.length > 1) {
      return parseInt(x, 10);
    } else {
      return getStops[1];
    }
  });

  const routeDirectionStops = ["Placeholder"];

  if (directionStopNumbers.length > 1) {
    for (var q = 0; q < parsedStops.length; q++) {
      for (var r = 0; r < directionStopNumbers.length; r++) {
        if (directionStopNumbers[r] === parseInt(parsedStops[q].id)) {
          routeDirectionStops.push(parsedStops[q].description);
        }
      }
    }
  } else if (directionStopNumbers.length === 1) {
    routeDirectionStops.push(getStops[1]);
  }

  if (loadError) return "Error";
  if (!isLoaded)
    return (
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      </div>
    );

  return (
    <Container fluid style={{ paddingLeft: 0, paddingRight: 0 }}>
      <Row>
        <Col sm={12}>
          <CustomNavBar
            // Passing in props - Custom built components.
            StopSearch={StopSearch}
            // Passing in useState props - defined above.
            setMapOptions={setMapOptions}
            touristModeFlag={touristModeFlag}
            setTouristModeFlag={setTouristModeFlag}
            nightModeFlag={nightModeFlag}
            setNightModeFlag={setNightModeFlag}
            // Passing in useCallback props - defined above.
            panTo={panTo}
            // Passing in arrow function props - defined above.
            stopChoice={stopChoice}
            // Passing in props - Stop data defined above.
            parsedStops={parsedStops}
            stopDescriptions={stopDescriptions}
          />
        </Col>
      </Row>
      <Row>
        <Col lg={9} style={{ height: "92vh" }}>
          {/* Render the Google Map */}
          <GoogleMap
            // Inbuilt props: https://react-google-maps-api-docs.netlify.app/#googlemap.
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={zoom}
            options={mapOptions}
            onLoad={onMapLoad}
          >
            <Locate
              // Passing in useState props - defined above.
              setResponse={setResponse}
              // Passing in useRef props - defined above.
              panToGeoMarker={panToGeoMarker}
            />
            <RouteMarkers
              // Passing in useState props - defined above.
              routeString={routeString}
              setRouteString={setRouteString}
              routeSelect={routeSelect} // consider removing this
              subMarkerSelection={subMarkerSelection}
              // Passing in useRef props - defined above.
              mapRef={mapRef}
              refUserOrigin={refUserOrigin}
              // Passing in arrow function props - defined above.
              markerLoadHandler={markerLoadHandler}
              markerClickHandler={markerClickHandler}
              markerSelectionChoice={markerSelectionChoice}
              filteredStopsChoice={filteredStopsChoice}
              filteredStopsLatLngChoice={filteredStopsLatLngChoice}
              // Passing in props - Stop data defined above.
              directionStopNumbers={directionStopNumbers}
            />
            <ClusteredMarkers
              // Passing in useState props - defined above.
              markerSelection={markerSelection}
              setFilteredStops={setFilteredStops}
              // Passing in arrow function props - defined above.
              markerLoadHandler={markerLoadHandler}
              markerClickHandler={markerClickHandler}
              // Passing in props - Stop data defined above.
              myStops={myStops}
            />

            {infoOpen && selectedPlace && (
              <InfoWindow
                // Inbuilt props: https://react-google-maps-api-docs.netlify.app/#infowindow.
                anchor={markerMap[selectedPlace.properties.id]}
                onCloseClick={() => setInfoOpen(false)}
              >
                <div>
                  <h5>
                    {selectedPlace.properties.fullname +
                      ", stop " +
                      selectedPlace.properties.id}
                  </h5>
                  <RtpiApi
                    // Passing in useState props - defined above.
                    number={selectedPlace.properties.id}
                  />
                </div>
              </InfoWindow>
            )}
            {/* Markers dropped when  geolocation activated. */}
            {geoMarkers.map((marker) => (
              <Marker
                // Inbuilt props: https://react-google-maps-api-docs.netlify.app/#marker.
                key={`${marker.lat}-${marker.lng}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                }}
                onClick={() => {
                  setSelected(marker);
                }}
              />
            ))}
            {/* Markers dropped when stop has been chosen. */}
            {stopMarkers.map((marker) => (
              <Marker
                // Inbuilt props: https://react-google-maps-api-docs.netlify.app/#marker.
                key={`${marker.lat}-${marker.lng}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                }}
                onClick={() => {
                  setSelected(marker);
                }}
              />
            ))}
            {destination !== "" && origin !== "" && (
              <DirectionsService
                // Inbuilt props: https://react-google-maps-api-docs.netlify.app/#directionsservice.
                options={{
                  destination: destination,
                  origin: origin,
                  travelMode: "TRANSIT",
                  provideRouteAlternatives: true,
                  transitOptions: {
                    modes: ["BUS"],
                    routingPreference: "FEWER_TRANSFERS",
                    departureTime: selectedTime,
                  },
                }}
                // required
                callback={directionsCallback}
              />
            )}
            {response !== null && (
              <DirectionsRenderer
                // Inbuilt props: https://react-google-maps-api-docs.netlify.app/#directionsrenderer.
                // required
                options={{
                  directions: response.response,
                  // hideRouteList: true,
                  polylineOptions: {
                    strokeColor: "red",
                    strokeWeight: 5,
                  },
                  suppressInfoWindows: true,
                  suppressMarkers: false,
                }}
                // removing all displayed stops upon loading
                onLoad={() => {
                  setRouteString("");
                  setMarkerSelection(false);
                  setSubMarkerSelection(false);
                }}
              />
            )}
          </GoogleMap>
        </Col>
        <Col
          lg={3}
          // CSS
          style={{ paddingTop: "1vh", paddingRight: "2vw", height: "92vh" }}
        >
          <PredictionInput
            // Passing in useState props - defined above.
            setGeoMarkers={setGeoMarkers}
            setStopMarkers={setStopMarkers}
            originNumber={originNumber}
            setOrigin={setOrigin}
            destinationNumber={destinationNumber} // ??
            setDestination={setDestination}
            distance={distance}
            setRouteString={setRouteString} // ??
            setResponse={setResponse}
            setResponseValidator={setResponseValidator}
            setMarkerSelection={setMarkerSelection}
            setSubMarkerSelection={setSubMarkerSelection}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            timeDayMonth={timeDayMonth}
            setTimeDayMonth={setTimeDayMonth}
            routeSelect={routeSelect}
            setRouteSelect={setRouteSelect}
            directionSelect={directionSelect}
            setDirectionSelect={setDirectionSelect}
            filteredStops={filteredStops}
            setFilteredStops={setFilteredStops}
            filteredStopsLatLng={filteredStopsLatLng}
            // Passing in useRef props - defined above.
            refSelectedRoute={refSelectedRoute}
            refUserOrigin={refUserOrigin}
            refUserDestination={refUserDestination}
            // Passing in useCallback props - defined above.
            panTo={panTo}
            // Passing in arrow function props - defined above.
            originChoice={originChoice}
            destinationChoice={destinationChoice}
            originNumberChoice={originNumberChoice}
            destinationNumberChoice={destinationNumberChoice}
            timeChoice={timeChoice}
            routeChoice={routeChoice} // ??
            // Passing in props - Stop data defined above.
            parsedStops={parsedStops}
            stopDescriptions={stopDescriptions}
            allRoutes={allRoutes}
            getStops={getStops}
            routeDirectionStops={routeDirectionStops}
          />
        </Col>
      </Row>
    </Container>
  );
}
