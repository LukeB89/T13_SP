import pandas as pd
import os
import sys
# Used in splitting the data
from sklearn.model_selection import train_test_split

def get_routes():
    """ A function to obtain the routes list"""
    # Get a list of all routes and return to user
    route_df = pd.read_csv("../database_code/routes_tripids.csv")
    return route_df["Routes"]

def clean_and_sep(df, direction):
    """ A function to clean and seperate out a route based on its direction"""
    # Split into individual dataframes based on direction
    dir_df = df[df["DIRECTION"] == direction]
    # Set subset columns to check for duplicates
    cols = ["TRIPID", "PROGRNUMBER", "STOPPOINTID", "PLANNEDTIME_ARR", "PLANNEDTIME_DEP", "ACTUALTIME_ARR",
            "ACTUALTIME_DEP", "VEHICLEID", "DELAY", "TIMEATSTOP", "LINEID", "DIRECTION",
            "PLANNED_TRIP_DURATION", "ACTUAL_TRIP_DURATION", "YEAR", "MONTH", "DAY", "HOUR", "DAYOFWEEK"]
    # drop duplicated entries
    dir_df.drop_duplicates(subset=cols, keep='last', inplace=True)
    # Obtain trip ids that have a first stop( based on PROGRNUMBER = 1)
    dir_tripids = list(dir_df[(dir_df["PROGRNUMBER"] == 1)]["TRIPID"].unique())
    # Seperate out the data
    ids_present = dir_df['TRIPID'].isin(dir_tripids)
    dir_df = dir_df.loc[ids_present]
    # Reset the indexs
    dir_df.reset_index(drop=True, inplace=True)
    # Memory cleanup
    del dir_tripids
    # Return dataframes
    return dir_df

def csv_out(data, route, direction, stoppoints):
    """A function to output percentile data to its own CSV file"""
    # Initialise column names
    cols = ["ROUTE", "MONTH", "HOUR", "DAYOFWEEK"]
    cols.extend(stoppoints)
    # Convert into dataframe
    prcnt_df = pd.DataFrame(columns=cols)
    del cols
    prcnt_df = pd.concat([prcnt_df, pd.DataFrame.from_dict(data)])
    # Output into individual CSV file
    if not os.path.isfile("prcnts/route_{}_dir_{}_prcnt_data.csv.csv".format(route,direction)):
        prcnt_df.to_csv("prcnts/route_{}_dir_{}_prcnt_data.csv".format(route,direction), index=False)
    else:
        with open("prcnts/route_{}_dir_{}_prcnt_data.csv".format(route,direction), 'a') as f:
            prcnt_df.to_csv(f, header=False, index=False)
    return True


def add_trip_start(df):
    """ A function to add in the start time of any given route"""
    # Default column to 0
    df["STARTTRIPTIME"] = 0
    # For each ID - Some ID's have multiple entries and need extra definition
    for id in list(df["TRIPID"].unique()):
        # For each Month
        for month in list(df[df["TRIPID"] == id]["MONTH"].unique()):
            # For each day
            for day in list(df[(df["TRIPID"] == id) & (df["MONTH"] == month)]["DAY"].unique()):
                # Obtain start time for that ID on that day and month based on the PROGRNUMBER being 1
                start_time = \
                df[(df["TRIPID"] == id) & (df["MONTH"] == month) & (df["DAY"] == day) & (df["PROGRNUMBER"] == 1)][
                    "ACTUALTIME_ARR"]
                # If that combination does not start at 1 drop it.
                # To get the average we only want routes that start and end at the same point
                if start_time.empty:
                    indexs = df[(df["TRIPID"] == id) & (df["MONTH"] == month) & (df["DAY"] == day)].index
                    df.drop(indexs, inplace=True)
                    continue
                # Apply the start time to the column
                df.loc[(df["TRIPID"] == id) & (df["MONTH"] == month) & (df["DAY"] == day), "STARTTRIPTIME"] = int(start_time)

    return df

