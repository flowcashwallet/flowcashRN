import os
import subprocess
import shutil
import sys

def install_tools():
    """Intenta instalar las herramientas usando Homebrew."""
    print("🛠️  Intentando instalar PostgreSQL Client Tools vía Homebrew...")
    
    # Verificar si tenemos brew
    if not shutil.which("brew"):
        print("❌ No se encontró 'brew' (Homebrew).")
        print("Por favor instala Homebrew primero o instala Postgres manualmente.")
        return False

    try:
        # Intentar instalar libpq (cliente liviano)
        print("Ejecutando: brew install libpq")
        subprocess.run(["brew", "install", "libpq"], check=True)
        
        # Linkearlo para que esté en el PATH
        print("Ejecutando: brew link --force libpq")
        subprocess.run(["brew", "link", "--force", "libpq"], check=True)
        
        return True
    except subprocess.CalledProcessError:
        print("⚠️  Falló la instalación de libpq. Intentando con postgresql completo...")
        try:
            subprocess.run(["brew", "install", "postgresql"], check=True)
            return True
        except subprocess.CalledProcessError:
            print("❌ Falló la instalación automática.")
            return False

def check_tools():
    """Verifica que pg_dump y psql estén instalados."""
    missing = []
    if not shutil.which("pg_dump"):
        missing.append("pg_dump")
    if not shutil.which("psql"):
        missing.append("psql")
    
    if missing:
        print(f"⚠️  Faltan herramientas necesarias: {', '.join(missing)}")
        if install_tools():
             # Verificar de nuevo
            if shutil.which("pg_dump") and shutil.which("psql"):
                print("✅ Herramientas instaladas correctamente.")
                return True
        
        print("❌ No se pudieron instalar las herramientas automáticamente.")
        print("Por favor instálalas manualmente (brew install libpq o postgresql).")
        return False
    return True

def main():
    print("--- 🐘 Asistente de Migración de Datos (Render -> Supabase) ---")
    print("Este script copiará los datos usando pg_dump | psql.\n")
    
    # 1. Verificar herramientas
    if not check_tools():
        return

    # 2. Solicitar URLs
    print("1. Obtén la 'External Database URL' de Render.")
    source_url = input("Pegue la URL de ORIGEN (Render): ").strip()
    if not source_url:
        print("❌ Se requiere URL de origen.")
        return

    print("\n2. Obtén la URL de Supabase (Mode: Session, Puerto: 5432).")
    dest_url = input("Pegue la URL de DESTINO (Supabase): ").strip()
    if not dest_url:
        print("❌ Se requiere URL de destino.")
        return

    # 3. Confirmación
    print("\n⚠️  ¡ATENCIÓN! Se copiarán datos desde el Origen hacia el Destino.")
    print("Asegúrate de haber corrido primero 'python run_remote_migrations.py' para crear las tablas.")
    confirm = input("¿Estás listo? (s/n): ").lower()
    if confirm != 's':
        print("Operación cancelada.")
        return

    print("\n🚀 Iniciando transferencia de datos... (Esto puede tardar unos segundos)")

    # 4. Construir y ejecutar el comando pipe
    # pg_dump source | psql dest
    
    try:
        # Proceso 1: pg_dump
        # Usamos --no-owner --no-acl --data-only y las exclusiones
        dump_args = [
            "pg_dump",
            source_url,
            "--no-owner",
            "--no-acl",
            "--data-only",
            "--exclude-table=django_migrations",
            "--exclude-table=auth_permission",
            "--exclude-table=django_content_type"
        ]
        
        # Proceso 2: psql
        psql_args = ["psql", dest_url]

        # Crear tubería
        p1 = subprocess.Popen(dump_args, stdout=subprocess.PIPE)
        p2 = subprocess.Popen(psql_args, stdin=p1.stdout, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Permitir que p1 reciba SIGPIPE si p2 muere
        p1.stdout.close()
        
        # Esperar a que termine
        output, error = p2.communicate()
        
        if p2.returncode == 0:
            print("\n✅ ¡Migración de datos EXITOSA!")
            print("Ahora tus datos de Render deberían estar en Supabase.")
        else:
            print(f"\n❌ Error en la importación (Código {p2.returncode}):")
            if error:
                print(error.decode(errors='replace'))
                
            # Verificar si el error fue en el dump
            if p1.poll() != 0:
                print("Nota: También hubo un problema al leer de la base de datos de origen (pg_dump).")

    except Exception as e:
        print(f"\n❌ Error inesperado al ejecutar los comandos: {e}")

if __name__ == "__main__":
    main()
