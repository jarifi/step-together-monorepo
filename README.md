1.  **Virtuelle Umgebung erstellen und aktivieren, sowie Abhängigkeiten installieren:**
    ```
    python -m venv venv
    ```
    ```
    (Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)
    ```
    ```
    .\venv\Scripts\Activate.ps1
    ```
    ```
    pip install -r requirements.txt
    ```
2.  **Datenbank erstellen:**
    Mariadb Server installieren und Datenbank step_together erstellen falls nicht vorhanden
    -Optional(Benutze step-together.sql um die Testdaten zu seeden oder mach mit Step 4 weiter

    - **Option 2: Direkt mit Uvicorn im Terminal (z.B. in VS Code)**
      ```bash
      uvicorn app.main:app --reload
      ```

## Nutzung

- **API-Dokumentation (Swagger UI):**
- **Verfügbare Basis-Endpunkte:**
  - `http://127.0.0.1:8000/users`
  - `http://127.0.0.1:8000/teams`
  - `http://127.0.0.1:8000/team_members`
  - `http://127.0.0.1:8000/challenges`
  - `http://127.0.0.1:8000/challenge_progresses`
  - `http://127.0.0.1:8000/schritt_logs`

SECRET_KEY="your-super-secret-and-secure-key"
ACCESS_TOKEN_EXPIRE_MINUTES=30
