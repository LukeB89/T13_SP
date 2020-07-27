import React from "react";
import DatePicker from "react-datepicker";
import Form from "react-bootstrap/Form";
import ModelApi from "./ModelApi";

import "react-datepicker/dist/react-datepicker.css";
import ".././styles.css";

const DateTimeSelector = (props) => {
  return (
    <Form>
      <Form.Group controlId="formTimeOfTravel">
        <Form.Label>Time of Travel: </Form.Label>
        <DatePicker
          selected={props.selectedTime}
          // onSelect={props.timeChoice}
          onChange={props.timeChoice}
          // Problem here!: if using onSelect, the time value isn't picked up
          // using onChange means there's a click delay in the values being set.
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={60}
          timeCaption="time"
          dateFormat="MMMM d, yyyy h:mm aa"
        />
        <Form.Label style={{ paddingTop: "1vh" }}>Route: 46A</Form.Label>
      </Form.Group>
      <ModelApi timeDayMonth={props.timeDayMonth}></ModelApi>
    </Form>
  );
};

export default DateTimeSelector;
