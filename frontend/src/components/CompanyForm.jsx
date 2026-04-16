import { useState, useEffect } from 'react'
import axios from 'axios'

export default function CompanyForm({ onSelect }) {
  const [empresas, setEmpresas] = useState([])
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)

  const API_URL = 'http://127.0.0.1:5000/api'

  useEffect(() => {
    fetchEmpresas()
  }, [])

  const fetchEmpresas = async () => {
    try {
      const res = await axios.get(`${API_URL}/empresas`)
      setEmpresas(res.data)
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nome) return
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/empresas`, { nome })
      setEmpresas([...empresas, res.data])
      setNome('')
      onSelect(res.data)
    } catch (error) {
      console.error('Erro ao criar empresa:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">Nova Empresa</h2>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            className="flex-1 border-slate-300 rounded-md shadow-sm p-3 border focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nome da Empresa (ex: Eldorado S/A)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50 font-medium"
          >
            Cadastrar
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Empresas Cadastradas</h2>
        {empresas.length === 0 ? (
          <p className="text-slate-500 italic">Nenhuma empresa cadastrada ainda.</p>
        ) : (
          <ul className="space-y-2">
            {empresas.map(emp => (
              <li key={emp.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-md border border-transparent hover:border-slate-200 transition cursor-pointer" onClick={() => onSelect(emp)}>
                <span className="font-medium text-slate-700">{emp.nome}</span>
                <button 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  onClick={(e) => { e.stopPropagation(); onSelect(emp); }}
                >
                  Selecionar &rarr;
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
