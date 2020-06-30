import React, { Component } from "react";
import DatePicker from "react-datepicker";
import Form from "react-bootstrap/Form";

import "react-datepicker/dist/react-datepicker.css";
import ".././styles.css";

class DateTimeSelector extends Component {
  state = {
    startDate: new Date(),
  };

  render() {
    const { startDate } = this.state;
    return (
      <Form>
        <Form.Group controlId="formTimeOfTravel">
          <Form.Label>Time of Travel</Form.Label>
          <DatePicker
            selected={startDate}
            onChange={this.handleChange}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            timeCaption="time"
            dateFormat="MMMM d, yyyy h:mm aa"
          />
        </Form.Group>
      </Form>
    );
  }

  handleChange = (startDate) => {
    this.setState({
      startDate,
    });
  };
}

export default DateTimeSelector;
