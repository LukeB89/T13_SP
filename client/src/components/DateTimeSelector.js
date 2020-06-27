import React, { Component } from 'react';
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

class DateTimeSelector extends Component {
    state = {
        startDate: new Date()
      };
    
      render() {
        const { startDate } = this.state;
        return <DatePicker 
                    selected={startDate} 
                    onChange={this.handleChange}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="time"
                    dateFormat="MMMM d, yyyy h:mm aa"
                 />;
      }
    
      handleChange = startDate => {
        this.setState({
          startDate
        });
      };
    }

export default DateTimeSelector;
