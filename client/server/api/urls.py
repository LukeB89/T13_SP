from django.urls import path
from . import views


urlpatterns = [
    path('api/hello/', views.hello, name='hello'),
    path('api/rtpi_api', views.rtpi_api, name='rtpi_api'),
    path('api/weather_test', views.weather_test, name='weather_test'),
    path('api/model_result', views.model_result, name='model_result')
]
