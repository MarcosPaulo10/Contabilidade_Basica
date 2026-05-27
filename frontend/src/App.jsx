import { useState } from 'react'
import CompanyForm from './components/CompanyForm'
import ValoresInput from './components/ValoresInput'
import BalancoView from './components/BalancoView'
import ContasPadraoManager from './components/ContasPadraoManager'
import DreValoresInput from './components/DreValoresInput'
import DreView from './components/DreView'
import ContasPadraoDreManager from './components/ContasPadraoDreManager'

function App() {
  const [ferramenta, setFerramenta] = useState(null)
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null)
  const [periodoSelecionado, setPeriodoSelecionado] = useState(null)
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false)
  const [mostrarContas, setMostrarContas] = useState(false)

  const resetFluxo = () => {
    setEmpresaSelecionada(null)
    setPeriodoSelecionado(null)
    setMostrarRelatorio(false)
    setMostrarContas(false)
  }

  const voltarInicio = () => {
    setFerramenta(null)
    resetFluxo()
  }

  const titulo =
    ferramenta === 'DRE'
      ? 'Demonstração do Resultado (DRE)'
      : ferramenta === 'BP'
        ? 'Balanço Patrimonial'
        : 'Sistema de Contabilidade Básica'

  return (
    <div className="min-h-screen">
      <header className="bg-slate-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">{titulo}</h1>
            {ferramenta && !mostrarContas && (
              <button
                onClick={voltarInicio}
                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded"
              >
                Trocar ferramenta
              </button>
            )}
          </div>
          {empresaSelecionada && !mostrarContas && ferramenta && (
            <div className="text-sm">
              Empresa:{' '}
              <span className="font-semibold text-blue-300">{empresaSelecionada.nome}</span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 py-8">
        {!ferramenta ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <p className="text-center text-slate-600">Escolha a demonstração contábil:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setFerramenta('BP')}
                className="bg-white border-2 border-slate-200 hover:border-blue-500 rounded-xl p-8 text-left shadow-sm hover:shadow-md transition"
              >
                <h2 className="text-xl font-bold text-slate-800 mb-2">Balanço Patrimonial</h2>
                <p className="text-slate-600 text-sm">
                  Lançar saldos de ativo, passivo e patrimônio líquido por competência.
                </p>
              </button>
              <button
                onClick={() => setFerramenta('DRE')}
                className="bg-white border-2 border-slate-200 hover:border-indigo-500 rounded-xl p-8 text-left shadow-sm hover:shadow-md transition"
              >
                <h2 className="text-xl font-bold text-indigo-900 mb-2">DRE</h2>
                <p className="text-slate-600 text-sm">
                  Preencher receitas, custos e despesas; calcular lucro líquido e imprimir.
                </p>
              </button>
            </div>
          </div>
        ) : mostrarContas ? (
          ferramenta === 'DRE' ? (
            <ContasPadraoDreManager onBack={() => setMostrarContas(false)} />
          ) : (
            <ContasPadraoManager onBack={() => setMostrarContas(false)} />
          )
        ) : !empresaSelecionada ? (
          <div className="space-y-6">
            <div className="max-w-2xl mx-auto flex justify-end">
              <button
                onClick={() => setMostrarContas(true)}
                className="bg-slate-600 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700"
              >
                Gerenciar Contas Padrão
              </button>
            </div>
            <CompanyForm onSelect={setEmpresaSelecionada} />
          </div>
        ) : !mostrarRelatorio ? (
          ferramenta === 'DRE' ? (
            <DreValoresInput
              empresa={empresaSelecionada}
              onViewDre={(mes, ano) => {
                setPeriodoSelecionado({ mes, ano })
                setMostrarRelatorio(true)
              }}
              onBack={() => setEmpresaSelecionada(null)}
            />
          ) : (
            <ValoresInput
              empresa={empresaSelecionada}
              onViewBalanco={(mes, ano) => {
                setPeriodoSelecionado({ mes, ano })
                setMostrarRelatorio(true)
              }}
              onBack={() => setEmpresaSelecionada(null)}
            />
          )
        ) : ferramenta === 'DRE' ? (
          <DreView
            empresa={empresaSelecionada}
            periodo={periodoSelecionado}
            onBack={() => setMostrarRelatorio(false)}
          />
        ) : (
          <BalancoView
            empresa={empresaSelecionada}
            periodo={periodoSelecionado}
            onBack={() => setMostrarRelatorio(false)}
          />
        )}
      </main>
    </div>
  )
}

export default App
