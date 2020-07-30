import requests
import pandas as pd
import numpy as np
import pickle
import sklearn
import json
from .models import ForecastWeather
from django.http import JsonResponse
import warnings

warnings.filterwarnings('ignore')


def rtpi_api(request):
    """Returns to the frontend the real time passenger information data for the requested stop.

    Receive via GET request the users chosen stop. """
    real_time_array = []
    stop_id = request.GET.get('stopid')
    url = "https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?stopid=" + stop_id + "&operator=bac"
    r = requests.get(url)
    full_dict = r.json()
    results_dict = full_dict['results']
    real_time_array.append(results_dict)
    return JsonResponse({'results': results_dict})


def weather_test(request):
    one_line = ForecastWeather.rows
    array = []
    for rows in one_line:
        array.append(rows)
    return JsonResponse({'weather_response': array})


def route_stops(request):
    """ Returns to the frontend the sequence of stops associated with the user
    selected route and direction of route.

    Receives via GET request the users desired route and direction"""
    route = request.GET.get('chosenRoute')
    print("hello, route here", route)
    direction = request.GET.get('chosenDirection')
    df = pd.read_csv("./static/percentile_tables/route_" + route + "_dir" + direction + "_prcnt_data.csv"
                     , keep_default_na=True,
                     sep=',\s+', delimiter=',', skipinitialspace=True)
    requested_route_stops = list(df.columns)[4:]
    return JsonResponse({'route_stops_response': requested_route_stops})


