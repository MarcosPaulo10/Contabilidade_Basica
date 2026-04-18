import { useState } from 'react'
import CompanyForm from './components/CompanyForm'
import ValoresInput from './components/ValoresInput'
import BalancoView from './components/BalancoView'
import ContasPadraoManager from './components/ContasPadraoManager'

function App() {
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null)
  const [periodoSelecionado, setPeriodoSelecionado] = useState(null)
  const [mostrarBalanco, setMostrarBalanco] = useState(false)
  const [mostrarContas, setMostrarContas] = useState(false)

  return (
    <div className="min-h-screen">
      <header className="bg-slate-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Sistema de Contabilidade Básica</h1>
          {empresaSelecionada && !mostrarContas && (
            <div className="text-sm">
              Empresa Ativa: <span className="font-semibold text-blue-300">{empresaSelecionada.nome}</span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 py-8">
        {mostrarContas ? (
          <ContasPadraoManager onBack={() => setMostrarContas(false)} />
        ) : !empresaSelecionada ? (
          <div className="space-y-6">
            <div className="max-w-2xl mx-auto flex justify-end">
               <button 
                onClick={() => setMostrarContas(true)} 
                className="bg-slate-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-slate-700 transition font-medium text-sm border border-slate-500"
               >
                 🔧 Gerenciar Contas Padrão
               </button>
            </div>
            <CompanyForm onSelect={setEmpresaSelecionada} />
          </div>
        ) : !mostrarBalanco ? (
          <ValoresInput 
            empresa={empresaSelecionada} 
            onViewBalanco={(mes, ano) => {
              setPeriodoSelecionado({ mes, ano })
              setMostrarBalanco(true)
            }}
            onBack={() => setEmpresaSelecionada(null)}
          />
        ) : (
          <BalancoView 
            empresa={empresaSelecionada} 
            periodo={periodoSelecionado} 
            onBack={() => setMostrarBalanco(false)} 
          />
        )}
      </main>
    </div>
  )
}

export default App
