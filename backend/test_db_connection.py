import sys
import dj_database_url
import psycopg2

def test_connection():
    print("--- Probador de Conexión a Base de Datos ---")
    print("Pega tu DATABASE_URL completa (con la contraseña real) y presiona Enter:")
    
    try:
        url = input().strip()
        if not url:
            print("Error: URL vacía.")
            return

        # Parsear la URL para ver si dj_database_url la entiende
        config = dj_database_url.parse(url)
        
        print(f"\nIntentando conectar a:")
        print(f"Host: {config.get('HOST')}")
        print(f"Port: {config.get('PORT')}")
        print(f"User: {config.get('USER')}")
        print(f"DB:   {config.get('NAME')}")
        print("...")

        # Intentar conexión real
        conn = psycopg2.connect(
            dbname=config['NAME'],
            user=config['USER'],
            password=config['PASSWORD'],
            host=config['HOST'],
            port=config['PORT'],
            sslmode='require'
        )
        
        print("\n✅ ¡ÉXITO! La conexión se estableció correctamente.")
        conn.close()
        
    except Exception as e:
        print("\n❌ FALLÓ la conexión:")
        print(e)
        print("\nConsejo: Verifica que la contraseña no tenga caracteres especiales sin codificar (como @ o :)")

if __name__ == "__main__":
    test_connection()
