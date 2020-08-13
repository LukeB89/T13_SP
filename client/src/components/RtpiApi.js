// Importing outside developed components.
import React from "react";
import Table from "react-bootstrap/Table";
// Promise based HTTP client - https://github.com/axios/axios.
const axios = require("axios");

// Makes GET request to Django API with user selected stopid as parameter.
// Django makes GET request to the RTPI API, which React returns as a Table.
// Clicking a bus stop's marker will display this Table.
const RtpiApi = (props) => {
  // A placeholder variable used while waiting for RTPI response.
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
  // The response from the backend we need to track in state:
  const [rawStopData, setRawStopData] = React.useState(placeholder);

  // The Effect Hook used to perform side effects in this component.
  // https://reactjs.org/docs/hooks-effect.html.
  React.useEffect(
    () => {
      const CancelToken = axios.CancelToken;
      const source = CancelToken.source();
      const loadData = () => {
        try {
          axios
            // .get(`/rtpi_api`, {
            .get(`/api/rtpi_api`, {
              params: {
                stopid: props.number,
              },
            })
            .then((res) => {
              setRawStopData(res.data);
            });
        } catch (error) {
          if (axios.isCancel(error)) {
          } else {
            throw error;
          }
        }
      };
      loadData();
      return () => {
        source.cancel();
      };
    },
    // eslint-disable-next-line
    []
  ); // react-hooks/exhaustive-deps

  const stopData = rawStopData.results;
  const realInfo = stopData.map((info) => ({
    id: info.arrivaldatetime,
    route: info.route,
    destination: info.destination,
    arrivaltime: info.duetime,
  }));

  return (
    <div
      // CSS
      style={{ maxHeight: "15vh", overflowY: "scroll" }}
    >
      <Table
        // Inbuilt props: https://react-bootstrap.github.io/components/table/#table-api.
        striped
        bordered
        hover
        size="sm"
      >
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
