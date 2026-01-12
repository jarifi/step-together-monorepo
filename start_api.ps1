# Move to the project directory
Set-Location "C:\Users\PC\python-projekte\step_together_api"

# Activate the virtual environment
# We use the call operator (&) to run the script
& ".\venv\Scripts\Activate.ps1"

# Start the Uvicorn server
uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload