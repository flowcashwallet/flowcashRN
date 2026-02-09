import sys
import dj_database_url
import psycopg2

def main():
    print("--- 🧨 RESET TOTAL DE BASE DE DATOS REMOTA ---")
    print("⚠️  PELIGRO: Esto borrará TODOS los datos y tablas en la base de datos de destino.")
    print("Úsalo solo si necesitas limpiar la base de datos para volver a migrar desde cero.\n")
    
    url = input("Ingresa tu DATABASE_URL de Supabase (la que quieres BORRAR): ").strip()
    if not url: return

    # Confirmación 1
    print("\nVas a ELIMINAR todo el esquema 'public' de esta base de datos.")
    confirm1 = input("Escribe 'BORRAR' (mayúsculas) para confirmar: ")
    if confirm1 != "BORRAR":
        print("Cancelado.")
        return

    # Confirmación 2
    confirm2 = input("¿Estás 100% seguro? No hay vuelta atrás. (s/n): ")
    if confirm2.lower() != 's':
        print("Cancelado.")
        return

    try:
        config = dj_database_url.parse(url)
        conn = psycopg2.connect(
            dbname=config['NAME'], user=config['USER'], password=config['PASSWORD'],
            host=config['HOST'], port=config['PORT'], sslmode='require'
        )
        conn.autocommit = True # Necesario para DROP DATABASE/SCHEMA
        cur = conn.cursor()
        
        print("\n🗑️  Eliminando esquema public...")
        cur.execute("DROP SCHEMA public CASCADE;")
        
        print("✨ Recreando esquema public...")
        cur.execute("CREATE SCHEMA public;")
        cur.execute("GRANT ALL ON SCHEMA public TO postgres;")
        cur.execute("GRANT ALL ON SCHEMA public TO public;")
        
        print("\n✅ ¡Base de datos limpia! Ahora está como nueva.")
        print("Pasos siguientes recomendados:")
        print("1. Ejecuta 'python run_remote_migrations.py' (para crear tablas vacías).")
        print("2. Ejecuta 'python migrate_data_v2.py' (para llenar los datos).")
        print("3. NO crees superusuario manual hasta verificar que los datos se importaron.")
        
        conn.close()

    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    main()
