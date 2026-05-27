import sqlite3
import os

def run_migration():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'banco.db')
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    try:
        c.execute("ALTER TABLE conta_padrao ADD COLUMN demonstrativo VARCHAR(10) DEFAULT 'BP'")
        c.execute("UPDATE conta_padrao SET demonstrativo='BP' WHERE demonstrativo IS NULL")
        conn.commit()
        print("Coluna demonstrativo adicionada com sucesso!")
    except sqlite3.OperationalError as e:
        if 'duplicate column' in str(e).lower():
            print("Coluna demonstrativo já existe.")
        else:
            print(f"Erro: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    run_migration()
