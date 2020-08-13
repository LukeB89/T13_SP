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
# Used to calculate evaluation metrics
from sklearn import metrics

def get_routes():
    # Get a list of all routes and return to user
    route_df = pd.read_csv("../database_code/routes_tripids.csv")
    return route_df["Routes"]


def clean_and_split(route):
    # Check if file is valid, log and return if not
    if not os.path.isfile("../database_code/route_{}_leavetimes.csv".format(route)):
        with open('model_test_log.txt', 'a') as f:
            f.writelines("{} is not a valid route\n".format(route))
        return
    else:
        # imports file to DataFrame
        leave_df = pd.read_csv("../database_code/route_{}_leavetimes.csv".format(route))

    # Create a feature "Minutes"
    leave_df["MINUTES"] = pd.to_datetime(leave_df["ACTUALTIME_ARR"], unit='s').dt.minute
    # Keep rows whose program number is 1
    leave_df.drop(leave_df[leave_df['PROGRNUMBER'] != 1].index, inplace=True)
    # Remove rows whose values are less than 0
    leave_df.drop(leave_df[leave_df['ACTUAL_TRIP_DURATION'] < 0].index, inplace=True)
    # Get Dummies for whole table on specfic coulmns
    test_data = pd.get_dummies(leave_df, columns=["DIRECTION", "MONTH", "HOUR", "MINUTES", "WEATHER_MAIN", "DAYOFWEEK", "WEATHER_ID"], drop_first=True)
    # Reset index
    test_data.reset_index(drop=True, inplace=True)
    # Save target data
    test_trgt = test_data["ACTUAL_TRIP_DURATION"]
    # Get Train and test Planned time (used for metrics)
    test_plan = test_data["PLANNED_TRIP_DURATION"]
    # Save feature data
    test_fetr = test_data.drop(columns=["STOPPOINTID", "ACTUALTIME_ARR", "TRIPID", "PROGRNUMBER", "PLANNEDTIME_ARR", "VEHICLEID", "PLANNEDTIME_DEP", "ACTUALTIME_DEP", "DELAY", "TIMEATSTOP", "LINEID", "PLANNED_TRIP_DURATION", "ACTUAL_TRIP_DURATION", "YEAR", "DAY"])

    # Clean up memory space
    del leave_df, test_data

    # Return Variables
    return test_fetr, test_trgt, test_plan


def clean_and_split_large(route, percent):
    # Check if file is valid, log and return if not
    if not os.path.isfile("../database_code/larger/route_{}_leavetimes.csv".format(route)):
        with open('model_test_log.txt', 'a') as f:
            f.writelines("{} is not a valid route\n".format(route))
        return
    else:
        # imports file to DataFrame
        leave_df = pd.read_csv("../database_code/larger/route_{}_leavetimes.csv".format(route))
        with open('model_test_log.txt', 'a') as f:
            f.writelines("{} has the shape: {}\n".format(route, leave_df.shape))

    # Create a feature "Minutes"
    leave_df["MINUTES"] = pd.to_datetime(leave_df["ACTUALTIME_ARR"], unit='s').dt.minute
    # Keep rows whose program number is 1
    leave_df.drop(leave_df[leave_df['PROGRNUMBER'] != 1].index, inplace=True)
    # Remove rows whose values are less than 0
    leave_df.drop(leave_df[leave_df['ACTUAL_TRIP_DURATION'] < 0].index, inplace=True)
    # Get list of all unique Trip IDs
    full_list = list(leave_df["TRIPID"].unique())
    # Split Trip Ids into 70:30 for Train:Test
    tripid_train, tripid_test = train_test_split(full_list, test_size=percent, random_state=0)
    # Seperate out the data
    ids_present = leave_df['TRIPID'].isin(tripid_test)
    test_data = leave_df.loc[ids_present]
    # Reset Index
    test_data.reset_index(drop=True, inplace=True)
    # Clean up memory space
    del leave_df, full_list, tripid_test, tripid_train
    with open('model_test_log.txt', 'a') as f:
        f.writelines("After Split {} has the shape: {}\n".format(route, test_data.shape))
    if test_data.shape[0] > 1000000:
        return
    # Get Dummies for whole table on specfic coulmns
    test_data = pd.get_dummies(test_data, columns=["DIRECTION", "MONTH", "HOUR", "MINUTES", "WEATHER_MAIN", "DAYOFWEEK", "WEATHER_ID"], drop_first=True)
    # Save target data
    test_trgt = test_data["ACTUAL_TRIP_DURATION"]
    # Get Train and test Planned time (used for metrics)
    test_plan = test_data["PLANNED_TRIP_DURATION"]
    # Save feature data
    test_fetr = test_data.drop(columns=["STOPPOINTID", "ACTUALTIME_ARR", "TRIPID", "PROGRNUMBER", "PLANNEDTIME_ARR", "VEHICLEID", "PLANNEDTIME_DEP", "ACTUALTIME_DEP", "DELAY", "TIMEATSTOP", "LINEID", "PLANNED_TRIP_DURATION", "ACTUAL_TRIP_DURATION", "YEAR", "DAY"])

    # Return Variables
    return test_fetr, test_trgt, test_plan

