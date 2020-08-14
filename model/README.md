# Data Cleaning and ML
This directory has files which were used to clean data and make the prediction. The prediction is made for the entire journey and is multiplied by the percentile between two stops.
1. data_prep.py is used to clean the data and add new features which are to be used for prediction.
1. model_buider_tester.py reads csv of the all lineids and then cleans and splits the data. This data is then trained using Random Forest regression Model which is then tested using the evaluation metrics. The models are stored in a pickle file. The evaluation results are stored in single csv file according to the lineid.
2. route_percent_creator.py
Each lineid has two directions, so the percentile data is stored based on the given lineid and direction. First it calculates the entire trip time and then calculates the percentile between two stops.