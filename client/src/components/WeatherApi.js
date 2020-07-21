import React from "react";

const axios = require("axios");

const RtpiApi = (props) => {
  const [weatherResponse, setWeatherResponse] = React.useState({});

  React.useEffect(() => {
    axios
      .get(`/api/weather_test`, {
        params: {
          chosenTime: props.number,
        },
      })
      .then((res) => {
        const weatherResponse = res.data;
        setWeatherResponse(rawStopData);
      });
  }, []);
  return (
    <div>
      <p>Information from database:</p>
      <p>{weatherResponse.weather_response}</p>
    </div>
  );
};
