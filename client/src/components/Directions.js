import React from "react";
const { Component } = require("react");
const {
  DirectionsRenderer,
  DirectionsService,
  Autocomplete,
} = require("@react-google-maps/api");

class Directions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      response: null,
      travelMode: "TRANSIT",
      origin: "",
      destination: "",
    };

    this.directionsCallback = this.directionsCallback.bind(this);
    this.getOrigin = this.getOrigin.bind(this);
    this.getDestination = this.getDestination.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onMapClick = this.onMapClick.bind(this);

    this.autocomplete = null;

    this.onLoad = this.onLoad.bind(this);
    this.onPlaceChanged = this.onPlaceChanged.bind(this);
  }

  directionsCallback(response) {
    console.log("hi, ", response);

    if (response !== null) {
      if (response.status === "OK") {
        this.setState(() => ({
          response,
        }));
      } else {
        console.log("response: ", response);
      }
    }
  }

  getOrigin(ref) {
    this.origin = ref;
  }

  getDestination(ref) {
    this.destination = ref;
  }

  onClick() {
    if (this.origin.value !== "" && this.destination.value !== "") {
      this.setState(() => ({
        origin: this.origin.value,
        destination: this.destination.value,
      }));
    }
  }

  onMapClick(...args) {
    console.log("onClick args: ", args);
  }

  onLoad(autocomplete) {
    console.log("autocomplete: ", autocomplete);

    this.autocomplete = autocomplete;
  }

  onPlaceChanged() {
    if (this.autocomplete !== null) {
      console.log(this.autocomplete.getPlace());
    } else {
      console.log("Autocomplete is not loaded yet!");
    }
  }

  render() {
    return (
      <div className="map">
        <div className="map-settings">
          <hr className="mt-0 mb-3" />

          <div className="row">
            <div className="col-md-6 col-lg-4">
              <div className="form-group">
                <input
                  id="ORIGIN"
                  className="form-control"
                  type="text"
                  placeholder="Origin"
                  ref={this.getOrigin}
                />
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="form-group">
                <input
                  id="DESTINATION"
                  className="form-control"
                  type="text"
                  placeholder="Destination"
                  ref={this.getDestination}
                />
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="form-group">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={this.onClick}
                >
                  Build Route
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="map-container">
          {this.state.destination !== "" && this.state.origin !== "" && (
            <DirectionsService
              // required
              options={{
                destination: this.state.destination,
                origin: this.state.origin,
                travelMode: this.state.travelMode,
              }}
              // required
              callback={this.directionsCallback}
            />
          )}

          {this.state.response !== null && (
            <DirectionsRenderer
              // required
              options={{
                directions: this.state.response,
              }}
              panel={document.getElementById("panel")}
            />
          )}
        </div>
      </div>
    );
  }
}

export default Directions;
