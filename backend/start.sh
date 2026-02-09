#!/usr/bin/env bash
# exit on error
set -o errexit

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario si las variables de entorno están definidas
python manage.py create_admin

# Ejecutar migración de Firebase si las credenciales están presentes
if [ -n "$FIREBASE_CREDENTIALS" ]; then
    echo "Running Firebase Migration..."
    python manage.py migrate_firebase
fi

# Iniciar servidor Gunicorn
gunicorn config.wsgi:application
