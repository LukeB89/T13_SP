import psycopg2
from configparser import ConfigParser

# read DataBase info from the config file
config = ConfigParser()
config.read("config.ini")
options = config["DataBase"]
host = options["host"]
passwd = options["passwd"]
user = options["user"]
port = options["port"]
database = options["database"]

try:
    connection = psycopg2.connect(dbname=database, host=host, port=port, user=user, password=passwd)
    cursor = connection.cursor()
    print(connection.get_dsn_parameters(), "\n")
    cursor.execute("SELECT version();")
    record = cursor.fetchone()
    print("You are connected to - ", record, "\n")
except (Exception, psycopg2.Error) as error:
    print("Error while connecting to PSQL: ", error)
finally:
    if connection:
        cursor.close()
        connection.close()
        print("PSQL Closed")
