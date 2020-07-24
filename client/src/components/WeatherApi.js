import React from "react";
import DateTimeSelector from "./DateTimeSelector";

const axios = require("axios");

const WeatherApi = (props) => {
  const [weatherResponse, setWeatherResponse] = React.useState({});
  console;

  React.useEffect(() => {
    axios
      .get(`/api/weather_test`, {
        params: {
          chosenTime: props.number,
        },
      })
      .then((res) => {
        const weatherResponse = res.data;
        setWeatherResponse(weatherResponse);
      });
  }, []);
  return (
    <div>
      <p>Information from database:</p>
      <p>{weatherResponse.weather_response}</p>
    </div>
  );
};
