import pandas as pd
import os

def get_routes():
    """ A function to obtain the routes list"""
    # Get a list of all routes and return to user
    route_df = pd.read_csv("../database_code/routes_tripids.csv")
    return route_df["Routes"]

def clean_and_sep(df):
    """ A function to clean and seperate out a route based on its direction"""
    # Find the last stop in the route based on sequential PROGRNUMBER
    max_dir_1 = max(list(df[df["DIRECTION"] == 1]["PROGRNUMBER"].unique()))
    max_dir_2 = max(list(df[df["DIRECTION"] == 2]["PROGRNUMBER"].unique()))
    # Split into individual dataframes based on direction
    dir_1_df = df[df["DIRECTION"] == 1]
    dir_2_df = df[df["DIRECTION"] == 2]
    # Clean up memory
    del df
    # Obtain trip ids that have the full route (based on last PROGRNUMBER)
    dir_1_tripids = list(dir_1_df[(dir_1_df["PROGRNUMBER"] == max_dir_1)]["TRIPID"].unique())
    dir_2_tripids = list(dir_2_df[dir_2_df["PROGRNUMBER"] == max_dir_2]["TRIPID"].unique())
    # Seperate out the data
    ids_present = dir_1_df['TRIPID'].isin(dir_1_tripids)
    dir_1_df = dir_1_df.loc[ids_present]
    ids_present = dir_2_df['TRIPID'].isin(dir_2_tripids)
    dir_2_df = dir_2_df.loc[ids_present]
    # Obtain trip ids that have a first stop( based on PROGRNUMBER = 1)
    dir_1_tripids = list(dir_1_df[(dir_1_df["PROGRNUMBER"] == 1)]["TRIPID"].unique())
    dir_2_tripids = list(dir_2_df[dir_2_df["PROGRNUMBER"] == 1]["TRIPID"].unique())
    # Seperate out the data
    ids_present = dir_1_df['TRIPID'].isin(dir_1_tripids)
    dir_1_df = dir_1_df.loc[ids_present]
    ids_present = dir_2_df['TRIPID'].isin(dir_2_tripids)
    dir_2_df = dir_2_df.loc[ids_present]
    # Reset the indexs
    dir_1_df.reset_index(drop=True, inplace=True)
    dir_2_df.reset_index(drop=True, inplace=True)
    # Memory cleanup
    del dir_1_tripids, dir_2_tripids
    # Return dataframes
    return dir_1_df, dir_2_df

def csv_out(data, route, dir, stoppoints):
    """A function to output percentile data to its own CSV file"""
    # Initialise column names
    cols = ["ROUTE", "MONTH", "HOUR", "DAYOFWEEK"]
    cols.extend(stoppoints)
    # Convert into dataframe
    prcnt_df = pd.DataFrame(columns=cols)
    del cols
    prcnt_df = pd.concat([prcnt_df, pd.DataFrame.from_dict(data)])
    # Output into individual CSV file
    if not os.path.isfile("prcnts/route_{}_dir_{}_prcnt_data.csv.csv".format(route,dir)):
        prcnt_df.to_csv("prcnts/route_{}_dir_{}_prcnt_data.csv".format(route,dir), index=False)
    else:
        with open("prcnts/route_{}_dir_{}_prcnt_data.csv".format(route,dir), 'a') as f:
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
                    # Calculate the percentage
                    stop_prcnt = (avg_stop_trip_duration/avg_trip_duration)*100

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
            if not track_df[(track_df["Route"] == route) & (track_df["Complete"] == 0)].empty:
                # imports file to DataFrame
                if os.path.isfile("../database_code/route_{}_leavetimes.csv".format(route)):
                    # If file exists load into dataframe
                    leave_df = pd.read_csv("../database_code/route_{}_leavetimes.csv".format(route))
                else:
                    with open('prcnt_log.txt', 'a') as f:
                        f.write("Route {} does not exist\n".format(route))
                    continue
                # Initialise Flag for checks
                complete_1 = False
                complete_2 = False
                # Sort the dataframe by TRIPID, PROGRNUMBER and DAY. The Reason for DAY being included is that
                # Sometimes there a multiple entried of the same TRIPID but on different days
                leave_df = leave_df.sort_values(by=["TRIPID", "PROGRNUMBER", "DAY"], ascending=[True, True, True])
                # Clean the data to obtain a complete route split data for each route
                dir_1_df, dir_2_df = clean_and_sep(leave_df)
                del leave_df
                # Add the start time of each TRIPID journey, used in obtaining the duration into the route for the stop
                dir_1_df = add_trip_start(dir_1_df)
                dir_2_df = add_trip_start(dir_2_df)
                # Add the duration into the route for each stop
                dir_1_df["STOP_TRIP_DURATION"] = dir_1_df["ACTUALTIME_ARR"] - dir_1_df["STARTTRIPTIME"]
                dir_2_df["STOP_TRIP_DURATION"] = dir_2_df["ACTUALTIME_ARR"] - dir_2_df["STARTTRIPTIME"]
                # Build percent data table
                dir_1_dict = build_dict(dir_1_df)
                dir_2_dict = build_dict(dir_2_df)
                # Output the data to csv files
                complete_1 = csv_out(dir_1_dict, route, 1, list(dir_1_df["STOPPOINTID"].unique()))
                complete_2 = csv_out(dir_2_dict, route, 2, list(dir_2_df["STOPPOINTID"].unique()))
                if complete_1 & complete_2:
                    # Update Tracker that model is complete
                    track_df.loc[track_df["Route"] == route, ["Complete"]] = 1
                    with open('prcnt_log.txt', 'a') as f:
                        f.write("Percent Table complete for Route {}\n\n".format(route))

    except Exception as e:
        with open('prcnt_log.txt', 'a') as f:
            f.write("Error: {} \n".format(e))
    finally:
        # output the tracker information
        track_df.to_csv("prcnt_tracker.csv", index=False)


if __name__ == '__main__':
    main()
