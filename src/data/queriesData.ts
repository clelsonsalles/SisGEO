export interface QueryItem {
  id: string;
  title: string;
  category: string;
  description: string;
  objective: string;
  sql: string;
}

export const QUERIES_LIST: QueryItem[] = [
  {
    id: 'relatorio-consolidado',
    title: 'Relatório Consolidado de OS por Secretaria & Projeto',
    category: 'Gerencial / BI',
    description: 'Agrupa as Ordens de Serviço totalizando a quantidade de profissionais alocados, percentual total e custo financeiro consolidado.',
    objective: 'Demonstrar o valor financeiro empenhado/executado por pasta governamental e projeto institucional, permitindo apuração de custos por centro de despesa.',
    sql: `SELECT 
    p.sigla_secretaria AS secretaria,
    p.sigla_projeto AS projeto,
    os.numero_os,
    os.ano_referencia,
    STRING_AGG(DISTINCT a.mes_referencia, ', ') AS meses_alocados,
    os.situacao_sgc,
    os.situacao_passivo_2026,
    COUNT(a.id) AS total_profissionais,
    COALESCE(SUM(a.percentual_alocacao), 0) AS total_percentual_alocado,
    COALESCE(SUM(a.custo_alocacao), 0.00) AS custo_total_os
FROM ordens_servico os
JOIN projetos p ON p.id = os.projeto_id
LEFT JOIN alocacoes_perfil_os a ON a.ordem_servico_id = os.id
GROUP BY 
    p.sigla_secretaria, p.sigla_projeto, os.id, os.numero_os, 
    os.ano_referencia, os.situacao_sgc, os.situacao_passivo_2026
ORDER BY p.sigla_secretaria, os.ano_referencia DESC, os.numero_os ASC;`
  },
  {
    id: 'detalhamento-equipe',
    title: 'Detalhamento de Equipe e Histórico Contratual por OS',
    category: 'Operacional / Auditoria',
    description: 'Lista cada profissional alocado em cada OS, evidenciando o snapshot do documento de referência e custo histórico.',
    objective: 'Garantir a rastreabilidade e integridade histórica do custo unitário do profissional e documento contratual no instante exato da alocação.',
    sql: `SELECT 
    os.numero_os,
    a.mes_referencia || '/' || os.ano_referencia AS competencia,
    p.sigla_projeto,
    a.nome_profissional,
    pc.nome_perfil,
    a.percentual_alocacao || '%' AS alocacao,
    a.documento_referencia AS doc_ref_historico,
    a.custo_mensal_perfil AS custo_mensal_snapshot,
    a.custo_alocacao AS custo_calculado
FROM alocacoes_perfil_os a
JOIN ordens_servico os ON os.id = a.ordem_servico_id
JOIN projetos p ON p.id = os.projeto_id
JOIN perfis_contratados pc ON pc.id = a.perfil_contratado_id
ORDER BY os.numero_os, a.mes_referencia, a.nome_profissional;`
  },
  {
    id: 'painel-sgc-passivo',
    title: 'Auditoria de Pendências no SGC & Passivo 2026',
    category: 'Auditoria & Compliance',
    description: 'Identifica ordens de serviço com pendências de alocação, entrega ou descrição no SGC, ou com passivo orçamentário registrado para 2026.',
    objective: 'Mitigar riscos de glosa contratual e apontamentos de órgãos de controle externo (TCE/CGU), listando inconformidades nas etapas do SGC.',
    sql: `SELECT 
    p.sigla_secretaria,
    p.sigla_projeto,
    os.numero_os,
    os.ano_referencia,
    CASE WHEN os.alocacao_sgc THEN 'OK' ELSE 'PENDENTE' END AS alocacao_sgc_status,
    CASE WHEN os.entrega_sgc THEN 'OK' ELSE 'PENDENTE' END AS entrega_sgc_status,
    CASE WHEN os.descricao_sgc THEN 'OK' ELSE 'PENDENTE' END AS descricao_sgc_status,
    os.situacao_passivo_2026
FROM ordens_servico os
JOIN projetos p ON p.id = os.projeto_id
WHERE os.alocacao_sgc = FALSE 
   OR os.entrega_sgc = FALSE 
   OR os.descricao_sgc = FALSE
   OR os.situacao_passivo_2026 IS NOT NULL
ORDER BY p.sigla_secretaria, os.numero_os;`
  },
  {
    id: 'distribuicao-por-perfil',
    title: 'Demonstrativo de Alocação e Custo Acumulado por Perfil Profissional',
    category: 'Financeiro / Orçamentário',
    description: 'Consolida a demanda e volume financeiro alocado para cada perfil do contrato administrativo.',
    objective: 'Subsidiar aditivos contratuais, planejamento de apostilamento e fiscalização da quantidade de postos de trabalho contratados.',
    sql: `SELECT 
    pc.item_contratacao,
    pc.nome_perfil,
    pc.custo_mensal_perfil AS valor_tabela_vigente,
    COUNT(a.id) AS quantidade_alocacoes_feitas,
    ROUND(AVG(a.percentual_alocacao), 2) AS media_percentual_alocacao,
    SUM(a.custo_alocacao) AS custo_total_alocado
FROM perfis_contratados pc
LEFT JOIN alocacoes_perfil_os a ON a.perfil_contratado_id = pc.id
GROUP BY pc.id, pc.item_contratacao, pc.nome_perfil, pc.custo_mensal_perfil
ORDER BY custo_total_alocado DESC NULLS LAST;`
  }
];
