# React JS and Django
This directory has a React app (**client**) on the front end and a Django app (**server**) that functions as an API for the back end.
## 1. Structure (Local)
- Open a window of the command application, navigate to the **client** directory and run the following commands:
```
touch .env
touch config.ini
```
- Using a text editor such as Vim, open **.env**  and include the following information then save your changes:
```
REACT_APP_GOOGLE_API=<your own Google API key>
REACT_APP_WEATHER_API=<your own OpenWeather API key>
```
- Using a text editor such as Vim, open **config.ini**  and include the following information then save your changes:
```
[WeatherApi]
weather_api = <your own OpenWeather API key>
```

## 2. Setup (Local)
- Navigate to **client/src/components**
- Using a text editor such as Vim, open **ModelApi.js**  and locate the following lines:
```
          //  .get(`/model_result`, {
           .get(`/api/model_result`, {
```
- Paste over those lines with the following:
```
          .get(`/model_result`, {
            // .get(`/api/model_result`, {
```
- In the same file locate the following lines:
```
         //  .get(`/percentile_result`, {
          .get(`/api/percentile_result`, {
```
- Paste over those lines with the following:
```
          .get(`/percentile_result`, {
            // .get(`/api/percentile_result`, {
```
- Now save you changes to the **ModelApi.js** file.
- Using a text editor such as Vim, open **RouteStopsApi.js**  and locate the following lines:
```
            //  .get(`/route_stops`, {
             .get(`/api/route_stops`, {
```
- Paste over those lines with the following:
```
            .get(`/route_stops`, {
              // .get(`/api/route_stops`, {
```
- Now save you changes to the **RouteStopsApi.js** file.
- Using a text editor such as Vim, open **RtpiApi.js**  and locate the following lines:
```
            //  .get(`/rtpi_api`, {
             .get(`/api/rtpi_api`, {
```
- Paste over those lines with the following:
```
            .get(`/rtpi_api`, {
              // .get(`/api/rtpi_api`, {
```
- Now save you changes to the **RtpiApi.js** file.

## 3. Backend End Installation (Local)

- Open a window of the command application, navigate to the **client** directory and run the following commands:
```
python -m venv env
source env/bin/activate
pip3 install -r requirements.txt
```
- This will create and activate for us a virtual environment named env with the required dependencies.
- To start the Django app, navigate into the higher **server** directory, where manage.py is, and run the command:
```
python3 manage.py runserver
```

## 4. Front End Installation (Local)

- Using another command line application, navigate to the **client** directory. The **package.json** file should be here. Run the command:
```
npm install
```
- Then run the command:
```
npm run start
```
- In your web browser, navigate to:
```
127.0.0.1:3000
```
- The application should now be loaded
- Please note that in order to deploy the application to a server, as described below, the steps taken in 2. Setup (Local) will need to be reversed.


## 5. Server Deployment
- If the above step have been run on the server the following must be run to deploy on the server:

- Run the following command:
```
npm run build
```
- This will create a build folder in "client".

- Copy this to the apache2 deployment folder:
```
sudo cp ~/path/to/build/* /var/www/html/
```
- Once this is complete we need to append permissions. Run the following:
```
sudo chown student:www-data ~/path/to/client/
sudo chown student:www-data ~/path/to/client/*
```
- With permissions set we need to set up the apache configuration file so that it will work with django.
```
sudo vim(or nano) /etc/apache2/sites-available/000-default.conf
```
- The file should already exist and have "NameVirtualHost *:80" at the top. To get the site working with geolocation we need to be using SSL. Add the following line under the "*:80":
```
NameVirtualHost *:443
```
- Next copy the "VirtualHost *:80" Block below it and change the name to "*:443". Once this is done we need to redirect all incoming traffic from the 80 port to the 443 port. To do this add the following line under "VirtualHost *:80" - "DocumentRoot"
```
Redirect permanent / https://ipa-001.ucd.ie
```

- Now with that done we need to set up the servers SSL connetion to communicate with Django's back end. To do this go to the end of the "VirtualHost *:443" block and add the following block of code:
```
	<Directory /home/student/T13_SP/client/server/server>
                <Files wsgi.py>
                    Require all granted
                </Files>
        </Directory>
        <Directory /home/student/T13_SP/client>
                Require all granted
        </Directory>
        <Directory /home/student/T13_app/client>
                Order allow,deny
                Allow from all
        </Directory>
        WSGIDaemonProcess server_ssl python-path=/home/student/T13_SP/client/server
        WSGIProcessGroup server_ssl
        WSGIScriptAlias /api /home/student/T13_SP/client/server/server/wsgi.py
        WSGIApplicationGroup %{GLOBAL}

        SSLEngine on
        SSLOptions +StrictRequire
        SSLCertificateFile /etc/ssl/certs/server.crt
        SSLCertificateKeyFile /etc/ssl/private/server.key
```

- Important notes here:
1. In each line I have left in the paths however these paths might be different on your server so change accordingly.
2. server.crt and server.key are necesarry for SSL to work. I wont go into detail on how to generate your own SSL Keys and Certs here however the following tutorial is what I used to get it working: https://www.linux.com/training-tutorials/creating-self-signed-ssl-certificates-apache-linux/
3. Other Tutorials used on setting up the WSGI interface can be found here: https://blog.learningdollars.com/2020/01/16/how-to-host-a-django-api-using-mod-wsgi-serving-a-react-frontend-on-an-apache-server-on/

- Once everything has been set up as above you should be good to go in running the server correctly. Run the following to ensure settings have been loaded correctly:
```
sudo service apache2 restart
```
- Navigate to ipa-001.ucd.ie(or your own server domain name) to see the site up and running.

- Note:
1. Should this not work run the following command to see any errors and fix them accordingly. These are usually permission errors that you will have to manually change the permission for as above but using the path to the file that is missing the permission.
```
sudo cat /var/log/apache2/error.log
```

Any issues please contact: luke.byrne6@ucdconnect.ie