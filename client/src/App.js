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
import styled from "styled-components";
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
  // Track user selected routes and directions.
  const [routeSelect, setRouteSelect] = React.useState("");
  const [directionSelect, setDirectionSelect] = React.useState();

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

  // Orient the map to the selected route.
  const panTwo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(12);
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
    console.log("originChoice triggered", address);
    setOrigin(() => address);
    // setOrigin(() => address.results[0].formatted_address);
  };
  // Changing destination info based on user choice.
  const destinationChoice = (address) => {
    console.log("destinationChoice triggered", address);
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
        console.log("response here", response);
        // console.log(
        //   "Here is the name of Google's favoured route, ",
        //   response.routes[0].legs[0].steps[0].transit.line.short_name
        // );
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
  console.log("These are the time values: date-day-month", timeDayMonth);

  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";

  return (
    <div>
      <Container fluid>
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

        <Wrapper
          // CSS
          style={{ width: "75%", float: "left" }}
        >
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
              // Passing in props - Variables defined above.
              // ?? Is this required?
              response={response}
            />

            <RouteInfo
              // Passing in props - Functions defined above.
              markerLoadHandler={markerLoadHandler}
              markerClickHandler={markerClickHandler}
              markerSelectionChoice={markerSelectionChoice}
              // Passing in props - Stop data defined above.
              route={routeString}
            />

            <ClusteredMarkers
              // Passing in props - Functions defined above.
              markerLoadHandler={markerLoadHandler}
              markerClickHandler={markerClickHandler}
              markerSelection={markerSelection}
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
        </Wrapper>

        <Wrapper
          style={{
            width: "25%",
            float: "right",
            maxHeight: "93vh",
          }}
        >
          <Container style={{ paddingTop: "2vh" }}>
            <PredictionInput
              // Passing in props - Functions defined above.
              panTo={panTo}
              originChoice={originChoice}
              destinationChoice={destinationChoice}
              originNumberChoice={originNumberChoice}
              destinationNumberChoice={destinationNumberChoice}
              timeChoice={timeChoice}
              // Passing in props - Variables defined above.
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
              // Passing in props - Stop data defined above.
              parsedStops={parsedStops}
              stopDescriptions={stopDescriptions}
            />
            <div id="panel"></div>
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
        props.markerSelectionChoice("False");
        props.markerLoadHandler(marker, stop);
      }}
      onClick={(event) => {
        props.markerClickHandler(event, stop);
      }}
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
