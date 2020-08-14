# React Weather icons :partly_sunny:
> Weather icons meant for use with the OpenWeatherMap, Yahoo and DarkSky API.

Note: Includes font icons from the [weather icons](http://weathericons.io) set.

## Install

``` bash
npm install react-icons-weather

```

## Usage
```js
import React from 'react';
import WeatherIcon from 'react-icons-weather';

const WeatherComponent = (props) => {
  return (
    <div>
      <WeatherIcon name="owm" iconId="200" flip="horizontal" rotate="90" />
    </div>
  )
}
```

API | name | iconId (Weather condition codes)
------------ | ------------- | -------------
Open Weather Map | 'owm' | [Refer to doc](https://openweathermap.org/weather-conditions)
Yahoo | 'yahoo' | [Refer to doc](https://developer.yahoo.com/weather/documentation.html)
Dark Sky (previously forecast.io) | 'darksky' | [Refer to doc](https://darksky.net/dev/docs#data-point-object)

## Features
* Flip: horizontal, vertical
* Rotate: 90, 180, 270
* Fixed Width

## TODO
-[ ] animate icons
-[ ] icons for general use
