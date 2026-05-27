export const IR_ALIQUOTA = 0.15
export const CSLL_ALIQUOTA = 0.09
export const PARTICIPACAO_ALIQUOTA = 0.10

export function somarPorSubgrupo(lancamentos, grupo, subgrupo = null) {
  return lancamentos
    .filter((l) => l.grupo === grupo && (subgrupo === null || l.subgrupo === subgrupo))
    .reduce((acc, l) => acc + (l.valor || 0), 0)
}

export function somarAbsPorSubgrupo(lancamentos, grupo, subgrupo = null) {
  return lancamentos
    .filter((l) => l.grupo === grupo && (subgrupo === null || l.subgrupo === subgrupo))
    .reduce((acc, l) => acc + Math.abs(l.valor || 0), 0)
}

export function calcularParticipacoes(base) {
  const debentures = base * PARTICIPACAO_ALIQUOTA
  const basePosDeb = base - debentures
  const empregados = basePosDeb * PARTICIPACAO_ALIQUOTA
  const basePosEmp = basePosDeb - empregados
  const administradores = basePosEmp * PARTICIPACAO_ALIQUOTA

  return {
    debentures,
    empregados,
    administradores,
    total: debentures + empregados + administradores,
    basePosDeb,
    basePosEmp,
    basePosAdm: basePosEmp - administradores,
  }
}

export function calcularDre(lancamentos) {
  const receitaBruta = somarAbsPorSubgrupo(lancamentos, 'Receita Bruta')
  const deducoes = somarAbsPorSubgrupo(lancamentos, 'Deduções')
  const receitaLiquida = receitaBruta - deducoes

  const custos = somarAbsPorSubgrupo(lancamentos, 'Custos')
  const lucroBruto = receitaLiquida - custos

  const despVendas = somarAbsPorSubgrupo(lancamentos, 'Despesas Operacionais', 'Vendas')
  const despAdministrativas = somarAbsPorSubgrupo(lancamentos, 'Despesas Operacionais', 'Administrativas')
  const despFinanceiras = somarAbsPorSubgrupo(lancamentos, 'Despesas Operacionais', 'Financeiras')
  const outrasReceitasOp = somarPorSubgrupo(lancamentos, 'Despesas Operacionais', 'Outras Receitas')
  const outrasDespesasOp = somarAbsPorSubgrupo(lancamentos, 'Despesas Operacionais', 'Outras Despesas')

  const despesasOperacionais =
    despVendas + despAdministrativas + despFinanceiras + outrasDespesasOp + outrasReceitasOp

  const lucroOperacional = lucroBruto - despesasOperacionais

  const outrasReceitas = somarPorSubgrupo(lancamentos, 'Outras', 'Receitas')
  const outrasDespesas = somarAbsPorSubgrupo(lancamentos, 'Outras', 'Despesas')

  const resultadoAntesIR = lucroOperacional + outrasReceitas - outrasDespesas

  const ir = resultadoAntesIR * IR_ALIQUOTA
  const csll = resultadoAntesIR * CSLL_ALIQUOTA
  const resultadoAposIR = resultadoAntesIR - ir - csll

  const participacoes = calcularParticipacoes(resultadoAposIR)
  const lucroLiquido = resultadoAposIR - participacoes.total

  const detalheDeducoes = lancamentos.filter((l) => l.grupo === 'Deduções')
  const detalheCustos = lancamentos.filter((l) => l.grupo === 'Custos')
  const detalheVendas = lancamentos.filter(
    (l) => l.grupo === 'Despesas Operacionais' && l.subgrupo === 'Vendas'
  )
  const detalheAdm = lancamentos.filter(
    (l) => l.grupo === 'Despesas Operacionais' && l.subgrupo === 'Administrativas'
  )
  const detalheFin = lancamentos.filter(
    (l) => l.grupo === 'Despesas Operacionais' && l.subgrupo === 'Financeiras'
  )
  const detalheOutrasRecOp = lancamentos.filter(
    (l) => l.grupo === 'Despesas Operacionais' && l.subgrupo === 'Outras Receitas'
  )
  const detalheOutrasDespOp = lancamentos.filter(
    (l) => l.grupo === 'Despesas Operacionais' && l.subgrupo === 'Outras Despesas'
  )

  return {
    receitaBruta,
    deducoes,
    receitaLiquida,
    custos,
    lucroBruto,
    despVendas,
    despAdministrativas,
    despFinanceiras,
    outrasReceitasOp,
    outrasDespesasOp,
    despesasOperacionais,
    lucroOperacional,
    outrasReceitas,
    outrasDespesas,
    resultadoAntesIR,
    ir,
    csll,
    resultadoAposIR,
    participacoes,
    lucroLiquido,
    detalheDeducoes,
    detalheCustos,
    detalheVendas,
    detalheAdm,
    detalheFin,
    detalheOutrasRecOp,
    detalheOutrasDespOp,
  }
}

export function lancamentosFromMap(contasPadrao, lancamentosMap) {
  return contasPadrao
    .filter((c) => lancamentosMap[c.id])
    .map((c) => {
      const digitsStr = String(lancamentosMap[c.id]).replace(/\D/g, '')
      let valor = parseFloat(digitsStr) / 100
      if (c.sinal === 'negativo' && valor > 0) valor = -valor
      return {
        id: c.id,
        nome: c.nome,
        grupo: c.grupo,
        subgrupo: c.subgrupo,
        sinal: c.sinal || 'positivo',
        valor,
      }
    })
}
