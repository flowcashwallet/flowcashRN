import os
import sys
import dj_database_url
import psycopg2

def main():
    print("--- 🕵️‍♂️ Verificador de Datos en Producción (Avanzado) ---")
    
    url = input("\nIngresa tu DATABASE_URL de Supabase (puerto 6543 o 5432): ").strip()
    if not url: return

    try:
        config = dj_database_url.parse(url)
        conn = psycopg2.connect(
            dbname=config['NAME'], user=config['USER'], password=config['PASSWORD'],
            host=config['HOST'], port=config['PORT'], sslmode='require'
        )
        cur = conn.cursor()
        
        tables = ['auth_user', 'wallet_transaction', 'wallet_budget', 'wallet_category']
        
        print("\n📊 Estado de la Base de Datos:")
        print("-" * 50)
        
        total_rows = 0
        for table in tables:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table};")
                count = cur.fetchone()[0]
                print(f"📄 {table.ljust(25)}: {count} registros")
                total_rows += count
            except:
                print(f"❌ {table.ljust(25)}: Error (¿Tabla no existe?)")

        print("-" * 50)

        # Verificar usuarios
        print("\n👤 Usuarios encontrados:")
        try:
            cur.execute("SELECT id, username, email, date_joined FROM auth_user ORDER BY id ASC LIMIT 5;")
            users = cur.fetchall()
            for u in users:
                print(f"   ID {u[0]}: {u[1]} ({u[2]}) - Unido: {u[3]}")
        except Exception as e:
            print(f"   Error leyendo usuarios: {e}")

        # Verificar transacciones recientes
        print("\n💸 Últimas 3 Transacciones:")
        try:
            cur.execute("SELECT id, amount, date, description FROM wallet_transaction ORDER BY date DESC LIMIT 3;")
            txs = cur.fetchall()
            if txs:
                for t in txs:
                    print(f"   ID {t[0]}: {t[1]} - {t[2]} - {t[3]}")
            else:
                print("   (Ninguna)")
        except:
            print("   (Error o tabla vacía)")

        print("-" * 50)
        
        if total_rows < 5:
            print("\n⚠️  DIAGNÓSTICO: La migración probablemente falló.")
            print("Posible Causa: Conflicto de IDs.")
            print("Si creaste un superusuario ANTES de migrar, el usuario ID 1 ya existía")
            print("y chocó con el usuario ID 1 de tus datos viejos, cancelando la copia.")
            print("\nSOLUCIÓN RECOMENDADA:")
            print("1. Limpiar la base de datos (borrar todo).")
            print("2. Correr migraciones (tablas vacías).")
            print("3. Importar datos (¡SIN crear superusuario antes!).")
            print("4. Crear superusuario AL FINAL (si hace falta).")
        else:
            print("\n✅ ¡Los datos están ahí!")
            print("Si no los ves en Vercel:")
            print("1. Asegúrate de haber hecho REDEPLOY en Vercel después de poner la variable DATABASE_URL.")
            print("2. Revisa que Vercel tenga la misma DATABASE_URL que usaste aquí.")

        conn.close()

    except Exception as e:
        print(f"\n❌ Error conectando: {e}")

if __name__ == "__main__":
    main()
