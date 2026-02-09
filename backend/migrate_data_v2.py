import os
import subprocess
import shutil
import sys
import time

def install_tools():
    """Intenta instalar las herramientas usando Homebrew."""
    print("🛠️  Intentando instalar PostgreSQL Client Tools vía Homebrew...")
    if not shutil.which("brew"):
        print("❌ No se encontró 'brew'.")
        return False
    try:
        subprocess.run(["brew", "install", "libpq"], check=True)
        subprocess.run(["brew", "link", "--force", "libpq"], check=True)
        return True
    except:
        return False

def check_tools():
    if not shutil.which("pg_dump") or not shutil.which("psql"):
        print("⚠️  Faltan herramientas. Intentando instalar...")
        if not install_tools():
            print("❌ Error: Necesitas instalar 'postgresql' o 'libpq'.")
            return False
    return True

def main():
    print("--- 🐘 Migración Segura (Dump to File -> Restore) ---")
    print("Este método descarga los datos a un archivo primero para verificar que no esté vacío.\n")
    
    if not check_tools():
        return

    # 1. Solicitar URLs
    source_url = input("Pegue la URL de ORIGEN (Render): ").strip()
    if not source_url: return

    dest_url = input("Pegue la URL de DESTINO (Supabase): ").strip()
    if not dest_url: return

    # Nombre del archivo temporal
    dump_file = "temp_render_dump.sql"

    print(f"\n⬇️  [Paso 1/2] Descargando datos de Render a '{dump_file}'...")
    
    try:
        # Usamos Popen para capturar stderr en tiempo real si fuera necesario, 
        # pero run es más simple para esperar
        with open(dump_file, "w") as f:
            # Añadimos --verbose para ver qué pasa
            process = subprocess.run(
                [
                    "pg_dump", 
                    source_url, 
                    "--no-owner", 
                    "--no-acl", 
                    "--data-only",
                    "--exclude-table=django_migrations",
                    "--exclude-table=auth_permission",
                    "--exclude-table=django_content_type"
                ],
                stdout=f,
                stderr=subprocess.PIPE,
                text=True
            )
        
        # Verificar errores
        if process.returncode != 0:
            print("\n❌ Error al descargar los datos:")
            print(process.stderr)
            return

        # Verificar tamaño del archivo
        file_size = os.path.getsize(dump_file)
        print(f"✅ Descarga completada. Tamaño del archivo: {file_size} bytes")
        
        if file_size < 100: # Un dump vacío o casi vacío
            print("⚠️  ALERTA: El archivo es demasiado pequeño.")
            print("Posiblemente la URL de origen no tiene tablas o falló la conexión silenciosamente.")
            print("Revisa el contenido del archivo:")
            os.system(f"head -n 5 {dump_file}")
            print("...")
            confirm = input("\n¿Quieres intentar subirlo de todas formas? (s/n): ")
            if confirm.lower() != 's':
                return

    except Exception as e:
        print(f"\n❌ Error ejecutando pg_dump: {e}")
        return

    print(f"\n⬆️  [Paso 2/2] Subiendo datos a Supabase...")
    
    try:
        # Usamos < para redirigir el archivo a psql
        # subprocess.run no soporta redirección de archivo de entrada directa como shell '<'
        # así que abrimos el archivo y lo pasamos a stdin
        with open(dump_file, "r") as f:
            process = subprocess.run(
                ["psql", dest_url],
                stdin=f,
                stderr=subprocess.PIPE,
                stdout=subprocess.PIPE, # Capturar output para no llenar la pantalla si hay mucho
                text=True
            )
            
        if process.returncode == 0:
            print("\n✅ ¡Restauración EXITOSA!")
            print(process.stdout[-200:]) # Mostrar últimas líneas
        else:
            print("\n❌ Error al subir datos:")
            print(process.stderr)
            
    except Exception as e:
        print(f"\n❌ Error ejecutando psql: {e}")

    # Limpieza
    if os.path.exists(dump_file):
        print(f"\n🧹 Eliminando archivo temporal '{dump_file}'...")
        os.remove(dump_file)

if __name__ == "__main__":
    main()
