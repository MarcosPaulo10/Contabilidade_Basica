from app import db, app
from models import ContaPadrao, Empresa, Lancamento

CONTAS_DRE = [
    {"nome": "Receita Operacional Bruta", "grupo": "Receita Bruta", "subgrupo": "Principal", "ordem": 1, "sinal": "positivo"},
    {"nome": "Devoluções e Abatimentos", "grupo": "Deduções", "subgrupo": "Devoluções", "ordem": 2, "sinal": "positivo"},
    {"nome": "Impostos sobre Vendas (ICMS, IPI, PIS e COFINS)", "grupo": "Deduções", "subgrupo": "Impostos", "ordem": 3, "sinal": "positivo"},
    {"nome": "Custo do Produto Vendido – CPV", "grupo": "Custos", "subgrupo": "CPV", "ordem": 4, "sinal": "positivo"},
    {"nome": "Salários e encargos sociais do pessoal de Vendas", "grupo": "Despesas Operacionais", "subgrupo": "Vendas", "ordem": 5, "sinal": "positivo"},
    {"nome": "Comissões s/Vendas", "grupo": "Despesas Operacionais", "subgrupo": "Vendas", "ordem": 6, "sinal": "positivo"},
    {"nome": "Propaganda e publicidade", "grupo": "Despesas Operacionais", "subgrupo": "Vendas", "ordem": 7, "sinal": "positivo"},
    {"nome": "Material de Expediente", "grupo": "Despesas Operacionais", "subgrupo": "Administrativas", "ordem": 8, "sinal": "positivo"},
    {"nome": "Salários e encargos sociais do pessoal da Administração", "grupo": "Despesas Operacionais", "subgrupo": "Administrativas", "ordem": 9, "sinal": "positivo"},
    {"nome": "Aluguel", "grupo": "Despesas Operacionais", "subgrupo": "Administrativas", "ordem": 10, "sinal": "positivo"},
    {"nome": "Telefone, água, energia", "grupo": "Despesas Operacionais", "subgrupo": "Administrativas", "ordem": 11, "sinal": "positivo"},
    {"nome": "Outras Despesas Administrativas", "grupo": "Despesas Operacionais", "subgrupo": "Administrativas", "ordem": 12, "sinal": "positivo"},
    {"nome": "Juros pagos ou passivos", "grupo": "Despesas Operacionais", "subgrupo": "Financeiras", "ordem": 13, "sinal": "positivo"},
    {"nome": "Comissões bancárias", "grupo": "Despesas Operacionais", "subgrupo": "Financeiras", "ordem": 14, "sinal": "positivo"},
    {"nome": "Outras Receitas Operacionais", "grupo": "Despesas Operacionais", "subgrupo": "Outras Receitas", "ordem": 15, "sinal": "negativo"},
    {"nome": "Outras Despesas Operacionais", "grupo": "Despesas Operacionais", "subgrupo": "Outras Despesas", "ordem": 16, "sinal": "positivo"},
    {"nome": "Outras Receitas", "grupo": "Outras", "subgrupo": "Receitas", "ordem": 17, "sinal": "negativo"},
    {"nome": "Outras Despesas", "grupo": "Outras", "subgrupo": "Despesas", "ordem": 18, "sinal": "positivo"},
]

LANCAMENTOS_EX03 = {
    "Receita Operacional Bruta": 130000.0,
    "Devoluções e Abatimentos": 4000.0,
    "Impostos sobre Vendas (ICMS, IPI, PIS e COFINS)": 19400.0,
    "Custo do Produto Vendido – CPV": 40000.0,
    "Salários e encargos sociais do pessoal de Vendas": 5000.0,
    "Comissões s/Vendas": 3000.0,
    "Propaganda e publicidade": 1600.0,
    "Material de Expediente": 600.0,
    "Salários e encargos sociais do pessoal da Administração": 10000.0,
    "Aluguel": 5000.0,
    "Telefone, água, energia": 3200.0,
    "Outras Despesas Administrativas": 4000.0,
    "Juros pagos ou passivos": 1400.0,
    "Comissões bancárias": 800.0,
    "Outras Receitas Operacionais": 4000.0,
    "Outras Despesas Operacionais": 2000.0,
    "Outras Receitas": 0.0,
    "Outras Despesas": 1000.0,
}

EMPRESA_NOME = "Indústria de Barcos ARAGUAIA S/A"
MES = 12
ANO = 2026

RENOMEAR_CONTAS = {
    "Impostos incidentes s/vendas (ICMS, IPI, PIS e COFINS)": "Impostos sobre Vendas (ICMS, IPI, PIS e COFINS)",
}


def seed_dre():
    with app.app_context():
        db.create_all()

        for nome_antigo, nome_novo in RENOMEAR_CONTAS.items():
            conta = ContaPadrao.query.filter_by(nome=nome_antigo, demonstrativo="DRE").first()
            if conta:
                conta.nome = nome_novo

        for c in CONTAS_DRE:
            existente = ContaPadrao.query.filter_by(
                nome=c["nome"], demonstrativo="DRE"
            ).first()
            if not existente:
                db.session.add(ContaPadrao(
                    nome=c["nome"],
                    grupo=c["grupo"],
                    subgrupo=c["subgrupo"],
                    ordem=c["ordem"],
                    sinal=c["sinal"],
                    demonstrativo="DRE",
                ))
            else:
                existente.grupo = c["grupo"]
                existente.subgrupo = c["subgrupo"]
                existente.ordem = c["ordem"]
                existente.sinal = c["sinal"]

        db.session.commit()

        empresa = Empresa.query.filter_by(nome=EMPRESA_NOME).first()
        if not empresa:
            empresa = Empresa(nome=EMPRESA_NOME)
            db.session.add(empresa)
            db.session.commit()

        contas_dre = ContaPadrao.query.filter_by(demonstrativo="DRE").all()
        conta_por_nome = {c.nome: c for c in contas_dre}

        for l in Lancamento.query.filter_by(empresa_id=empresa.id, mes=MES, ano=ANO).all():
            conta = ContaPadrao.query.get(l.conta_padrao_id) if l.conta_padrao_id else None
            if conta and conta.demonstrativo == "DRE":
                db.session.delete(l)

        db.session.commit()

        for nome, valor in LANCAMENTOS_EX03.items():
            conta = conta_por_nome.get(nome)
            if not conta:
                continue
            if valor == 0:
                continue

            existente = Lancamento.query.filter_by(
                empresa_id=empresa.id,
                conta_padrao_id=conta.id,
                mes=MES,
                ano=ANO,
            ).first()
            if existente:
                existente.valor = valor
            else:
                db.session.add(Lancamento(
                    empresa_id=empresa.id,
                    conta_padrao_id=conta.id,
                    mes=MES,
                    ano=ANO,
                    valor=valor,
                ))

        db.session.commit()
        print(f"DRE seed OK: {len(contas_dre)} contas, empresa '{EMPRESA_NOME}', período {MES}/{ANO}")


if __name__ == "__main__":
    seed_dre()
