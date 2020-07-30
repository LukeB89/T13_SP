from django.db import models
import psycopg2
from configparser import ConfigParser

# read DataBase info from the config file
config = ConfigParser()
config.read("../../config.ini")
options = config["DataBase"]
database = options["database"]
host = options["host"]
port = options["port"]
user = options["user"]
password = options["passwd"]


class ForecastWeather(models.Model):
    """A class used to query the forecast_weather table and fetch one line from it."""
    conn = psycopg2.connect(database=database, host=host, port=port, user=user, password=password)
    cur = conn.cursor()
    cur.execute("SELECT dt_iso FROM forecast_weather LIMIT 1")
    rows = cur.fetchall()
    conn.close()
    cur.close()
