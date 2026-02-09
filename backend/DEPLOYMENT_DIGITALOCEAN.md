# Guía de Despliegue en Digital Ocean App Platform y Migración de Datos

Esta guía explica cómo desplegar el backend Django en Digital Ocean (DO) App Platform y cómo migrar tus datos desde Render.

## 1. Despliegue en Digital Ocean App Platform

DO App Platform es muy similar a Heroku y Render. Detectará automáticamente tu código Python.

### Prerrequisitos
*   Cuenta en Digital Ocean.
*   Repositorio de GitHub conectado.

### Pasos de Despliegue

1.  **Crear App:**
    *   Ve a "Apps" en el dashboard de DO.
    *   Click "Create App".
    *   Selecciona "GitHub" y tu repositorio.

2.  **Configuración de Recursos (Resources):**
    *   DO detectará el servicio Web.
    *   **Run Command:** `gunicorn config.wsgi:application` (o déjalo en blanco si detecta el `Procfile` correctamente).
    *   **HTTP Port:** 8000.

3.  **Variables de Entorno (Environment Variables):**
    Agrega las siguientes variables en la configuración del componente o a nivel global de la App:

    *   `SECRET_KEY`: "tu_secret_key_segura"
    *   `DEBUG`: "False"
    *   `DJANGO_SUPERUSER_USERNAME`: "admin"
    *   `DJANGO_SUPERUSER_PASSWORD`: "password_seguro"
    *   `DJANGO_SUPERUSER_EMAIL`: "admin@example.com"
    *   `FIREBASE_CREDENTIALS`: '...' (El contenido JSON completo de tu service account).
    *   `ALLOWED_HOSTS`: "nombre-de-tu-app.ondigitalocean.app"
    *   `CSRF_TRUSTED_ORIGINS`: "https://nombre-de-tu-app.ondigitalocean.app"

4.  **Base de Datos (Database):**
    *   En la configuración de la App, haz click en "Add Resource" -> "Database".
    *   Selecciona "Dev Database" (más barato para pruebas) o "Managed PostgreSQL".
    *   DO inyectará automáticamente la variable `DATABASE_URL` a tu aplicación. Tu código ya está listo para leerla (`dj_database_url`).

5.  **Build & Deploy:**
    *   Guarda y lanza el despliegue.
    *   DO ejecutará `pip install -r requirements.txt`.
    *   Nota: Para correr migraciones automáticamente, puedes agregar un "Job" post-deploy en la configuración de la App, con el comando: `python manage.py migrate`. O usar la consola (ver abajo).

### Acceso a Consola (SSH)
Una vez desplegado, puedes entrar a la pestaña "Console" de tu componente web para correr comandos puntuales:

```bash
python manage.py migrate
python manage.py create_admin
```

---

## 2. Migración de Base de Datos (Render -> Digital Ocean)

### Paso 1: Exportar datos de Render
Igual que en la guía de Heroku, exporta tus datos:

```bash
pg_dump "postgres://user:pass@host_render:port/db_name" --no-owner --no-acl -f backup_render.dump
```

### Paso 2: Importar datos a Digital Ocean

Necesitas la "Connection String" de tu base de datos en Digital Ocean.
1.  Ve a la pestaña "Settings" de tu Base de Datos en DO.
2.  Busca "Connection Details" -> "Public Network".
3.  Copia la "Connection String" (se ve como `postgresql://doadmin:pass@host:port/defaultdb?sslmode=require`).

**Importante:** Las bases de datos gestionadas de DO requieren SSL (`sslmode=require`).

Ejecuta el comando de restauración localmente:

```bash
psql "postgresql://doadmin:pass@host_do:port/defaultdb?sslmode=require" < backup_render.dump
```

*Nota: Es posible que necesites instalar el certificado CA de Digital Ocean si tienes problemas de SSL estricto, pero `sslmode=require` suele ser suficiente para `psql`.*

### Alternativa: Copia Directa (Pipe)

```bash
pg_dump "URL_RENDER" --no-owner --no-acl | psql "URL_DIGITAL_OCEAN"
```

---

## Diferencias Clave con Heroku
*   **Archivos Estáticos:** DO App Platform puede servir archivos estáticos si configuras un componente "Static Site", pero como ya usamos `Whitenoise` en Django, funcionará bien dentro del mismo contenedor web sin configuración extra.
*   **CSRF:** Es crítico configurar `CSRF_TRUSTED_ORIGINS` con la URL HTTPS de tu app en DO, ya que el balanceador de carga termina SSL.
