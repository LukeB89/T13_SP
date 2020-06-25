import os
import pandas as pd
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
        f.write("Verifiable Line Information\n")
        # Read in dataframe of route - tripids
        route_df = pd.read_csv("routes_tripids.csv")
        # Cycle through each available route
        for route in route_df['Routes']:
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
            string = "Input line: {}, Route IDs all in Rout CSV: {} Lines with IDs association: ".format(route, all_ids_present)
            for r in routex:
                string += r + ", "
            # Writes to log file
            f.write(string + "\n")


if __name__ == '__main__':
    verify_ids()
