from app import db, app
from models import ContaPadrao

CONTAS_PRESET = [
    {"nome": "Disponível", "grupo": "Ativo", "subgrupo": "Circulante", "ordem": 1},
    {"nome": "Duplicatas a Receber", "grupo": "Ativo", "subgrupo": "Circulante", "ordem": 2},
    {"nome": "Estoque", "grupo": "Ativo", "subgrupo": "Circulante", "ordem": 3},
    {"nome": "Aplicações Financeiras", "grupo": "Ativo", "subgrupo": "Circulante", "ordem": 4},
    
    {"nome": "Títulos a Receber (LP)", "grupo": "Ativo", "subgrupo": "Realizável a Longo Prazo", "ordem": 5},
    {"nome": "Investimentos", "grupo": "Ativo", "subgrupo": "Investimentos", "ordem": 6},
    {"nome": "Veículos", "grupo": "Ativo", "subgrupo": "Imobilizado", "ordem": 7},
    {"nome": "Máquinas", "grupo": "Ativo", "subgrupo": "Imobilizado", "ordem": 8},
    {"nome": "Móveis", "grupo": "Ativo", "subgrupo": "Imobilizado", "ordem": 9},
    {"nome": "(-) Depreciação Acumulada", "grupo": "Ativo", "subgrupo": "Imobilizado", "ordem": 10},
    {"nome": "Marcas e Patentes", "grupo": "Ativo", "subgrupo": "Intangível", "ordem": 11},
    
    {"nome": "Fornecedores", "grupo": "Passivo", "subgrupo": "Circulante", "ordem": 1},
    {"nome": "Salários a Pagar", "grupo": "Passivo", "subgrupo": "Circulante", "ordem": 2},
    {"nome": "Impostos a Pagar", "grupo": "Passivo", "subgrupo": "Circulante", "ordem": 3},
    {"nome": "Encargos a Pagar", "grupo": "Passivo", "subgrupo": "Circulante", "ordem": 4},
    {"nome": "Empréstimos Bancários", "grupo": "Passivo", "subgrupo": "Circulante", "ordem": 5},
    
    {"nome": "Financiamentos (LP)", "grupo": "Passivo", "subgrupo": "Não Circulante", "ordem": 6},
    
    {"nome": "Capital Social", "grupo": "Patrimônio Líquido", "subgrupo": "Patrimônio Líquido", "ordem": 7},
    {"nome": "Reservas de Lucros", "grupo": "Patrimônio Líquido", "subgrupo": "Patrimônio Líquido", "ordem": 8},
]

def seed_db():
    with app.app_context():
        db.create_all()
        for c in CONTAS_PRESET:
            if not ContaPadrao.query.filter_by(nome=c["nome"]).first():
                nova_conta = ContaPadrao(
                    nome=c["nome"],
                    grupo=c["grupo"],
                    subgrupo=c["subgrupo"],
                    ordem=c["ordem"]
                )
                db.session.add(nova_conta)
        db.session.commit()
        print("Banco de dados populado com contas padrão!")

if __name__ == "__main__":
    seed_db()
