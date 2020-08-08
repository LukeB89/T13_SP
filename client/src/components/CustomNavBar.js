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
  // ?? This hasn't been received from App.js. Does it work?
  setMarkerMap,
  // Receiving props - Functions defined in App.js.
  panTo,
  stopChoice,
  routeChoice,
  // Receiving props - Stop data defined in App.js.
  parsedStops,
  stopDescriptions,
  allRoutes,
  // Receiving props - setTouristModeFlag defined in App.js
  touristModeFlag,
  setTouristModeFlag,
  nightModeFlag,
  setNightModeFlag,
  setMapOptions,
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
    <Navbar
      // Inbuilt props: https://react-bootstrap.github.io/components/navbar/#navbar-props
      bg="dark"
      variant="dark"
      // CSS
      style={{ maxHeight: "7vh", paddingBottom: "1vh" }}
    >
      <Navbar.Brand href="#home">
        <img
          alt=""
          src="https://media.glassdoor.com/sqll/1043913/dublin-bus-squarelogo-1440748899751.png"
          // CSS
          width="30"
          height="30"
          className="d-inline-block align-top"
        />{" "}
        Dublin Bus
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav
          // Inbuilt props: https://react-bootstrap.github.io/components/navs/#nav-props.
          className="mr-auto"
        ></Nav>

        <Form
          // CSS
          style={{ paddingRight: "1vw" }}
        >
          <Form.Group
            // Inbuilt props: https://react-bootstrap.github.io/components/forms/#form-group-props.
            controlId="formRealTime"
            // CSS
            style={{ paddingTop: "1.6vh", width: "15vw" }}
          >
            <StopSearch
              // Passing in props - Functions defined in App.js.
              panTo={panTo}
              stopChoice={stopChoice}
              // ?? This hasn't been received from above. Does it work?
              setMarkerMap={setMarkerMap}
              // Passing in props - Stop data defined in App.js.
              parsedStops={parsedStops}
              stopDescriptions={stopDescriptions}
            />
          </Form.Group>
        </Form>
        <Form
          // CSS
          style={{ paddingRight: "1vw" }}
        >
          <Form.Check
            // Inbuilt props: https://react-bootstrap.github.io/components/forms/#form-check-props.
            type="switch"
            id="night-switch"
            label="Night Mode"
            // CSS
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
        </Form>
        <Form
          // CSS
          style={{ paddingRight: "1vw" }}
        >
          <Form.Check
            // Inbuilt props: https://react-bootstrap.github.io/components/forms/#form-check-props.
            type="switch"
            id="tourist-switch"
            label="Tourist Mode"
            // CSS
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
        </Form>
        <Weather
          // Inbuilt props: https://github.com/lopogo59/simple-react-weather#readme.
          unit="C"
          city="Dublin, IE"
          // ?? This API key will need to be hidden.
          appid="0af2c4378e1bfb001a3e457cc32410be"
          // CSS
          style={{ paddingTop: "1.8vh" }}
        />
      </Navbar.Collapse>
    </Navbar>
  );
}
export default CustomNavbar;