def build_dict(df):
    """A function to journey percentile data for any given route"""
    prcnt_dict = {}
    # For each month, day of week and hour
    for month in list(df["MONTH"].unique()):
        for day in list(df["DAYOFWEEK"].unique()):
            for hour in list(df["HOUR"].unique()):
                # set or append the month, DoW and hour information

                if "MONTH" not in prcnt_dict:
                    prcnt_dict["MONTH"] = [month]
                else:
                    prcnt_dict["MONTH"].append(month)

                if "DAYOFWEEK" not in prcnt_dict:
                    prcnt_dict["DAYOFWEEK"] = [day]
                else:
                    prcnt_dict["DAYOFWEEK"].append(day)

                if "HOUR" not in prcnt_dict:
                    prcnt_dict["HOUR"] = [hour]
                else:
                    prcnt_dict["HOUR"].append(hour)
                # For each stop id
                for stopid in list(df["STOPPOINTID"].unique()):
                    # Obtain the average time it took to get to the stop at that hour, month and DoW combination
                    avg_stop_trip_duration = df[
                        (df["MONTH"] == month) & (df["HOUR"] == hour) & (df["DAYOFWEEK"] == day) & (
                                    df["STOPPOINTID"] == stopid)]["STOP_TRIP_DURATION"].mean()
                    # Obtain the average time it took to complete the journey at that hour, month and DoW combination
                    avg_trip_duration = df[(df["MONTH"] == month) & (df["HOUR"] == hour) & (df["DAYOFWEEK"] == day)][
                        "ACTUAL_TRIP_DURATION"].mean()
                    try:
                        # Calculate the percentage
                        stop_prcnt = (avg_stop_trip_duration/avg_trip_duration)*100
                    except:
                        stop_prcnt = "N/A"

                    # Apply percentage to dictionary
                    if stopid not in prcnt_dict:
                        prcnt_dict[stopid] = [stop_prcnt]
                    else:
                        prcnt_dict[stopid].append(stop_prcnt)
    return prcnt_dict

