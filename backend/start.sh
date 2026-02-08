#!/usr/bin/env bash
# exit on error
set -o errexit

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario si las variables de entorno están definidas
python manage.py create_admin

# Iniciar servidor Gunicorn
gunicorn config.wsgi:application
