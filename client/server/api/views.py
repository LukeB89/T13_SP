import requests
from .models import Tables
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
