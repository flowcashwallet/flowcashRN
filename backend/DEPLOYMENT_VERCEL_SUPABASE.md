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
- Archivo `build_files.sh` (script de construcción robusto incluido).

### Pasos de Despliegue

1.  **Importar Proyecto en Vercel:**
    - Ve al Dashboard de Vercel -> "Add New..." -> "Project".
    - Importa tu repositorio de GitHub.

2.  **Configuración del Proyecto:**
    - **Root Directory:** Selecciona `backend` (importante porque tu código Django está en esa subcarpeta).
    - **Framework Preset:** Selecciona "Other".

3.  **Variables de Entorno:**
    Agrega las siguientes variables en Vercel:
    - `SECRET_KEY`: "tu_secret_key_segura"
    - `DEBUG`: "False" (o simplemente no la pongas, el código ya la desactiva en Vercel).
    - `DATABASE_URL`: Pegar la URL del **Transaction Pooler** de Supabase (puerto 6543). Asegúrate de reemplazar `[YOUR-PASSWORD]` por tu contraseña real y añadir `?sslmode=require` al final.
    - `ALLOWED_HOSTS`: `.vercel.app` (El código también acepta `*` automáticamente si detecta Vercel).
    - `CSRF_TRUSTED_ORIGINS`: `https://tu-proyecto.vercel.app` (Reemplaza con tu URL real después del primer deploy).
    - `FIREBASE_CREDENTIALS`: '...' (Tu JSON de Firebase en una sola línea).

4.  **Deploy:**
    - Haz click en "Deploy".
    - Vercel usará automáticamente `build_files.sh` para instalar dependencias y recolectar archivos estáticos.

---

## 3. Gestión de Base de Datos y Migraciones

En un entorno Serverless (Vercel), **NO** se pueden correr migraciones (`python manage.py migrate`) durante el despliegue porque el proceso de build es de solo lectura y tiene timeouts estrictos.

Debes correr las migraciones desde tu computadora local apuntando a la base de datos de producción.

### Script Automatizado (Recomendado)

Hemos creado un script para facilitar este proceso:

1.  Abre tu terminal en la carpeta `backend/`.
2.  Ejecuta:
    ```bash
    python run_remote_migrations.py
    ```
3.  Pega tu `DATABASE_URL` de Supabase (con contraseña y puerto 6543) cuando te lo pida.
4.  El script aplicará las migraciones y te ofrecerá crear un superusuario para el Admin.

---

## 4. Solución de Problemas Comunes (Troubleshooting)

### Error 500 en el Admin / Login (CSRF)

Si ves un error 500 o "CSRF Verification Failed" al intentar loguearte:

- **Causa:** Vercel está detrás de un proxy y Django no confía en que la conexión sea HTTPS.
- **Solución (Ya aplicada en código):** Se configuró `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')` en `settings.py` para confiar en los headers de Vercel. Asegúrate de tener `CSRF_TRUSTED_ORIGINS` configurado correctamente.

### Archivos CSS/Estáticos Rotos

Si el panel de administración se ve sin estilos:

- **Causa:** Vercel no encontraba la carpeta estática generada.
- **Solución (Ya aplicada):**
  - `vercel.json` ahora redirige explícitamente `/static/` a la carpeta generada.
  - `build_files.sh` corre `collectstatic` antes del deploy.
  - `settings.py` usa `CompressedStaticFilesStorage` en Vercel para evitar errores de manifiesto faltante.

### Error "Relation does not exist"

- **Causa:** La base de datos está vacía.
- **Solución:** Ejecuta el script `run_remote_migrations.py` explicado arriba.

---

## 5. Migración de Datos (Render -> Supabase)

Si necesitas mover datos existentes, sigue estos pasos para obtener las URLs y ejecutar la migración.

### 1. Obtener las URLs de Conexión

Antes de empezar, necesitas tener a mano las cadenas de conexión de ambas bases de datos.

#### A. URL de Render (`URL_RENDER`)

1. Entra a tu Dashboard en [dashboard.render.com](https://dashboard.render.com).
2. Selecciona tu servicio de **PostgreSQL**.
3. Baja hasta la sección **"Connections"**.
4. Copia la **"External Database URL"**.
   - _Nota:_ Esta URL suele empezar con `postgres://` y terminar en `.render.com`.

#### B. URL de Supabase Directa (`URL_SUPABASE_PUERTO_5432`)

1. Entra a tu proyecto en [supabase.com](https://supabase.com).
2. Haz click en el botón **"Connect"** (arriba a la derecha).
3. Ve a la pestaña **"ORM"** o **"URI"**.
4. Asegúrate de que el **Mode** esté en **Session** (esto es crucial, el puerto debe ser **5432**).
5. Copia la cadena de conexión.
   - _Nota:_ Reemplaza `[YOUR-PASSWORD]` por tu contraseña real.

### 2. Ejecutar la Migración

1.  Ejecuta `run_remote_migrations.py` primero para crear la estructura de tablas vacías en Supabase (si no lo has hecho aún).
2.  Usa `pg_dump` y `psql` desde tu terminal local para copiar los datos:

```bash
# Comando (ejecutar en tu terminal local):
# Reemplaza las URLs por las que obtuviste en el paso anterior.
# ¡Cuidado! Las comillas dobles "" son importantes si la URL tiene caracteres especiales.

pg_dump "tu_url_externa_de_render" \
  --no-owner --no-acl --data-only \
  --exclude-table=django_migrations \
  --exclude-table=auth_permission \
  --exclude-table=django_content_type \
  | psql "tu_url_directa_de_supabase_5432"
```

_Excluimos tablas de permisos y contenido porque Django ya las crea automáticamente al migrar._
