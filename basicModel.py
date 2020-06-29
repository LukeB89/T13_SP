import psycopg2
from configparser import ConfigParser
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from pylab import rcParams
import statsmodels.api as sm
from sklearn.metrics import mean_squared_error
from pandas import DataFrame
from statsmodels.tsa.arima_model import ARIMA
from matplotlib import pyplot
from pylab import rcParams
import warnings
import itertools
warnings.filterwarnings("ignore")
plt.style.use('fivethirtyeight')

# read DataBase info from the config file
config = ConfigParser()
config.read("config.ini")
options = config["DataBase"]
host = options["host"]
passwd = options["passwd"]
user = options["user"]
port = options["port"]
database = options["database"]


def postgreSQL_connection():
    try:
        connection = psycopg2.connect(dbname=database, host=host, port=port, user=user, password=passwd)
        postgreSQL_query = "SELECT rt_leavetimes.dayofservice, rt_trips.tripid, rt_trips.lineid, rt_trips.routeid, rt_trips.direction, rt_trips.plannedtime_dep, rt_trips.plannedtime_arr, rt_trips.actualtime_dep,rt_trips.actualtime_arr, rt_trips.suppressed, rt_vehicles.vehicleid, rt_vehicles.distance, rt_vehicles.minutes, rt_weather.lat, rt_weather.lon, rt_weather.temp, rt_weather.feels_like, rt_weather.temp_min, rt_weather.temp_max, rt_weather.pressure, rt_weather.humidity, rt_weather.wind_speed,rt_weather.wind_deg, rt_weather.clouds_all FROM trips as rt_trips, leavetimes as rt_leavetimes, vehicles as rt_vehicles, historical_weather as rt_weather WHERE rt_trips.dayofservice=rt_leavetimes.dayofservice and rt_leavetimes.dayofservice=rt_vehicles.dayofservice and rt_leavetimes.dayofservice=rt_weather.dt_iso and rt_trips.tripid=rt_leavetimes.tripid and rt_leavetimes.vehicleid=rt_vehicles.vehicleid and rt_trips.lineid='38A' and rt_leavetimes.dayofservice between '2018-01-01 00:00:00.000000' and '2018-01-31 00:00:00.000000'"
        cursor = connection.cursor()
        cursor.execute(postgreSQL_query)
        vehicles_records = pd.DataFrame(cursor.fetchall(),
                                        columns=["DAYOFSERVICE", "TRIPID", "LINEID", "ROUTEID", "DIRECTION",
                                                 "PLANNEDTIME_DEP", "PLANNEDTIME_ARR", "ACTUALTIME_DEP",
                                                 "ACTUALTIME_ARR", "SUPPRESSED", "VEHICLEID", "DISTANCE", "MINUTES",
                                                 "LATITUDE", "LONGITUDE", "TEMPERATURE", "FEELS_LIKE",
                                                 "TEMPERATURE_MIN", "TEMPERATURE_MAX", "PRESSURE", "HUMIDITY",
                                                 "WIND_SPEED", "WIND_DEGREE", "CLOUDS"])
        return vehicles_records
    except (Exception, psycopg2.Error) as error:
        print("Error while connecting to PSQL: ", error)
    finally:
        if (connection):
            cursor.close()
            connection.close()
            print("PSQL Closed")


postgreSQL_connection()
df = postgreSQL_connection()
print(df)

df['PLANNED_DURATION'] = df['PLANNEDTIME_ARR'] - df['PLANNEDTIME_DEP']
print(df[['PLANNEDTIME_DEP', 'PLANNEDTIME_ARR', 'PLANNED_DURATION']])

df['ACTUAL_DURATION'] = df['ACTUALTIME_ARR'] - df['ACTUALTIME_DEP']
print(df[['ACTUALTIME_DEP', 'ACTUALTIME_ARR', 'ACTUAL_DURATION']])

df = df.T.drop_duplicates().T

# Identify unique values with respect to columns
df.nunique()

# Check for a constant column
df[df.duplicated(keep=False)]

# Identify datatype of rows
print(df.dtypes)

# Check for missing values in the dataset
print(df.isnull().sum())

print(df)

df = df[df['ACTUALTIME_DEP'].notna()]
df = df[df['ACTUALTIME_ARR'].notna()]
df = df[df['ACTUAL_DURATION'].notna()]

df = df.set_index('DAYOFSERVICE')

sns.set(rc={'figure.figsize': (11, 4)})

cols_plot = ['PLANNED_DURATION', 'ACTUAL_DURATION']
axes = df[cols_plot].plot(marker='.', alpha=0.5, linestyle='None', figsize=(11, 9), subplots=True)
for ax in axes:
    ax.set_ylabel('Daily commute time')

plannedDur = df.PLANNED_DURATION['2018-01-01':]
plannedDur = np.array(plannedDur, dtype=float)

rcParams['figure.figsize'] = 18, 8
decomposition = sm.tsa.seasonal_decompose(plannedDur, model='additive', freq=30)
fig = decomposition.plot()
plt.show()

p = d = q = range(0, 2)
pdq = list(itertools.product(p, d, q))
seasonal_pdq = [(x[0], x[1], x[2], 12) for x in list(itertools.product(p, d, q))]
print('Examples of parameter combinations for Seasonal ARIMA...')
print('SARIMAX: {} x {}'.format(pdq[1], seasonal_pdq[1]))
print('SARIMAX: {} x {}'.format(pdq[1], seasonal_pdq[2]))
print('SARIMAX: {} x {}'.format(pdq[2], seasonal_pdq[3]))
print('SARIMAX: {} x {}'.format(pdq[2], seasonal_pdq[4]))

for param in pdq:
    for param_seasonal in seasonal_pdq:
        try:
            mod = sm.tsa.statespace.SARIMAX(plannedDur,
                                            order=param,
                                            seasonal_order=param_seasonal,
                                            enforce_stationarity=False,
                                            enforce_invertibility=False)
            results = mod.fit()
            print('ARIMA{}x{}12 - AIC:{}'.format(param, param_seasonal, results.aic))
        except:
            continue

print(df.head())
actual = df['ACTUAL_DURATION']
actual.plot()
pyplot.show()

model = ARIMA(actual.astype(float), order=(5,1,0))
model_fit = model.fit(disp=0)
print(model_fit.summary())
# plot residual errors
residuals = DataFrame(model_fit.resid)
residuals.plot()
pyplot.show()
residuals.plot(kind='kde')
pyplot.show()
print(residuals.describe())

np.asarray(actual)

X = actual.values
size = int(len(X) * 0.66)
train, test = X[0:size], X[size:len(X)]
history = [x for x in train]
predictions = list()
for t in range(len(test)):
    model = ARIMA(history, order=(5,1,0))
    model_fit = model.fit(disp=0)
    output = model_fit.forecast()
    yhat = output[0]
    predictions.append(yhat)
    obs = test[t]
    history.append(obs)
    print('predicted=%f, expected=%f' % (yhat, obs))
error = mean_squared_error(test, predictions)
print('Test MSE: %.3f' % error)
# plot
pyplot.plot(test)
pyplot.plot(predictions, color='red')
pyplot.show()
