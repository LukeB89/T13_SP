import psycopg2
from configparser import ConfigParser
import pandas as pd
import os
import numpy as np

# Read DataBase info from the config file
# Store in variables for use when making SQL Query's

config = ConfigParser()
config.read("../config.ini")
options = config["DataBase"]
host = options["host"]
passwd = options["passwd"]
user = options["user"]
port = options["port"]
database = options["database"]


def get_tripids(route):
    '''Function to get the Trip IDs for any given route

    Input is the route number output is a list of all of the unique IDs associated with that route'''

    # setup variable
    tripids = []
    # Open a database connection for the PSQL
    with psycopg2.connect(dbname=database, host=host, port=port, user=user, password=passwd) as connection:
        with connection.cursor() as cur:
            # Query to obtain all 'tripid' that are associated with a specified route
            cur.execute("SELECT DISTINCT tripid FROM trips WHERE lineid = '{}';".format(route))
            # stores response as list of tupples
            tripid = cur.fetchall()
    # Appends ids into master list
    for i in range(len(tripid)):
        tripids.append(tripid[i][0])
    # Returns List to function call
    return tripids


def main():
    try:
        # Checks to see if file exists or not
        # Speeds up multiple use of code
        if not os.path.isfile("routes_tripids.csv"):
            # Opens a connection to PSQL server
            with psycopg2.connect(dbname=database, host=host, port=port, user=user, password=passwd) as connection:
                with connection.cursor() as cur:
                    # Obtains all unique route numbers
                    cur.execute("SELECT DISTINCT lineid FROM trips;")
                    routeAll = cur.fetchall()
            # Sets up variables
            routes = []
            tripids = []
            # Cycles through each route making two lists
            for route in routeAll:
                print(route[0])
                # Builds list of routes
                routes.append(route[0])
                # Builds list of IDs associated with that route
                tripids.append(get_tripids(route[0]))
            # Creates dataframe building in routes and trips ids
            route_df = pd.DataFrame()
            route_df['Routes'] = routes
            route_df['TripIds'] = tripids
            # Stores dataframe as csv
            route_df.to_csv("routes_tripids.csv", index=False)
        # If file already exists load file into dataframe
        else:
            route_df = pd.read_csv("routes_tripids.csv")
        # Load master leavetimes file into chunks
        for num, chunk in enumerate(pd.read_csv("~/data/rt_leavetimes_DB_2018.csv", sep=";", chunksize=100000)):
            # Cycles through all routes for each chunk
            for route in route_df['Routes']:
                # if all rows removed from chunk - break loop and move on to next chunk
                if chunk.empty:
                    print("nothing left in chunk")
                    break
                # obtains the list of ids for the current route being examined
                current_ids = list(
                    map(int, route_df.loc[route_df['Routes'] == route, 'TripIds'].iloc[0].strip('[]').split(', ')))
                # Obtains a dataframe of all the rows that contain the ids from the list- True is present in that row,
                # False if not present
                ids_present = chunk['TRIPID'].isin(current_ids)
                print(ids_present.value_counts())
                # Inverts the selection for removal
                remove_ids = np.where(ids_present, False, True)
                print(remove_ids.value_counts())
                # Creates or recreates the route csv file with headers if working with the first chunk
                if num == 0:
                    # Creates the csv file adding rows that contain the correct ids
                    chunk.loc[ids_present].to_csv("route_{}_leavetimes.csv".format(route), index=False)
                    # Removes the rows from the chunk that have already been added to file
                    chunk = chunk[chunk['TRIPID'] == remove_ids]
                # Appends to route cvs file if not the first chunk
                else:
                    # appends csv file
                    chunk.loc[ids_present].to_csv("route_{}_leavetimes.csv".format(route), mode='a', header=False,
                                                  index=False)
                    # Removes the rows from the chunk that have already been added to file
                    chunk = chunk[chunk['TRIPID'] == remove_ids]
            if not chunk.empty:
                print("remaning tripids have no specified route")
                if not os.path.isfile("remaining_ids.csv"):
                    chunk.to_csv("remaining_ids.csv", index=False)
                else:
                    chunk.to_csv("remaining_ids.csv", mode='a', header=False, index=False)


    except psycopg2.Error as error:
        print("Error while connecting to PSQL: ", error)
    except Exception as errorE:
        print("Generic Error: ", errorE)


if __name__ == '__main__':
    main()