def test_model_outcome(predicted, actual, planned):
    """ Sort and Obtain Metrics in Dictionary format

        Function used to obtain the metrics of the model in dictionary format  """
    if not isinstance(predicted, pd.DataFrame):
        predicted = pd.DataFrame(predicted, columns=["PREDICTED_TRIP_DURATION"])
    if not isinstance(actual, pd.DataFrame):
        actual = pd.DataFrame(actual, columns=["ACTUAL_TRIP_DURATION"])
    if not isinstance(planned, pd.DataFrame):
        planned = pd.DataFrame(planned, columns=["PLANNED_TRIP_DURATION"])
    # Initialise the combined dataframe
    combined = pd.concat([predicted, actual, planned], axis=1)
    # Calculate the actual delay
    actual_delay = combined["PLANNED_TRIP_DURATION"] - combined["ACTUAL_TRIP_DURATION"]
    # Calculate the predicted delay
    predicted_delay = combined["PLANNED_TRIP_DURATION"] - combined["PREDICTED_TRIP_DURATION"]
    # Calculate the difference in delay
    delay_diff = actual_delay - predicted_delay
    # Combine the delays into a single dataframe
    combined_delay = pd.concat([pd.DataFrame(actual_delay, columns=['Actual_Delay']),
                                pd.DataFrame(predicted_delay, columns=['Predicted_Delay']),
                                pd.DataFrame(delay_diff, columns=['Difference_In_Delay'])], axis=1)
    # Obtain the index of the max and min values of the actual, predicted and difference delays
    actual_max_index = combined_delay["Actual_Delay"].argmax()
    actual_min_index = combined_delay["Actual_Delay"].argmin()
    predicted_max_index = combined_delay["Predicted_Delay"].argmax()
    predicted_min_index = combined_delay["Predicted_Delay"].argmin()
    delay_diff_max_index = combined_delay["Difference_In_Delay"].argmax()
    delay_diff_min_index = combined_delay["Difference_In_Delay"].argmin()
    # Get the Mean Absolute Error
    MAE = metrics.mean_absolute_error(combined["ACTUAL_TRIP_DURATION"], combined["PREDICTED_TRIP_DURATION"])
    # Get the R2 Score
    R2 = metrics.r2_score(combined["ACTUAL_TRIP_DURATION"], combined["PREDICTED_TRIP_DURATION"])
    # Get the Root Mean Squared Error
    RMSE = metrics.mean_squared_error(combined["ACTUAL_TRIP_DURATION"], combined["PREDICTED_TRIP_DURATION"],
                                      squared=False)
    # Get the Median Absolute Error
    MEDAE = metrics.median_absolute_error(combined["ACTUAL_TRIP_DURATION"], combined["PREDICTED_TRIP_DURATION"])
    # Get the Mean Squared Error Log Value
    MSLE = metrics.mean_squared_log_error(combined["ACTUAL_TRIP_DURATION"], combined["PREDICTED_TRIP_DURATION"])
    # Build Dictionary
    pass_val = {"combined": combined,
                "combined_delay": combined_delay,
                "actual_max_index": actual_max_index,
                "actual_min_index": actual_min_index,
                "predicted_max_index": predicted_max_index,
                "predicted_min_index": predicted_min_index,
                "delay_diff_max_index": delay_diff_max_index,
                "delay_diff_min_index": delay_diff_min_index,
                "MAE": MAE,
                "R2": R2,
                "MEDAE": MEDAE,
                "RMSE": RMSE,
                "MSLE": MSLE}
    # Return Dictionary
    return pass_val

