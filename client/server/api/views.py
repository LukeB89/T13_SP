import requests
import time
import warnings
import json
import os.path

import pandas as pd
from configparser import ConfigParser
from django.http import JsonResponse
from .utils import get_prediction
FILE = os.path.abspath(__file__)
L2_DIR = os.path.dirname(FILE)
L1_DIR = os.path.dirname(L2_DIR)
ROOT_DIR = os.path.dirname(L1_DIR)
warnings.filterwarnings('ignore')
with open(ROOT_DIR + "/log.txt", 'w') as f:
    f.write("FILE: {}\n".format(FILE))
    f.write("L2: {}\n".format(L2_DIR))
    f.write("L1: {}\n".format(L1_DIR))
    f.write("Root Dir: {}\n".format(ROOT_DIR))
# read DataBase info from the config file
config = ConfigParser()
config.read(ROOT_DIR + "/config.ini")
options = config["WeatherApi"]
weather_api = options["weather_api"]
options_a = config["NTAApi"]
nta_api = options_a["nta_api"]


def rtpi_api(request):
    """Returns to the frontend the real time passenger information data for the requested stop.

    Receive via GET request the users chosen stop. """
    with open(ROOT_DIR + "/log.txt",'a') as f:
        f.write("RTPI Entry\n")
    real_time_array = []
    stop_id = request.GET.get('stopid')
    with open(ROOT_DIR + "/log.txt",'a') as f:
        f.write("Stop ID: {}\n".format(stop_id))
    # url = "https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?stopid=" + stop_id + "&operator=bac"
    url = "https://api.nationaltransport.ie/rtpi/RealTimeBusInformation?stopid=" + stop_id + "&operator=bac"
    headers = {'Ocp-Apim-Subscription-Key': nta_api}
    r = requests.get(url, headers=headers)
    full_dict = r.json()
    results_dict = full_dict['results']
    real_time_array.append(results_dict)
    return JsonResponse({'results': results_dict})


def route_stops(request):
    """ Returns to the frontend the sequence of stops associated with the user
    selected route and direction of route.

    Receives via GET request the users desired route and chosen stop, then
    determines in which direction the user is going."""
    route = request.GET.get('chosenRoute')
    stop = request.GET.get('chosenStop')

    # should there no file for the selected route.
    if not os.path.isfile(L1_DIR + "/static/percentile_tables/route_" + route + "_dir_1_prcnt_data.csv") \
            and not os.path.isfile(L1_DIR + "/static/percentile_tables/route_" + route + "_dir_2_prcnt_data.csv"):
        return JsonResponse({'route_stops_response': [1, "We're sorry, no data exists for this route."]})
    # should there only be a file for direction 1 of the selected route
    elif not os.path.isfile(L1_DIR + "/static/percentile_tables/route_" + route + "_dir_2_prcnt_data.csv") \
            and os.path.isfile(L1_DIR + "/static/percentile_tables/route_" + route + "_dir_1_prcnt_data.csv"):
        df1 = pd.read_csv(L1_DIR + "/static/percentile_tables/route_" + route + "_dir_1_prcnt_data.csv"
                          , keep_default_na=True,
                          sep=',\s+', delimiter=',', skipinitialspace=True)
        # remove any columns with more than 80% missing data
        df1 = df1[df1.columns[df1.isnull().mean() < 0.8]]
        requested_route_stops = list(df1.columns)[df1.columns.get_loc(stop) + 1:]
        requested_route_stops.insert(0, "1")
        return JsonResponse({'route_stops_response': requested_route_stops})
    # should there only be a file for direction 2 of the selected route
    elif not os.path.isfile(L1_DIR + "/static/percentile_tables/route_" + route + "_dir_1_prcnt_data.csv") \
            and os.path.isfile(L1_DIR + "/static/percentile_tables/route_" + route + "_dir_2_prcnt_data.csv"):
        df2 = pd.read_csv(L1_DIR + "/static/percentile_tables/route_" + route + "_dir_2_prcnt_data.csv"
                          , keep_default_na=True,
                          sep=',\s+', delimiter=',', skipinitialspace=True)
        # remove any columns with more than 80% missing data
        df2 = df2[df2.columns[df2.isnull().mean() < 0.8]]
        requested_route_stops = list(df2.columns)[df2.columns.get_loc(stop) + 1:]
        requested_route_stops.insert(0, "1")
        return JsonResponse({'route_stops_response': requested_route_stops})
    # where both files exist
    else:
        df1 = pd.read_csv(L1_DIR + "/static/percentile_tables/route_" + route + "_dir_1_prcnt_data.csv"
                          , keep_default_na=True,
                          sep=',\s+', delimiter=',', skipinitialspace=True)
        df1 = df1[df1.columns[df1.isnull().mean() < 0.8]]
        df2 = pd.read_csv(L1_DIR + "/static/percentile_tables/route_" + route + "_dir_2_prcnt_data.csv"
                          , keep_default_na=True,
                          sep=',\s+', delimiter=',', skipinitialspace=True)
        df2 = df2[df2.columns[df2.isnull().mean() < 0.8]]
        if stop in df1.columns and stop in df2.columns:
            if df1.columns.get_loc(stop) < df2.columns.get_loc(stop):
                requested_route_stops = list(df1.columns)[df1.columns.get_loc(stop) + 1:]
                requested_route_stops.insert(0, "1")
                return JsonResponse({'route_stops_response': requested_route_stops})
            else:
                requested_route_stops = list(df2.columns)[df2.columns.get_loc(stop) + 1:]
                requested_route_stops.insert(0, "2")
                return JsonResponse({'route_stops_response': requested_route_stops})
        elif stop not in df1.columns and stop in df2.columns:
            requested_route_stops = list(df2.columns)[df2.columns.get_loc(stop) + 1:]
            requested_route_stops.insert(0, "2")
            return JsonResponse({'route_stops_response': requested_route_stops})
        else:
            requested_route_stops = list(df1.columns)[df1.columns.get_loc(stop) + 1:]
            requested_route_stops.insert(0, "1")
            return JsonResponse({'route_stops_response': requested_route_stops})