def model_result(request):
    """ Returns to the frontend the predicted time for the total length of the
    selected route going in the selected direction.

    Receives via GET request the users desired hour, day and month of travel. """
    route = request.GET.get('chosenRoute')
    direction = request.GET.get('chosenDirection')
    # Load the pickle file
    with open("./static/pickle/RANDOM_FOREST_2018_" + route + "_" + direction + ".pkl", 'rb') as pickle_file:
        rfr_ = pickle.load(pickle_file)
    hour = int(request.GET.get('chosenTime'))
    day = request.GET.get('chosenDay')
    month = request.GET.get('chosenMonth')
    # Dataframes for the hours of the day
    df_times = pd.DataFrame({hour: [hour]})
    # Create dummy columns for all of the hours.
    df_times['5'] = np.where((df_times[hour] == 5), 1, 0)
    df_times['6'] = np.where((df_times[hour] == 6), 1, 0)
    df_times['7'] = np.where((df_times[hour] == 7), 1, 0)
    df_times['8'] = np.where((df_times[hour] == 8), 1, 0)
    df_times['9'] = np.where((df_times[hour] == 9), 1, 0)
    df_times['10'] = np.where((df_times[hour] == 10), 1, 0)
    df_times['11'] = np.where((df_times[hour] == 11), 1, 0)
    df_times['12'] = np.where((df_times[hour] == 12), 1, 0)
    df_times['13'] = np.where((df_times[hour] == 13), 1, 0)
    df_times['14'] = np.where((df_times[hour] == 14), 1, 0)
    df_times['15'] = np.where((df_times[hour] == 15), 1, 0)
    df_times['16'] = np.where((df_times[hour] == 16), 1, 0)
    df_times['17'] = np.where((df_times[hour] == 17), 1, 0)
    df_times['18'] = np.where((df_times[hour] == 18), 1, 0)
    df_times['19'] = np.where((df_times[hour] == 19), 1, 0)
    df_times['20'] = np.where((df_times[hour] == 20), 1, 0)
    df_times['21'] = np.where((df_times[hour] == 21), 1, 0)
    df_times['22'] = np.where((df_times[hour] == 22), 1, 0)
    df_times['23'] = np.where((df_times[hour] == 23), 1, 0)
    df_times['24'] = np.where((df_times[hour] == 24), 1, 0)
    df_times = df_times.drop(df_times.columns[0], axis=1)
    # Dataframe for the days of the week
    df_days = pd.DataFrame({day: [day]})
    # Create the dummy columns for all of the days.
    df_days['Friday'] = np.where((df_days[day] == "Fri"), 1, 0)
    df_days['Monday'] = np.where((df_days[day] == "Mon"), 1, 0)
    df_days['Saturday'] = np.where((df_days[day] == "Sat"), 1, 0)
    df_days['Sunday'] = np.where((df_days[day] == "Sun"), 1, 0)
    df_days['Thursday'] = np.where((df_days[day] == "Thu"), 1, 0)
    df_days['Tuesday'] = np.where((df_days[day] == "Tue"), 1, 0)
    df_days['Wednesday'] = np.where((df_days[day] == "Wed"), 1, 0)
    df_days = df_days.drop(df_days.columns[0], axis=1)
    # Dataframes for the months
    df_month = pd.DataFrame({month: [month]})
    df_alt_month = pd.DataFrame()
    # Create the dummy columns for all of the months.
    df_alt_month['April'] = np.where((df_month[month] == "Apr"), 1, 0)
    df_alt_month['August'] = np.where((df_month[month] == "Aug"), 1, 0)
    df_alt_month['December'] = np.where((df_month[month] == "Dec"), 1, 0)
    df_alt_month['February'] = np.where((df_month[month] == "Feb"), 1, 0)
    df_alt_month['January'] = np.where((df_month[month] == "Jan"), 1, 0)
    df_alt_month['July'] = np.where((df_month[month] == "Jul"), 1, 0)
    df_alt_month['June'] = np.where((df_month[month] == "Jun"), 1, 0)
    df_alt_month['March'] = np.where((df_month[month] == "Mar"), 1, 0)
    df_alt_month['May'] = np.where((df_month[month] == "May"), 1, 0)
    df_alt_month['November'] = np.where((df_month[month] == "Nov"), 1, 0)
    df_alt_month['October'] = np.where((df_month[month] == "Oct"), 1, 0)
    df_alt_month['September'] = np.where((df_month[month] == "Sep"), 1, 0)
    # Call to the weather api for the current weather conditions.
    # TODO - We must instead include a call to the weather database.
    WEATHER_URI = "http://api.openweathermap.org/data/2.5/weather"
    weather_api = "0af2c4378e1bfb001a3e457cc32410be"
    response = requests.get(WEATHER_URI, params={"id": 2964574, "appid": weather_api})
    # Parse the data
    data = response.text
    parsed = json.loads(data)
    # Create dataframes from the weather.
    temp_df = pd.DataFrame(parsed['main'], index=[0])
    temp_df.temp[0] = temp_df.temp[0] - 273.15  # kelvin
    cloud_df = pd.DataFrame(parsed['clouds'], index=[0])
    cloud_df = cloud_df.rename(columns={'all': 'clouds_all'})
    # Dataframe to hold correct weather input for model
    df_weather = pd.DataFrame(
        {'temp': temp_df['temp'], 'humidity': temp_df['humidity'], 'clouds_all': cloud_df['clouds_all']})
    # Final dataframe with the shape expected by the model.
    dfX = pd.concat([df_times, df_days, df_alt_month, df_weather], axis=1)
    return JsonResponse({'model_response': (int(round(rfr_.predict(dfX)[0])))})


def percentile_result(request):
    """ Returns to the frontend the length of time of the users journey as a percentile result of the total.

    Receives via GET request the users desired hour, origin and destination stops,
    and the response from the model for the total time of the selected route. """
    route = request.GET.get('chosenRoute')
    direction = request.GET.get('chosenDirection')
    df = pd.read_csv("./static/percentile_tables/route_" + route + "_dir" + direction + "_prcnt_data.csv",
                     keep_default_na=True, sep=',\s+', delimiter=',', skipinitialspace=True)
    df["DAYOFWEEK"].replace({5: "Sat", 6: "Sun", 0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri"}, inplace=True)
    hour = int(request.GET.get('chosenTime'))
    day = request.GET.get('chosenDay')
    origin = request.GET.get('origin')
    destination = request.GET.get('destination')
    model_response = int(request.GET.get('modelResponse'))
    rowx = df[(df["HOUR"] == hour) & (df["DAYOFWEEK"] == day)]
    prct = int(rowx[destination]) - int(rowx[origin])
    prct /= 100
    journey_time = model_response * prct
    return JsonResponse({'percentile_response': (int(round(journey_time)))})
