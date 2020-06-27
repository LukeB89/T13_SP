import psycopg2
from sshtunnel import SSHTunnelForwarder
from configparser import ConfigParser

# read DataBase & VM info from the config file
config = ConfigParser()
config.read("config.ini")
options = config["DataBase"]
host = options["host"]
passwd = options["passwd"]
user = options["user"]
port = options["port"]
database = options["database"]
ip = options["ip"]
ssh = options["ssh"]

try:
    # Create an SSH tunnel
    tunnel = SSHTunnelForwarder(
        (ip, 22),
        ssh_username=user,
        ssh_password=ssh,
        remote_bind_address=(host, 5432),
        local_bind_address=(host, 6543),  # could be any available port
    )
    # Start the tunnel
    tunnel.start()
    # Create a database connection
    conn = psycopg2.connect(
        database=database,
        user=user,
        password=passwd,
        host=tunnel.local_bind_host,
        port=tunnel.local_bind_port,
    )
    # Get a database cursor
    cur = conn.cursor()
    # Execute SQL
    cur.execute("SELECT version();")
    # Get the result
    record = cur.fetchone()
    print("You are connected to - ", record, "\n")

except (Exception, psycopg2.Error) as error:
    print("Error while connecting to PSQL: ", error)

finally:
    if conn:
        # Close connections
        conn.close()
        # Stop the tunnel
        tunnel.stop()
        print("PSQL Closed")
