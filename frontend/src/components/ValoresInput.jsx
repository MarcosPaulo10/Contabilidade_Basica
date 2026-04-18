import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function ValoresInput({ empresa, onViewBalanco, onBack }) {
  const [contasPadrao, setContasPadrao] = useState([])
  const [lancamentos, setLancamentos] = useState({}) // Usar o ID da conta como chave pro valor
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)

  // Estado do formulario de adicionar
  const [busca, setBusca] = useState('')
  const [contaSelecionada, setContaSelecionada] = useState(null)
  const [valorInput, setValorInput] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)

  const dropdownRef = useRef(null)
  const valorInputRef = useRef(null)

  const API_URL = 'http://127.0.0.1:5000/api'

  useEffect(() => {
    fetchContas()
    // Fechar dropdown ao clicar fora
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    fetchLancamentos()
    // Toda vez que muda o mes/ano, limpa os preenchimentos pra buscar novos
    setBusca('')
    setContaSelecionada(null)
    setValorInput('')
  }, [mes, ano])

  const fetchContas = async () => {
    try {
      const res = await axios.get(`${API_URL}/contas`)
      setContasPadrao(res.data)
    } catch (error) {
      console.error('Erro ao buscar contas:', error)
    }
  }

  const fetchLancamentos = async () => {
    try {
      const res = await axios.get(`${API_URL}/lancamentos`, {
        params: { empresa_id: empresa.id, mes, ano }
      })
      const preenchidos = {}
      res.data.forEach(l => {
        if(l.conta_padrao_id) {
          const centsStr = Math.abs(l.valor).toFixed(2).replace(/\D/g, '')
          preenchidos[l.conta_padrao_id] = formatCurrency(centsStr)
        }
      })
      setLancamentos(preenchidos)
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error)
    }
  }

  const formatCurrency = (value) => {
    if (!value) return ''
    const number = value.replace(/\D/g, '')
    if(number === '') return ''
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(number / 100)
  }

  const handleValorInputChange = (e) => {
    setValorInput(formatCurrency(e.target.value))
  }

  const handleSelecionarConta = (conta) => {
    setContaSelecionada(conta)
    setBusca(conta.nome)
    setMostrarDropdown(false)
    if(lancamentos[conta.id]) {
        setValorInput(lancamentos[conta.id])
    } else {
        setValorInput('')
    }
  }

  const performSave = async (dados_atuais) => {
    try {
      const dados_limpos = {}
      Object.keys(dados_atuais).forEach(id => {
        if(dados_atuais[id]) {
          const digitsStr = String(dados_atuais[id]).replace(/\D/g, '')
          if (digitsStr !== '') {
            dados_limpos[id] = parseFloat(digitsStr) / 100
          }
        }
      })

      await axios.post(`${API_URL}/lancamentos`, {
        empresa_id: empresa.id,
        mes: parseInt(mes),
        ano: parseInt(ano),
        valores: dados_limpos,
        novas_contas: [] 
      })
    } catch (error) {
      console.error('Erro no autosave:', error)
    }
  }

  const handleRemoverConta = async (contaId) => {
      const novolanc = {...lancamentos}
      delete novolanc[contaId]
      setLancamentos(novolanc)
      await performSave(novolanc)
  }

  const handleAdicionarNaLista = async () => {
      if(!contaSelecionada || !valorInput) {
          alert('Selecione uma conta e digite um valor válido.')
          return
      }
      const novolanc = {
          ...lancamentos,
          [contaSelecionada.id]: valorInput
      }
      setLancamentos(novolanc)
      setBusca('')
      setContaSelecionada(null)
      setValorInput('')
      
      await performSave(novolanc)
  }

  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
          handleAdicionarNaLista()
      }
  }

  const handleViewBalanço = () => {
      onViewBalanco(parseInt(mes), parseInt(ano))
  }

  const handleLimparTudo = async () => {
    if(window.confirm('Tem certeza que deseja limpar TODOS os lançamentos deste período?')) {
      try {
        await axios.post(`${API_URL}/lancamentos/limpar`, {
          empresa_id: empresa.id,
          mes: parseInt(mes),
          ano: parseInt(ano)
        })
        setLancamentos({})
      } catch (error) {
        console.error('Erro ao limpar:', error)
      }
    }
  }

  const handleEditarLancamento = (conta) => {
    setContaSelecionada(conta)
    setBusca(conta.nome)
    setValorInput(lancamentos[conta.id])
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => {
        if(valorInputRef.current) {
            valorInputRef.current.focus()
            if(valorInputRef.current.select) valorInputRef.current.select()
        }
    }, 300)
  }

  const contasFiltradas = contasPadrao.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.grupo.toLowerCase().includes(busca.toLowerCase())
  )

  const contasJaAdicionadasIds = Object.keys(lancamentos).map(id => parseInt(id))
  
  // Separando para visualização
  const ativosAdicionados = contasPadrao.filter(c => c.grupo === 'Ativo' && contasJaAdicionadasIds.includes(c.id))
  const passivosPLAdicionados = contasPadrao.filter(c => c.grupo === 'Passivo e PL' && contasJaAdicionadasIds.includes(c.id))

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-slate-200">
      
      {/* Cabeçalho Período */}
      <div className="flex justify-between items-center mb-8 border-b pb-4 border-slate-100">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 bg-slate-100 rounded-md">
          &larr; Voltar
        </button>
        <div className="flex gap-4 items-center">
          <label className="font-semibold text-slate-700">Competência:</label>
          <select value={mes} onChange={e => setMes(e.target.value)} className="border p-2 rounded-md shadow-sm">
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
            ))}
          </select>
          <span className="text-slate-400">/</span>
          <input 
            type="number" 
            value={ano} 
            onChange={e => setAno(e.target.value)} 
            className="border p-2 rounded-md w-24 shadow-sm"
          />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-slate-800">
         Contas do Balanço - {empresa.nome}
      </h2>

      {/* Area de Input Autocomplete */}
      <div className="bg-slate-50 p-6 rounded-md border border-slate-200 mb-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-700 mb-4">Adicionar / Editar Conta</h3>
        
        <div className="flex flex-col md:flex-row gap-4">
            
            <div className="flex-1 relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-slate-600 mb-1">Buscar Conta</label>
                <input 
                    type="text" 
                    className="w-full border p-3 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o nome da conta (ex: Caixa, Computadores...)"
                    value={busca}
                    onChange={(e) => {
                        setBusca(e.target.value)
                        setContaSelecionada(null)
                        setMostrarDropdown(true)
                    }}
                    onFocus={() => setMostrarDropdown(true)}
                />
                
                {/* Dropdown de Resultados */}
                {mostrarDropdown && contasFiltradas.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {contasFiltradas.map(c => (
                            <li 
                                key={c.id} 
                                onClick={() => handleSelecionarConta(c)}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between"
                            >
                                <span className="font-medium text-slate-700">{c.nome}</span>
                                <span className="text-xs text-slate-500 tracking-wider bg-slate-200 px-2 py-1 rounded">
                                    {c.grupo} &rarr; {c.subgrupo}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="w-full md:w-1/4">
                <label className="block text-sm font-medium text-slate-600 mb-1">Valor do Saldo</label>
                <input 
                    type="text" 
                    ref={valorInputRef}
                    className="w-full border p-3 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="R$ 0,00"
                    value={valorInput}
                    onChange={handleValorInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={!contaSelecionada}
                />
            </div>

            <div className="flex items-end">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition shadow-sm w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAdicionarNaLista}
                  disabled={!contaSelecionada || !valorInput}
                >
                  Confirmar Saldo
                </button>
            </div>
        </div>

        {/* Indicação visual da conta selecionada atualmente */}
        {contaSelecionada && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-center justify-between">
                <span className="text-blue-800 text-sm">
                   Conta pronta para registro: <strong>{contaSelecionada.nome}</strong> 
                </span>
                <span className="text-xs px-2 py-1 bg-white border rounded text-slate-600 shadow-sm">
                    Destino no Balanço: <strong>{contaSelecionada.grupo}</strong> - {contaSelecionada.subgrupo}
                </span>
            </div>
        )}
      </div>

      {/* Lista de Contas já Adicionadas */}
      <h3 className="text-xl font-bold mb-4 text-slate-800">Contas Registradas neste Período</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-md border border-slate-200">
        
        {/* Ativos Cadastrados */}
        <div>
          <h4 className="text-lg font-bold border-b-2 border-blue-600 pb-2 mb-4 text-blue-800">Lado do Ativo</h4>
          {ativosAdicionados.length === 0 ? (
              <p className="text-slate-400 italic text-sm">Nenhum ativo registrado.</p>
          ) : (
              <ul className="space-y-2">
                  {ativosAdicionados.map(conta => (
                      <li key={conta.id} className="flex justify-between items-center p-2 bg-white rounded border border-slate-200 shadow-sm group">
                          <div className="flex flex-col">
                              <span className={`font-medium text-sm ${conta.nome.includes('Depreciação') ? 'text-red-600' : 'text-slate-700'}`}>{conta.nome}</span>
                              <span className="text-xs text-slate-400">{conta.subgrupo}</span>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="font-semibold text-slate-800 text-sm">{lancamentos[conta.id]}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                <button onClick={() => handleEditarLancamento(conta)} className="text-blue-500 hover:text-blue-700 bg-blue-50 px-2 rounded font-bold" title="Editar Valor">✏️</button>
                                <button onClick={() => handleRemoverConta(conta.id)} className="text-red-400 hover:text-red-600 font-bold px-2 py-1 bg-red-50 rounded" title="Remover">&times;</button>
                              </div>
                          </div>
                      </li>
                  ))}
              </ul>
          )}
        </div>

        {/* Passivos e PL Cadastrados */}
        <div>
          <h4 className="text-lg font-bold border-b-2 border-green-600 pb-2 mb-4 text-green-800">Lado do Passivo e P.L.</h4>
          {passivosPLAdicionados.length === 0 ? (
               <p className="text-slate-400 italic text-sm">Nenhum passivo registrado.</p>
          ) : (
              <ul className="space-y-2">
                  {passivosPLAdicionados.map(conta => (
                      <li key={conta.id} className="flex justify-between items-center p-2 bg-white rounded border border-slate-200 shadow-sm group">
                          <div className="flex flex-col">
                              <span className="font-medium text-sm text-slate-700">{conta.nome}</span>
                              <span className="text-xs text-slate-400">{conta.subgrupo}</span>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="font-semibold text-slate-800 text-sm">{lancamentos[conta.id]}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                <button onClick={() => handleEditarLancamento(conta)} className="text-blue-500 hover:text-blue-700 bg-blue-50 px-2 rounded font-bold" title="Editar Valor">✏️</button>
                                <button onClick={() => handleRemoverConta(conta.id)} className="text-red-400 hover:text-red-600 font-bold px-2 py-1 bg-red-50 rounded" title="Remover">&times;</button>
                              </div>
                          </div>
                      </li>
                  ))}
              </ul>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between gap-4">
        <button 
          onClick={handleLimparTudo}
          className="px-6 py-3 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition font-medium"
        >
          Limpar Todos Lançamentos
        </button>
        <button 
          onClick={handleViewBalanço}
          disabled={contasJaAdicionadasIds.length === 0}
          className="px-8 py-3 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition font-bold disabled:opacity-50 flex items-center justify-center min-w-[300px]"
        >
          Visualizar o Balanço Pronto &rarr;
        </button>
      </div>
    </div>
  )
}
