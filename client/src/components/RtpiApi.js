import React from "react";
import Table from "react-bootstrap/Table";

const axios = require("axios");

// Makes GET request to Django API with user selected stopid as parameter.
// Django makes GET request to the RTPI API, which React returns as a Table.
// Clicking a bus stop's marker will display this Table.
const RtpiApi = (props) => {
  const placeholder = {
    results: [
      {
        arrivaldatetime: "08/07/2020 00:00:00",
        route: "",
        destination: "",
        duetime: "",
      },
    ],
  };
  const [rawStopData, setRawStopData] = React.useState(placeholder);

  React.useEffect(() => {
    axios
      .get(`/api/rtpi_api`, {
        params: {
          stopid: props.number,
        },
      })
      .then((res) => {
        const rawStopData = res.data;
        setRawStopData(rawStopData);
      });
  }, []);

  const stopData = rawStopData.results;
  const realInfo = stopData.map((info) => ({
    id: info.arrivaldatetime,
    route: info.route,
    destination: info.destination,
    arrivaltime: info.duetime,
  }));
  if (realInfo === []) {
    const realInfo = placeholder;
  }

  return (
    <div style={{ maxHeight: "15vh", overflowY: "scroll" }}>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>Route</th>
            <th>Destination</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {realInfo.map((info) => {
            if (info.arrivaltime === "Due")
              return (
                <tr key={info.id}>
                  <td>{info.route}</td>
                  <td>{info.destination}</td>
                  <td>{info.arrivaltime}</td>
                </tr>
              );
            else {
              return (
                <tr key={info.id}>
                  <td>{info.route}</td>
                  <td>{info.destination}</td>
                  <td>{info.arrivaltime} mins</td>
                </tr>
              );
            }
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default RtpiApi;
