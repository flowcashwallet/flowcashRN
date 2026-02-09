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
        # 2. Ejecutar Migraciones
        print("\n🔄 [1/2] Aplicando migraciones a la base de datos remota...")
        subprocess.run([python_exe, "manage.py", "migrate"], env=env, check=True)
        print("✅ Migraciones completadas con éxito.")
        
        # 3. Crear Superusuario
        print("\n👤 [2/2] Creación de Superusuario para el Admin")
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
