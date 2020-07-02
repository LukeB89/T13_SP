import os
import pandas as pd
import sys

drop_columns = ["DATASOURCE", "PASSENGERS", "PASSENGERSIN", "PASSENGERSOUT", "DISTANCE", "JUSTIFICATIONID",
                "LASTUPDATE", "NOTE"]
trip_columns = ["dayofservice", "tripid", "lineid", "direction", "plannedtime_arr", "plannedtime_dep",
                "actualtime_arr", "actualtime_dep", "suppressed"]
weather_columns = ["dt_iso", "temp", "feels_like", "temp_min", "temp_max", "pressure", "humidity", "wind_speed",
                   "wind_deg", "clouds_all", "weather_id", "weather_main"]


def get_routes():
    route_df = pd.read_csv("../database_code/routes_tripids.csv")
    return route_df["Routes"]


def clean_leavetimes(route):
    complete = False
    # Check to see if file exists
    if not os.path.isfile("../database_code/route_{}_leavetimes.csv".format(route)):
        return complete
    else:
        # imports file to DataFrame
        leave_df = pd.read_csv("../database_code/route_{}_leavetimes.csv".format(route))
        # Drops Columns Not Needed
        leave_df = leave_df.drop(columns=drop_columns)
        # Drops Rows Where Suppressed = 1
        # Suppressed Indicates That Trip Did Not Run. Data Invalid
        leave_df = leave_df[leave_df["SUPPRESSED"] != 1]
        # Reset Index
        leave_df = leave_df.reset_index(drop=True)
        # Drop Suppressed, No Longer Needed
        leave_df = leave_df.drop(columns=["SUPPRESSED"])
        # Create Feature, DELAY Is The Difference Between The Time Bus Was Supposed To Arrive
        # And The Time It Actually Arrived
        leave_df["DELAY"] = leave_df["ACTUALTIME_ARR"] - leave_df["PLANNEDTIME_ARR"]
        # Create Feature, TIMEATSTOP Is The Difference Between The Time The Bus Actually Arrived
        # And the Time It Actually Departed
        leave_df["TIMEATSTOP"] = leave_df["ACTUALTIME_DEP"] - leave_df["ACTUALTIME_ARR"]
        # Remove Any Duplicated Rows
        leave_df = leave_df.drop_duplicates(keep=False)
        # Remove Rows Wit Null Values
        leave_df = leave_df.dropna()
        leave_df.to_csv("../database_code/route_{}_leavetimes.csv".format(route), index=False)
        # Remove Unused Variables From Memory
        del leave_df
        complete = True
    return complete


def add_trips(route):
    complete = False
    if not os.path.isfile("../database_code/route_{}_leavetimes.csv".format(route)):
        return complete
    else:
        # Read In Tables to Dataframes
        trips_df = pd.read_csv("../database_code/trips.csv")
        leave_df = pd.read_csv("../database_code/route_{}_leavetimes.csv".format(route))
        # Keep Needed Columns And Standardise The Headings
        trips_df = trips_df[trip_columns]
        trips_df.columns = map(str.upper,trips_df.columns)
        # Drops Rows Where Suppressed = 1
        # Suppressed Indicates That Trip Did Not Run. Data Invalid
        trips_df = trips_df[trips_df["SUPPRESSED"] != 1]
        # Reset Index
        trips_df = trips_df.reset_index(drop=True)
        # Drop Suppressed, No Longer Needed
        trips_df = trips_df.drop(columns=["SUPPRESSED"])
        # Add Columns Capturing Trip In ofrmation To Prevent Duplicates
        trips_df["PLANNED_TRIP_DURATION"] = trips_df["PLANNEDTIME_ARR"] - trips_df["PLANNEDTIME_DEP"]
        trips_df["ACTUAL_TRIP_DURATION"] = trips_df["ACTUALTIME_ARR"] - trips_df["ACTUALTIME_DEP"]
        # Remove Non-Needed Columns
        trips_df = trips_df.drop(columns=["PLANNEDTIME_ARR", "PLANNEDTIME_DEP", "ACTUALTIME_ARR", "ACTUALTIME_DEP"])
        # Prepare Required Columns For Merge
        leave_df["DAYOFSERVICE"] = leave_df["DAYOFSERVICE"].astype('datetime64')
        trips_df["DAYOFSERVICE"] = trips_df["DAYOFSERVICE"].astype('datetime64')
        # Merge Both DataFrames
        leave_df = pd.merge(leave_df,trips_df, on=["DAYOFSERVICE", "TRIPID"])
        # Sometimes ACTUAL_TRIP_DURATION Has Null Values Which This Should Fix
        # First Segregate Out The Rows With Null Values
        seg_df = leave_df[leave_df["ACTUAL_TRIP_DURATION"].isnull()]
        # Obtain List Of Trip Ids With Null Values
        nan_ids = list(seg_df["TRIPID"].unique())
        # Loop Through Ids
        for id in nan_ids:
            # Use Only The Current ID
            local_seg_df = seg_df.loc[(seg_df["TRIPID"] == id)]
            # Get All Dates Used By That Id
            dates = list(local_seg_df["DAYOFSERVICE"].unique())
            # Go Through Each Date
            # Note: Without Going Through Each Date Some Ids Will Error Out As Some Ids Have More Than One Date
            # And Wont Know What Day You Are Trying To Append
            for date in dates:
                # Obtain Last And First Number In PROGRNUMBER Associated With Date
                max_progr = local_seg_df[local_seg_df["DAYOFSERVICE"] == date]["PROGRNUMBER"].max()
                min_progr = local_seg_df[local_seg_df["DAYOFSERVICE"] == date]["PROGRNUMBER"].min()
                # Calculate New ACTUAL_TRIP_DURATION
                new_actual = int(seg_df.loc[(seg_df["TRIPID"] == id) & (seg_df["PROGRNUMBER"] == max_progr) & (
                        seg_df["DAYOFSERVICE"] == date)]["ACTUALTIME_ARR"]) - \
                             int(seg_df.loc[(seg_df["TRIPID"] == id) & (seg_df["PROGRNUMBER"] == min_progr) & (
                                     seg_df["DAYOFSERVICE"] == date)]["ACTUALTIME_DEP"])
                # Assign ACTUAL_TRIP_DURATION With New Value
                leave_df.loc[(leave_df["TRIPID"] == id)&(leave_df["DAYOFSERVICE"] == date), "ACTUAL_TRIP_DURATION"] = \
                    new_actual
        # Save Data And Confirm Completed
        leave_df.to_csv("../database_code/route_{}_leavetimes.csv".format(route), index=False)
        # Remove Unused Variables From Memory
        del leave_df, trips_df, seg_df, local_seg_df, dates, max_progr, min_progr, new_actual, nan_ids
        complete = True
    return complete


