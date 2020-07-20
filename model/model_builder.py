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

def get_routes():
    # Get a list of all routes and return to user
    route_df = pd.read_csv("../database_code/routes_tripids.csv")
    return route_df["Routes"]

def clean_and_split(route):
    # Check if file is valid, log and return if not
    if not os.path.isfile("../database_code/route_{}_leavetimes.csv".format(route)):
        with open('model_log.txt', 'a') as f:
            f.writelines("{} is not a valid route\n".format(route))
        return
    else:
        # imports file to DataFrame
        leave_df = pd.read_csv("../database_code/route_{}_leavetimes.csv".format(route))
    # Get Dummies for whole table on specfic coulmns
    train_data = pd.get_dummies(leave_df, columns=["STOPPOINTID", "DIRECTION", "MONTH", "HOUR", "WEATHER_MAIN", "DAYOFWEEK", "WEATHER_ID", "DAY"], drop_first=True)
    # Reset index
    train_data.reset_index(drop=True, inplace=True)
    # Save target data
    train_trgt = train_data["ACTUALTIME_ARR"]
    # Save feature data
    train_fetr = train_data.drop(columns=["ACTUALTIME_ARR", "TRIPID","PROGRNUMBER", "PLANNEDTIME_ARR", "VEHICLEID", "PLANNEDTIME_DEP", "ACTUALTIME_DEP", "DELAY", "TIMEATSTOP", "LINEID", "PLANNED_TRIP_DURATION", "ACTUAL_TRIP_DURATION", "YEAR"])
    # Clean up memory space
    del leave_df, train_data
    # Return Variables
    return train_fetr, train_trgt

def clean_and_split_large(route, percent):
    # Check if file is valid, log and return if not
    if not os.path.isfile("../database_code/larger/route_{}_leavetimes.csv".format(route)):
        with open('model_log.txt', 'a') as f:
            f.writelines("{} is not a valid route\n".format(route))
        return
    else:
        # imports file to DataFrame
        leave_df = pd.read_csv("../database_code/route_{}_leavetimes.csv".format(route))
    # Get Dummies for whole table on specfic coulmns
    main_df_dummies = pd.get_dummies(leave_df, columns=["STOPPOINTID", "DIRECTION", "MONTH", "HOUR", "WEATHER_MAIN", "DAYOFWEEK", "WEATHER_ID", "DAY"], drop_first=True)
    # Reset index
    # Get list of all unique Trip IDs
    full_list = list(main_df_dummies["TRIPID"].unique())
    # Split Trip Ids into 70:30 for Train:Test
    tripid_train, tripid_test = train_test_split(full_list, test_size=percent, random_state=0)
    # Seperate out the data
    ids_present = main_df_dummies['TRIPID'].isin(tripid_train)
    train_data = main_df_dummies.loc[ids_present]
    # Reset Index
    train_data.reset_index(drop=True, inplace=True)
    # Save target data
    train_trgt = train_data["ACTUALTIME_ARR"]
    # Save feature data
    train_fetr = train_data.drop(columns=["ACTUALTIME_ARR", "TRIPID","PROGRNUMBER", "PLANNEDTIME_ARR", "VEHICLEID", "PLANNEDTIME_DEP", "ACTUALTIME_DEP", "DELAY", "TIMEATSTOP", "LINEID", "PLANNED_TRIP_DURATION", "ACTUAL_TRIP_DURATION", "YEAR"])
    # Clean up memory space
    del leave_df, train_data, main_df_dummies, tripid_train, tripid_test
    # Return Variables
    return train_fetr, train_trgt


def main():
    try:
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
        # Run function to get list of routes
        routes = get_routes()
        # Go through each route
        for route in routes:
            # Check if current route has been tracked already, if not add to tracker
            if track_df[(track_df["Route"] == route)].empty:
                track_df.loc[track_df.shape[0]] = [route, 0]
            # Check to see if current route has a model created
            if not track_df[(track_df["Route"] == route) & (track_df["Model"] == 0)].empty:
                try:
                    with open('model_log.txt', 'a') as f:
                        f.write("Building Model For Route {}\n".format(route))
                    # Get feature and target data
                    # If route does not have file this will error and is caught below
                    train_fetr, train_trgt = clean_and_split(route)
                    # Create model for current route
                    randforest_model = RandomForestRegressor(n_estimators=16, max_features='auto', max_depth=18,
                                                             oob_score=True, random_state=1).fit(train_fetr, train_trgt)
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
                    try:
                        for i in range(1,9):
                            try:
                                with open('model_log.txt', 'a') as f:
                                    f.write("Trying for Larger Route Model Building: {}% Less\n".format(i*10))
                                    train_fetr, train_trgt = clean_and_split_large(route, i/10)
                                    # Create model for current route
                                    randforest_model = RandomForestRegressor(n_estimators=16, max_features='auto',
                                                                             max_depth=18,
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
                                    break

                            except Exception as e:
                                with open('model_log.txt', 'a') as f:
                                    f.write("Error: {} \n".format(e))
                                del randforest_model
                                # If Error move on to next percent
                                continue

                    except Exception as e:
                        with open('model_log.txt', 'a') as f:
                            f.write("Error: {} \n".format(e))
                        # If Error move on to next route
                        continue
            else:
                with open('model_log.txt', 'a') as f:
                    f.write("Route {} Model Already Built\n".format(route))
    except Exception as e:
        with open('model_log.txt', 'a') as f:
            f.write("Error: {}\n".format(e))


if __name__ == '__main__':
    main()