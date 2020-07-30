from django.urls import path
from . import views


urlpatterns = [
    path('api/rtpi_api', views.rtpi_api, name='rtpi_api'),
    path('api/weather_test', views.weather_test, name='weather_test'),
    path('api/route_stops', views.route_stops, name='route_stops'),
    path('api/model_result', views.model_result, name='model_result'),
    path('api/percentile_result', views.percentile_result, name='percentile_result')
]