def add_weather(route):
    complete = False
    if not os.path.isfile("../database_code/route_{}_leavetimes.csv".format(route)):
        return complete
    else:
        # Read In Tables to Dataframes
        weather_df = pd.read_csv("../database_code/weather.csv")
        leave_df = pd.read_csv("../database_code/route_{}_leavetimes.csv".format(route))
        # Keep Needed Columns And Standardise The Headings
        weather_df = weather_df[weather_columns]
        weather_df.columns = map(str.upper, weather_df.columns)
        # Create Columns For Merge - Weather
        weather_df["DT_ISO"] = weather_df["DT_ISO"].astype('datetime64')
        weather_df["YEAR"] = weather_df["DT_ISO"].dt.year
        weather_df["MONTH"] = weather_df["DT_ISO"].dt.month
        weather_df["DAY"] = weather_df["DT_ISO"].dt.day
        weather_df["HOUR"] = weather_df["DT_ISO"].dt.hour

        # Create Columns For Merge - leavetimes
        leave_df["DAYOFSERVICE"] = leave_df["DAYOFSERVICE"].astype('datetime64')
        leave_df["YEAR"] = leave_df["DAYOFSERVICE"].dt.year
        leave_df["MONTH"] = leave_df["DAYOFSERVICE"].dt.month
        leave_df["DAY"] = leave_df["DAYOFSERVICE"].dt.day
        # Convert ACTUALTIME_ARR From Seconds To Timestamp(DateTime)
        # Year For This Is 1970 (Start Of Epoch Time)
        # But Hour Will Always Be Correct
        leave_df["HOUR"] = pd.to_datetime(leave_df["ACTUALTIME_ARR"], unit='s').dt.hour
        # Merge Both On Common Year, Month, Day And Hour
        leave_df = pd.merge(leave_df,weather_df, on=["YEAR", "MONTH", "DAY", "HOUR"])
        # Obtain Day Of Week (Useful For What Days Are Busier)
        leave_df["DAYOFWEEK"] = leave_df["DAYOFSERVICE"].dt.dayofweek
        # Remove DateTime As Data Now In Individual Columns For Easier Modeling
        leave_df = leave_df.drop(columns=["DAYOFSERVICE", "DT_ISO"])
        # Save Data And Confirm Completed
        leave_df.to_csv("../database_code/route_{}_leavetimes.csv".format(route), index=False)
        # Remove Unused Variables From Memory
        del leave_df, weather_df
        complete = True
    return complete


def checks(route):
    complete = False
    if not os.path.isfile("../database_code/route_{}_leavetimes.csv".format(route)):
        return complete
    else:
        # Read In Table To DataFrame
        leave_df = pd.read_csv("../database_code/route_{}_leavetimes.csv".format(route))
        # Check If Any Remaining NaN Values And Remove
        if leave_df.isnull().any().any():
            leave_df = leave_df.dropna()
            with open("clean_log.txt", 'a') as f:
                f.write("Route {} had NaN Values. Removed\n".format(route))
        # Check For Duplicated Rows And Remove
        if leave_df.duplicated().sum() > 0:
            leave_df = leave_df.drop_duplicates()
            with open("clean_log.txt", 'a') as f:
                f.write("Route {} had Duplicated Rows. Removed\n".format(route))
        # Save Data And Confirm Completed
        leave_df.to_csv("../database_code/route_{}_leavetimes.csv".format(route), index=False)
        # Remove Unused Variables From Memory
        del leave_df
        complete = True

    return complete


