# Import package pandas for data analysis
import pandas as pd
# Import OS to check if files exist
import os
# Import Pickle to save prediction model
import pickle
# Import individual sklearn modules used in model building and analysis
from sklearn.ensemble import RandomForestRegressor
FILE = os.path.abspath(__file__)
L2_DIR = os.path.dirname(FILE)
L1_DIR = os.path.dirname(L2_DIR)
ROOT_DIR = os.path.dirname(L1_DIR)

def get_prediction(route, **kwargs):
    """ A Function to obtain the predicted arrival time based on specfic inputs
        This take sa route as a specific input and then the following keyword arguments.
        Note defaults are in brackets:
        TEMP = x
        FEELS_LIKE = x
        TEMP_MIN = x
        TEMP_MAX = x
        PRESSURE = x
        HUMIDITY = x
        WIND_SPEED = x
        WIND_DEG = x
        CLOUNDS_ALL = x
        MONTH = y
        MINUETS = y
        WEATHER_MAIN = y
        DAYOFWEEK = y
        WEATHER_ID = y"""
    if not os.path.isfile(L1_DIR + "/static/model_features/model_log.txt".format(route)):
        with open(L1_DIR + '/static/model_features/model_log.txt', 'a') as f:
            f.writelines("Log for Model Queries\n\n")
        return
    if not os.path.isfile(L1_DIR + "/static/models/route_{}_RF_model.pkl".format(route)):
        with open(L1_DIR + '/static/model_features/model_log.txt', 'a') as f:
            f.writelines("Route {} Has No Model\n".format(route))
        return 90000
    else:
        fetr_df = pd.read_csv(L1_DIR + "/static/model_features/model_features.csv")
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

        with open(L1_DIR + '/static/models/route_{}_RF_model.pkl'.format(route), 'rb') as handle:
            rand_forest_model = pickle.load(handle)
        randforest_model_predict = list(map(round, rand_forest_model.predict(fetr_df)))
        return randforest_model_predict[0]
