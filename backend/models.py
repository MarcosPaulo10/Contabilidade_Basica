from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Empresa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)
    lancamentos = db.relationship('Lancamento', backref='empresa', lazy=True)

class ContaPadrao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    grupo = db.Column(db.String(50), nullable=False) 
    subgrupo = db.Column(db.String(50), nullable=False) 
    ordem = db.Column(db.Integer, default=0)
    sinal = db.Column(db.String(10), default='positivo')

class Lancamento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresa.id'), nullable=False)
    conta_padrao_id = db.Column(db.Integer, db.ForeignKey('conta_padrao.id'), nullable=True)
    nome_conta_personalizada = db.Column(db.String(100), nullable=True) # Caso crie conta nova no momento
    grupo_personalizado = db.Column(db.String(50), nullable=True) 
    subgrupo_personalizado = db.Column(db.String(50), nullable=True)
    mes = db.Column(db.Integer, nullable=False)
    ano = db.Column(db.Integer, nullable=False)
    valor = db.Column(db.Float, default=0.0)
    
    conta_padrao = db.relationship('ContaPadrao', backref='lancamentos_ref')
    
    @property
    def nome(self):
        return self.conta_padrao.nome if self.conta_padrao else self.nome_conta_personalizada
    
    @property
    def grupo(self):
        return self.conta_padrao.grupo if self.conta_padrao else self.grupo_personalizado

    @property
    def subgrupo(self):
        return self.conta_padrao.subgrupo if self.conta_padrao else self.subgrupo_personalizado
