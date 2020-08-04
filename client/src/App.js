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
// Importing self-developed components.
import CustomNavBar from "./components/CustomNavBar";
import FilterRoute from "./components/FilterRoute";
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
  // eslint-disable-next-line
  const [zoom, setZoom] = useState(11); // removing unwanted warning.
  // The general things we need to track in state:
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [markerMap, setMarkerMap] = useState({});
  const [infoOpen, setInfoOpen] = useState(false);
  const [markers, setMarkers] = useState([]);
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
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  // This is being used to track in state which set of markers is displayed. (Clusters or Route Markers)
  const [markerSelection, setMarkerSelection] = useState("True");
  // The things for selected time (Hour, Day, Month) we need to track in state.
  const [selectedTime, setSelectedTime] = useState(new Date());
  // Setting the time, day and month values as the current time.
  // This allows for user to make prediction for journey that occurs at
  // this time without having to select the time.
  const initialTime = selectedTime.toTimeString().substring(0, 2);
  const [initialDay, initialMonth] = selectedTime.toDateString().split(" ");
  // An array containing time data for model input.
  const [timeDayMonth, setTimeDayMonth] = useState([
    initialTime,
    initialDay,
    initialMonth,
  ]);
  // Track state of user selected routes and directions.
  const [routeSelect, setRouteSelect] = React.useState("");
  const [directionSelect, setDirectionSelect] = React.useState(undefined);
  // Track state of filtered bus stops.
  const [filteredStops, setFilteredStops] = React.useState([]);
  const [filteredStopsLatLng, setFilteredStopsLatLng] = React.useState([]);

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Orient the map to selected location.
  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(16);
    // Resetting the drawn route anytime this functions is called.
    setDestination("");
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
  const directionsCallback = (response) => {
    if (response !== null) {
      if (response.status === "OK") {
        console.log(
          "routeSelect in directionsCallback",
          routeSelect.toLowerCase()
        );
        // This is the array you want associated with
        // the response instead of the one that google assigns.
        const selectedRouteArray = [];
        for (var i = 0; i < response.routes.length; i++) {
          for (var j = 0; j < response.routes[i].legs.length; j++) {
            for (var k = 0; k < response.routes[i].legs[j].steps.length; k++) {
              if (
                // making sure that WALKING is excluded since it will not contain bus name information
                response.routes[i].legs[j].steps[k].travel_mode == "TRANSIT" &&
                // locating the first occurence of the users selected route
                String(
                  response.routes[i].legs[j].steps[k].transit.line.short_name
                ) === routeSelect.toLowerCase()
              ) {
                selectedRouteArray.push(response.routes[i]);
              }
            }
          }
        }
        // setting the routes array to be the one containing our desired bus route.
        response.routes = selectedRouteArray;
        setResponse(() => ({
          response,
        }));
      } else {
      }
    }
  };

  //  For which set of markers to display (Clusters or Route Markers).
  const markerSelectionChoice = () => {
    setMarkerSelection(() => "False");
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
    const time = selectedTime.toTimeString().substring(0, 2);
    const [day, month] = selectedTime.toDateString().split(" ");
    setSelectedTime(selectedTime);
    setTimeDayMonth([time, day, month]);
  };
  // console.log("These are the time values: date-day-month", timeDayMonth);

  const filteredStopsChoice = (filteredMarkers) => {
    setFilteredStops(() => filteredMarkers);
  };

  const filteredStopsLatLngChoice = (filteredMarkers) => {
    setFilteredStopsLatLng(() => filteredMarkers);
  };

  // Orient the map to the selected route.
  // Will need to have passed in to it an array of stop locations.
  const panTwo = React.useCallback(
    // For some reason there is delay in this function receiving filteredStopsLatLng.
    // You had this problem before, with the time. How the hell did you fix that?!
    () => {
      // console.log(newBounds, "here is geometry in panTwo in App.js");
      // mapRef.current.fitBounds(newBounds);
      // mapRef.current.setZoom(12);
      // Resetting the drawn route anytime this functions is called.
      setDestination("");
    },
    []
  );

  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";

  return (
    <Container fluid>
      <Row>
        <Col sm={12}>
          <CustomNavBar
            // Passing in props - Custom built components.
            FilterRoute={FilterRoute}
            StopSearch={StopSearch}
            // Passing in props - Functions defined above.
            panTo={panTo}
            stopChoice={stopChoice}
            routeChoice={routeChoice}
            panTwo={panTwo}
            // Passing in props - Stop data defined above.
            parsedStops={parsedStops}
            stopDescriptions={stopDescriptions}
            allRoutes={allRoutes}
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
              panTo={panTo}
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
              route={routeString}
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
            {/* Markers dropped when stop has been chosen or geolocation activated. */}
            {markers.map((marker) => (
              <Marker
                // Inbuilt props: https://react-google-maps-api-docs.netlify.app/#marker.
                key={`${marker.lat}-${marker.lng}`}
                position={{ lat: marker.lat, lng: marker.lng }}
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
                  // transitDetails: { trip_short_name: "145" },
                }}
                // required
                callback={directionsCallback}
              />
            )}
            {response !== null && (
              <DirectionsRenderer
                // Inbuilt props: https://react-google-maps-api-docs.netlify.app/#directionsrenderer.
                // what you might try to do is iterate over
                // the route list and find the one with short_name of
                // selected route, then render that one using routeIndex : i.
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
                  setRouteString("");
                  setMarkerSelection("False");
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
            panTwo={panTwo}
            originChoice={originChoice}
            destinationChoice={destinationChoice}
            originNumberChoice={originNumberChoice}
            destinationNumberChoice={destinationNumberChoice}
            timeChoice={timeChoice}
            routeChoice={routeChoice}
            // Passing in props - Variables defined above.
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
      if (String(myStops[i].properties.routes[j]) === props.route) {
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
    // console.log("hi there", filteredStopsCoords[i]);
  }
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
        props.markerSelectionChoice("False");
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
}

// Function that renders all of the Dublin Bus stops in clustered form.
// props.markerSelection being set to True means that they will all be displayed on
// the first load. When a route is chosen from the RouteInfo function above,
// props.cheker gets set to False and all of the markers are removed. This solution
// is intended only to be temporary until something better comes up.
function ClusteredMarkers(props) {
  if (props.markerSelection === "True") {
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
