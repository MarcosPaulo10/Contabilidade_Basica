import sqlite3

def run_migration():
    conn = sqlite3.connect('banco.db')
    c = conn.cursor()
    try:
        c.execute("ALTER TABLE conta_padrao ADD COLUMN sinal VARCHAR(10) DEFAULT 'positivo'")
        c.execute("UPDATE conta_padrao SET sinal='negativo' WHERE nome LIKE '%Deprecia%'")
        conn.commit()
        print("Coluna sinal adicionada e atualizada com sucesso!")
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    run_migration()
