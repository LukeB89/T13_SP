import requests
import json

# Update the stops information, run this script every 24 hours.
url = 'https://data.smartdublin.ie/cgi-bin/rtpi/busstopinformation?operator=bac'
r = requests.get(url)
db_stops = r.json()
with open('DublinBusStops.json', 'w') as outfile:
    json.dump(db_stops, outfile)
