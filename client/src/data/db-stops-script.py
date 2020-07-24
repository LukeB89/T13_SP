import requests
import json
# Ideally this file will not be located here bus elsewhere in the file system.

# Update the stops information, run this script every 24 hours.
url = 'https://data.smartdublin.ie/cgi-bin/rtpi/busstopinformation?operator=bac'
r = requests.get(url)
db_stops = r.json()
with open('DublinBusStops.json', 'w') as outfile:
    json.dump(db_stops, outfile)
