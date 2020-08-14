// Importing outside developed components.
import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Form from "react-bootstrap/Form";
import Weather from "simple-react-weather";
// Importing custom styles to customize the style of Google Map...
// important for including and excluding certain place markers etc.
const nightModeBasic = require("../data/NightModeBasic.json");
const nightModeTourist = require("../data/NightModeTourist.json");
const normalModeTourist = require("../data/NormalModeTourist.json");

const nightBasicOptions = {
  styles: nightModeBasic,
  disableDefaultUI: true,
  zoomControl: true,
  maxZoom: 17,
  minZoom: 11,
};

const nightTouristOptions = {
  styles: nightModeTourist,
  disableDefaultUI: true,
  zoomControl: true,
  maxZoom: 17,
  minZoom: 11,
};

const normalTouristOptions = {
  styles: normalModeTourist,
  disableDefaultUI: true,
  zoomControl: true,
  maxZoom: 17,
  minZoom: 11,
};

// This SPA's NavBar, containing branding logo, FilterRoute and
// StopSearch Autocomplete selectors, and Tourist Mode toggle.
function CustomNavbar({
  // Receiving props - Custom built components.
  StopSearch,
  // Receiving useState props - defined in App.js.
  touristModeFlag,
  setTouristModeFlag,
  nightModeFlag,
  setNightModeFlag,
  setMapOptions,
  // Receiving useCallback props - defined in App.js.
  panTo,
  //Receiving arrow function props - defined in App.js.
  stopChoice,
  // Receiving props - Stop data defined in App.js.
  parsedStops,
  stopDescriptions,
  // Receiving props - CSS data defined in App.js.
  normalModeBasic,
}) {
  const normalBasicOptions = {
    styles: normalModeBasic,
    disableDefaultUI: true,
    zoomControl: true,
    maxZoom: 17,
    minZoom: 11,
  };
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Navbar.Brand href="">
        <img
          alt="dublin_bus.jpeg"
          src="dublin_bus.jpeg"
          // CSS
          width="30"
          height="30"
          className="d-inline-block align-top"
          // Reload the page when clicked.
          onClick={() => window.location.reload(false)}
          style={{ cursor: "pointer" }}
        />{" "}
        Dublin Bus Journey Planner
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        {/* For orienting toward the right */}
        <Nav className="mr-auto"></Nav>
        <Form inline>
          <Form.Check
            // Inbuilt props: https://react-bootstrap.github.io/components/forms/#form-check-props.
            type="switch"
            id="night-switch"
            label="Night Mode"
            // CSS
            className="mr-sm-2"
            style={{ color: "white" }}
            onClick={() => {
              if (nightModeFlag === false && touristModeFlag === false) {
                setNightModeFlag(true);
                setMapOptions(nightBasicOptions);
              } else if (nightModeFlag === true && touristModeFlag === false) {
                setNightModeFlag(false);
                setMapOptions(normalBasicOptions);
              } else if (nightModeFlag === false && touristModeFlag === true) {
                setNightModeFlag(true);
                setMapOptions(nightTouristOptions);
              } else if (nightModeFlag === true && touristModeFlag === true) {
                setNightModeFlag(false);
                setMapOptions(normalTouristOptions);
              }
            }}
          />
          <Form.Check
            // Inbuilt props: https://react-bootstrap.github.io/components/forms/#form-check-props.
            type="switch"
            id="tourist-switch"
            label="Tourist Mode"
            // CSS
            className="mr-sm-2"
            style={{ color: "white" }}
            onClick={() => {
              if (touristModeFlag === false && nightModeFlag === false) {
                setTouristModeFlag(true);
                setMapOptions(normalTouristOptions);
              } else if (touristModeFlag === true && nightModeFlag === false) {
                setTouristModeFlag(false);
                setMapOptions(normalBasicOptions);
              } else if (touristModeFlag === false && nightModeFlag === true) {
                setTouristModeFlag(true);
                setMapOptions(nightTouristOptions);
              } else if (touristModeFlag === true && nightModeFlag === true) {
                setTouristModeFlag(false);
                setMapOptions(nightBasicOptions);
              }
            }}
          />
          <StopSearch
            // Passing in useCallback props - defined in App.js.
            panTo={panTo}
            // Passing in arrow function props - defined in App.js.
            stopChoice={stopChoice}
            // Passing in props - Stop data defined in App.js.
            parsedStops={parsedStops}
            stopDescriptions={stopDescriptions}
          />
          <Weather
            // Inbuilt props: https://github.com/lopogo59/simple-react-weather#readme.
            unit="C"
            city="Dublin, IE"
            // ?? This API key will need to be hidden.
            appid={process.env.REACT_APP_WEATHER_API}
            // CSS
            className="mr-sm-2"
            style={{ paddingTop: "1.5vh" }}
          />
        </Form>
      </Navbar.Collapse>
    </Navbar>
  );
}
export default CustomNavbar;