def metrics_builder(metrics_dict):
    """ Returns a Datafram of the metrics

        Built from the dictionary"""
    df = pd.DataFrame(metrics_dict["combined_delay"].mean(axis=0), columns=["Metrics"])
    df.loc["Max_Actual_Delay"] = metrics_dict["combined_delay"]["Actual_Delay"].loc[metrics_dict["actual_max_index"]]
    df.loc["Min_Actual_Delay"] = metrics_dict["combined_delay"]["Actual_Delay"].loc[metrics_dict["actual_min_index"]]
    df.loc["Max_Predicted_Delay"] = metrics_dict["combined_delay"]["Predicted_Delay"].loc[
        metrics_dict["predicted_max_index"]]
    df.loc["Min_Predicted_Delay"] = metrics_dict["combined_delay"]["Predicted_Delay"].loc[
        metrics_dict["predicted_min_index"]]
    df.loc["Mean_Absolute_Error"] = metrics_dict["MAE"]
    df.loc["R2"] = metrics_dict["R2"]
    df.loc["Median_Absolute_Error"] = metrics_dict["MEDAE"]
    df.loc["Root_Mean_Squared_Error"] = metrics_dict["RMSE"]
    df.loc["Mean_Squared_Log_Error"] = metrics_dict["MSLE"]
    df = df.rename(index={"Actual_Delay": "Actual_Delay_Mean", "Predicted_Delay": "Predicted_Delay_Mean",
                          "Difference_In_Delay": "Difference_In_Delay_Mean"})
    return df

def test_model(route, test_fetr, test_trgt, test_plan):
    if not os.path.isfile("models/route_{}_RF_model.pkl".format(route)):
        with open('model_test_log.txt', 'a') as f:
            f.writelines("Route {} Has No Model\n".format(route))
            return "na"
    with open('models/route_{}_RF_model.pkl'.format(route), 'rb') as handle:
        rand_forest_model = pickle.load(handle)
    randforest_model_predict = list(map(round, rand_forest_model.predict(test_fetr)))
    # Build the metrics dictionary with test data and predictions
    metrics_dict = test_model_outcome(randforest_model_predict, test_trgt, test_plan)
    # Build the dataframe
    randforrest_results = metrics_builder(metrics_dict)
    # Rename column name to show what trial this is
    randforrest_results.rename(columns={'Metrics': 'route={}'.format(route)}, inplace=True)
    return randforrest_results

