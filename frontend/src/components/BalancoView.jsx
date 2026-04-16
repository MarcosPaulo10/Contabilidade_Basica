import { useState, useEffect } from 'react'
import axios from 'axios'

export default function BalancoView({ empresa, periodo, onBack }) {
  const [lancamentos, setLancamentos] = useState([])
  const [loading, setLoading] = useState(true)

  const API_URL = 'http://127.0.0.1:5000/api'

  useEffect(() => {
    fetchLancamentos()
  }, [])

  const fetchLancamentos = async () => {
    try {
      const res = await axios.get(`${API_URL}/lancamentos`, {
        params: { empresa_id: empresa.id, mes: periodo.mes, ano: periodo.ano }
      })
      setLancamentos(res.data)
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  // Agrupamento e Totais
  const getSubgrupo = (grupoMaior, nomeSub) => lancamentos.filter(l => l.grupo === grupoMaior && l.subgrupo === nomeSub)
  const calcTotal = (arr) => arr.reduce((acc, curr) => acc + curr.valor, 0)

  const ativoCirculante = getSubgrupo('Ativo', 'Circulante')
  const totalAC = calcTotal(ativoCirculante)

  const realizavel = getSubgrupo('Ativo', 'Realizável a Longo Prazo')
  const investimentos = getSubgrupo('Ativo', 'Investimentos')
  const imobilizado = getSubgrupo('Ativo', 'Imobilizado')
  const intangivel = getSubgrupo('Ativo', 'Intangível')
  
  const totalANC = calcTotal(realizavel) + calcTotal(investimentos) + calcTotal(imobilizado) + calcTotal(intangivel)
  const totalAtivo = totalAC + totalANC

  const passivoCirculante = getSubgrupo('Passivo', 'Circulante')
  const totalPC = calcTotal(passivoCirculante)

  const passivoNaoCirculante = getSubgrupo('Passivo', 'Não Circulante')
  const totalPNC = calcTotal(passivoNaoCirculante)

  const patrimonioLiquido = getSubgrupo('Patrimônio Líquido', 'Patrimônio Líquido')
  const totalPL = calcTotal(patrimonioLiquido)

  const totalPassivoEPL = totalPC + totalPNC + totalPL

  const balancoOk = Math.abs(totalAtivo - totalPassivoEPL) < 0.01

  if (loading) return <div className="text-center p-8">Carregando balanço...</div>

  return (
    <div className="pb-16 flex flex-col items-center">
      <div className="w-full max-w-4xl flex justify-between mb-4">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-800 font-medium px-4 py-2 border rounded-md bg-white shadow-sm">
          &larr; Voltar
        </button>
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-6 py-2 rounded-md font-medium shadow-sm hover:bg-slate-700">
          Imprimir / PDF
        </button>
      </div>

      {!balancoOk && (
        <div className="w-full max-w-4xl bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold">Atenção: Balanço Desequilibrado!</p>
          <p>O Total do Ativo ({formatMoney(totalAtivo)}) é diferente do Total do Passivo e PL ({formatMoney(totalPassivoEPL)}).</p>
          <p className="text-sm mt-1">Diferença de: {formatMoney(Math.abs(totalAtivo - totalPassivoEPL))}</p>
        </div>
      )}

      <div className="a4-sheet text-sm text-slate-800 font-serif" id="print-area">
        <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-wider">BALANÇO PATRIMONIAL - {empresa.nome.toUpperCase()}</h1>
          <p className="text-slate-600 mt-2">Em {new Date(periodo.ano, periodo.mes, 0).toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="flex w-full divide-x divide-slate-800">
          {/* Lado Esquerdo - Ativo */}
          <div className="w-1/2 pr-4 flex flex-col h-full">
            <h2 className="font-bold border-b border-slate-300 pb-1 mb-2 text-center bg-slate-100">ATIVO</h2>
            
            <div className="flex-1">
              <h3 className="font-bold text-xs mt-2 mb-1">CIRCULANTE</h3>
              {ativoCirculante.map(l => (
                <div key={l.id} className="flex justify-between pl-4 text-xs py-0.5">
                  <span>{l.nome}</span>
                  <span>{formatMoney(l.valor)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-xs mt-2 border-t border-slate-200 pt-1">
                <span>TOTAL DO CIRCULANTE</span>
                <span>{formatMoney(totalAC)}</span>
              </div>

              <h3 className="font-bold text-xs mt-4 mb-1">NÃO CIRCULANTE</h3>
              {realizavel.length > 0 && <h4 className="italic text-xs pl-2">Realizável a Longo Prazo</h4>}
              {realizavel.map(l => (
                <div key={l.id} className="flex justify-between pl-6 text-xs py-0.5">
                  <span>{l.nome}</span>
                  <span>{formatMoney(l.valor)}</span>
                </div>
              ))}
              
              {investimentos.length > 0 && <h4 className="italic text-xs pl-2 mt-2">Investimentos</h4>}
              {investimentos.map(l => (
                <div key={l.id} className="flex justify-between pl-6 text-xs py-0.5">
                  <span>{l.nome}</span>
                  <span>{formatMoney(l.valor)}</span>
                </div>
              ))}

              {imobilizado.length > 0 && <h4 className="italic text-xs pl-2 mt-2">Imobilizado</h4>}
              {imobilizado.map(l => (
                <div key={l.id} className="flex justify-between pl-6 text-xs py-0.5">
                  <span className={l.valor < 0 ? 'text-red-700' : ''}>{l.nome}</span>
                  <span className={l.valor < 0 ? 'text-red-700' : ''}>{l.valor < 0 ? `(${formatMoney(Math.abs(l.valor))})` : formatMoney(l.valor)}</span>
                </div>
              ))}

              {intangivel.length > 0 && <h4 className="italic text-xs pl-2 mt-2">Intangível</h4>}
              {intangivel.map(l => (
                <div key={l.id} className="flex justify-between pl-6 text-xs py-0.5">
                  <span>{l.nome}</span>
                  <span>{formatMoney(l.valor)}</span>
                </div>
              ))}

              <div className="flex justify-between font-bold text-xs mt-2 border-t border-slate-200 pt-1">
                <span>TOTAL DO NÃO CIRCULANTE</span>
                <span>{formatMoney(totalANC)}</span>
              </div>
            </div>
          </div>

          {/* Lado Direito - Passivo & PL */}
          <div className="w-1/2 pl-4 flex flex-col h-full">
            <h2 className="font-bold border-b border-slate-300 pb-1 mb-2 text-center bg-slate-100">PASSIVO E PL</h2>
            
            <div className="flex-1">
              <h3 className="font-bold text-xs mt-2 mb-1">CIRCULANTE</h3>
              {passivoCirculante.map(l => (
                <div key={l.id} className="flex justify-between pl-4 text-xs py-0.5">
                  <span>{l.nome}</span>
                  <span>{formatMoney(l.valor)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-xs mt-2 border-t border-slate-200 pt-1">
                <span>TOTAL DO CIRCULANTE</span>
                <span>{formatMoney(totalPC)}</span>
              </div>

              <h3 className="font-bold text-xs mt-4 mb-1">NÃO CIRCULANTE</h3>
              {passivoNaoCirculante.map(l => (
                <div key={l.id} className="flex justify-between pl-4 text-xs py-0.5">
                  <span>{l.nome}</span>
                  <span>{formatMoney(l.valor)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-xs mt-2 border-t border-slate-200 pt-1">
                <span>TOTAL DO NÃO CIRCULANTE</span>
                <span>{formatMoney(totalPNC)}</span>
              </div>

              <h3 className="font-bold text-xs mt-6 mb-1">PATRIMÔNIO LÍQUIDO</h3>
              {patrimonioLiquido.map(l => (
                <div key={l.id} className="flex justify-between pl-4 text-xs py-0.5">
                  <span>{l.nome}</span>
                  <span>{formatMoney(l.valor)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-xs mt-2 border-t border-slate-200 pt-1">
                <span>TOTAL DO PATRIMÔNIO LÍQUIDO</span>
                <span>{formatMoney(totalPL)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Totais - Mesma Linha */}
        <div className="flex w-full divide-x divide-transparent mt-8 border-t-2 border-double border-slate-800 pt-2">
          <div className="w-1/2 pr-4 flex justify-between font-bold text-sm">
            <span>TOTAL ATIVO</span>
            <span>{formatMoney(totalAtivo)}</span>
          </div>
          <div className="w-1/2 pl-4 flex justify-between font-bold text-sm">
            <span>TOTAL PASSIVO E PL</span>
            <span className={!balancoOk ? 'text-red-600' : ''}>{formatMoney(totalPassivoEPL)}</span>
          </div>
        </div>

      </div>
    </div>
  )
}
