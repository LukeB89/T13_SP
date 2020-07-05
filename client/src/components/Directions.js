/*global google*/
import React, { Component } from "react";
import { DirectionsRenderer } from "@react-google-maps/api";

class Directions extends Component {
  state = {
    directions: null,
    selected: [],
  };

  render() {
    return (
      <div>
        <DirectionsRenderer directions={this.state.directions} />
      </div>
    );
  }

  componentDidMount() {
    const directionsService = new google.maps.DirectionsService();

    // we want to make these variable values, to be able to
    // pass this information from what has been selected above.
    const origin = { lat: 53.3472419444, lng: -6.2587911111 };
    const destination = { lat: 53.3466669444, lng: -6.258325 };

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          this.setState({
            directions: result,
          });
          console.log(result);
        } else {
          console.error(`error fetching directions ${result}`);
        }
      }
    );
  }
}

export default Directions;
