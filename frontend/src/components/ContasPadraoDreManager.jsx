import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:5000/api'

const gruposOpcoes = [
  'Receita Bruta',
  'Deduções',
  'Custos',
  'Despesas Operacionais',
  'Outras',
]

const subgruposOpcoes = {
  'Receita Bruta': ['Principal'],
  'Deduções': ['Devoluções', 'Impostos'],
  'Custos': ['CPV'],
  'Despesas Operacionais': [
    'Vendas',
    'Administrativas',
    'Financeiras',
    'Outras Receitas',
    'Outras Despesas',
  ],
  'Outras': ['Receitas', 'Despesas'],
}

export default function ContasPadraoDreManager({ onBack }) {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState('')
  const [grupo, setGrupo] = useState('Receita Bruta')
  const [subgrupo, setSubgrupo] = useState('Principal')
  const [sinal, setSinal] = useState('positivo')
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchContas()
  }, [])

  useEffect(() => {
    setSubgrupo(subgruposOpcoes[grupo]?.[0] || '')
  }, [grupo])

  const fetchContas = async () => {
    const res = await axios.get(`${API_URL}/contas`, { params: { demonstrativo: 'DRE' } })
    setContas(res.data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nome) return
    setLoading(true)
    try {
      if (editId) {
        const res = await axios.put(`${API_URL}/contas/${editId}`, { nome, grupo, subgrupo, sinal })
        setContas(contas.map((c) => (c.id === editId ? res.data : c)))
      } else {
        const res = await axios.post(`${API_URL}/contas`, {
          nome,
          grupo,
          subgrupo,
          sinal,
          demonstrativo: 'DRE',
        })
        setContas([...contas, res.data])
      }
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditId(null)
    setNome('')
    setGrupo('Receita Bruta')
    setSubgrupo('Principal')
    setSinal('positivo')
  }

  const startEdit = (conta) => {
    setEditId(conta.id)
    setNome(conta.nome)
    setGrupo(conta.grupo)
    setSubgrupo(conta.subgrupo)
    setSinal(conta.sinal || 'positivo')
  }

  const handleDelete = async (id, nomeConta) => {
    if (!window.confirm(`Apagar a conta "${nomeConta}"?`)) return
    await axios.delete(`${API_URL}/contas/${id}`)
    setContas(contas.filter((c) => c.id !== id))
  }

  const agrupadas = contas.reduce((acc, c) => {
    if (!acc[c.grupo]) acc[c.grupo] = {}
    if (!acc[c.grupo][c.subgrupo]) acc[c.grupo][c.subgrupo] = []
    acc[c.grupo][c.subgrupo].push(c)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Contas Padrão — DRE</h2>
        <button onClick={onBack} className="text-slate-600 hover:text-slate-800 font-medium">
          &larr; Voltar
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <h3 className="text-lg font-bold mb-4">{editId ? 'Editar conta' : 'Nova conta DRE'}</h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm mb-1">Nome</label>
            <input
              className="w-full border p-2 rounded-md"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div className="w-48">
            <label className="block text-sm mb-1">Grupo (seção da DRE)</label>
            <select
              className="w-full border p-2 rounded-md bg-white"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
            >
              {gruposOpcoes.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm mb-1">Subgrupo</label>
            <select
              className="w-full border p-2 rounded-md bg-white"
              value={subgrupo}
              onChange={(e) => setSubgrupo(e.target.value)}
            >
              {subgruposOpcoes[grupo]?.map((sg) => (
                <option key={sg} value={sg}>
                  {sg}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 items-center h-[42px]">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                checked={sinal === 'positivo'}
                onChange={() => setSinal('positivo')}
              />
              (+) Despesa/Dedução
            </label>
            <label className="flex items-center gap-1 text-sm text-green-700">
              <input
                type="radio"
                checked={sinal === 'negativo'}
                onChange={() => setSinal('negativo')}
              />
              (-) Receita/Abate
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md h-[42px]"
          >
            {editId ? 'Salvar' : 'Adicionar'}
          </button>
          {editId && (
            <button type="button" onClick={resetForm} className="bg-slate-200 px-4 py-2 rounded-md">
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-6">
        {Object.keys(agrupadas).map((grupoNome) => (
          <div key={grupoNome}>
            <h4 className="font-bold text-indigo-800 border-b-2 border-indigo-400 pb-1 mb-3">
              {grupoNome}
            </h4>
            {Object.keys(agrupadas[grupoNome]).map((sub) => (
              <div key={sub} className="mb-4 pl-2">
                <h5 className="text-sm font-semibold text-slate-600 mb-2">{sub}</h5>
                <div className="flex flex-wrap gap-2">
                  {agrupadas[grupoNome][sub].map((conta) => (
                    <div
                      key={conta.id}
                      className={`group flex items-center gap-2 border px-3 py-1 rounded text-sm ${
                        conta.sinal === 'negativo'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span>{conta.nome}</span>
                      <button onClick={() => startEdit(conta)} className="opacity-0 group-hover:opacity-100">
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(conta.id, conta.nome)}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
