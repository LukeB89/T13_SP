import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Form from "react-bootstrap/Form";

function CustomNavbar({
  StopSearch,
  panTo,
  stopChoice,
  setMarkerMap,
  stopDescriptions,
  parsedStops,
  FilterRoute,
  routeChoice,
  allRoutes,
}) {
  return (
    <Navbar
      bg="dark"
      variant="dark"
      style={{ maxHeight: "7vh", paddingBottom: "1vh" }}
    >
      <Navbar.Brand href="#home">
        <img
          alt=""
          src="https://media.glassdoor.com/sqll/1043913/dublin-bus-squarelogo-1440748899751.png"
          width="30"
          height="30"
          className="d-inline-block align-top"
        />{" "}
        Dublin Bus
      </Navbar.Brand>
      <Nav className="mr-auto"></Nav>
      <Form style={{ paddingRight: "1vw" }}>
        <Form.Group
          controlId="formRealTime"
          style={{ paddingTop: "1.6vh", width: "6.5vw" }}
        >
          <FilterRoute routeChoice={routeChoice} allRoutes={allRoutes} />
        </Form.Group>
      </Form>
      <Form style={{ paddingRight: "1vw" }}>
        <Form.Group
          controlId="formRealTime"
          style={{ paddingTop: "1.6vh", width: "15vw" }}
        >
          <StopSearch
            panTo={panTo}
            stopChoice={stopChoice}
            setMarkerMap={setMarkerMap}
            stopDescriptions={stopDescriptions}
            parsedStops={parsedStops}
          />
        </Form.Group>
      </Form>
      <Form style={{ paddingRight: "1vw" }}>
        <Form.Check
          type="switch"
          id="custom-switch"
          label="Tourist Mode"
          style={{ color: "white" }}
        />
      </Form>
    </Navbar>
  );
}
export default CustomNavbar;
