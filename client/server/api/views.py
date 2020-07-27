import requests
import pandas as pd
import numpy as np
import pickle
import sklearn
import json
from .models import Tables
from .models import Forecast_Weather
from django.http import JsonResponse
import warnings
warnings.filterwarnings('ignore')


def hello(request):
    all_tables = Tables.rows
    names = []
    for rows in all_tables:
        names.append(rows[2] + " ")
    return JsonResponse({'response_text': names})


def rtpi_api(request):
    real_time_array = []
    stop_id = request.GET.get('stopid')
    url = "https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?stopid=" + stop_id + "&operator=bac"
    r = requests.get(url)
    full_dict = r.json()
    results_dict = full_dict['results']
    real_time_array.append(results_dict)
    return JsonResponse({'results': results_dict})


def weather_test(request):
    one_line = Forecast_Weather.rows
    array = []
    for rows in one_line:
        array.append(rows)
    return JsonResponse({'weather_response': array})


def model_result(request):
    # Load the pickle file
    with open('./static/pickle/RANDOM_FOREST_2018_46A_1.pkl', 'rb') as pickle_file:
        rfr_ = pickle.load(pickle_file)
    hour = int(request.GET.get('chosenTime'))
    day = request.GET.get('chosenDay')
    month = request.GET.get('chosenMonth')
    # Dataframe to hold current time
    df_times = pd.DataFrame({hour: [hour]})
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
    # Call to the weather api for the current weather conditions
    WEATHER_URI = "http://api.openweathermap.org/data/2.5/weather"
    weather_api = "0af2c4378e1bfb001a3e457cc32410be"
    response = requests.get(WEATHER_URI, params={"id": 2964574, "appid": weather_api})
    # parse the data
    data = response.text
    parsed = json.loads(data)
    # create dataframes
    temp_df = pd.DataFrame(parsed['main'], index=[0])
    temp_df.temp[0] = temp_df.temp[0] - 273.15  # kelvin
    cloud_df = pd.DataFrame(parsed['clouds'], index=[0])
    cloud_df = cloud_df.rename(columns={'all': 'clouds_all'})
    # Dataframe to hold correct weather input for model
    df_weather = pd.DataFrame(
        {'temp': temp_df['temp'], 'humidity': temp_df['humidity'], 'clouds_all': cloud_df['clouds_all']})
    dfX = pd.concat([df_times, df_days, df_alt_month, df_weather], axis=1)
    return JsonResponse({'model_response': (int(round(rfr_.predict(dfX)[0])))})


def percentile_result(request):
    df = pd.read_csv('./static/route_46A_dir1_prcnt_data.csv', keep_default_na=True, sep=',\s+', delimiter=',',
                     skipinitialspace=True)
    df["DAYOFWEEK"].replace({5: "Sat", 6: "Sun", 0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri"}, inplace=True)
    hour = int(request.GET.get('chosenTime'))
    day = request.GET.get('chosenDay')
    origin = request.GET.get('origin')
    destination = request.GET.get('destination')
    model_response = int(request.GET.get('modelResponse'))
    rowx = df[(df["HOUR"] == hour) & (df["DAYOFWEEK"] == day)]
    prct = int(rowx[origin]) - int(rowx[destination])
    prct /= 100
    print("Percent!", prct)
    journey_time = model_response * prct
    print(journey_time)
    return JsonResponse({'percentile_response': (int(round(journey_time)))})
