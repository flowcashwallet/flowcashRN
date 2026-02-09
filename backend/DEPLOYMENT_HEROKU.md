# Guía de Despliegue en Heroku y Migración de Datos

Esta guía explica cómo desplegar el backend Django en Heroku y cómo migrar tus datos desde Render (PostgreSQL) a Heroku (PostgreSQL).

## 1. Despliegue en Heroku

### Prerrequisitos
*   Cuenta en Heroku.
*   Heroku CLI instalado (`brew tap heroku/brew && brew install heroku`).
*   Git instalado.

### Pasos de Despliegue

1.  **Iniciar sesión en Heroku:**
    ```bash
    heroku login
    ```

2.  **Crear la aplicación en Heroku:**
    Desde la carpeta `backend/`:
    ```bash
    heroku create nombre-de-tu-app-wallet
    ```

3.  **Configurar Variables de Entorno:**
    Configura las credenciales y variables necesarias. Asegúrate de tener el contenido de tu archivo JSON de credenciales de Firebase listo (sin saltos de línea es mejor, o en base64 si prefieres, pero Django lo espera como string JSON directo en este proyecto).

    ```bash
    heroku config:set SECRET_KEY="tu_secret_key_segura"
    heroku config:set DJANGO_SUPERUSER_USERNAME="admin"
    heroku config:set DJANGO_SUPERUSER_PASSWORD="password_seguro"
    heroku config:set DJANGO_SUPERUSER_EMAIL="admin@example.com"
    heroku config:set FIREBASE_CREDENTIALS='{ ... contenido de tu json ... }'
    heroku config:set ALLOWED_HOSTS="nombre-de-tu-app-wallet.herokuapp.com"
    ```

4.  **Aprovisionar Base de Datos PostgreSQL:**
    Heroku incluye un plan gratuito/básico (Hobby Dev o Basic) para Postgres.
    ```bash
    heroku addons:create heroku-postgresql:mini
    ```

5.  **Desplegar código:**
    ```bash
    git push heroku main
    # O si estás en una rama diferente:
    git push heroku tu-rama:main
    ```

    *Nota: El archivo `Procfile` incluido se encargará de ejecutar las migraciones (`release:`) y levantar el servidor (`web:`).*

6.  **Verificar Logs:**
    ```bash
    heroku logs --tail
    ```

---

## 2. Migración de Base de Datos (Render -> Heroku)

Si ya tienes datos en Render y quieres moverlos a Heroku, sigue estos pasos.

### Requisitos
*   Tener instaladas las herramientas de cliente de PostgreSQL (`pg_dump` y `psql`).
*   Obtener la **External Database URL** de Render (desde el Dashboard de Render).
*   Obtener la **Database URL** de Heroku.

### Paso 1: Exportar datos de Render (Backup)

Ejecuta este comando en tu terminal local para descargar los datos de Render a un archivo:

```bash
# Reemplaza la URL con la "External Database URL" de tu dashboard en Render
pg_dump "postgres://user:pass@host:port/database_name" --no-owner --no-acl -f backup_render.dump
```

### Paso 2: Importar datos a Heroku

Usa el comando `heroku pg:psql` para restaurar el archivo en tu base de datos de Heroku.

```bash
# Asegúrate de estar en la carpeta donde creaste el backup
heroku pg:psql --app nombre-de-tu-app-wallet < backup_render.dump
```

### Alternativa: Copia Directa (Si tienes buena conexión)

Si prefieres hacerlo directo sin archivo intermedio (pipe):

```bash
pg_dump "postgres://user_render:pass@host:port/db_render" --no-owner --no-acl | heroku pg:psql --app nombre-de-tu-app-wallet
```

### Paso 3: Verificar Migración

Entra a la consola de Heroku para verificar que los usuarios y transacciones están ahí:

```bash
heroku run python manage.py shell
```

```python
from users.models import User
from wallet.models import Transaction
print(User.objects.count())
print(Transaction.objects.count())
```
