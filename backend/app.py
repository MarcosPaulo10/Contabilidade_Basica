from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Empresa, ContaPadrao, Lancamento
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.abspath(os.path.dirname(__name__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(BASE_DIR, "banco.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)


def _demonstrativo_lancamento(lancamento):
    if lancamento.conta_padrao_id:
        conta = ContaPadrao.query.get(lancamento.conta_padrao_id)
        if conta:
            return getattr(conta, 'demonstrativo', None) or 'BP'
    return 'BP'


def _conta_to_dict(c):
    return {
        'id': c.id,
        'nome': c.nome,
        'grupo': c.grupo,
        'subgrupo': c.subgrupo,
        'sinal': getattr(c, 'sinal', 'positivo'),
        'demonstrativo': getattr(c, 'demonstrativo', 'BP') or 'BP',
        'ordem': c.ordem,
    }


@app.route('/api/empresas', methods=['GET'])
def get_empresas():
    empresas = Empresa.query.all()
    return jsonify([{'id': e.id, 'nome': e.nome, 'data_cadastro': e.data_cadastro.isoformat()} for e in empresas])


@app.route('/api/empresas', methods=['POST'])
def create_empresa():
    data = request.json
    nome = data.get('nome')
    if not nome:
        return jsonify({'error': 'Nome é obrigatório'}), 400

    nova = Empresa(nome=nome)
    db.session.add(nova)
    db.session.commit()
    return jsonify({'id': nova.id, 'nome': nova.nome}), 201


@app.route('/api/contas', methods=['GET'])
def get_contas_padrao():
    demonstrativo = request.args.get('demonstrativo', 'BP')
    if demonstrativo == 'BP':
        query = ContaPadrao.query.filter(
            (ContaPadrao.demonstrativo == 'BP') | (ContaPadrao.demonstrativo.is_(None))
        )
    else:
        query = ContaPadrao.query.filter_by(demonstrativo=demonstrativo)
    contas = query.order_by(ContaPadrao.ordem).all()
    return jsonify([_conta_to_dict(c) for c in contas])


@app.route('/api/contas', methods=['POST'])
def add_conta_padrao():
    data = request.json
    nome = data.get('nome')
    grupo = data.get('grupo')
    subgrupo = data.get('subgrupo')
    sinal = data.get('sinal', 'positivo')
    demonstrativo = data.get('demonstrativo', 'BP')

    if not all([nome, grupo, subgrupo]):
        return jsonify({'error': 'Parâmetros insuficientes'}), 400

    ultima_conta = ContaPadrao.query.filter_by(demonstrativo=demonstrativo).order_by(ContaPadrao.ordem.desc()).first()
    if not ultima_conta:
        ultima_conta = ContaPadrao.query.order_by(ContaPadrao.ordem.desc()).first()
    ordem = ultima_conta.ordem + 1 if ultima_conta else 1

    nova = ContaPadrao(
        nome=nome, grupo=grupo, subgrupo=subgrupo,
        ordem=ordem, sinal=sinal, demonstrativo=demonstrativo
    )
    db.session.add(nova)
    db.session.commit()

    return jsonify(_conta_to_dict(nova)), 201


@app.route('/api/contas/<int:id>', methods=['PUT'])
def edit_conta_padrao(id):
    conta = ContaPadrao.query.get(id)
    if not conta:
        return jsonify({'error': 'Conta não encontrada'}), 404

    data = request.json
    conta.nome = data.get('nome', conta.nome)
    conta.grupo = data.get('grupo', conta.grupo)
    conta.subgrupo = data.get('subgrupo', conta.subgrupo)
    conta.sinal = data.get('sinal', getattr(conta, 'sinal', 'positivo'))

    db.session.commit()
    return jsonify(_conta_to_dict(conta)), 200


@app.route('/api/contas/<int:id>', methods=['DELETE'])
def delete_conta_padrao(id):
    conta = ContaPadrao.query.get(id)
    if not conta:
        return jsonify({'error': 'Conta não encontrada'}), 404

    lancamentos = Lancamento.query.filter_by(conta_padrao_id=id).all()
    for l in lancamentos:
        l.nome_conta_personalizada = conta.nome
        l.grupo_personalizado = conta.grupo
        l.subgrupo_personalizado = conta.subgrupo
        l.conta_padrao_id = None

    db.session.delete(conta)
    db.session.commit()
    return jsonify({'status': 'ok'}), 200


@app.route('/api/lancamentos', methods=['GET'])
def get_lancamentos():
    empresa_id = request.args.get('empresa_id')
    mes = request.args.get('mes')
    ano = request.args.get('ano')
    demonstrativo = request.args.get('demonstrativo', 'BP')

    query = Lancamento.query
    if empresa_id:
        query = query.filter_by(empresa_id=empresa_id)
    if mes:
        query = query.filter_by(mes=mes)
    if ano:
        query = query.filter_by(ano=ano)

    lancamentos = query.all()
    resultado = []

    for l in lancamentos:
        if _demonstrativo_lancamento(l) != demonstrativo:
            continue

        conta = l.conta_padrao
        nome = conta.nome if conta else l.nome_conta_personalizada
        grupo = conta.grupo if conta else l.grupo_personalizado
        subgrupo = conta.subgrupo if conta else l.subgrupo_personalizado
        sinal = getattr(conta, 'sinal', 'positivo') if conta else 'positivo'

        resultado.append({
            'id': l.id,
            'empresa_id': l.empresa_id,
            'conta_padrao_id': l.conta_padrao_id,
            'nome_conta_personalizada': l.nome_conta_personalizada,
            'nome': nome,
            'grupo': grupo,
            'subgrupo': subgrupo,
            'sinal': sinal,
            'mes': l.mes,
            'ano': l.ano,
            'valor': l.valor,
        })
    return jsonify(resultado)


@app.route('/api/lancamentos', methods=['POST'])
def save_lancamentos():
    data = request.json
    empresa_id = data.get('empresa_id')
    mes = data.get('mes')
    ano = data.get('ano')
    valores = data.get('valores')
    novas_contas = data.get('novas_contas', [])
    demonstrativo = data.get('demonstrativo', 'BP')

    if not all([empresa_id, mes, ano]):
        return jsonify({'error': 'Parâmetros insuficientes'}), 400

    existentes = Lancamento.query.filter_by(empresa_id=empresa_id, mes=mes, ano=ano).all()
    for l in existentes:
        if _demonstrativo_lancamento(l) == demonstrativo:
            db.session.delete(l)

    for conta_id, valor_str in valores.items():
        if not valor_str:
            continue
        valor = float(str(valor_str).replace(',', '.'))

        conta = ContaPadrao.query.get(conta_id)
        if not conta:
            continue
        if (getattr(conta, 'demonstrativo', None) or 'BP') != demonstrativo:
            continue

        is_neg = (
            getattr(conta, 'sinal', 'positivo') == 'negativo'
            or 'depreciação' in conta.nome.lower()
        )
        if is_neg and valor > 0:
            valor = valor * -1

        novo_lanc = Lancamento(
            empresa_id=empresa_id,
            conta_padrao_id=conta_id,
            mes=mes,
            ano=ano,
            valor=valor,
        )
        db.session.add(novo_lanc)

    for nova in novas_contas:
        nome = nova.get('nome')
        grupo = nova.get('grupo')
        subgrupo = nova.get('subgrupo')
        valor = float(str(nova.get('valor', 0)).replace(',', '.'))

        if 'depreciação' in nome.lower() and valor > 0:
            valor = valor * -1

        novo_lanc_pers = Lancamento(
            empresa_id=empresa_id,
            nome_conta_personalizada=nome,
            grupo_personalizado=grupo,
            subgrupo_personalizado=subgrupo,
            mes=mes,
            ano=ano,
            valor=valor,
        )
        db.session.add(novo_lanc_pers)

    db.session.commit()
    return jsonify({'status': 'ok'}), 200


@app.route('/api/lancamentos/limpar', methods=['POST'])
def clear_lancamentos():
    data = request.json
    empresa_id = data.get('empresa_id')
    mes = data.get('mes')
    ano = data.get('ano')
    demonstrativo = data.get('demonstrativo', 'BP')

    if not all([empresa_id, mes, ano]):
        return jsonify({'error': 'Parâmetros insuficientes'}), 400

    existentes = Lancamento.query.filter_by(empresa_id=empresa_id, mes=mes, ano=ano).all()
    for l in existentes:
        if _demonstrativo_lancamento(l) == demonstrativo:
            db.session.delete(l)

    db.session.commit()
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
