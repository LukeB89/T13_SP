// Importing outside developed components.
import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Form from "react-bootstrap/Form";
import Weather from "simple-react-weather";

// This SPA's NavBar, containing branding logo, FilterRoute and
// StopSearch Autocomplete selectors, and Tourist Mode toggle.
function CustomNavbar({
  // Receiving props - Custom built components.
  FilterRoute,
  StopSearch,
  // ?? This hasn't been received from App.js. Does it work?
  setMarkerMap,
  // Receiving props - Functions defined in App.js.
  panTo,
  stopChoice,
  routeChoice,
  panTwo,
  // Receiving props - Stop data defined in App.js.
  parsedStops,
  stopDescriptions,
  allRoutes,
}) {
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
          id="custom-switch"
          label="Tourist Mode"
          // CSS
          style={{ color: "white" }}
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
    </Navbar>
  );
}
export default CustomNavbar;
