from app import app, db
from models import ContaPadrao, Lancamento

mapping = {
    'Realizável a Longo Prazo': 'Realizável a Longo Prazo - Não Circulante',
    'Investimentos': 'Investimentos - Não Circulante',
    'Imobilizado': 'Imobilizado - Não Circulante',
    'Intangível': 'Intangível - Não Circulante',
    'Exigível a Longo Prazo': 'Exigível a Longo Prazo - Não Circulante',
    'Não Circulante': 'Exigível a Longo Prazo - Não Circulante'
}

with app.app_context():
    contas = ContaPadrao.query.all()
    updated = 0
    for c in contas:
        if c.subgrupo in mapping:
            c.subgrupo = mapping[c.subgrupo]
            updated += 1
            
    lancamentos = Lancamento.query.all()
    for l in lancamentos:
        if l.subgrupo_personalizado in mapping:
            l.subgrupo_personalizado = mapping[l.subgrupo_personalizado]
            updated += 1
            
    db.session.commit()
    print(f"Banco de dados corrigido! {updated} registros atualizados para nova nomenclatura de subgrupos.")