def model_result(request, weather_api=weather_api):
    """ Returns to the frontend the predicted time for the total length of the
    selected route going in the selected direction.

    Receives via GET request the users desired hour, day and month of travel. """
    route = request.GET.get('chosenRoute')
    direction = request.GET.get('chosenDirection')
    hour = int(request.GET.get('chosenTime'))
    minute = int(request.GET.get('chosenMinute'))
    day = request.GET.get('chosenDay')
    month = request.GET.get('chosenMonth')

    DAYOFWEEK = time.strptime(day, "%a").tm_wday
    MONTH = time.strptime(month,'%b').tm_mon
    # Call to the weather api for the current weather conditions
    WEATHER_URL_2 = "https://api.openweathermap.org/data/2.5/onecall?lat=53.349804&lon=-6.30131&exclude=current," \
                    "minutely,hourly "
    weather_api = weather_api
    response = requests.get(WEATHER_URL_2, params={"id": 2964574, "appid": weather_api})
    kelvin = 273.15
    # parse the data
    data = response.text
    onecall_parsed = json.loads(data)
    for i in range(len(onecall_parsed['daily']) - 1):
        if pd.Timestamp(onecall_parsed['daily'][i]['dt'], unit='s').dayofweek == DAYOFWEEK:
            TEMP = onecall_parsed['daily'][i]['temp']['day'] - kelvin
            FEELS_LIKE = onecall_parsed['daily'][i]['feels_like']['day'] - kelvin
            TEMP_MIN = onecall_parsed['daily'][i]['temp']['min'] - kelvin
            TEMP_MAX = onecall_parsed['daily'][i]['temp']['max'] - kelvin
            PRESSURE = onecall_parsed['daily'][i]['pressure']
            HUMIDITY = onecall_parsed['daily'][i]['humidity']
            WIND_SPEED = onecall_parsed['daily'][i]['wind_speed']
            WIND_DEG = onecall_parsed['daily'][i]['wind_deg']
            CLOUDS_ALL = onecall_parsed['daily'][i]['clouds']
            WEATHER_MAIN = onecall_parsed['daily'][i]['weather'][0]['main']
            WEATHER_ID = onecall_parsed['daily'][i]['weather'][0]['id']
            result = get_prediction(route, TEMP=TEMP, FEELS_LIKE=FEELS_LIKE, TEMP_MIN=TEMP_MIN, TEMP_MAX=TEMP_MAX,
                            PRESSURE=PRESSURE, HUMIDITY=HUMIDITY, WIND_SPEED=WIND_SPEED, WIND_DEG=WIND_DEG,
                            CLOUDS_ALL=CLOUDS_ALL, MONTH=MONTH, MINUETS=minute, WEATHER_MAIN=WEATHER_MAIN,
                            DAYOFWEEK=DAYOFWEEK, WEATHER_ID=WEATHER_ID, DIRECTION=direction)
            result = int(result/60)

            return JsonResponse({'model_response': result})


def percentile_result(request):
    """ Returns to the frontend the length of time of the users journey as a percentile result of the total.

    Receives via GET request the users desired hour, origin and destination stops,
    and the response from the model for the total time of the selected route. """
    route = request.GET.get('chosenRoute')
    direction = request.GET.get('chosenDirection')

    df = pd.read_csv(L1_DIR + "/static/percentile_tables/route_" + route + "_dir_" + direction + "_prcnt_data.csv",
                     keep_default_na=True, sep=',\s+', delimiter=',', skipinitialspace=True)
    hour = int(request.GET.get('chosenTime'))
    day_string = request.GET.get('chosenDay')
    month_string = request.GET.get('chosenMonth')
    origin = request.GET.get('origin')
    destination = request.GET.get('destination')
    model_response = int(request.GET.get('modelResponse'))

    day = time.strptime(day_string, "%a").tm_wday
    month = time.strptime(month_string, '%b').tm_mon
    rowx = df[(df["HOUR"] == hour) & (df["DAYOFWEEK"] == day) & (df["MONTH"] == month)]
    if rowx.empty:
        # Empty dataframe triggered
        return JsonResponse({'percentile_response': "No modelling data for this journey exists."})
    elif pd.isna(rowx.iloc[0][destination]) or pd.isna(rowx.iloc[0][origin]):
        # NaN values triggered
        return JsonResponse({'percentile_response': "No modelling data for this journey exists."})
    else:
        prct = int(rowx[destination]) - int(rowx[origin])
        prct /= 100
        journey_time = model_response * prct
        return JsonResponse({'percentile_response': (int(round(journey_time)))})
