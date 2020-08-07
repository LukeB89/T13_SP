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
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";
// Importing self-developed components.
import CustomNavBar from "./components/CustomNavBar";
import StopSearch from "./components/StopSearch";
import Locate from "./components/Locate";
import PredictionInput from "./components/PredictionInput";
import RtpiApi from "./components/RtpiApi";
// Importing outside developed css.
import "bootstrap/dist/css/bootstrap.min.css";
import "@reach/combobox/styles.css";
// Importing Google Maps Api Key.
import googleMapApiKey from "./config";
// Defining libraries for Google Places
const libraries = ["places"];
// Importing the Dublin Bus API stops data
const data = require("./data/DublinBusStops.json");
// // consts: [53.349804, -6.260310] - Dublin
const dublinCenter = require("./data/DublinCenter.json");
// Importing custom styles to customize the style of Google Map...
// important for including and excluding certain place markers etc.
const normalModeBasic = require("./data/NormalModeBasic");

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
  const [mapOptions, setMapOptions] = useState({
    styles: normalModeBasic,
    disableDefaultUI: true,
    zoomControl: true,
    maxZoom: 17,
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

  // Orient the map to selected location.
  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(16);
    setDestination("");
    setStopMarkers((current) => [...current, { lat: lat, lng: lng }]);
  }, []);

  // Orient the map to selected location.
  const panToGeoMarker = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(16);
    // Resetting the drawn route anytime this functions is called.
    setDestination("");
    setGeoMarkers((current) => [...current, { lat: lat, lng: lng }]);
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
    // console.log("originChoice triggered", address);
    setOrigin(() => address);
    // setOrigin(() => address.results[0].formatted_address);
  };
  // Changing destination info based on user choice.
  const destinationChoice = (address) => {
    // console.log("destinationChoice triggered", address);
    setDestination(() => address);
    // setDestination(() => address.results[0].formatted_address);
  };
  // Changing stops of route displayed on based on user choice.
  const routeChoice = (route) => {
    setRouteString(() => route.routeString);
  };

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

  //  For which set of markers to display (Clusters or Route Markers).
  const markerSelectionChoice = () => {
    setMarkerSelection(() => false);
  };

  // For setting the selected origin stop number in state.
  const originNumberChoice = (number) => {
    console.log("originNumberChoice", number);
    setOriginNumber(() => parseInt(number.id));
  };
  // For setting the selected destination stop number in state.
  const destinationNumberChoice = (number) => {
    console.log("destinationNumberChoice", number);
    setDestinationNumber(() => parseInt(number.id));
  };

  // For setting the time in state.
  const timeChoice = (selectedTime) => {
    if (selectedTime === null) {
      console.log("this dut has activated");
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
  // console.log("These are the time values: date-day-month", timeDayMonth);

  const filteredStopsChoice = (filteredMarkers) => {
    setFilteredStops(() => filteredMarkers);
  };

  const filteredStopsLatLngChoice = (filteredMarkers) => {
    setFilteredStopsLatLng(() => filteredMarkers);
  };

  if (loadError) return "Error";
  // if (!isLoaded) return <Loader type="line-scale" active />;+
  if (!isLoaded)
    return (
      <Spinner animation="border" role="status">
        <span className="sr-only">Loading...</span>
      </Spinner>
    );

  return (
    <Container fluid>
      <Row>
        <Col sm={12}>
          <CustomNavBar
            // Passing in props - Custom built components.
            StopSearch={StopSearch}
            // Passing in props - Functions defined above.
            panTo={panTo}
            stopChoice={stopChoice}
            routeChoice={routeChoice}
            // Passing in props - Stop data defined above.
            parsedStops={parsedStops}
            stopDescriptions={stopDescriptions}
            allRoutes={allRoutes}
            // Passing in props - touristModeFlag defined above
            touristModeFlag={touristModeFlag}
            setTouristModeFlag={setTouristModeFlag}
            nightModeFlag={nightModeFlag}
            setNightModeFlag={setNightModeFlag}
            setMapOptions={setMapOptions}
            normalModeBasic={normalModeBasic}
          />
        </Col>
      </Row>
      <Row>
        <Col lg={9}>
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
              // Passing in props - Functions defined above.
              panToGeoMarker={panToGeoMarker}
              setResponse={setResponse}
            />
            <RouteInfo
              // Passing in props - Functions defined above.
              markerLoadHandler={markerLoadHandler}
              markerClickHandler={markerClickHandler}
              markerSelectionChoice={markerSelectionChoice}
              filteredStopsLatLngChoice={filteredStopsLatLngChoice}
              mapRef={mapRef}
              // Passing in props - Stop data defined above.
              routeString={routeString}
              routeSelect={routeSelect}
              filteredStopsChoice={filteredStopsChoice}
            />
            <ClusteredMarkers
              // Passing in props - Functions defined above.
              markerLoadHandler={markerLoadHandler}
              markerClickHandler={markerClickHandler}
              markerSelection={markerSelection}
              // Passing in props - Stop data defined above.
              myStops={myStops}
              setFilteredStops={setFilteredStops}
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
                    // Passing in props - Stop data defined above.
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
                    // arrivalTime: new Date(1337675679473),
                    departureTime: selectedTime,
                  },
                  // transitDetails: { trip_short_name: "145" },
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
                // panel={document.getElementById("panel")}
                // removing all displayed stops upon loading
                onLoad={() => {
                  // setRouteSelect("");
                  setRouteString("");
                  setMarkerSelection(false);
                }}
              />
            )}
          </GoogleMap>
        </Col>
        <Col
          lg={3}
          // CSS
          style={{ paddingTop: "2vh" }}
        >
          <PredictionInput
            // Passing in props - Functions defined above.
            panTo={panTo}
            originChoice={originChoice}
            destinationChoice={destinationChoice}
            originNumberChoice={originNumberChoice}
            destinationNumberChoice={destinationNumberChoice}
            timeChoice={timeChoice}
            routeChoice={routeChoice}
            // Passing in props - Variables defined above.
            setResponseValidator={setResponseValidator}
            setStopMarkers={setStopMarkers}
            setRouteString={setRouteString}
            setGeoMarkers={setGeoMarkers}
            setMarkerSelection={setMarkerSelection}
            setFilteredStops={setFilteredStops}
            setOrigin={setOrigin}
            setDestination={setDestination}
            originNumber={originNumber}
            destinationNumber={destinationNumber}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            timeDayMonth={timeDayMonth}
            setTimeDayMonth={setTimeDayMonth}
            routeSelect={routeSelect}
            setRouteSelect={setRouteSelect}
            directionSelect={directionSelect}
            setDirectionSelect={setDirectionSelect}
            setResponse={setResponse}
            // Passing in props - Directions response defined above.
            distance={distance}
            // Passing in props - Stop data defined above.
            parsedStops={parsedStops}
            stopDescriptions={stopDescriptions}
            allRoutes={allRoutes}
            filteredStops={filteredStops}
            filteredStopsLatLng={filteredStopsLatLng}
          />
          <div id="panel"></div>
        </Col>
      </Row>
    </Container>
  );
}

