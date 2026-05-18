import os
import sys
import subprocess

def main():
    print("--- 🚀 Asistente de Migración a Producción (Supabase) ---")
    print("Este script ejecutará las migraciones desde tu máquina local hacia la base de datos remota.")
    
    # 1. Obtener URL
    url = input("\nIngresa tu DATABASE_URL de Supabase completa (puerto 6543): ").strip()
    if not url:
        print("❌ Error: URL vacía.")
        return

    # Preparar entorno con la variable
    env = os.environ.copy()
    env['DATABASE_URL'] = url
    
    # Asegurarnos de usar el python actual
    python_exe = sys.executable

    try:
        print("\n🧩 [1/3] Verificando/creando migraciones locales...")
        subprocess.run([python_exe, "manage.py", "makemigrations", "wallet"], env=env, check=True)

        # 2. Ejecutar Migraciones
        print("\n🔄 [2/3] Aplicando migraciones a la base de datos remota...")
        migrate_result = subprocess.run(
            [python_exe, "manage.py", "migrate", "--fake-initial"],
            env=env,
            text=True,
            capture_output=True,
        )
        print(migrate_result.stdout, end="")
        print(migrate_result.stderr, end="")

        if migrate_result.returncode != 0:
            combined = (migrate_result.stdout or "") + "\n" + (migrate_result.stderr or "")
            if (
                'Applying wallet.0009_category' in combined
                and 'relation "wallet_category" already exists' in combined
            ):
                print("\n🧯 Detectado conflicto: la tabla wallet_category ya existe. Marcando 0009_category como aplicada (fake)...")
                subprocess.run(
                    [python_exe, "manage.py", "migrate", "wallet", "0009_category", "--fake"],
                    env=env,
                    check=True,
                )
                print("\n🔁 Reintentando migrate (--fake-initial)...")
                subprocess.run(
                    [python_exe, "manage.py", "migrate", "--fake-initial"],
                    env=env,
                    check=True,
                )
            else:
                raise subprocess.CalledProcessError(migrate_result.returncode, migrate_result.args)

        print("✅ Migraciones completadas con éxito.")
        
        # 3. Crear Superusuario
        print("\n👤 [3/3] Creación de Superusuario para el Admin")
        choice = input("¿Quieres crear un nuevo superusuario ahora? (s/n): ").lower()
        if choice.startswith('s'):
            print("Sigue las instrucciones para crear el usuario:")
            subprocess.run([python_exe, "manage.py", "createsuperuser"], env=env)
            print("✅ Superusuario creado.")
        else:
            print("⚠️ Recuerda que necesitarás un superusuario para entrar al admin.")

    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error al ejecutar el comando. Código de salida: {e.returncode}")
        print("Verifica que la URL sea correcta y que tengas acceso a internet.")

if __name__ == "__main__":
    main()
