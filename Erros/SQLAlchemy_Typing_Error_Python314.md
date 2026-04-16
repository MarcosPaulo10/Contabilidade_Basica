# Erro: Compatibilidade do SQLAlchemy com Python 3.14

## Descrição do Erro
Ao executar `py seed.py` ou qualquer script que importe o SQLAlchemy, ocore o erro:
`AssertionError: Class <class 'sqlalchemy.sql.elements.SQLCoreOperations'> directly inherits TypingOnly but has additional attributes {'__firstlineno__', '__static_attributes__'}.`

Isso acontece porque a versão hardcoded `2.0.29` do SQLAlchemy entra em conflito com o módulo `typing.py` nativo do interpretador Python 3.14, que é uma versão recém-lançada/experimental e alterou regras de herança estrita em Generic types.

## Solução Adotada
As versões específicas (`==2.0.29` e `==3.1.1`) foram removidas do arquivo `requirements.txt`, deixando apenas os nomes:
`Flask-SQLAlchemy`
`SQLAlchemy`

Desta forma, o `pip` irá baixar a versão mais recente e corrigida disponível do SQLAlchemy (2.0.35+) que já resolve esse conflito com as novas versões do interpretador Python.