def main():
    try:
        # Check if file exists
        if os.path.isfile("model_tracker.csv"):
            # If file exists load into dataframe
            track_df = pd.read_csv("model_tracker.csv")
        else:
            # If file dosnt exist create dataframe
            track_df = pd.DataFrame(columns=["Route", "Model", "Test"])
        # Same as above but for a different file
        if os.path.isfile("model_features.csv"):
            fetr_df = pd.read_csv("model_features.csv")
        else:
            fetr_df = pd.DataFrame(columns=["Route", "Features"])
        # Open a log and write to it
        with open('model_log.txt', 'w') as f:
            f.write("Starting Model Building\n\n")
        with open('model_test_log.txt', 'w') as f:
            f.write("Starting Model Testing\n\n")
        # Run function to get list of routes
        routes = get_routes()
        route_trials = pd.DataFrame()
        # Go through each route
        for route in routes:
            # Check if current route has been tracked already, if not add to tracker
            if track_df[(track_df["Route"] == route)].empty:
                track_df.loc[track_df.shape[0]] = [route, 0, 0]
            track_df.to_csv("model_tracker.csv", index=False)
            fetr_df.to_csv("model_features.csv", index=False)
            # Check to see if current route has a model created
            if not track_df[(track_df["Route"] == route) & (track_df["Model"] == 0)].empty:
                try:
                    with open('model_log.txt', 'a') as f:
                        f.write("Building Model For Route {}\n".format(route))
                    # Get feature and target data
                    # If route does not have file this will error and is caught below
                    test_fetr, test_trgt, test_plan = clean_and_split(route)
                    # Create model for current route
                    randforest_model = RandomForestRegressor(n_estimators=64, max_features='auto', max_depth=16,
                                                             oob_score=True, random_state=1).fit(test_fetr, test_trgt)
                    # Save Model with current Route name
                    with open('models/route_{}_RF_model.pkl'.format(route), 'wb') as handle:
                        pickle.dump(randforest_model, handle, pickle.HIGHEST_PROTOCOL)
                    # Output Features used to dataframe for use when building predictions
                    if fetr_df[(fetr_df["Route"] == route)].empty:
                        fetr_df.loc[fetr_df.shape[0]] = [route, list(test_fetr.columns)]
                    # Update Tracker that model is complete
                    track_df.loc[track_df["Route"] == route, ["Model"]] = 1
                    # Update log
                    with open('model_log.txt', 'a') as f:
                        f.write("Route {} Model Built\n".format(route))
                    track_df.to_csv("model_tracker.csv", index=False)
                    fetr_df.to_csv("model_features.csv", index=False)
                    randforrest_results = test_model(route, test_fetr, test_trgt, test_plan)
                    if not isinstance(randforrest_results, pd.DataFrame) and randforrest_results == "na":
                        with open('model_test_log.txt', 'a') as f:
                            f.write("No model to test for route {}\n".format(route))
                            track_df.to_csv("model_tracker.csv", index=False)
                            continue
                    # Append dataframe to trials dataframe
                    route_trials = pd.concat([route_trials, randforrest_results], axis=1)
                    route_trials.to_csv('metric_tester_results.csv')
                    # Update Tracker that model is complete
                    track_df.loc[track_df["Route"] == route, ["Test"]] = 1
                    # Update log
                    with open('model_test_log.txt', 'a') as f:
                        f.write("Route {} Model Tested\n".format(route))
                    track_df.to_csv("model_tracker.csv", index=False)
                except Exception as e:
                    try:
                        for i in range(1, 9):
                            try:
                                with open('model_log.txt', 'a') as f:
                                    f.write("Trying for Larger Route Model Building: {}% Less\n".format(i*10))
                                    test_fetr, test_trgt, test_plan = clean_and_split_large(route, i/10)
                                    # Create model for current route
                                    randforest_model = RandomForestRegressor(n_estimators=16, max_features='auto',
                                                                             max_depth=18,
                                                                             oob_score=True, random_state=1).fit(
                                        test_fetr, test_trgt)
                                    # Save Model with current Route name
                                    with open('models/route_{}_RF_model.pkl'.format(route), 'wb') as handle:
                                        pickle.dump(randforest_model, handle, pickle.HIGHEST_PROTOCOL)
                                    # Output Features used to dataframe for use when building predictions
                                    if fetr_df[(fetr_df["Route"] == route)].empty:
                                        fetr_df.loc[fetr_df.shape[0]] = [route, list(test_fetr.columns)]
                                    # Update Tracker that model is complete
                                    track_df.loc[track_df["Route"] == route, ["Model"]] = 1
                                    # Update log
                                    with open('model_log.txt', 'a') as f:
                                        f.write("Route {} Model Built\n".format(route))
                                    track_df.to_csv("model_tracker.csv", index=False)
                                    fetr_df.to_csv("model_features.csv", index=False)
                                    randforrest_results = test_model(route, test_fetr, test_trgt, test_plan)
                                    # Append dataframe to trials dataframe
                                    route_trials = pd.concat([route_trials, randforrest_results], axis=1)
                                    route_trials.to_csv('metric_tester_results.csv')
                                    # Update Tracker that model is complete
                                    track_df.loc[track_df["Route"] == route, ["Test"]] = 1
                                    # Update log
                                    with open('model_test_log.txt', 'a') as f:
                                        f.write("Route {} Model Tested\n".format(route))
                                    track_df.to_csv("model_tracker.csv", index=False)
                                    break

                            except Exception as e:
                                with open('model_log.txt', 'a') as f:
                                    f.write("Error: {} \n".format(e))
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