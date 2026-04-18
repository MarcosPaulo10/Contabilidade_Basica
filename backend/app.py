from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Empresa, ContaPadrao, Lancamento
import os

app = Flask(__name__)
# Permitir chamadas do React/Tauri
CORS(app)

# Configurar Banco de Dados
BASE_DIR = os.path.abspath(os.path.dirname(__name__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(BASE_DIR, "banco.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

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
    contas = ContaPadrao.query.order_by(ContaPadrao.ordem).all()
    return jsonify([{
        'id': c.id,
        'nome': c.nome,
        'grupo': c.grupo,
        'subgrupo': c.subgrupo,
        'sinal': getattr(c, 'sinal', 'positivo')
    } for c in contas])

@app.route('/api/contas', methods=['POST'])
def add_conta_padrao():
    data = request.json
    nome = data.get('nome')
    grupo = data.get('grupo')
    subgrupo = data.get('subgrupo')
    sinal = data.get('sinal', 'positivo')
    
    if not all([nome, grupo, subgrupo]):
        return jsonify({'error': 'Parâmetros insuficientes'}), 400
        
    ultima_conta = ContaPadrao.query.order_by(ContaPadrao.ordem.desc()).first()
    ordem = ultima_conta.ordem + 1 if ultima_conta else 1
    
    nova = ContaPadrao(nome=nome, grupo=grupo, subgrupo=subgrupo, ordem=ordem, sinal=sinal)
    db.session.add(nova)
    db.session.commit()
    
    return jsonify({
        'id': nova.id,
        'nome': nova.nome,
        'grupo': nova.grupo,
        'subgrupo': nova.subgrupo,
        'sinal': nova.sinal
    }), 201

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
    
    return jsonify({
        'id': conta.id,
        'nome': conta.nome,
        'grupo': conta.grupo,
        'subgrupo': conta.subgrupo,
        'sinal': conta.sinal
    }), 200

@app.route('/api/contas/<int:id>', methods=['DELETE'])
def delete_conta_padrao(id):
    conta = ContaPadrao.query.get(id)
    if not conta:
        return jsonify({'error': 'Conta não encontrada'}), 404
        
    # Preservar o histórico desvinculando de Lançamentos antigos
    from models import Lancamento
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
    
    query = Lancamento.query
    if empresa_id: query = query.filter_by(empresa_id=empresa_id)
    if mes: query = query.filter_by(mes=mes)
    if ano: query = query.filter_by(ano=ano)
        
    lancamentos = query.all()
    
    resultado = []
    for l in lancamentos:
        conta = l.conta_padrao
        nome = conta.nome if conta else l.nome_conta_personalizada
        grupo = conta.grupo if conta else l.grupo_personalizado
        subgrupo = conta.subgrupo if conta else l.subgrupo_personalizado
        
        resultado.append({
            'id': l.id,
            'empresa_id': l.empresa_id,
            'conta_padrao_id': l.conta_padrao_id,
            'nome_conta_personalizada': l.nome_conta_personalizada,
            'nome': nome,
            'grupo': grupo,
            'subgrupo': subgrupo,
            'mes': l.mes,
            'ano': l.ano,
            'valor': l.valor
        })
    return jsonify(resultado)

@app.route('/api/lancamentos', methods=['POST'])
def save_lancamentos():
    data = request.json
    empresa_id = data.get('empresa_id')
    mes = data.get('mes')
    ano = data.get('ano')
    valores = data.get('valores') # dict de {conta_id: valor}
    novas_contas = data.get('novas_contas', []) # lista de contas novas
    
    if not all([empresa_id, mes, ano]):
        return jsonify({'error': 'Parâmetros insuficientes'}), 400

    # Limpar lançamentos existentes para este mês/ano/empresa pra facilitar
    Lancamento.query.filter_by(empresa_id=empresa_id, mes=mes, ano=ano).delete()
    
    # Salvar contas padrao
    for conta_id, valor_str in valores.items():
        if not valor_str: continue
        valor = float(str(valor_str).replace(',', '.'))
        
        # TRATAMENTO DE CONTA REDUTORA (Sinal Negativo) E DEPRECIAÇÃO
        conta = ContaPadrao.query.get(conta_id)
        is_neg = False
        if conta:
            is_neg = getattr(conta, 'sinal', 'positivo') == 'negativo' or "depreciação" in conta.nome.lower()
            
        if is_neg:
            if valor > 0:
                valor = valor * -1 # Força a ser negativo
        elif "depreciação" in str(conta_id).lower(): pass # Só pra prevenir
        
        novo_lanc = Lancamento(
            empresa_id=empresa_id,
            conta_padrao_id=conta_id,
            mes=mes,
            ano=ano,
            valor=valor
        )
        db.session.add(novo_lanc)
        
    # Salvar contas personalizadas
    for nova in novas_contas:
        nome = nova.get('nome')
        grupo = nova.get('grupo')
        subgrupo = nova.get('subgrupo')
        valor = float(str(nova.get('valor', 0)).replace(',', '.'))
        
        if "depreciação" in nome.lower() and valor > 0:
            valor = valor * -1
            
        novo_lanc_pers = Lancamento(
            empresa_id=empresa_id,
            nome_conta_personalizada=nome,
            grupo_personalizado=grupo,
            subgrupo_personalizado=subgrupo,
            mes=mes,
            ano=ano,
            valor=valor
        )
        db.session.add(novo_lanc_pers)

    db.session.commit()
    return jsonify({'status': 'ok'}), 200

@app.route('/api/lancamentos/limpar', methods=['POST'])
def clear_lancamentos():
    # Botão Limpar solicitado
    data = request.json
    empresa_id = data.get('empresa_id')
    mes = data.get('mes')
    ano = data.get('ano')
    
    if not all([empresa_id, mes, ano]):
        return jsonify({'error': 'Parâmetros insuficientes'}), 400
        
    Lancamento.query.filter_by(empresa_id=empresa_id, mes=mes, ano=ano).delete()
    db.session.commit()
    
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
