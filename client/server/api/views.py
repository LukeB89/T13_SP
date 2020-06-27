from .models import Tables
from django.http import JsonResponse


def hello(request):
    all_tables = Tables.rows
    names = []
    for rows in all_tables:
        names.append(rows[2] + " ")
    return JsonResponse({'response_text': names})
