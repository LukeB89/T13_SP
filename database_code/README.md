# Understanding Data
As the given dataset was very huge, we started accessing the dataset using PostGreSQl DBMS, but as its better to work with CSVs in Python, we split the entire dataset into CSVs based on lineid. This directory has two files:
1. split_DB.py fetches unique tripid's and then seperates it based on the lineid, this data is then stored in a csv.
2. verify.py checks for correctness of the tripid information.
3. forecastWeatherScrapper.py connects to the PostGreSQl database and the calls the OpenWeather API and copies the data to the database.
