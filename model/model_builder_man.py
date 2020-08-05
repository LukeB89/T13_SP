# Import package pandas for data analysis
import pandas as pd
# Import OS to check if files exist
import os
# Import Pickle to save prediction model
import pickle
# Import individual sklearn modules used in model building and analysis
from sklearn.ensemble import RandomForestRegressor
# Used in error handling
import sys
# Used in splitting the data
from sklearn.model_selection import train_test_split

def clean_and_split_large(route, percent):
    # Check if file is valid, log and return if not
    if not os.path.isfile("../database_code/larger/route_{}_leavetimes.csv".format(route)):
        with open('model_log.txt', 'a') as f:
            f.writelines("{} is not a valid route\n".format(route))
        return
    else:
        # imports file to DataFrame
        leave_df = pd.read_csv("../database_code/larger/route_{}_leavetimes.csv".format(route))
        with open('model_log.txt', 'a') as f:
            f.writelines("{} has the shape: {}\n".format(route, leave_df.shape))

    # Get list of all unique Trip IDs
    full_list = list(leave_df["TRIPID"].unique())

    # Create a feature "Minutes"
    leave_df["MINUTES"] = pd.to_datetime(leave_df["ACTUALTIME_ARR"], unit='s').dt.minute

    # Keep rows whose program number is 1
    leave_df.drop(leave_df[leave_df['PROGRNUMBER'] != 1].index, inplace=True)

    # Split Trip Ids into 70:30 for Train:Test
    tripid_train, tripid_test = train_test_split(full_list, test_size=percent, random_state=0)
    # Seperate out the data
    ids_present = leave_df['TRIPID'].isin(tripid_train)
    train_data = leave_df.loc[ids_present]
    # Reset Index
    train_data.reset_index(drop=True, inplace=True)
    # Clean up memory space
    del leave_df, full_list, tripid_test, tripid_train
    with open('model_log.txt', 'a') as f:
        f.writelines("After Split {} has the shape: {}\n".format(route, train_data.shape))
    if train_data.shape[0] > 1000000:
        return
    # Get Dummies for whole table on specfic coulmns
    train_data = pd.get_dummies(train_data, columns=["DIRECTION", "MONTH", "HOUR", "MINUTES", "WEATHER_MAIN", "DAYOFWEEK", "WEATHER_ID"], drop_first=True)
    # Reset index

    # Save target data
    train_trgt = train_data["ACTUAL_TRIP_DURATION"]
    # Save feature data
    train_fetr = train_data.drop(columns=["STOPPOINTID", "ACTUALTIME_ARR", "TRIPID","PROGRNUMBER", "PLANNEDTIME_ARR", "VEHICLEID", "PLANNEDTIME_DEP", "ACTUALTIME_DEP", "DELAY", "TIMEATSTOP", "LINEID", "PLANNED_TRIP_DURATION", "ACTUAL_TRIP_DURATION", "YEAR", "DAY"])

    # Return Variables
    return train_fetr, train_trgt


def main():
    try:
        route = input("Route name: ")
        i = float(input("Percentage to take away (X.X): "))
        # Check if file exists
        if os.path.isfile("model_tracker.csv"):
            # If file exists load into dataframe
            track_df = pd.read_csv("model_tracker.csv")
        else:
            # If file dosnt exist create dataframe
            track_df = pd.DataFrame(columns=["Route", "Model"])
        # Same as above but for a different file
        if os.path.isfile("model_features.csv"):
            fetr_df = pd.read_csv("model_features.csv")
        else:
            fetr_df = pd.DataFrame(columns=["Route", "Features"])
        # Open a log and write to it
        with open('model_log.txt', 'w') as f:
            f.write("Starting Model Building\n\n")
        with open('model_log.txt', 'a') as f:
            f.write("Trying for Larger Route Model Building: {}% Less\n".format(i * 10))
        train_fetr, train_trgt = clean_and_split_large(route, i/10)
        # Create model for current route
        randforest_model = RandomForestRegressor(n_estimators=64, max_features='auto',
                                                 max_depth=16,
                                                 oob_score=True, random_state=1).fit(
            train_fetr, train_trgt)
        # Save Model with current Route name
        with open('models/route_{}_RF_model.pkl'.format(route), 'wb') as handle:
            pickle.dump(randforest_model, handle, pickle.HIGHEST_PROTOCOL)
        # Output Features used to dataframe for use when building predictions
        if fetr_df[(fetr_df["Route"] == route)].empty:
            fetr_df.loc[fetr_df.shape[0]] = [route, list(train_fetr.columns)]
        # Update Tracker that model is complete
        track_df.loc[track_df["Route"] == route, ["Model"]] = 1
        # Update log
        with open('model_log.txt', 'a') as f:
            f.write("Route {} Model Built\n".format(route))
        track_df.to_csv("model_tracker.csv", index=False)
        fetr_df.to_csv("model_features.csv", index=False)

    except Exception as e:
        with open('model_log.txt', 'a') as f:
            f.write("Error: {} \n".format(e))


if __name__ == '__main__':
    main()