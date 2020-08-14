# Dublin Bus Journey Planner
Summer Project for Team 13
<br> Application for predicting travel time for Dublin Bus. This app is live at https://ipa-001.ucd.ie/
## Problem
Most of the people living in Dublin rely on Dublin Bus as their main mode of transport. The current predictions of Dublin Bus are not quite accurate, which makes it difficult for people to make travel decisions.
## Solution
We tried to predict the travel time using several Machine Learning models and then we compared the evaluation metrics for these models. Later, we decided to make use of <b>Random Forest Regression</b> as it gave the best results and also consumed less time when compared to other models.
<br> The project is divided into 3 parts:
1. Front-end
For front-end we have used ReactJS. You can get all the information about front-end from client directory.
2. Back-end
Django is used in the back-end. The application is hosted on apache server. The details about this can be found in the client directory.
3. Machine Learning
Please refer to database_code and model directory to know about the data cleaning, model that was used and the evaluation metrics.