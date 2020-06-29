import React, { useState } from "react";
import useSwr from "swr";
import styled from 'styled-components';
import {
  useLoadScript,
  GoogleMap,
  Marker,
  InfoWindow,
  MarkerClusterer
} from "@react-google-maps/api";

import googleMapApiKey from './config';
import Api from './components/Api';
import DateTimeSelector from './components/DateTimeSelector';

import * as data from "./data/db-stops.json";

const Wrapper = styled.main`
  width: 100vh;
  height: 100vh;
`;

const options = {
  imagePath: "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m"
};

export default function App() {
  // The things we need to track in state
  const [mapRef, setMapRef] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [markerMap, setMarkerMap] = useState({});
  // consts: [53.349804, -6.260310] - Dublin
  const [center, setCenter] = useState({ lat: 53.349804, lng: -6.260310 });
  const [zoom, setZoom] = useState(10);
  // const [clickedLatLng, setClickedLatLng] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);

  // Load the Google maps scripts
  const { isLoaded } = useLoadScript({
    // Enter your own Google Maps API key in config.js
    googleMapsApiKey: googleMapApiKey

  });

  // Currently reading in data variable from db-stops.json file, will use API in future, see three lines below
//   const url = "https://data.smartdublin.ie/cgi-bin/rtpi/busstopinformation?operator=bac";
//   const { data, error } = useSwr(url, { fetcher });
//   const stopData = data && !error ? data.slice(0, 4200) : [];
  // Currently reading in data variable from db-stops.json file, will use API in future, see three commented lines above.
  const uncleanData = data.results;
  // A GeoJSON Feature object, with the geometry/pos of each object being a GeoJSON Point
  // ref: https://tools.ietf.org/html/rfc7946#section-3.2
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
                height: "100%"
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
            <Api />

          </Wrapper>

        </Wrapper>
    );
  };

  return isLoaded ? renderPage() : null;
}
