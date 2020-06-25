import os
import pandas as pd


def verify_ids():
    with open("log.txt", "w") as f:
        f.write("Verifiable Line Information\n")
        route_df = pd.read_csv("routes_tripids.csv")
        for route in route_df['Routes']:
            current_ids = list(
                map(int, route_df.loc[route_df['Routes'] == route, 'TripIds'].iloc[0].strip('[]').split(', ')))
            routex = []
            for tripid in current_ids:
                cur.execute("SELECT DISTINCT lineid FROM trips WHERE tripid = '{}';".format(tripid))
                rout = cur.fetchall()
                for r in rout:
                    if r[0] not in routex:
                        routex.append(r[0])
            string = "Input line: {}, Lines with IDs association: ".format(route)
            for r in routex:
                string += r + ", "
            f.write(string + "\n")


if __name__ == '__main__':
    verify_ids()
