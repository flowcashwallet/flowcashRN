# Guía de Despliegue (Deployment) - Backend Django

Este proyecto está configurado para ser desplegado fácilmente en plataformas como **Render**, **Railway** o **Heroku**. A continuación se detallan los pasos para desplegar en **Render (Opción recomendada/gratuita)**.

## Requisitos Previos

El proyecto ya cuenta con la configuración necesaria:
- `requirements.txt`: Lista de dependencias (incluye `gunicorn` y `psycopg2`).
- `config/settings.py`: Configurado para leer variables de entorno y servir archivos estáticos con `Whitenoise`.
- `build.sh`: Script para instalar dependencias y ejecutar migraciones automáticamente.

## Pasos para Desplegar en Render.com

1.  **Crear cuenta**: Ve a [render.com](https://render.com/) y crea una cuenta (puedes usar GitHub/GitLab).
2.  **Nuevo Web Service**:
    - Haz clic en "New +" y selecciona "Web Service".
    - Conecta tu repositorio de GitHub/GitLab donde está este código.
3.  **Configuración del Servicio**:
    - **Name**: Elige un nombre (ej. `mi-wallet-backend`).
    - **Root Directory**: `backend` (IMPORTANTE: Indica que el proyecto está en la carpeta backend).
    - **Environment**: `Python 3`.
    - **Build Command**: `./build.sh` (Esto ejecutará el script que instala dependencias y migra la BD).
    - **Start Command**: `gunicorn config.wsgi:application`
4.  **Variables de Entorno (Environment Variables)**:
    Agrega las siguientes variables en la sección "Environment":
    - `PYTHON_VERSION`: `3.9.6` (o la versión que uses).
    - `SECRET_KEY`: Genera una clave segura (puedes usar un generador online).
    - `DEBUG`: `False` (Opcional, por defecto es False en Render si no se define).
    - `WEB_CONCURRENCY`: `4` (Recomendado para Gunicorn).
5.  **Crear Servicio**: Haz clic en "Create Web Service".

Render detectará automáticamente el archivo `requirements.txt` en la carpeta `backend`, instalará todo, y ejecutará el `build.sh`.

## Base de Datos (PostgreSQL)

Por defecto, Django usará SQLite si no se configura otra BD. SQLite funciona en Render pero **se perderán los datos cada vez que se reinicie el servidor** (porque el sistema de archivos es efímero). Para producción, necesitas una base de datos real.

1.  En el Dashboard de Render, crea un "New + -> PostgreSQL".
2.  Ponle un nombre (ej. `wallet-db`).
3.  Copia la **Internal Database URL** (si despliegas el backend en la misma cuenta de Render) o **External Database URL**.
4.  Ve a tu Web Service (el backend) -> Environment.
5.  Agrega la variable `DATABASE_URL` y pega la URL de la base de datos.
    - El proyecto ya está configurado (`dj-database-url`) para usar esta variable automáticamente.

## Probar la API

Una vez desplegado, Render te dará una URL (ej. `https://mi-wallet-backend.onrender.com`).

- **Admin**: `https://mi-wallet-backend.onrender.com/admin/`
- **Login**: `https://mi-wallet-backend.onrender.com/api/token/`
- **Transacciones**: `https://mi-wallet-backend.onrender.com/api/wallet/transactions/`

## Siguientes Pasos (Frontend)

Una vez tengas la URL del backend desplegado:
1.  Actualizaremos las llamadas a la API en la app móvil.
2.  Cambiaremos la lógica de Firebase por llamadas `fetch` o `axios` a estos endpoints.
