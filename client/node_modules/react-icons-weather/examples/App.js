import React, { Component } from 'react';
import { render } from 'react-dom';
import WeatherIcon from 'react-icons-weather';
import './styles.css';

const root = document.getElementById('root');

class Example extends Component {
  constructor(){
    super();
  }
  render(){
    return (
      <WeatherIcon
        name='owm'
        iconId='200'
        className='icon'
        rotate='90'
        fixedWidth={true}
      />
    );
  }
}

render(<Example />, root);
