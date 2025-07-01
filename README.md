1.  **Virtuelle Umgebung erstellen und aktivieren, sowie Abhängigkeiten installieren:**

    ```
    python -m venv venv
    ```

    ```

    ```

    ```
    .\venv\Scripts\Activate.ps1
    ```

    ```
    pip install -r requirements.txt
    ```

2.  **Datenbank erstellen:**
    Mariadb Server installieren und Datenbank step_together_api erstellen falls nicht vorhanden oder
    -Optional(Benutze step-together.sql im Ordner app/db um die Testdaten zu seeden oder mach mit Step 3 weiter

## Nutzung

3.  **Installiere Rest Client Plugin um die test.http zu verwenden:**

## Starten

4.  - **Option 4.1: Direkt mit Uvicorn im Terminal (z.B. in VS Code)**
    ```bash
    uvicorn app.main:app --reload
    ```
5.  **Verfügbare Endpoints mit test.http testen:**
    - Öffne die Datei test.http und finde Test2 und klick Send Request

- **Verfügbare Basis-Endpunkte:**
  - `http://127.0.0.1:8000/users`
  - `http://127.0.0.1:8000/teams`
  - `http://127.0.0.1:8000/team_members`
  - `http://127.0.0.1:8000/challenges`
  - `http://127.0.0.1:8000/challenge_progresses`
  - `http://127.0.0.1:8000/schritt_logs`
    SECRET_KEY="your-super-secret-and-secure-key"
    ACCESS_TOKEN_EXPIRE_MINUTES=30
