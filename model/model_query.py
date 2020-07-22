# Import package pandas for data analysis
import pandas as pd
# Import OS to check if files exist
import os
# Import Pickle to save prediction model
import pickle
# Import individual sklearn modules used in model building and analysis
from sklearn.ensemble import RandomForestRegressor

def get_prediction(route, **kwargs):
    """ A Function to obtain the predicted arrival time based on specfic inputs

        This take sa route as a specific input and then the following keyword arguments.
        Note defaults are in brackets:

        TEMP (10.0)
        FEELS_LIKE (10.0)
        TEMP_MIN (10.0)
        TEMP_MAX (10.0)
        PRESSURE (1000)
        HUMIDITY (70)
        WIND_SPEED (10.0)
        WIND_DEG (260)
        CLOUDS_ALL (50)
        DAYOFWEEK (0)
        WEATHER_ID (0)
        WEATHER_MAIN (0)
        HOUR (0)
        DIRECTION (1)
        STOPPOINTID (0)
        MONTH (1)
        DAY (1)"""
    if not os.path.isfile("model_log.txt".format(route)):
        with open('model_log.txt', 'a') as f:
            f.writelines("Log for Model Queries\n\n")
        return
    if not os.path.isfile("models/route_{}_RF_model.pkl".format(route)):
        with open('model_log.txt', 'a') as f:
            f.writelines("Route {} Has No Model\n".format(route))
        return 90000
    else:
        fetr_df = pd.read_csv("model_features.csv")
        columns = fetr_df.loc[fetr_df['Route'] == route, 'Features'].iloc[0].strip('[]\'').split("', '")
        fetr_df = pd.DataFrame(columns=columns)
        # Initialise Defaults
        fetr_df.loc[0] = 0
        fetr_df["TEMP"].loc[0] = 10.0
        fetr_df["FEELS_LIKE"].loc[0] = 10.0
        fetr_df["TEMP_MIN"].loc[0] = 10.0
        fetr_df["TEMP_MAX"].loc[0] = 10.0
        fetr_df["PRESSURE"].loc[0] = 1000
        fetr_df["HUMIDITY"].loc[0] = 70
        fetr_df["WIND_SPEED"].loc[0] = 10.0
        fetr_df["WIND_DEG"].loc[0] = 260
        fetr_df["CLOUDS_ALL"].loc[0] = 50
        for key, value in kwargs.items():
            if key in fetr_df.columns:
                fetr_df[key].loc[0] = value
            elif "{}_{}".format(key, value) in fetr_df.columns:
                link = "{}_{}".format(key, value)
                fetr_df[link].loc[0] = 1

        with open('models/route_{}_RF_model.pkl'.format(route), 'rb') as handle:
            rand_forest_model = pickle.load(handle)
        randforest_model_predict = list(map(round, rand_forest_model.predict(fetr_df)))
        print(randforest_model_predict[0])




if __name__ == '__main__':
    get_prediction("46A", TEMP=4.18, FEELS_LIKE=-2.82,TEMP_MIN=3.94, TEMP_MAX=6.07, PRESSURE=1008, HUMIDITY=75, WIND_SPEED=7.2, WIND_DEG=260, CLOUDS_ALL=40, STOPPOINTID=807, HOUR=23, WEATHER_MAIN="CLOUDS",WEATHER_ID=802)
