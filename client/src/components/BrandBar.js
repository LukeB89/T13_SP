import React, { Component } from "react";
import Navbar from "react-bootstrap/Navbar";

class BrandBar extends Component {
  render() {
    return (
      <Navbar bg="dark" variant="dark">
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
      </Navbar>
    );
  }
}

export default BrandBar;
