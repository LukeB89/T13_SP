import json
import requests
import psycopg2
from configparser import ConfigParser
import traceback

# Read DataBase info from the config file
# Store in variables for use when making SQL Query's
config = ConfigParser()
config.read("../config.ini")
options = config["DataBase"]
host = options["host"]
passwd = options["passwd"]
user = options["user"]
port = options["port"]
database = options["database"]
weather_api = options["weather_api"]


def main():
    try:
        # Connects to the database, calls to the OpenWeather API and copies data to the database.
        conn = psycopg2.connect(dbname=database, host=host, port=port, user=user, password=passwd)
        cursor = conn.cursor()

        # makes call to api
        WEATHER_URI = "http://api.openweathermap.org/data/2.5/forecast"
        response = requests.get(WEATHER_URI, params={"id": 2964574, "appid": weather_api})

        data = response.text
        parsed = json.loads(data)

        for x in range(len(parsed["list"])):
            # weather on openweather mapped formatted using kelvin so convert to degrees
            kelvin = 273.15

            dt = (parsed["list"][x]["dt"])
            dt_iso = (parsed["list"][x]["dt_txt"])
            timezone = (parsed["city"]["timezone"])
            city_name = "Dublin"
            lat = 53.349805
            lng = -6.26031
            temp = round(((parsed["list"][x]["main"]["temp"]) - kelvin), 2)
            feels_like = round(((parsed["list"][x]["main"]["feels_like"]) - kelvin), 2)
            temp_min = round(((parsed["list"][x]["main"]["temp_min"]) - kelvin), 2)
            temp_max = round(((parsed["list"][x]["main"]["temp_max"]) - kelvin), 2)
            pressure = parsed["list"][x]["main"]["pressure"]
            sea_level = None
            grnd_level = None
            humidity = parsed["list"][x]["main"]["humidity"]
            wind_speed = parsed["list"][x]["wind"]["speed"]
            wind_deg = parsed["list"][x]["wind"]["deg"]
            try:
                rain_1h = parsed["list"][x]["rain"]["1h"]
            except:
                rain_1h = None
            try:
                rain_3h = parsed["list"][x]["rain"]["3h"]
            except:
                rain_3h = None
            try:
                snow_1h = parsed["list"][x]["snow"]["1h"]
            except:
                snow_1h = None
            try:
                snow_3h = parsed["list"][x]["snow"]["3h"]
            except:
                snow_3h = 0
            clouds_all = parsed["list"][x]["clouds"]["all"]
            weather_id = parsed["list"][x]["weather"][0]["id"]
            weather_main = parsed["list"][x]["weather"][0]["main"]
            weather_description = parsed["list"][x]["weather"][0]["description"]
            weather_icon = parsed["list"][x]["weather"][0]["icon"]
            # checks for duplicate row on database and if it is then it skips
            try:
                # pushes data to SQL table on database
                cursor.execute(
                    "INSERT INTO forecast_weather (dt, dt_iso, timezone, city_name, lat, lng, temp, feels_like, "
                    "temp_min, temp_max, pressure, sea_level, grnd_level, humidity, wind_speed, wind_deg, rain_1h, "
                    "rain_3h, snow_1h, snow_3h, clouds_all, weather_id, weather_main, weather_description, "
                    "weather_icon) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (dt, dt_iso, timezone, city_name, lat, lng, temp, feels_like, temp_min, temp_max, pressure,
                     sea_level, grnd_level, humidity, wind_speed, wind_deg, rain_1h, rain_3h, snow_1h, snow_3h,
                     clouds_all, weather_id, weather_main, weather_description, weather_icon))
                conn.commit()
            except psycopg2.Error as error:
                print("Error while connecting to PSQL: ", error)

        conn.close()

    except Exception as errorE:
        print("Generic Error: ", errorE)
        traceback.print_exc()


if __name__ == '__main__':
    main()
