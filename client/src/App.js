import React from "react";
import styled from "styled-components";

import Container from "react-bootstrap/Container";
import T13GoogleMap from "./components/T13GoogleMap";
import Api from "./components/Api";
import DateTimeSelector from "./components/DateTimeSelector";
import BrandBar from "./components/BrandBar";
import LocationForms from "./components/Location Forms";

import "bootstrap/dist/css/bootstrap.min.css";

const Wrapper = styled.main`
  width: 100%;
  height: 100%;
`;

export default function App() {
  const renderPage = () => {
    return (
      <Container fluid>
        <BrandBar></BrandBar>
        <Wrapper style={{ width: "75%", float: "left" }}>
          <T13GoogleMap></T13GoogleMap>
        </Wrapper>

        <Wrapper style={{ width: "25%", float: "right" }}>
          <Container style={{ paddingTop: "15vh" }}>
            <DateTimeSelector></DateTimeSelector>
            <LocationForms></LocationForms>
            <Api></Api>
          </Container>
        </Wrapper>
      </Container>
    );
  };

  return renderPage();
}
