import { useState, useEffect } from 'react'
import axios from 'axios'

export default function ContasPadraoManager({ onBack }) {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState('')
  const [grupo, setGrupo] = useState('Ativo')
  const [subgrupo, setSubgrupo] = useState('Circulante')
  const [sinal, setSinal] = useState('positivo')
  const [editId, setEditId] = useState(null)

  const API_URL = 'http://127.0.0.1:5000/api'

  const gruposOpcoes = [
    'Ativo', 
    'Passivo e PL'
  ]

  const subgruposOpcoes = {
    'Ativo': [
      'Circulante', 
      'Realizável a Longo Prazo - Não Circulante', 
      'Investimentos - Não Circulante', 
      'Imobilizado - Não Circulante', 
      'Intangível - Não Circulante'
    ],
    'Passivo e PL': [
      'Circulante', 
      'Exigível a Longo Prazo - Não Circulante', 
      'Patrimônio Líquido'
    ]
  }

  useEffect(() => {
    fetchContas()
  }, [])

  // Auto update subgrupo when grupo changes
  useEffect(() => {
    setSubgrupo(subgruposOpcoes[grupo][0])
  }, [grupo])

  const fetchContas = async () => {
    try {
      const res = await axios.get(`${API_URL}/contas`)
      setContas(res.data)
    } catch (error) {
      console.error('Erro ao buscar contas:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nome) return
    setLoading(true)
    try {
      if (editId) {
        const res = await axios.put(`${API_URL}/contas/${editId}`, { nome, grupo, subgrupo, sinal })
        setContas(contas.map(c => c.id === editId ? res.data : c))
      } else {
        const res = await axios.post(`${API_URL}/contas`, { nome, grupo, subgrupo, sinal })
        setContas([...contas, res.data])
      }
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar conta padrão:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (conta) => {
    setEditId(conta.id)
    setNome(conta.nome)
    setGrupo(conta.grupo)
    setSubgrupo(conta.subgrupo)
    setSinal(conta.sinal || 'positivo')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja apagar a conta "${nome}"? Históricos de lançamentos já realizados não serão perdidos.`)) return;
    try {
      await axios.delete(`${API_URL}/contas/${id}`)
      setContas(contas.filter(c => c.id !== id))
    } catch (error) {
      console.error('Erro ao excluir conta padrão:', error)
      alert("Erro ao excluir conta.")
    }
  }

  const resetForm = () => {
    setEditId(null)
    setNome('')
    setGrupo('Ativo')
    setSubgrupo('Circulante')
    setSinal('positivo')
  }

  // Agrupar contas para exibição com sub-subgrupos
  const contasAgrupadasUI = contas.reduce((acc, conta) => {
    let mainSubgrupo = conta.subgrupo;
    let subSubgrupo = null;

    if (conta.subgrupo.includes(' - Não Circulante')) {
      mainSubgrupo = 'Não Circulante';
      subSubgrupo = conta.subgrupo.replace(' - Não Circulante', '');
    }

    if (!acc[conta.grupo]) acc[conta.grupo] = {}
    if (!acc[conta.grupo][mainSubgrupo]) acc[conta.grupo][mainSubgrupo] = {}
    
    const category = subSubgrupo || 'default';
    if (!acc[conta.grupo][mainSubgrupo][category]) acc[conta.grupo][mainSubgrupo][category] = []
    
    acc[conta.grupo][mainSubgrupo][category].push(conta)
    return acc
  }, {})

  const sortGrupoKeys = (keys) => keys.sort((a, b) => a === 'Ativo' ? -1 : 1)
  
  const sortSubgrupoKeys = (keys) => {
    const order = { 'Circulante': 1, 'Não Circulante': 2, 'Patrimônio Líquido': 3 }
    return keys.sort((a, b) => (order[a] || 99) - (order[b] || 99))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Gerenciar Contas Padrão</h2>
        <button 
          onClick={onBack}
          className="text-slate-600 hover:text-slate-800 font-medium"
        >
          &larr; Voltar
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold mb-4 text-slate-700">
          {editId ? 'Editar Conta Padrão' : 'Nova Conta Padrão'}
        </h3>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-600 mb-1">Nome da Conta</label>
            <input
              type="text"
              className="w-full border-slate-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Caixa, Banco..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-600 mb-1">Grupo</label>
            <select
              className="w-full border-slate-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
            >
              {gruposOpcoes.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="w-56">
            <label className="block text-sm font-medium text-slate-600 mb-1">Subgrupo</label>
            <select
              className="w-full border-slate-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={subgrupo}
              onChange={(e) => setSubgrupo(e.target.value)}
            >
              {subgruposOpcoes[grupo]?.map(sg => (
                <option key={sg} value={sg}>{sg}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col mb-1 ml-2 mr-4">
            <label className="block text-sm font-medium text-slate-600 mb-2">Comportamento</label>
            <div className="flex gap-4 items-center h-8">
              <label className="flex items-center gap-1 text-sm text-slate-700 cursor-pointer">
                <input 
                  type="radio" 
                  value="positivo" 
                  checked={sinal === 'positivo'} 
                  onChange={(e) => setSinal(e.target.value)} 
                  className="accent-blue-600" 
                />
                (+) Normal
              </label>
              <label className="flex items-center gap-1 text-sm text-slate-700 cursor-pointer">
                <input 
                  type="radio" 
                  value="negativo" 
                  checked={sinal === 'negativo'} 
                  onChange={(e) => setSinal(e.target.value)} 
                  className="accent-red-600" 
                />
                <span className="text-red-700">(-) Redutora</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 font-medium h-[42px]"
            >
              {editId ? 'Salvar' : 'Adicionar'}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 transition font-medium h-[42px]"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Contas Cadastradas</h3>
        {Object.keys(contasAgrupadasUI).length === 0 ? (
          <p className="text-slate-500">Nenhuma conta encontrada.</p>
        ) : (
          <div className="space-y-8">
            {sortGrupoKeys(Object.keys(contasAgrupadasUI)).map((grupoNome) => (
              <div key={grupoNome} className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                
                {/* Banner de Destaque para o Grupo */}
                <div className="bg-slate-800 text-white p-4">
                  <h4 className="font-extrabold text-xl uppercase tracking-wider">{grupoNome}</h4>
                </div>
                
                <div className="p-4 space-y-6 bg-slate-50">
                  {sortSubgrupoKeys(Object.keys(contasAgrupadasUI[grupoNome])).map((mainSubgrupoNome) => (
                    <div key={mainSubgrupoNome} className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
                      <div className="border-b-2 border-blue-500 pb-2 mb-4">
                        <h5 className="font-bold text-md text-blue-700 uppercase tracking-wide">{mainSubgrupoNome}</h5>
                      </div>
                      
                      <div className="space-y-6">
                        {Object.keys(contasAgrupadasUI[grupoNome][mainSubgrupoNome]).map(subSubgrupoNome => (
                          <div key={subSubgrupoNome} className="space-y-3">
                            {subSubgrupoNome !== 'default' && (
                              <h6 className="font-bold text-sm text-slate-700 italic border-l-4 border-slate-400 pl-2">
                                + {subSubgrupoNome}
                              </h6>
                            )}
                            <div className="flex flex-wrap gap-3">
                              {contasAgrupadasUI[grupoNome][mainSubgrupoNome][subSubgrupoNome].map(conta => (
                                <div 
                                  key={conta.id} 
                                  className={`group flex items-center justify-between gap-2 border pl-3 pr-1 py-1 rounded-md font-medium text-sm transition ${
                                    conta.sinal === 'negativo' 
                                      ? 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100 hover:border-red-300' 
                                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-300'
                                  }`}
                                >
                                  <span>
                                    {conta.nome} {conta.sinal === 'negativo' && <span className="font-bold ml-1 opacity-75">(-)</span>}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => startEdit(conta)}
                                      className="text-slate-400 hover:text-blue-600 p-1 rounded"
                                      title="Editar Conta"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDelete(conta.id, conta.nome)}
                                      className="text-slate-400 hover:text-red-500 p-1 rounded"
                                      title="Apagar Conta"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
