import os
import pandas as pd
import psycopg2
from configparser import ConfigParser

config = ConfigParser()
config.read("../config.ini")
options = config["DataBase"]
host = options["host"]
passwd = options["passwd"]
user = options["user"]
port = options["port"]
database = options["database"]

def verify_ids():
    """A multi-purpose funtion for checking the tripid information is sound

        1) Checks all ids that have been segregated against the route they appear in conjunction with
        2) Check segregated leave time files only have those same IDs"""
    # Open and write to a log file
    with open("log.txt", "w") as f:
        print("Starting Verification")
        f.write("Starting Verification\n")
        f.write("Verifiable Line Information\n")
    # Read in dataframe of route - tripids
    route_df = pd.read_csv("routes_tripids.csv")
    # Cycle through each available route
    for route in route_df['Routes']:

        with open("log.txt", "a") as f:
            print("Verifying Route: {}".format(route))
            f.write("Verifying Route: {}\n".format(route))
        # Make a list of all of the ID's that are stored for that route
        current_ids = list(
            map(int, route_df.loc[route_df['Routes'] == route, 'TripIds'].iloc[0].strip('[]').split(', ')))
        # Check if route has been segregated
        if os.path.isfile("route_{}_leavetimes.csv".format(route)):
            # Imports segregated route as dataframe
            check_df = pd.read_csv("route_{}_leavetimes.csv".format(route))
            # Creates a list of unique tripids from dataframe
            check_ids = list(check_df.TRIPID.unique())
            # Compares both list (as sets) to each other to make sure they are the same and sets a flag
            if set(check_ids) == set(current_ids):
                all_ids_present = True
            else:
                all_ids_present = False
        # Ensures flag is set for use if no file exists
        else:
            all_ids_present = False
        routex = []
        # runs through each ID
        for tripid in current_ids:
            # Gets all distinct lineids that use the current trip id
            with psycopg2.connect(dbname=database, host=host, port=port, user=user, password=passwd) as connection:
                with connection.cursor() as cur:
                    cur.execute("SELECT DISTINCT lineid FROM trips WHERE tripid = '{}';".format(tripid))
                    rout = cur.fetchall()
            for r in rout:
                if r[0] not in routex:
                    # Appends non-present rout numbers to the list
                    routex.append(r[0])
        # Sets up informative string to ensure that everything is understood
        with open("log.txt", "a") as f:
            string = "Input line: {}\t".format(route)
            string += "Route IDs all in Rout CSV: {}\t".format(all_ids_present)
            string += "Lines with IDs association: "
            for r in routex:
                string += r + ", "
            # Writes to log file
            f.write(string + "\n\n")

def investigate_further(ids):
    route_df = pd.read_csv("routes_tripids.csv")
    for id in ids:
        oj_list = list(
            map(int, route_df.loc[route_df['Routes'] == id, 'TripIds'].iloc[0].strip('[]').split(', ')))
        check_df = pd.read_csv("route_{}_leavetimes.csv".format(id))
        # Creates a list of unique tripids from dataframe
        new_list = list(check_df.TRIPID.unique())
        print("Length of DB list of TripIds for route {}: {}".format(id, len(oj_list)))
        print("Length of segregated list of TripIds for route {}: {}".format(id, len(new_list)))
        if len(oj_list) > len(new_list):
            for i in range(len(oj_list)):
                if oj_list[i] not in new_list:
                    print("{} is in the DB list of IDs but not in the Segregated List".format(oj_list[i]))
        else:
            for i in range(len(new_list)):
                if new_list[i] not in oj_list:
                    print("{} is in the Segregated list of IDs but not in the DB List".format(new_list[i]))



if __name__ == '__main__':
    print("Options:")
    print("1) Verify")
    print("2) Investigate")
    option = int(input("Choose Option Number: "))
    if option == 1:
        verify_ids()
    elif option == 2:
        num_id = int(input("How many ids to investigate? "))
        ids = []
        for i in range(num_id):
            ids.append(input("Enter ID {}: ".format(i+1)))
        investigate_further(ids)
    else:
        print("Not an option please run again")
