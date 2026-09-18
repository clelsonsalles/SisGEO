import React, { useState, useMemo } from 'react';
import { useSisgos } from '../../context/SisgosContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface EmpenhoItem {
  tipo: 'PLANEJAMENTO' | 'FATURAMENTO';
  rotulo_tipo: string;
  codigo_ne: string;
  valor_total: number;
  quantidade_os: number;
  numeros_os: number[];
  projetos_vinculados: string[];
}

export const TabelaEmpenhosHub: React.FC = () => {
  const { ordensServico, projetos, getCalculoValorTotalOS } = useSisgos();

  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'PLANEJAMENTO' | 'FATURAMENTO'>('TODOS');
  const [termoBusca, setTermoBusca] = useState<string>('');

  // Mapeamento rápido de projeto_id -> sigla do projeto
  const mapaProjetos = useMemo(() => {
    const map = new Map<number, string>();
    projetos.forEach((p) => {
      map.set(p.id, p.sigla_projeto || p.nome_projeto);
    });
    return map;
  }, [projetos]);

  // Cálculo e agrupamento das Ordens de Serviço por Empenho
  const {
    itensEmpenhos,
    totalPlanejamentoVazio,
    totalFaturamentoVazio,
    ossPlanejamentoVazio,
    ossFaturamentoVazio,
    totalGeralOss,
    totalEmpenhosPlanejamento,
    totalEmpenhosFaturamento,
  } = useMemo(() => {
    const mapaPlanejamento = new Map<
      string,
      { valor: number; oss: number[]; projetos: Set<string> }
    >();
    const mapaFaturamento = new Map<
      string,
      { valor: number; oss: number[]; projetos: Set<string> }
    >();

    let somaPlanVazio = 0;
    const ossPlanVazio: number[] = [];

    let somaFatVazio = 0;
    const ossFatVazio: number[] = [];

    let somaGeral = 0;

    ordensServico.forEach((os) => {
      const valorOs = getCalculoValorTotalOS(os.id);
      somaGeral += valorOs;

      const siglaProj = mapaProjetos.get(os.projeto_id) || `Projeto #${os.projeto_id}`;

      // Empenho no Planejamento
      const nePlan = os.ne_planejamento ? os.ne_planejamento.trim() : '';
      if (!nePlan) {
        somaPlanVazio += valorOs;
        ossPlanVazio.push(os.numero_os);
      } else {
        const atual = mapaPlanejamento.get(nePlan) || {
          valor: 0,
          oss: [],
          projetos: new Set<string>(),
        };
        atual.valor += valorOs;
        atual.oss.push(os.numero_os);
        atual.projetos.add(siglaProj);
        mapaPlanejamento.set(nePlan, atual);
      }

      // Empenho no Faturamento
      const neFat = os.ne_faturamento ? os.ne_faturamento.trim() : '';
      if (!neFat) {
        somaFatVazio += valorOs;
        ossFatVazio.push(os.numero_os);
      } else {
        const atual = mapaFaturamento.get(neFat) || {
          valor: 0,
          oss: [],
          projetos: new Set<string>(),
        };
        atual.valor += valorOs;
        atual.oss.push(os.numero_os);
        atual.projetos.add(siglaProj);
        mapaFaturamento.set(neFat, atual);
      }
    });

    const listaItens: EmpenhoItem[] = [];

    // Adiciona empenhos de planejamento
    let somaTotalPlan = 0;
    Array.from(mapaPlanejamento.entries())
      .sort(([neA], [neB]) => neA.localeCompare(neB))
      .forEach(([codigo_ne, dados]) => {
        somaTotalPlan += dados.valor;
        listaItens.push({
          tipo: 'PLANEJAMENTO',
          rotulo_tipo: 'NE no Planejamento',
          codigo_ne,
          valor_total: Math.round(dados.valor * 100) / 100,
          quantidade_os: dados.oss.length,
          numeros_os: dados.oss.sort((a, b) => a - b),
          projetos_vinculados: Array.from(dados.projetos),
        });
      });

    // Adiciona empenhos de faturamento
    let somaTotalFat = 0;
    Array.from(mapaFaturamento.entries())
      .sort(([neA], [neB]) => neA.localeCompare(neB))
      .forEach(([codigo_ne, dados]) => {
        somaTotalFat += dados.valor;
        listaItens.push({
          tipo: 'FATURAMENTO',
          rotulo_tipo: 'NE no Faturamento',
          codigo_ne,
          valor_total: Math.round(dados.valor * 100) / 100,
          quantidade_os: dados.oss.length,
          numeros_os: dados.oss.sort((a, b) => a - b),
          projetos_vinculados: Array.from(dados.projetos),
        });
      });

    return {
      itensEmpenhos: listaItens,
      totalPlanejamentoVazio: Math.round(somaPlanVazio * 100) / 100,
      totalFaturamentoVazio: Math.round(somaFatVazio * 100) / 100,
      ossPlanejamentoVazio: ossPlanVazio.sort((a, b) => a - b),
      ossFaturamentoVazio: ossFatVazio.sort((a, b) => a - b),
      totalGeralOss: Math.round(somaGeral * 100) / 100,
      totalEmpenhosPlanejamento: somaTotalPlan,
      totalEmpenhosFaturamento: somaTotalFat,
    };
  }, [ordensServico, mapaProjetos, getCalculoValorTotalOS]);

  // Itens filtrados para exibição
  const itensExibidos = useMemo(() => {
    return itensEmpenhos.filter((item) => {
      // Filtro de tipo
      if (filtroTipo === 'PLANEJAMENTO' && item.tipo !== 'PLANEJAMENTO') return false;
      if (filtroTipo === 'FATURAMENTO' && item.tipo !== 'FATURAMENTO') return false;

      // Filtro de busca textual
      if (termoBusca.trim() !== '') {
        const busca = termoBusca.toLowerCase().trim();
        const noCodigo = item.codigo_ne.toLowerCase().includes(busca);
        const noTipo = item.rotulo_tipo.toLowerCase().includes(busca);
        const nasOss = item.numeros_os.some((num) => num.toString().includes(busca));
        const nosProjetos = item.projetos_vinculados.some((p) => p.toLowerCase().includes(busca));
        if (!noCodigo && !noTipo && !nasOss && !nosProjetos) {
          return false;
        }
      }

      return true;
    });
  }, [itensEmpenhos, filtroTipo, termoBusca]);

  // Função para exportar a tabela para arquivo CSV
  const handleExportarCsv = () => {
    const cabecalho = [
      'Empenho / Identificação',
      'Tipo de Empenho',
      'Código NE',
      'Qtd OSs',
      'Ordens de Serviço',
      'Valor Total das OSs (R$)',
    ];

    const linhas = itensExibidos.map((item) => [
      `"${item.rotulo_tipo} - ${item.codigo_ne}"`,
      `"${item.rotulo_tipo}"`,
      `"${item.codigo_ne}"`,
      item.quantidade_os,
      `"${item.numeros_os.map((n) => `OS #${n}`).join(', ')}"`,
      item.valor_total.toFixed(2).replace('.', ','),
    ]);

    // Linhas finais de vazios conforme solicitado
    if (filtroTipo === 'TODOS' || filtroTipo === 'PLANEJAMENTO') {
      linhas.push([
        '"NE no Planejamento (Vazio / Não informado)"',
        '"NE no Planejamento"',
        '"Vazio"',
        ossPlanejamentoVazio.length,
        `"${ossPlanejamentoVazio.map((n) => `OS #${n}`).join(', ')}"`,
        totalPlanejamentoVazio.toFixed(2).replace('.', ','),
      ]);
    }

    if (filtroTipo === 'TODOS' || filtroTipo === 'FATURAMENTO') {
      linhas.push([
        '"NE no Faturamento (Vazio / Não informado)"',
        '"NE no Faturamento"',
        '"Vazio"',
        ossFaturamentoVazio.length,
        `"${ossFaturamentoVazio.map((n) => `OS #${n}`).join(', ')}"`,
        totalFaturamentoVazio.toFixed(2).replace('.', ','),
      ]);
    }

    const conteudoCsv = '\uFEFF' + [cabecalho.join(';'), ...linhas.map((l) => l.join(';'))].join('\n');
    const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sisgos_empenhos_planejamento_faturamento_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
      {/* Cabeçalho da Seção com Título e Ações */}
      <div className="card-header bg-white pt-4 pb-3 px-4 border-bottom">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-dark-subtle text-dark border border-secondary-subtle px-2 py-1 fw-bold">
                <i className="bi bi-receipt-cutoff me-1"></i>
                Controle Orçamentário & Financeiro
              </span>
              <span className="badge bg-light text-muted border">Notas de Empenho</span>
            </div>
            <h4 className="fw-bold text-dark mb-1 fs-5">
              Empenhos de Planejamento & Faturamento por Ordem de Serviço
            </h4>
            <p className="text-muted small mb-0">
              Demonstrativo consolidado do somatório dos valores totais das Ordens de Serviço vinculadas a cada
              empenho de planejamento e faturamento, acompanhado do controle de pendências (empenhos vazios).
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
              onClick={handleExportarCsv}
              title="Exportar dados da tabela de empenhos para planilha CSV"
            >
              <i className="bi bi-file-earmark-excel text-success"></i>
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Mini-Cards de Resumo Orçamentário */}
        <div className="row g-2 mt-3">
          {/* Card 1: Planejamento Empenhado */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3 rounded-2 bg-light border border-light-subtle d-flex flex-column justify-content-between h-100">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-xs fw-bold text-uppercase text-primary">
                  <i className="bi bi-journal-bookmark-fill me-1"></i>
                  NE no Planejamento
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  Empenhado
                </span>
              </div>
              <div className="fs-5 fw-bold text-dark">{formatCurrency(totalEmpenhosPlanejamento)}</div>
              <span className="text-muted text-xs">
                {itensEmpenhos.filter((i) => i.tipo === 'PLANEJAMENTO').length} empenho(s) ativo(s)
              </span>
            </div>
          </div>

          {/* Card 2: Faturamento Empenhado */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3 rounded-2 bg-light border border-light-subtle d-flex flex-column justify-content-between h-100">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-xs fw-bold text-uppercase text-success">
                  <i className="bi bi-cash-stack me-1"></i>
                  NE no Faturamento
                </span>
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  Empenhado
                </span>
              </div>
              <div className="fs-5 fw-bold text-dark">{formatCurrency(totalEmpenhosFaturamento)}</div>
              <span className="text-muted text-xs">
                {itensEmpenhos.filter((i) => i.tipo === 'FATURAMENTO').length} empenho(s) ativo(s)
              </span>
            </div>
          </div>

          {/* Card 3: Planejamento Vazio */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className={`p-3 rounded-2 border h-100 d-flex flex-column justify-content-between ${
              totalPlanejamentoVazio > 0 ? 'bg-warning-subtle border-warning-subtle' : 'bg-light border-light-subtle'
            }`}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-xs fw-bold text-uppercase text-secondary">
                  <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                  NE Plan. Vazia
                </span>
                <span className={`badge ${totalPlanejamentoVazio > 0 ? 'bg-warning text-dark' : 'bg-light text-muted border'}`}>
                  {ossPlanejamentoVazio.length} OS(s)
                </span>
              </div>
              <div className="fs-5 fw-bold text-dark">{formatCurrency(totalPlanejamentoVazio)}</div>
              <span className="text-muted text-xs">
                {totalPlanejamentoVazio > 0 ? 'Aguardando empenho de planejamento' : '100% das OSs com NE informada'}
              </span>
            </div>
          </div>

          {/* Card 4: Faturamento Vazio */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className={`p-3 rounded-2 border h-100 d-flex flex-column justify-content-between ${
              totalFaturamentoVazio > 0 ? 'bg-warning-subtle border-warning-subtle' : 'bg-light border-light-subtle'
            }`}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-xs fw-bold text-uppercase text-secondary">
                  <i className="bi bi-clock-history text-secondary me-1"></i>
                  NE Fat. Vazia
                </span>
                <span className={`badge ${totalFaturamentoVazio > 0 ? 'bg-warning text-dark' : 'bg-light text-muted border'}`}>
                  {ossFaturamentoVazio.length} OS(s)
                </span>
              </div>
              <div className="fs-5 fw-bold text-dark">{formatCurrency(totalFaturamentoVazio)}</div>
              <span className="text-muted text-xs">
                {totalFaturamentoVazio > 0 ? 'Aguardando empenho de faturamento' : '100% das OSs com NE informada'}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="row g-2 mt-3 pt-2 border-top align-items-center">
          <div className="col-12 col-md-6">
            <div className="btn-group btn-group-sm w-100 w-sm-auto" role="group">
              <button
                type="button"
                className={`btn ${filtroTipo === 'TODOS' ? 'btn-dark fw-bold' : 'btn-outline-secondary'}`}
                onClick={() => setFiltroTipo('TODOS')}
              >
                Todos os Empenhos ({itensEmpenhos.length})
              </button>
              <button
                type="button"
                className={`btn ${filtroTipo === 'PLANEJAMENTO' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                onClick={() => setFiltroTipo('PLANEJAMENTO')}
              >
                <i className="bi bi-journal-bookmark-fill me-1"></i>
                NE no Planejamento ({itensEmpenhos.filter((i) => i.tipo === 'PLANEJAMENTO').length})
              </button>
              <button
                type="button"
                className={`btn ${filtroTipo === 'FATURAMENTO' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`}
                onClick={() => setFiltroTipo('FATURAMENTO')}
              >
                <i className="bi bi-cash-stack me-1"></i>
                NE no Faturamento ({itensEmpenhos.filter((i) => i.tipo === 'FATURAMENTO').length})
              </button>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Buscar por código de NE (ex: 2026NE000142), número da OS ou projeto..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
              {termoBusca && (
                <button
                  type="button"
                  className="btn btn-light border border-start-0 text-muted"
                  onClick={() => setTermoBusca('')}
                  title="Limpar busca"
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Empenhos */}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light border-bottom">
            <tr>
              {/* PRIMEIRA COLUNA */}
              <th scope="col" className="ps-4 py-3 text-dark fw-bold" style={{ minWidth: '340px' }}>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-hash text-secondary"></i>
                  <span>Nota de Empenho (NE no Planejamento / NE no Faturamento)</span>
                </div>
              </th>

              {/* SEGUNDA COLUNA */}
              <th
                scope="col"
                className="pe-4 py-3 text-end text-dark fw-bold"
                style={{ width: '280px', minWidth: '220px' }}
              >
                <div className="d-flex align-items-center justify-content-end gap-1">
                  <i className="bi bi-currency-dollar text-success"></i>
                  <span>Somatório do Valor Total das Ordens de Serviço (R$)</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {itensExibidos.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
                  <p className="mb-0 fw-medium">Nenhum empenho cadastrado atende aos filtros especificados.</p>
                  <small className="text-muted">Tente ajustar a busca ou alternar os tipos de empenho.</small>
                </td>
              </tr>
            ) : (
              itensExibidos.map((item, idx) => {
                const isPlanejamento = item.tipo === 'PLANEJAMENTO';

                return (
                  <tr key={`${item.tipo}-${item.codigo_ne}-${idx}`}>
                    {/* PRIMEIRA COLUNA: Empenhos de planejamento / faturamento */}
                    <td className="ps-4 py-3">
                      <div className="d-flex flex-column gap-1">
                        <div className="d-flex align-items-center flex-wrap gap-2">
                          <span
                            className={`badge ${
                              isPlanejamento
                                ? 'bg-primary-subtle text-primary border border-primary-subtle'
                                : 'bg-success-subtle text-success border border-success-subtle'
                            } fw-semibold px-2 py-1`}
                          >
                            <i
                              className={`bi ${
                                isPlanejamento ? 'bi-journal-bookmark-fill' : 'bi-cash-stack'
                              } me-1`}
                            ></i>
                            {item.rotulo_tipo}
                          </span>

                          <span className="font-monospace fw-bold fs-6 text-dark bg-light px-2 py-0.5 rounded border border-light-subtle">
                            {item.codigo_ne}
                          </span>

                          <span className="badge bg-light text-secondary border">
                            {item.quantidade_os} {item.quantidade_os === 1 ? 'OS' : 'OSs'}
                          </span>
                        </div>

                        {/* Relação sutil das OSs e Projetos Vinculados */}
                        <div className="d-flex align-items-center flex-wrap gap-1 mt-1 text-muted text-xs">
                          <span className="fw-semibold text-secondary">OSs Vinculadas:</span>
                          {item.numeros_os.map((num) => (
                            <span key={num} className="badge bg-secondary-subtle text-secondary py-0.5 px-1.5">
                              OS #{num}
                            </span>
                          ))}
                          {item.projetos_vinculados.length > 0 && (
                            <>
                              <span className="text-muted mx-1">•</span>
                              <span className="text-muted">
                                Projetos: {item.projetos_vinculados.join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SEGUNDA COLUNA: Somatório do valor total das Ordens de Serviço */}
                    <td className="pe-4 py-3 text-end">
                      <div className="d-flex flex-column align-items-end">
                        <span className="fw-bold text-dark fs-6 font-monospace">
                          {formatCurrency(item.valor_total)}
                        </span>
                        {totalGeralOss > 0 && (
                          <span className="text-muted text-xs">
                            {((item.valor_total / totalGeralOss) * 100).toFixed(1)}% do valor total das OSs
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}

            {/* ============================================================== */}
            {/* PENÚLTIMA LINHA DA TABELA: Somatório das OSs com NE Planejamento VAZIA */}
            {/* ============================================================== */}
            <tr
              className="table-warning border-top border-warning-subtle"
              style={{ backgroundColor: '#fff8e6' }}
            >
              {/* PRIMEIRA COLUNA */}
              <td className="ps-4 py-3">
                <div className="d-flex flex-column gap-1">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <span className="badge bg-warning text-dark fw-bold px-2 py-1">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>
                      NE no Planejamento
                    </span>
                    <span className="fw-bold text-dark font-monospace">
                      (Vazio / Não informado)
                    </span>
                    <span className="badge bg-white text-dark border border-warning-subtle">
                      {ossPlanejamentoVazio.length} {ossPlanejamentoVazio.length === 1 ? 'OS' : 'OSs'} pendente(s)
                    </span>
                  </div>

                  <div className="text-muted text-xs mt-1">
                    {ossPlanejamentoVazio.length > 0 ? (
                      <div className="d-flex align-items-center flex-wrap gap-1">
                        <span className="fw-semibold text-secondary">Ordens de Serviço com campo vazio:</span>
                        {ossPlanejamentoVazio.map((num) => (
                          <span key={num} className="badge bg-warning-subtle text-dark border border-warning-subtle">
                            OS #{num}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-success fw-medium">
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Todas as Ordens de Serviço possuem NE de Planejamento cadastrada.
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* SEGUNDA COLUNA */}
              <td className="pe-4 py-3 text-end">
                <div className="d-flex flex-column align-items-end">
                  <span className="fw-bold text-dark fs-6 font-monospace">
                    {formatCurrency(totalPlanejamentoVazio)}
                  </span>
                  <span className="text-xs text-muted">
                    {totalGeralOss > 0
                      ? `${((totalPlanejamentoVazio / totalGeralOss) * 100).toFixed(1)}% do total sem NE Plan.`
                      : '0%'}
                  </span>
                </div>
              </td>
            </tr>

            {/* ============================================================== */}
            {/* ÚLTIMA LINHA DA TABELA: Somatório das OSs com NE Faturamento VAZIA */}
            {/* ============================================================== */}
            <tr
              className="table-warning border-top border-warning-subtle"
              style={{ backgroundColor: '#fffdf5' }}
            >
              {/* PRIMEIRA COLUNA */}
              <td className="ps-4 py-3">
                <div className="d-flex flex-column gap-1">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <span className="badge bg-warning text-dark fw-bold px-2 py-1">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>
                      NE no Faturamento
                    </span>
                    <span className="fw-bold text-dark font-monospace">
                      (Vazio / Não informado)
                    </span>
                    <span className="badge bg-white text-dark border border-warning-subtle">
                      {ossFaturamentoVazio.length} {ossFaturamentoVazio.length === 1 ? 'OS' : 'OSs'} pendente(s)
                    </span>
                  </div>

                  <div className="text-muted text-xs mt-1">
                    {ossFaturamentoVazio.length > 0 ? (
                      <div className="d-flex align-items-center flex-wrap gap-1">
                        <span className="fw-semibold text-secondary">Ordens de Serviço com campo vazio:</span>
                        {ossFaturamentoVazio.map((num) => (
                          <span key={num} className="badge bg-warning-subtle text-dark border border-warning-subtle">
                            OS #{num}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-success fw-medium">
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Todas as Ordens de Serviço possuem NE de Faturamento cadastrada.
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* SEGUNDA COLUNA */}
              <td className="pe-4 py-3 text-end">
                <div className="d-flex flex-column align-items-end">
                  <span className="fw-bold text-dark fs-6 font-monospace">
                    {formatCurrency(totalFaturamentoVazio)}
                  </span>
                  <span className="text-xs text-muted">
                    {totalGeralOss > 0
                      ? `${((totalFaturamentoVazio / totalGeralOss) * 100).toFixed(1)}% do total sem NE Fat.`
                      : '0%'}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Rodapé Informativo da Tabela */}
      <div className="card-footer bg-light px-4 py-3 border-top d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 text-muted small">
        <div>
          <i className="bi bi-info-circle me-1 text-primary"></i>
          <span>
            Total de <strong>{itensExibidos.length}</strong> empenho(s) listado(s). As duas últimas linhas consolidam os montantes das OSs com os campos &quot;NE no Planejamento&quot; e &quot;NE no Faturamento&quot; vazios.
          </span>
        </div>
        <div className="fw-semibold text-dark">
          Montante Total das OSs: <span className="font-monospace text-primary">{formatCurrency(totalGeralOss)}</span>
        </div>
      </div>
    </div>
  );
};
