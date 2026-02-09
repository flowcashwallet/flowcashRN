# Estructura del Proyecto Backend (Django)

Este documento proporciona una visión técnica general de la arquitectura y estructura del backend para desarrolladores. El proyecto está construido con **Django 4.2+** y **Django REST Framework (DRF)**.

## 1. Visión General

El backend sirve como una API RESTful que gestiona la autenticación, transacciones financieras, presupuestos y sincronización de datos para la aplicación móvil.

- **Framework**: Django REST Framework.
- **Autenticación**: JWT (JSON Web Tokens) vía `djangorestframework-simplejwt`.
- **Base de Datos**: PostgreSQL (Producción) / SQLite (Desarrollo).
- **Despliegue**: Configurado para ser agnóstico (Render, Heroku, Vercel, Digital Ocean).

---

## 2. Estructura de Directorios

### 📂 `config/` (Project Root)

Configuración central del proyecto Django.

- **`settings.py`**:
  - Configuración de entorno (`dotenv`).
  - Base de datos dinámica (`dj_database_url`): SQLite local, Postgres en prod.
  - CORS y Hosts permitidos (`ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`).
  - Apps instaladas: `users`, `wallet`, `rest_framework`, `corsheaders`, `admin_auto_filters`.
- **`urls.py`**: Enrutador principal. Incluye las rutas de `users` y `wallet`.

### 📂 `users/` (App: Gestión de Usuarios)

Maneja el registro, login y perfiles de usuario.

- **`models.py`**: Extensión del modelo de usuario (si aplica) o uso del `User` por defecto de Django.
- **`views.py`**:
  - Endpoints para registro (`/register/`).
  - Endpoints para obtener perfil (`/me/`).
- **`serializers.py`**: Serialización de datos de usuario.
- **`management/commands/create_admin.py`**: Comando personalizado para crear superusuario automáticamente en despliegue (basado en variables de entorno).

### 📂 `wallet/` (App: Lógica de Negocio)

El núcleo de la aplicación financiera. Contiene toda la lógica de transacciones y presupuestos.

- **`models.py`**:
  - `Transaction`: Ingresos, gastos, transferencias.
  - `Category`: Categorías personalizadas por usuario.
  - `Budget`: Presupuesto mensual (ingresos vs gastos fijos).
  - `FixedExpense`: Gastos recurrentes asociados al presupuesto.
  - `Subscription`: Suscripciones recurrentes.
  - `VisionEntity`: Metas financieras (Ahorros, Deudas).
  - `GamificationStats`: Estadísticas de usuario (rachas).
- **`serializers.py`**: Transformación de datos y validaciones complejas.
- **`views.py`**: ViewSets protegidos (`IsAuthenticated`) para CRUD de cada modelo.
- **`admin.py`**:
  - Personalización del panel de administración.
  - Uso de `django-admin-autocomplete-filter` para búsquedas eficientes de usuarios en dropdowns.
- **`management/commands/migrate_firebase.py`**: Script crítico para migración de datos legacy desde Firebase a PostgreSQL.

### 📂 Archivos de Raíz y Despliegue

- **`manage.py`**: CLI de Django.
- **`requirements.txt`**: Dependencias de Python.
- **`vercel.json`**: Configuración para despliegue Serverless en Vercel.
- **`Procfile`**: Configuración de procesos para Heroku/Render (`web` y `release`).
- **`runtime.txt`**: Versión de Python para Heroku.
- **`build.sh`**: Script de construcción genérico (instalar deps, migrar, colectar estáticos).
- **`start.sh`**: Script de inicio para contenedores (ejecuta migraciones + gunicorn).

---

## 3. Patrones y Decisiones Técnicas

### Autenticación y Seguridad

- Se utiliza **JWT** (Access + Refresh Tokens).
- Todos los endpoints de `wallet/` requieren `IsAuthenticated`.
- Los datos se filtran automáticamente por el usuario autenticado (`get_queryset` filtra por `self.request.user`).

### Base de Datos

- **Desarrollo**: `db.sqlite3` (no se sube al repo).
- **Producción**: Conexión vía `DATABASE_URL`.
- **Migraciones**: Se gestionan con `python manage.py makemigrations` y `migrate`.

### Admin Panel

- Se ha optimizado para manejar múltiples usuarios.
- Filtros de autocompletado para evitar cargar listas gigantes de usuarios en los selectores.

### Migración de Datos (Legacy)

- Existe un script idempotente (`migrate_firebase.py`) que conecta con Firebase Admin SDK y mueve los datos a PostgreSQL, manteniendo las relaciones y saneando fechas.

## 4. Comandos Útiles para el Desarrollador

```bash
# Iniciar entorno virtual
source venv/bin/activate

# Correr servidor local
python manage.py runserver

# Crear nuevas migraciones (después de editar models.py)
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario local
python manage.py createsuperuser

# Correr script de migración Firebase (requiere credenciales)
python manage.py migrate_firebase
```
