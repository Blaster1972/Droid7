import sys
import os

# Activate your virtual environment
activate_this = os.path.join(os.path.dirname(__file__), '.venv', 'Scripts', 'activate_this.py')
exec(open(activate_this).read(), dict(__file__=activate_this))

# Set the path to your application
sys.path.append(os.path.join(os.path.dirname(__file__), 'droid7'))

from django.core.wsgi import get_wsgi_application

# Set the default settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'droid7.settings')

# Create the WSGI application
application = get_wsgi_application()
