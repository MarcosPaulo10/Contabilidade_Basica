import { useState } from 'react'
import CompanyForm from './components/CompanyForm'
import ValoresInput from './components/ValoresInput'
import BalancoView from './components/BalancoView'

function App() {
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null)
  const [periodoSelecionado, setPeriodoSelecionado] = useState(null)
  const [mostrarBalanco, setMostrarBalanco] = useState(false)

  return (
    <div className="min-h-screen">
      <header className="bg-slate-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Sistema de Contabilidade Básica</h1>
          {empresaSelecionada && (
            <div className="text-sm">
              Empresa Ativa: <span className="font-semibold text-blue-300">{empresaSelecionada.nome}</span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 py-8">
        {!empresaSelecionada ? (
          <CompanyForm onSelect={setEmpresaSelecionada} />
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
