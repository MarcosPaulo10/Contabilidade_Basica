from app import app, db
from models import ContaPadrao, Lancamento

with app.app_context():
    contas = ContaPadrao.query.all()
    updated = 0
    for c in contas:
        if c.grupo in ['Passivo', 'Patrimônio Líquido']:
            c.grupo = 'Passivo e PL'
            updated += 1
            
    lancamentos = Lancamento.query.all()
    for l in lancamentos:
        if l.grupo_personalizado in ['Passivo', 'Patrimônio Líquido']:
            l.grupo_personalizado = 'Passivo e PL'
            updated += 1
            
    db.session.commit()
    print(f"Banco de dados corrigido! {updated} registros atualizados para 'Passivo e PL'.")