def main():
    try:
        if os.path.isfile("prcnt_tracker.csv"):
            # If file exists load into dataframe
            track_df = pd.read_csv("prcnt_tracker.csv")
        else:
            # If file dosnt exist create dataframe
            track_df = pd.DataFrame(columns=["Route", "Complete"])
        routes = get_routes()
        with open('prcnt_log.txt', 'w') as f:
            f.write("Starting Percent Table Building\n\n")
        for route in routes:
            # Check if current route has been tracked already, if not add to tracker
            if track_df[(track_df["Route"] == route)].empty:
                track_df.loc[track_df.shape[0]] = [route, 0]
            track_df.to_csv("prcnt_tracker.csv", index=False)
            if not track_df[(track_df["Route"] == route) & (track_df["Complete"] == 0)].empty:
                # imports file to DataFrame
                if os.path.isfile("../database_code/route_{}_leavetimes.csv".format(route)):
                    # If file exists load into dataframe
                    leave_df = pd.read_csv("../database_code/route_{}_leavetimes.csv".format(route))
                else:
                    with open('prcnt_log.txt', 'a') as f:
                        f.write("Route {} does not exist\n".format(route))
                    continue
                with open('prcnt_log.txt', 'a') as f:
                    f.write("Starting Route {}\n".format(route))

                try:

                    # Initialise Flag for checks
                    complete = [False, False]
                    # Sort the dataframe by TRIPID, PROGRNUMBER and DAY. The Reason for DAY being included is that
                    # Sometimes there a multiple entried of the same TRIPID but on different days
                    leave_df = leave_df.sort_values(by=["TRIPID", "PROGRNUMBER", "DAY"], ascending=[True, True, True])
                    for num, direction in enumerate(list(leave_df["DIRECTION"].unique())):
                        # Clean the data to obtain a complete route split data for each route
                        dir_df= clean_and_sep(leave_df, direction)
                        # Add the start time of each TRIPID journey, used in obtaining the duration into the route for the stop
                        dir_df = add_trip_start(dir_df)

                        # Add the duration into the route for each stop
                        dir_df["STOP_TRIP_DURATION"] = dir_df["ACTUALTIME_ARR"] - dir_df["STARTTRIPTIME"]
                        # Build percent data table
                        dir_dict = build_dict(dir_df)
                        with open('prcnt_log.txt', 'a') as f:
                            f.write("Completed  Direction {}\n".format(direction))
                        # Output the data to csv files
                        complete[num] = csv_out(dir_dict, route, direction, list(dir_df["STOPPOINTID"].unique()))
                    del leave_df
                    if complete[0] or complete[1]:
                        # Update Tracker that model is complete
                        track_df.loc[track_df["Route"] == route, ["Complete"]] = 1
                        with open('prcnt_log.txt', 'a') as f:
                            f.write("Percent Table complete for Route {}\n\n".format(route))
                    track_df.to_csv("prcnt_tracker.csv", index=False)

                except:
                    try:
                        for i in range(1, 9):
                            try:
                                full_list = list(leave_df["TRIPID"].unique())
                                # Split Trip Ids
                                tripid_train, tripid_test = train_test_split(full_list, test_size=i/10, random_state=0)
                                # Seperate out the data
                                ids_present = leave_df['TRIPID'].isin(tripid_train)
                                leave_df = leave_df.loc[ids_present]
                                if leave_df.shape[0] > 1000000:
                                    continue
                                # Initialise Flag for checks
                                complete = [False, False]
                                # Sort the dataframe by TRIPID, PROGRNUMBER and DAY. The Reason for DAY being included is that
                                # Sometimes there a multiple entried of the same TRIPID but on different days
                                leave_df = leave_df.sort_values(by=["TRIPID", "PROGRNUMBER", "DAY"],
                                                                ascending=[True, True, True])
                                for num, direction in enumerate(list(leave_df["DIRECTION"].unique())):
                                    # Clean the data to obtain a complete route split data for each route
                                    dir_df = clean_and_sep(leave_df, direction)
                                    # Add the start time of each TRIPID journey, used in obtaining the duration into the route for the stop
                                    dir_df = add_trip_start(dir_df)

                                    # Add the duration into the route for each stop
                                    dir_df["STOP_TRIP_DURATION"] = dir_df["ACTUALTIME_ARR"] - dir_df["STARTTRIPTIME"]
                                    # Build percent data table
                                    dir_dict = build_dict(dir_df)
                                    with open('prcnt_log.txt', 'a') as f:
                                        f.write("Completed  Direction {}\n".format(direction))
                                    # Output the data to csv files
                                    complete[num] = csv_out(dir_dict, route, direction,
                                                            list(dir_df["STOPPOINTID"].unique()))
                                del leave_df
                                if complete[0] or complete[1]:
                                    # Update Tracker that model is complete
                                    track_df.loc[track_df["Route"] == route, ["Complete"]] = 1
                                    with open('prcnt_log.txt', 'a') as f:
                                        f.write("Percent Table complete for Route {} with {}% less data\n\n".format(route, i*10))
                                track_df.to_csv("prcnt_tracker.csv", index=False)
                                break

                            except Exception as e:
                                with open('prcnt_log.txt', 'a') as f:
                                    f.write("Error: {} \n".format(e))
                                # If Error move on to next percent
                                continue
                    except Exception as e:
                        with open('prcnt_log.txt', 'a') as f:
                            f.write("Error: {} \n".format(e))
                            exc_type, exc_value, exc_traceback = sys.exc_info()
                            f.write(exc_type)
                            f.write(exc_value)
                            f.write(exc_traceback)
            else:
                with open('prcnt_log.txt', 'a') as f:
                    f.write("Route {} already exists\n".format(route))

    except Exception as e:
        with open('prcnt_log.txt', 'a') as f:
            f.write("Error: {} \n".format(e))
            exc_type, exc_value, exc_traceback = sys.exc_info()
            f.write(exc_type)
            f.write(exc_value)
            f.write(exc_traceback)
    finally:
        # output the tracker information
        track_df.to_csv("prcnt_tracker.csv", index=False)


if __name__ == '__main__':
    main()
