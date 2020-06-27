// import apikey from config file
import googleMapApiKey from './config';
import App from './App';

import React, { useState, Fragment } from "react";
import ReactDOM from "react-dom";
import styled from 'styled-components';

import {
  useLoadScript,
  GoogleMap,
  Marker,
  InfoWindow,
  MarkerClusterer
} from "@react-google-maps/api";

import DateTimeSelector from './components/DateTimeSelector';

import * as data from "./data/db-stops.json";

const options = {
  imagePath: "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m"
};

const Wrapper = styled.main`
  width: 100%;
  height: 100%;
`;

function SinglePageApplication() {
  // The things we need to track in state
  const [mapRef, setMapRef] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [markerMap, setMarkerMap] = useState({});
  // consts: [53.349804, -6.260310]
  const [center, setCenter] = useState({ lat: 53.349804, lng: -6.260310 });
  // const [center, setCenter] = useState({ lat: 44.076613, lng: -98.362239833 });
  const [zoom, setZoom] = useState(10);
  // const [clickedLatLng, setClickedLatLng] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);

  // Load the Google maps scripts
  const { isLoaded } = useLoadScript({
    // Enter your own Google Maps API key
    googleMapsApiKey: googleMapApiKey
    // googleMapsApiKey: "AIzaSyDmDEDnZrcDTrRnaCt-fDtCM-xRnML5jyM"
    // AIzaSyDFfQele6SPurbIljoHv4tVF5USA_7y1-o
  });

  const uncleanData = data.results;
  const myStops = uncleanData.map(stop => ({
    type: "Feature",
    properties: { id: stop.stopid, fullname: stop.fullname, routes: stop.operators[0].routes },
    geometry: {
      type: "Point",
      pos: {
        lat: parseFloat(stop.latitude),
        lng: parseFloat(stop.longitude)  
      }
    }
  }));

  // Iterate myStops to size, center, and zoom map to contain all markers
  const fitBounds = map => {
    const bounds = new window.google.maps.LatLngBounds();
    myStops.map(stop => {
      bounds.extend(stop.geometry.pos);
      return stop.properties.id;
    });
    map.fitBounds(bounds);
  };

  const loadHandler = map => {
    // Store a reference to the google map instance in state
    setMapRef(map);
    // Fit map bounds to contain all markers
    fitBounds(map);
  };

  // We have to create a mapping of our places to actual Marker objects
  const markerLoadHandler = (marker, stop) => {
    return setMarkerMap(prevState => {
      // console.log(stop.properties.id);
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

    // If you want to zoom in a little on marker click
    if (zoom < 11) {
      setZoom(11);
    }

    // if you want to center the selected Marker
    //setCenter(place.pos)
  };

  const renderPage = () => {
    return (
      <Fragment>
        <Wrapper>
          <Wrapper style={{ width: "75%", float: "left"}}>
            <GoogleMap
              // Do stuff on map initial laod
              onLoad={loadHandler}
              // Save the current center position in state
              onCenterChanged={() => setCenter(mapRef.getCenter().toJSON())}
              // Save the user's map click position
              // onClick={e => setClickedLatLng(e.latLng.toJSON())}
              center={center}
              zoom={zoom}
              mapContainerStyle={{
                height: "99vh"
              }}
            >
              <MarkerClusterer options={options}>
                {clusterer =>
                  myStops.map(stop => (
                    <Marker 
                      key={stop.properties.id} 
                      position={stop.geometry.pos} 
                      clusterer={clusterer} 
                      onLoad={marker => markerLoadHandler(marker, stop)}
                      onClick={event => markerClickHandler(event, stop)}
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
                    <h3>STOPID: {selectedPlace.properties.id}</h3>
                    <h5>ROUTES: {selectedPlace.properties.routes.join(', ')}</h5>
                    {/* <div>This is your info window content</div> */}
                  </div>
                </InfoWindow>
              )}

            </GoogleMap>
          </Wrapper>
          
          <Wrapper style= {{ width: "25%", float: "right" }}>

            <DateTimeSelector></DateTimeSelector>
            {/* Rendering the database information from here. */}
            <App />

          </Wrapper>

        </Wrapper>
      </Fragment>
    );
  };

  return isLoaded ? renderPage() : null;
}

const rootElement = document.getElementById("root");
ReactDOM.render(<SinglePageApplication />, rootElement);