if __name__ == '__main__':
    try:
        # Obtain a previously created list of routes
        route_df = get_routes()
        # Check to see if tracking has been started and stored
        # Load into tracking DataFrame if file exist,
        # if not start new tracking DataFrame
        if os.path.isfile("cleaning_tracker.csv"):
            track_df = pd.read_csv("cleaning_tracker.csv")
        else:
            track_df = pd.DataFrame(columns=["Route", "Leavetimes", "Trips", "Weather", "Checks"])
        # Prepare Log File
        with open("clean_log.txt", 'w') as f:
            f.write("Log for data_prep.py\n")
        # Cycle through route list
        for route in route_df:
            # If current route is not found in the tracker then append
            # Route to the end of the tracker DataFrame with default values
            if track_df[(track_df["Route"] == route)].empty:
                track_df.loc[track_df.shape[0]] = [route, 0, 0, 0,0]
            # If route cleaning has not occured start cleaning
            if not track_df[(track_df["Route"] == route) & (track_df["Leavetimes"] == 0)].empty:
                # Use log to kep track of current progress
                with open("clean_log.txt", 'a') as f:
                    f.write("Cleaning Route {} Data\n".format(route))
                    # Run clean_leavetimes function. when function is finished
                    # True will be returned signaling the data has been processed
                    if clean_leavetimes(route):
                        f.write("Route {} Cleaned\n".format(route))
                        # Update tracker with cleaning applied
                        track_df.loc[track_df["Route"] == route, ["Leavetimes"]] = 1
                    else:
                        f.write("Route {} Not Cleaned\n".format(route))
            else:
                with open("clean_log.txt", 'a') as f:
                    f.write("Route {} Already Cleaned\n".format(route))
            # Check to see data has been cleaned through clean_leavetimes
            if not track_df[(track_df["Route"] == route) & (track_df["Leavetimes"] == 1) &
                            (track_df["Trips"] == 0)].empty:
                # Use log to kep track of current progress
                with open("clean_log.txt", 'a') as f:
                    f.write("Adding Trips Data For Route {} \n".format(route))
                    # Run add_trips function. when function is finished
                    # True will be returned signaling the data has been processed
                    if add_trips(route):
                        f.write("Trips Data Added For Route {}\n".format(route))
                        # Update tracker with cleaning applied
                        track_df.loc[track_df["Route"] == route, ["Trips"]] = 1
                    else:
                        f.write("No Trips Data Added For Route {}\n".format(route))
            else:
                with open("clean_log.txt", 'a') as f:
                    f.write("Trips Data Already Added For Route {}\n".format(route))
            # Check to see data has been cleaned through clean_leavetimes and trips data has been added
            if not track_df[
                (track_df["Route"] == route) & (track_df["Leavetimes"] == 1) & (track_df["Trips"] == 1) &
                (track_df["Weather"] == 0)].empty:
                # Use log to kep track of current progress
                with open("clean_log.txt", 'a') as f:
                    f.write("Adding Weather Data For Route {} \n".format(route))
                    # Run add_weather function. when function is finished
                    # True will be returned signaling the data has been processed
                    if add_weather(route):
                        f.write("Weather Data Added For Route {}\n".format(route))
                        # Update tracker with cleaning applied
                        track_df.loc[track_df["Route"] == route, ["Weather"]] = 1
                    else:
                        f.write("No Weather Data Added For Route {}\n".format(route))
            else:
                with open("clean_log.txt", 'a') as f:
                    f.write("Weather Data Already Added For Route {}\n".format(route))
            if not track_df[
                (track_df["Route"] == route) & (track_df["Leavetimes"] == 1) & (track_df["Trips"] == 1) &
                (track_df["Weather"] == 1) & (track_df["Checks"] == 0)].empty:
                # Use log to kep track of current progress
                with open("clean_log.txt", 'a') as f:
                    f.write("Checking Data For Route {} \n".format(route))
                    # Run add_weather function. when function is finished
                    # True will be returned signaling the data has been processed
                    if checks(route):
                        f.write("Completed Checks For Route {}\n".format(route))
                        # Update tracker with cleaning applied
                        track_df.loc[track_df["Route"] == route, ["Checks"]] = 1
                    else:
                        f.write("No Checks Done For Route {}\n".format(route))
            else:
                with open("clean_log.txt", 'a') as f:
                    f.write("Checks Already Done For Route {}\n".format(route))
    except Exception as e:
        print("An Error occurred: ", e)
        print("Error found on line: ", sys.exc_info()[2].tb_lineno)


    finally:
        # Before closing save current progress to tracker file
        track_df.to_csv("cleaning_tracker.csv", index=False)
        print(track_df)