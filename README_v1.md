1. download and install the latest python version
   - https://www.python.org/downloads/

2. download and install git to clone the project
   - https://git-scm.com/downloads/win
     choose "Git for Windows/x64 Setup."

3. download and install Visual Studio Code (if you don't have one already)
   - https://code.visualstudio.com/docs/?dv=win64user

4. install/create a github account (if you don't have one)
   copy the following url for our project:
   - https://github.com/jarifi/step_together_api

   click on the "Code" button and copy the following HTTPS:
   - https://github.com/jarifi/step_together_api.git

     4.1 open a new Window in Visual Studio Code and click on "Clone Git Repository" and paste the HTTPS - Select a Repository

5. download and install the mariaDB server
   - use heidiSQL for administration
     (if you don't have it, download that aswell: https://www.heidisql.com/download.php)
   - then go into folder app -> db -> and copy/execute the file called step-together-api.sql

6. Go to extensions in VSC and download "REST Client" by Huachao Mao to test on rest_client.http

- Send there a Request (= Send Request) to see if you'll get a response

7. open a new terminal and write/copy these following steps:
   1. py -m venv venv
   2. (Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)
   3. .\venv\Scripts\Activate.ps1
   4. pip install -r requirements.txt
      (use these steps just for once then follow number 5.)

   Later, when you need to start the project again, you can do so using just the following steps:
   1. (Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)
   2. .\venv\Scripts\Activate.ps1
      (then follow number 5.)

   and then open the project (if you want to start the project with VSC) with: 5. uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload

# Remote Server

cd /srv/step_together_api/

# Run, stop and check staus as Service

sudo systemctl stop step_together_api.service
sudo systemctl status step_together_api.service
sudo systemctl start step_together_api.service

# Update Database

`mysql -u dein_nutzername -p deine_datenbank < dateiname.sql`

oder

```
mysql -u root -p
USE deine_datenbank;
source /pfad/zu/deiner/dateiname.sql;
```

# Run as App bindid on console for debuging

cd /srv/step_together_api/
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 3000

# run on windwos dev mode

$env:ENVIRONMENT="development"; uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload