#!/bin/bash

# Wait for the MySQL database to be ready
while ! nc -z db 3306; do   
  sleep 0.3
done

# Start the Flask application in the background
/app/.venv/bin/python /app/app.py &

# Start the Django application in the foreground
exec /app/.venv/bin/python /app/droid7/manage.py runserver 0.0.0.0:8443
