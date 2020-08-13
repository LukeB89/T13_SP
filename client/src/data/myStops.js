// Importing the Dublin Bus API stops data
const data = require("./DublinBusStops.json");
// Parsing the Stops data into various object shapes.
const rawData = data.results;
const myStops = rawData.map((stop) => ({
  description: "Stop " + stop.stopid + ", " + stop.fullname,
  type: "Feature",
  properties: {
    id: stop.stopid,
    fullname: stop.fullname,
    routes: stop.operators[0].routes,
  },
  geometry: {
    type: "Point",
    pos: {
      lat: parseFloat(stop.latitude),
      lng: parseFloat(stop.longitude),
    },
  },
}));

export default myStops;
