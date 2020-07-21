import requests
from .models import Tables
from .models import Forecast_Weather
from django.http import JsonResponse


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
