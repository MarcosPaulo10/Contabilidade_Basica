import { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import { calcularDre, lancamentosFromMap } from '../utils/dreCalculos'

const API_URL = 'http://127.0.0.1:5000/api'

const SECOES_ORDEM = [
  { grupo: 'Receita Bruta', titulo: 'Receita Operacional Bruta' },
  { grupo: 'Deduções', titulo: '(-) Deduções da Receita Bruta' },
  { grupo: 'Custos', titulo: '(-) Custos das Vendas' },
  { grupo: 'Despesas Operacionais', titulo: '(-) Despesas Operacionais' },
  { grupo: 'Outras', titulo: 'Outras Receitas e Despesas' },
]

export default function DreValoresInput({ empresa, onViewDre, onBack }) {
  const [contasPadrao, setContasPadrao] = useState([])
  const [lancamentos, setLancamentos] = useState({})
  const [mes, setMes] = useState(12)
  const [ano, setAno] = useState(2026)
  const [busca, setBusca] = useState('')
  const [contaSelecionada, setContaSelecionada] = useState(null)
  const [valorInput, setValorInput] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)

  const dropdownRef = useRef(null)
  const valorInputRef = useRef(null)

  useEffect(() => {
    axios.get(`${API_URL}/contas`, { params: { demonstrativo: 'DRE' } }).then((res) => {
      setContasPadrao(res.data)
    })
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    axios
      .get(`${API_URL}/lancamentos`, {
        params: { empresa_id: empresa.id, mes, ano, demonstrativo: 'DRE' },
      })
      .then((res) => {
        const preenchidos = {}
        res.data.forEach((l) => {
          if (l.conta_padrao_id) {
            const centsStr = Math.abs(l.valor).toFixed(2).replace(/\D/g, '')
            preenchidos[l.conta_padrao_id] = formatCurrency(centsStr)
          }
        })
        setLancamentos(preenchidos)
      })
    setBusca('')
    setContaSelecionada(null)
    setValorInput('')
  }, [mes, ano, empresa.id])

  const preview = useMemo(() => {
    const lista = lancamentosFromMap(contasPadrao, lancamentos)
    return lista.length ? calcularDre(lista) : null
  }, [contasPadrao, lancamentos])

  const formatCurrency = (value) => {
    if (!value) return ''
    const number = String(value).replace(/\D/g, '')
    if (number === '') return ''
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      number / 100
    )
  }

  const formatMoney = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const performSave = async (dados) => {
    const dados_limpos = {}
    Object.keys(dados).forEach((id) => {
      if (dados[id]) {
        const digitsStr = String(dados[id]).replace(/\D/g, '')
        if (digitsStr !== '') dados_limpos[id] = parseFloat(digitsStr) / 100
      }
    })
    await axios.post(`${API_URL}/lancamentos`, {
      empresa_id: empresa.id,
      mes: parseInt(mes),
      ano: parseInt(ano),
      valores: dados_limpos,
      novas_contas: [],
      demonstrativo: 'DRE',
    })
  }

  const handleSelecionarConta = (conta) => {
    setContaSelecionada(conta)
    setBusca(conta.nome)
    setMostrarDropdown(false)
    setValorInput(lancamentos[conta.id] || '')
  }

  const handleAdicionar = async () => {
    if (!contaSelecionada || !valorInput) {
      alert('Selecione uma conta e informe o valor.')
      return
    }
    const novo = { ...lancamentos, [contaSelecionada.id]: valorInput }
    setLancamentos(novo)
    setBusca('')
    setContaSelecionada(null)
    setValorInput('')
    await performSave(novo)
  }

  const handleRemover = async (id) => {
    const novo = { ...lancamentos }
    delete novo[id]
    setLancamentos(novo)
    await performSave(novo)
  }

  const handleLimpar = async () => {
    if (!window.confirm('Limpar todos os lançamentos DRE deste período?')) return
    await axios.post(`${API_URL}/lancamentos/limpar`, {
      empresa_id: empresa.id,
      mes: parseInt(mes),
      ano: parseInt(ano),
      demonstrativo: 'DRE',
    })
    setLancamentos({})
  }

  const contasFiltradas = contasPadrao.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.grupo.toLowerCase().includes(busca.toLowerCase()) ||
      c.subgrupo.toLowerCase().includes(busca.toLowerCase())
  )

  const idsPreenchidos = Object.keys(lancamentos).map(Number)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg border border-slate-200">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 bg-slate-100 rounded-md"
        >
          &larr; Voltar
        </button>
        <div className="flex gap-3 items-center">
          <label className="font-semibold text-slate-700">Competência:</label>
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="border p-2 rounded-md"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')}
              </option>
            ))}
          </select>
          <span>/</span>
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="border p-2 rounded-md w-24"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Lançamentos DRE — {empresa.nome}
            </h2>

            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-6">
              <h3 className="font-bold text-slate-700 mb-3">Adicionar / Editar valor</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative" ref={dropdownRef}>
                  <input
                    type="text"
                    className="w-full border p-3 rounded-md"
                    placeholder="Buscar conta da DRE..."
                    value={busca}
                    onChange={(e) => {
                      setBusca(e.target.value)
                      setContaSelecionada(null)
                      setMostrarDropdown(true)
                    }}
                    onFocus={() => setMostrarDropdown(true)}
                  />
                  {mostrarDropdown && contasFiltradas.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {contasFiltradas.map((c) => (
                        <li
                          key={c.id}
                          onClick={() => handleSelecionarConta(c)}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b"
                        >
                          <span className="font-medium">{c.nome}</span>
                          <span className="text-xs text-slate-500 block">
                            {c.grupo} → {c.subgrupo}
                            {c.sinal === 'negativo' && ' (abate no total)'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <input
                  ref={valorInputRef}
                  type="text"
                  className="border p-3 rounded-md w-full md:w-36 text-right"
                  placeholder="R$ 0,00"
                  value={valorInput}
                  onChange={(e) => setValorInput(formatCurrency(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdicionar()}
                  disabled={!contaSelecionada}
                />
                <button
                  onClick={handleAdicionar}
                  disabled={!contaSelecionada || !valorInput}
                  className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
              {contaSelecionada && (
                <p className="mt-2 text-sm text-blue-800 bg-blue-50 p-2 rounded">
                  Destino na DRE: <strong>{contaSelecionada.grupo}</strong> —{' '}
                  {contaSelecionada.subgrupo}
                </p>
              )}
            </div>

            {SECOES_ORDEM.map((secao) => {
              const contasSecao = contasPadrao.filter((c) => c.grupo === secao.grupo)
              const preenchidas = contasSecao.filter((c) => idsPreenchidos.includes(c.id))
              if (preenchidas.length === 0) return null

              return (
                <div key={secao.grupo} className="mb-6">
                  <h4 className="font-bold text-slate-800 border-b-2 border-indigo-500 pb-1 mb-2">
                    {secao.titulo}
                  </h4>
                  <ul className="space-y-1">
                    {preenchidas.map((conta) => (
                      <li
                        key={conta.id}
                        className="flex justify-between items-center p-2 bg-slate-50 rounded border text-sm group"
                      >
                        <div>
                          <span className="font-medium">{conta.nome}</span>
                          <span className="text-xs text-slate-400 block">{conta.subgrupo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{lancamentos[conta.id]}</span>
                          <button
                            onClick={() => handleSelecionarConta(conta)}
                            className="opacity-0 group-hover:opacity-100 text-blue-600 text-xs"
                          >
                            editar
                          </button>
                          <button
                            onClick={() => handleRemover(conta.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleLimpar}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
            >
              Limpar período
            </button>
            <button
              onClick={() => onViewDre(parseInt(mes), parseInt(ano))}
              disabled={idsPreenchidos.length === 0}
              className="px-8 py-3 bg-indigo-800 text-white rounded-md font-bold disabled:opacity-50"
            >
              Ver DRE completa &rarr;
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm h-fit sticky top-4">
          <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">Prévia dos totais</h3>
          {preview ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Receita Líquida</span>
                <span className="font-medium">{formatMoney(preview.receitaLiquida)}</span>
              </div>
              <div className="flex justify-between">
                <span>Lucro Bruto</span>
                <span className="font-medium">{formatMoney(preview.lucroBruto)}</span>
              </div>
              <div className="flex justify-between">
                <span>Lucro Operacional</span>
                <span className="font-medium">{formatMoney(preview.lucroOperacional)}</span>
              </div>
              <div className="flex justify-between">
                <span>Antes IR/CSLL</span>
                <span className="font-medium">{formatMoney(preview.resultadoAntesIR)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-indigo-800">
                <span>Lucro Líquido</span>
                <span>{formatMoney(preview.lucroLiquido)}</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm italic">Preencha contas para ver os totais.</p>
          )}
        </div>
      </div>
    </div>
  )
}
