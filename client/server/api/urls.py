from django.urls import path
from . import views


urlpatterns = [
    path('rtpi_api', views.rtpi_api, name='rtpi_api'),
    path('route_stops', views.route_stops, name='route_stops'),
    path('model_result', views.model_result, name='model_result'),
    path('percentile_result', views.percentile_result, name='percentile_result')
]
