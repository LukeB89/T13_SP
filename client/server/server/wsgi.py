"""
WSGI config for server project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/wsgi/
"""

import os
import sys
from django.core.wsgi import get_wsgi_application

sys.path.append('/var/www')
sys.path.append('/var/www/mysite')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

application = get_wsgi_application()
