from django.urls import path
from . import views


urlpatterns = [
    path('api/hello/', views.hello, name='hello'),
    path('api/rtpi_api', views.rtpi_api, name='rtpi_api'),
]