// Function that filters the markers on the map
// according to a user selected route.
function RouteInfo(props) {
  // i want to be able to define this variable outside of this function.
  // but it has to be populated in here.
  // when it has been populated it shoiuld be set in App.
  const filteredMarkers = [];
  const filteredStopStrings = [];
  const filteredStopsCoords = [];

  for (var i = 0; i < myStops.length; i++) {
    for (var j = 0; j < myStops[i].properties.routes.length; j++) {
      if (String(myStops[i].properties.routes[j]) === props.routeString) {
        filteredMarkers.push(myStops[i]);
        filteredStopStrings.push(myStops[i].description);
        filteredStopsCoords.push(myStops[i].geometry.pos);
      }
    }
  }

  const uniqueMarkers = filteredMarkers.filter(
    (a, b) => filteredMarkers.indexOf(a) === b
  );

  const bounds = new window.google.maps.LatLngBounds(); // create an empty new bounds object
  for (i = 0; i < filteredStopsCoords.length; i++) {
    bounds.extend(filteredStopsCoords[i]);
  }
  if (String(props.routeString) !== "") {
    // console.log(filteredMarkers);
    return uniqueMarkers.map((stop) => (
      <Marker
        icon={icon}
        key={stop.properties.id}
        position={stop.geometry.pos}
        onLoad={(marker) => {
          props.filteredStopsLatLngChoice(filteredStopsCoords);
          props.filteredStopsChoice(filteredStopStrings);
          // Will do for now - removing cluster upon selection of route.
          props.markerSelectionChoice(false);
          props.markerLoadHandler(marker, stop);
          // Changing the bounds to fit map to chosen route's markers.
          props.mapRef.current.fitBounds(bounds);
          props.mapRef.current.setZoom(13);
        }}
        onClick={(event) => {
          props.markerClickHandler(event, stop);
        }}
        animation={window.google.maps.Animation.DROP}
      />
    ));
  } else {
    return null;
  }
}

// Function that renders all of the Dublin Bus stops in clustered form.
// props.markerSelection being set to True means that they will all be displayed on
// the first load. When a route is chosen from the RouteInfo function above,
// props.markerSelection gets set to False and all of the markers are removed. This solution
// is intended only to be temporary until something better comes up.
function ClusteredMarkers(props) {
  if (props.markerSelection === true) {
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
