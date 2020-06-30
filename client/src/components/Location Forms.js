import React, { Component } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Typeahead } from "react-bootstrap-typeahead";

import "react-bootstrap-typeahead/css/Typeahead.css";

import * as data from ".././data/db-stops.json";
const uncleanData = data.results;

const nameOfStops = uncleanData.map((stop) => ({
  label: stop.fullname,
  id: parseInt(stop.stopid),
}));

console.log(nameOfStops);

class LocationForms extends Component {
  state = {
    selected: [],
  };

  render() {
    return (
      <Form>
        <Form.Group controlId="formDeparture">
          <Form.Label>Departure</Form.Label>
          <Typeahead
            {...this.state}
            id="basic-example"
            onChange={(selected) => this.setState({ selected })}
            options={nameOfStops}
            placeholder="Choose a departure stop..."
          />
        </Form.Group>

        <Form.Group controlId="formArrival">
          <Form.Label>Arrival</Form.Label>
          <Typeahead
            {...this.state}
            id="basic-example"
            onChange={(selected) => this.setState({ selected })}
            options={nameOfStops}
            placeholder="Choose an arrival stop..."
          />
        </Form.Group>
        <Form.Group controlId="formModeSubmit">
          <Form.Check
            style={{ paddingBottom: "10px" }}
            type="switch"
            id="custom-switch"
            label="Tourist Mode"
          />
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form.Group>
      </Form>
    );
  }
}

export default LocationForms;
