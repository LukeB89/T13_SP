import React, { useState } from "react";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  InfoWindow,
  MarkerClusterer,
} from "@react-google-maps/api";
import useSwr from "swr";

import googleMapApiKey from ".././config";

// Import custom styles to customize the style of Google Map
const styles = require("../data/GoogleMapStyles.json");

const options = {
  imagePath:
    "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
};

const fetcher = (...args) => fetch(...args).then((response) => response.json());

export default function T13GoogleMap() {
  // The things we need to track in state
  const [mapRef, setMapRef] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [markerMap, setMarkerMap] = useState({});
  // consts: [53.349804, -6.260310] - Dublin
  const [center, setCenter] = useState({ lat: 53.349804, lng: -6.26031 });
  const [zoom, setZoom] = useState(11);
  const [infoOpen, setInfoOpen] = useState(false);

  // Load the Google maps scripts
  const { isLoaded } = useLoadScript({
    // Enter your own Google Maps API key in config.js
    googleMapsApiKey: googleMapApiKey,
  });

  const url =
    "https://data.smartdublin.ie/cgi-bin/rtpi/busstopinformation?operator=bac";
  const { data, error } = useSwr(url, { fetcher });
  // Creating a placeholder JSON object while the real one is fetched.
  const stopData =
    data && !error
      ? data
      : {
          results: [
            {
              stopid: "0",
              fullname: "Test0",
              latitude: "53.60395194",
              longitude: "-6.184445556",
              operators: [
                {
                  routes: ["46A"],
                },
              ],
            },
            {
              stopid: "1",
              fullname: "Test1",
              latitude: "53.0706738889",
              longitude: "-6.063445",
              operators: [
                {
                  routes: ["46A"],
                },
              ],
            },
            {
              stopid: "2",
              fullname: "Test2",
              latitude: "53.13340306",
              longitude: "-6.614838889",
              operators: [
                {
                  routes: ["46A"],
                },
              ],
            },
          ],
        };

  console.log("Stop data here", stopData.results);
  const myStops = stopData.results.map((stop) => ({
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

  console.log(myStops);

  // Iterate myStops to size, center, and zoom map to contain all markers
  const fitBounds = (map) => {
    const bounds = new window.google.maps.LatLngBounds();
    myStops.map((stop) => {
      bounds.extend(stop.geometry.pos);
      return stop.properties.id;
    });
    map.fitBounds(bounds);
  };

  const loadHandler = (map) => {
    // Store a reference to the google map instance in state
    setMapRef(map);
    // Fit map bounds to contain all markers
    fitBounds(map);
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

    // If you want to zoom in a little on marker click
    if (zoom < 11) {
      setZoom(11);
    }

    // if you want to center the selected Marker
    //setCenter(place.pos)
  };

  const renderPage = () => {
    return (
      <GoogleMap
        onLoad={loadHandler}
        onCenterChanged={() => setCenter(mapRef.getCenter().toJSON())}
        center={center}
        zoom={zoom}
        options={{ styles: styles }}
        mapContainerStyle={{
          height: "94vh",
        }}
      >
        <MarkerClusterer options={options}>
          {(clusterer) =>
            myStops.map((stop) => (
              <Marker
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
    );
  };
  return isLoaded ? renderPage() : null;
}
