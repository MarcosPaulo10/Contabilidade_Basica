import { useState, useEffect } from 'react'
import axios from 'axios'
import { calcularDre, IR_ALIQUOTA, CSLL_ALIQUOTA, PARTICIPACAO_ALIQUOTA } from '../utils/dreCalculos'

const API_URL = 'http://127.0.0.1:5000/api'

function formatMoney(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function Linha({ label, valor, indent = 0, bold = false, prefix = '' }) {
  const pad = { paddingLeft: `${indent * 16}px` }
  return (
    <div className={`flex justify-between py-0.5 text-xs ${bold ? 'font-bold' : ''}`} style={pad}>
      <span>{prefix}{label}</span>
      <span className="tabular-nums">{formatMoney(valor)}</span>
    </div>
  )
}

function LinhaConta({ nome, valor, indent = 2 }) {
  const pad = { paddingLeft: `${indent * 16}px` }
  return (
    <div className="flex justify-between py-0.5 text-xs text-slate-700" style={pad}>
      <span>{nome}</span>
      <span className="tabular-nums">{formatMoney(Math.abs(valor))}</span>
    </div>
  )
}

function LinhaTotal({ label, valor, prefix = '= ' }) {
  return (
    <div className="flex justify-between py-1 text-xs font-bold border-t border-slate-300 mt-1">
      <span>{prefix}{label}</span>
      <span className="tabular-nums">{formatMoney(valor)}</span>
    </div>
  )
}

export default function DreView({ empresa, periodo, onBack }) {
  const [lancamentos, setLancamentos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get(`${API_URL}/lancamentos`, {
        params: {
          empresa_id: empresa.id,
          mes: periodo.mes,
          ano: periodo.ano,
          demonstrativo: 'DRE',
        },
      })
      .then((res) => setLancamentos(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [empresa.id, periodo.mes, periodo.ano])

  if (loading) return <div className="text-center p-8">Carregando DRE...</div>

  const dre = calcularDre(lancamentos)
  const semDados = lancamentos.length === 0

  return (
    <div className="pb-16 flex flex-col items-center">
      <div className="w-full max-w-3xl flex justify-between mb-4 print:hidden">
        <button
          onClick={onBack}
          className="text-slate-600 hover:text-slate-800 font-medium px-4 py-2 border rounded-md bg-white shadow-sm"
        >
          &larr; Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="bg-slate-800 text-white px-6 py-2 rounded-md font-medium shadow-sm hover:bg-slate-700"
        >
          Imprimir / PDF
        </button>
      </div>

      {semDados && (
        <div className="w-full max-w-3xl bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 print:hidden">
          Nenhum lançamento DRE neste período. Preencha os valores antes de gerar o relatório.
        </div>
      )}

      <div className="a4-sheet text-sm text-slate-800 font-serif" id="print-area">
        <div className="text-center mb-6 border-b-2 border-slate-800 pb-3">
          <h1 className="text-xl font-bold tracking-wide">
            DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO
          </h1>
          <p className="text-base font-semibold mt-1">{empresa.nome.toUpperCase()}</p>
          <p className="text-slate-600 mt-1 text-xs">
            Exercício encerrado em{' '}
            {new Date(periodo.ano, periodo.mes, 0).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <Linha label="RECEITA OPERACIONAL BRUTA" valor={dre.receitaBruta} bold />

        <div className="mt-2">
          <Linha label="(-) DEDUÇÕES DA RECEITA BRUTA" valor={dre.deducoes} bold prefix="(-) " />
          {dre.detalheDeducoes.map((l) => (
            <LinhaConta key={l.id} nome={l.nome} valor={l.valor} />
          ))}
        </div>

        <LinhaTotal label="RECEITA OPERACIONAL LÍQUIDA" valor={dre.receitaLiquida} />

        <div className="mt-3">
          <div className="font-bold text-xs mb-1">(-) CUSTOS DAS VENDAS</div>
          {dre.detalheCustos.map((l) => (
            <LinhaConta key={l.id} nome={l.nome} valor={l.valor} indent={1} />
          ))}
        </div>

        <LinhaTotal label="RESULTADO OPERACIONAL BRUTO ou LUCRO BRUTO" valor={dre.lucroBruto} />

        <div className="mt-3">
          <Linha
            label="(-) DESPESAS OPERACIONAIS"
            valor={dre.despesasOperacionais}
            bold
            prefix="(-) "
          />

          <div className="mt-1">
            <Linha label="(-) Despesas Com Vendas" valor={dre.despVendas} indent={1} prefix="(-) " />
            {dre.detalheVendas.map((l) => (
              <LinhaConta key={l.id} nome={l.nome} valor={l.valor} indent={2} />
            ))}
          </div>

          <div className="mt-1">
            <Linha
              label="(-) Despesas Administrativas"
              valor={dre.despAdministrativas}
              indent={1}
              prefix="(-) "
            />
            {dre.detalheAdm.map((l) => (
              <LinhaConta key={l.id} nome={l.nome} valor={l.valor} indent={2} />
            ))}
          </div>

          <div className="mt-1">
            <Linha
              label="(-) Despesas Financeiras"
              valor={dre.despFinanceiras}
              indent={1}
              prefix="(-) "
            />
            {dre.detalheFin.map((l) => (
              <LinhaConta key={l.id} nome={l.nome} valor={l.valor} indent={2} />
            ))}
          </div>

          {dre.detalheOutrasRecOp.length > 0 && (
            <div className="mt-1">
              <Linha
                label="(+) Outras Receitas Operacionais"
                valor={Math.abs(dre.outrasReceitasOp)}
                indent={1}
                prefix="(+) "
              />
              {dre.detalheOutrasRecOp.map((l) => (
                <LinhaConta key={l.id} nome={l.nome} valor={l.valor} indent={2} />
              ))}
            </div>
          )}

          <div className="mt-1">
            <Linha
              label="(-) Outras Despesas Operacionais"
              valor={dre.outrasDespesasOp}
              indent={1}
              prefix="(-) "
            />
            {dre.detalheOutrasDespOp.map((l) => (
              <LinhaConta key={l.id} nome={l.nome} valor={l.valor} indent={2} />
            ))}
          </div>
        </div>

        <LinhaTotal label="LUCRO OPERACIONAL" valor={dre.lucroOperacional} prefix="" />

        <div className="mt-3">
          <Linha label="(+) OUTRAS RECEITAS" valor={Math.abs(dre.outrasReceitas)} prefix="(+) " />
          <Linha label="(-) OUTRAS DESPESAS" valor={dre.outrasDespesas} prefix="(-) " />
        </div>

        <LinhaTotal
          label="RESULTADO DO EXERCÍCIO ANTES DO IMPOSTO DE RENDA – IR E DA CONTRIBUIÇÃO SOCIAL SOBRE O LUCRO – CSLL"
          valor={dre.resultadoAntesIR}
        />

        <div className="mt-4 border-t border-slate-200 pt-3">
          <Linha
            label={`(-) Provisão para Imposto de Renda (${IR_ALIQUOTA * 100}%)`}
            valor={dre.ir}
            prefix="(-) "
          />
          <p className="text-[10px] text-slate-500 pl-4 mb-1">
            ({IR_ALIQUOTA * 100}% de {formatMoney(dre.resultadoAntesIR)})
          </p>
          <Linha
            label={`(-) Provisão para CSLL (${CSLL_ALIQUOTA * 100}%)`}
            valor={dre.csll}
            prefix="(-) "
          />
          <p className="text-[10px] text-slate-500 pl-4 mb-1">
            ({CSLL_ALIQUOTA * 100}% de {formatMoney(dre.resultadoAntesIR)})
          </p>

          <LinhaTotal
            label="RESULTADO DO EXERCÍCIO DEPOIS DO IR e CSLL ou ANTES DAS PARTICIPAÇÕES"
            valor={dre.resultadoAposIR}
          />

          <div className="mt-3">
            <Linha label="(-) Participações" valor={dre.participacoes.total} prefix="(-) " bold />
            <LinhaConta
              nome={`Debêntures ${PARTICIPACAO_ALIQUOTA * 100}%`}
              valor={dre.participacoes.debentures}
              indent={2}
            />
            <p className="text-[10px] text-slate-500 pl-8">
              ({PARTICIPACAO_ALIQUOTA * 100}% de {formatMoney(dre.resultadoAposIR)})
            </p>
            <LinhaConta
              nome={`Empregados ${PARTICIPACAO_ALIQUOTA * 100}%`}
              valor={dre.participacoes.empregados}
              indent={2}
            />
            <p className="text-[10px] text-slate-500 pl-8">
              ({PARTICIPACAO_ALIQUOTA * 100}% de {formatMoney(dre.participacoes.basePosDeb)})
            </p>
            <LinhaConta
              nome={`Administradores ${PARTICIPACAO_ALIQUOTA * 100}%`}
              valor={dre.participacoes.administradores}
              indent={2}
            />
            <p className="text-[10px] text-slate-500 pl-8">
              ({PARTICIPACAO_ALIQUOTA * 100}% de {formatMoney(dre.participacoes.basePosEmp)})
            </p>
          </div>

          <div className="flex justify-between py-2 text-sm font-bold border-t-2 border-double border-slate-800 mt-4">
            <span>(=) RESULTADO LÍQUIDO DO EXERCÍCIO</span>
            <span className="tabular-nums">{formatMoney(dre.lucroLiquido)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
