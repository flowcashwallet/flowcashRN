# Guía de Despliegue Híbrido (Vercel + Supabase) y Migración

Esta guía explica cómo desplegar el backend Django en **Vercel** (Serverless) y usar **Supabase** como base de datos PostgreSQL. Esta combinación tiene una capa gratuita muy generosa.

## 1. Configuración de Base de Datos en Supabase

Supabase ofrece una base de datos PostgreSQL completa y gratuita.

1.  **Crear Proyecto:**
    - Ve a [supabase.com](https://supabase.com) y crea una cuenta.
    - Crea un "New Project".
    - Asigna un nombre y una contraseña segura para la base de datos (¡guárdala!).
    - Selecciona una región cercana a tus usuarios (ej. US East).

2.  **Obtener Connection Strings:**
    - Haz click en el botón **"Connect"** en la parte superior del Dashboard.
    - Selecciona la pestaña **"Transaction Pooler"** (o "Transaction" en el menú desplegable de modo).
    - Copia la URL de conexión. Debería usar el puerto `6543`.
    - Para Vercel (serverless), es **CRÍTICO** usar esta URL del Pooler (puerto 6543) y no la directa (5432) para no agotar las conexiones.
    - Formato: `postgres://[db-user].[project-ref]:[password]@[aws-region].pooler.supabase.com:6543/[db-name]?sslmode=require`

---

## 2. Despliegue del Backend en Vercel

Vercel ejecutará Django como funciones serverless.

### Prerrequisitos

- Cuenta en Vercel.
- Repositorio de GitHub conectado.
- Archivo `vercel.json` (ya incluido en el proyecto).

### Pasos de Despliegue

1.  **Importar Proyecto en Vercel:**
    - Ve al Dashboard de Vercel -> "Add New..." -> "Project".
    - Importa tu repositorio de GitHub.

2.  **Configuración del Proyecto:**
    - **Root Directory:** Selecciona `backend` (importante porque tu código Django está en esa subcarpeta).
    - **Framework Preset:** Selecciona "Other".

3.  **Variables de Entorno:**
    Agrega las siguientes variables:
    - `SECRET_KEY`: "tu_secret_key_segura"
    - `DEBUG`: "False"
    - `DATABASE_URL`: Pegar la URL del **Transaction Pooler** de Supabase (puerto 6543). Asegúrate de añadir `?sslmode=require` al final si no lo tiene.

- `ALLOWED_HOSTS`: ".vercel.app"
- `CSRF_TRUSTED_ORIGINS`: "https://tu-proyecto.vercel.app"
  - **Nota:** Si aún no sabes la URL exacta, puedes dejar esto pendiente, hacer el deploy, copiar la URL que te asigne Vercel, agregarla aquí y **Redesplegar**.
- `FIREBASE_CREDENTIALS`: '...' (Tu JSON de Firebase en una sola línea).

4.  **Deploy:**
    - Haz click en "Deploy".
    - Vercel instalará las dependencias y construirá la función.

---

## 3. Migración de Datos (Render -> Supabase)

Vamos a mover tus datos desde Render hacia tu nueva base de datos en Supabase.

### Opción A: Migración Directa (Recomendada)

Esta opción envía los datos directamente de un servidor a otro sin crear archivos locales grandes.

Necesitas:

- URL de conexión de Render (Origen).
- URL de conexión de Supabase (Destino - usa la conexión directa puerto `5432`, NO el pooler para la migración).

```bash
# Comando (ejecutar en tu terminal local):
pg_dump "URL_RENDER" --no-owner --no-acl --data-only --exclude-table=django_migrations | psql "URL_SUPABASE_PUERTO_5432"
```

_Nota: Usamos `--data-only` y `--exclude-table=django_migrations` porque es mejor correr primero las migraciones de Django (estructura) y luego importar solo los datos._

### Pasos Detallados de Migración:

1.  **Aplicar Estructura (Schema) en Supabase:**
    Como Vercel es serverless, correr migraciones ahí es difícil (timeout). Hazlo desde tu máquina local conectándote a Supabase:

    ```bash
    # En tu terminal local, carpeta backend/
    # Configura temporalmente la URL de Supabase como variable de entorno local
    export DATABASE_URL="URL_SUPABASE_PUERTO_5432"

    # Ejecuta las migraciones para crear las tablas vacías
    python manage.py migrate

    # Crea el superusuario
    python manage.py create_admin
    ```

2.  **Copiar los Datos:**
    Ahora que las tablas existen, importa los datos desde Render.

    ```bash
    pg_dump "URL_RENDER" --no-owner --no-acl --data-only --exclude-table=django_migrations --exclude-table=auth_permission --exclude-table=django_content_type | psql "URL_SUPABASE_PUERTO_5432"
    ```

    _Excluimos `auth_permission` y `django_content_type` porque `migrate` ya los generó y suelen causar conflictos de duplicados._

---

## Limitaciones y Consideraciones de Vercel (Serverless)

- **Cold Starts:** La primera petición después de un tiempo de inactividad puede tardar unos segundos mientras la función "despierta".
- **Timeouts:** Las peticiones no pueden durar más de 10 segundos (Plan Hobby). Tareas largas (como reportes pesados) pueden fallar.
- **Base de Datos:** Siempre usa el **Connection Pooler** (puerto 6543) en la variable `DATABASE_URL` de Vercel, o tendrás errores de "too many clients".
- **Archivos Estáticos:** Vercel sirve archivos estáticos automáticamente si están en la carpeta correcta, pero Django con Whitenoise funciona bien.
