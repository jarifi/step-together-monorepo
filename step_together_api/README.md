# STARTING THE PROJECT

1. Download and install the latest python version
   - https://www.python.org/downloads/

2. Download and install git to clone the project
   - https://git-scm.com/downloads/win
     choose "Git for Windows/x64 Setup."

3. Download and install Visual Studio Code (if you don't have one already)
   - https://code.visualstudio.com/docs/?dv=win64user

4. Install/create a github account (if you don't have one) and open our project in Github:
   - Click on the "<> Code" button there and copy the HTTPS provided.

   - Open a new Window in Visual Studio Code and click on "Clone Git Repository" and paste the HTTPS - Select a Repository

5. Download and install the mariaDB server
   - Use heidiSQL for administration
     (if you don't have it, download that aswell: https://www.heidisql.com/download.php)
   - Then copy/execute the file called db.sql

6. Go to extensions in VSC and download "REST Client" by Huachao Mao to test on rest_client.http

- Send there a Request (= Send Request) to see if you'll get a response

7. Open a new terminal and write/copy these following commands:<br>
   _Note: it is necessary to follow these steps only when trying to start the project for the first time!_<br>
   _If this isn't the first time you are starting the project, jump to step 8 instead._
   1. `py -m venv venv OR py -m venv venv`
   2. `(Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)`
   3. `.\venv\Scripts\Activate.ps1`
   4. `pip install -r requirements.txt`
   5. `$env:ENVIRONMENT="development"; uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload`
      - this will run the project on windows dev mode

8. If you are starting the project for a second time, run these commands in the following order:
   1. `(Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)`
   2. `.\venv\Scripts\Activate.ps1`
   3. `$env:ENVIRONMENT="development"; uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload`
      - this will run the project on windows dev mode

<br>

# SERVER & DATABASE

### Remote Server

`cd /srv/step_together_api/`

### Run, stop and check status as Service

- Stop:<br>
  `sudo systemctl stop step_together_api.service`
- Check status:<br>
  `sudo systemctl status step_together_api.service`
- Run:<br>
  `sudo systemctl start step_together_api.service`

## Update Backend

1. Log into the Server and stop it with `sudo systemctl stop step_together_api.service`

2. Open WinSCP and delete all folders **except** `media` and `db`

3. Upload all folders from your local machine, **excluding** `media` and `db`

4. Then start the Server again with `sudo systemctl start step_together_api.service`

## Update Database

`mysql -u dein_nutzername -p deine_datenbank < dateiname.sql`

or

```
mysql -u root -p
USE deine_datenbank;
source /pfad/zu/deiner/dateiname.sql;
```

<br>

# TESTING

### UNIT Tests

_Note: make sure the project isn't running when testing!_<br>

#### Test individual test

pytest tests/api/v1/endpoints/test_endpoint_name.py

**Example:**<br>
`pytest tests/api/v1/endpoints/test_auth.py`<br>
`pytest tests/api/v1/endpoints/test_challenges.py`

#### Test everything

`pytest`

### rest_client.http

1. Open the rest_client.http file
2. To start a test, simply click the "Send Request" line above the specific test
3. Most tests will require you to first run the /auth/login test specifically

#### Send Request using keyboard

In case you do not see the "Send Request" line, you can also start a test by clicking on it with a mouse click and then pressing `Ctrl + Alt + R` on your keyboard.

### Run as App binded on console for debuging (only on Test Server)

1. cd /srv/step_together_api/
2. ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 3000
