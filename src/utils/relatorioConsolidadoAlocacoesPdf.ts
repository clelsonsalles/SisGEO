import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Projeto, OrdemServico, PerfilContratado, AlocacaoPerfilOs, MesReferencia } from '../types/models';
import { formatCurrency, formatNumber } from './formatters';
import { FiltrosRelatorioAlocacoes } from './relatorioAlocacoesPdf';

export const MESES_ANO: MesReferencia[] = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
];

export const MESES_ABREV: Record<MesReferencia, string> = {
  JANEIRO: 'JAN',
  FEVEREIRO: 'FEV',
  MARÇO: 'MAR',
  ABRIL: 'ABR',
  MAIO: 'MAI',
  JUNHO: 'JUN',
  JULHO: 'JUL',
  AGOSTO: 'AGO',
  SETEMBRO: 'SET',
  OUTUBRO: 'OUT',
  NOVEMBRO: 'NOV',
  DEZEMBRO: 'DEZ',
};

export interface IndicadoresConsolidados {
  totalAlocacoes: number;
  profissionaisDistintos: number;
  quantidadeProjetos: number;
  quantidadeOrdensServico: number;
  custoTotalOS: number;
}

export interface IndicadoresMesLinha extends IndicadoresConsolidados {
  mes: MesReferencia;
  mesAbrev: string;
  percentualCusto: number;
}

export interface GerarRelatorioConsolidadoOptions {
  filtros: FiltrosRelatorioAlocacoes;
  alocacoes: AlocacaoPerfilOs[];
  ordensServico: OrdemServico[];
  projetos: Projeto[];
  perfis: PerfilContratado[];
}

/**
 * Calcula os 5 indicadores gerenciais para um conjunto específico de alocações
 */
export function calcularIndicadoresConsolidados(
  alocs: AlocacaoPerfilOs[],
  mapaOS: Map<number, OrdemServico>
): IndicadoresConsolidados {
  const totalAlocacoes = alocs.length;

  const profSet = new Set<string>();
  alocs.forEach((a) => {
    if (a.nome_profissional && a.nome_profissional.trim()) {
      profSet.add(a.nome_profissional.trim().toUpperCase());
    }
  });

  const projSet = new Set<number>();
  const osSet = new Set<number>();
  let custoTotal = 0;

  alocs.forEach((a) => {
    osSet.add(a.ordem_servico_id);
    custoTotal += a.custo_alocacao || 0;
    const os = mapaOS.get(a.ordem_servico_id);
    if (os && os.projeto_id) {
      projSet.add(os.projeto_id);
    }
  });

  return {
    totalAlocacoes,
    profissionaisDistintos: profSet.size,
    quantidadeProjetos: projSet.size,
    quantidadeOrdensServico: osSet.size,
    custoTotalOS: custoTotal,
  };
}

/**
 * Gera o documento PDF do Relatório Consolidado das Alocações do SisGOS
 */
export function gerarRelatorioConsolidadoAlocacoesPDF(options: GerarRelatorioConsolidadoOptions): jsPDF {
  const { filtros, alocacoes, ordensServico, projetos, perfis } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const dataHoraEmissao = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Cores do tema corporativo
  const primaryNavy: [number, number, number] = [15, 34, 64]; // #0f2240
  const blueTheme: [number, number, number] = [30, 58, 138]; // #1e3a8a
  const accentBlue: [number, number, number] = [2, 132, 199]; // #0284c7
  const tealColor: [number, number, number] = [13, 148, 136]; // #0d9488
  const amberColor: [number, number, number] = [217, 119, 6]; // #d97706
  const purpleColor: [number, number, number] = [126, 34, 206]; // #7e22ce
  const textDark: [number, number, number] = [31, 41, 55]; // #1f2937
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748b
  const bgLight: [number, number, number] = [248, 250, 252]; // #f8fafc
  const borderLight: [number, number, number] = [226, 232, 240]; // #e2e8f0

  // Mapeamentos rápidos
  const mapaOS = new Map<number, OrdemServico>(ordensServico.map((os) => [os.id, os]));
  const mapaProjetos = new Map<number, Projeto>(projetos.map((p) => [p.id, p]));
  const mapaProjetosStr = new Map<string, Projeto>(projetos.map((p) => [String(p.id), p]));
  const mapaPerfis = new Map<number, PerfilContratado>(perfis.map((p) => [p.id, p]));

  // Filtragem idêntica à tela de Análise de Alocações
  const termo = (filtros.termoBusca || '').trim().toLowerCase();

  const alocacoesFiltradas = alocacoes.filter((aloc) => {
    const os = mapaOS.get(aloc.ordem_servico_id);
    if (!os) return false;
    const proj = mapaProjetos.get(os.projeto_id);
    if (!proj) return false;
    const perfil = mapaPerfis.get(aloc.perfil_contratado_id);

    // Filtro Secretaria
    if (filtros.secretarias && filtros.secretarias.length > 0) {
      if (!filtros.secretarias.includes(proj.sigla_secretaria.trim().toUpperCase())) {
        return false;
      }
    }

    // Filtro Projeto
    if (filtros.projetosIds && filtros.projetosIds.length > 0) {
      if (!filtros.projetosIds.includes(String(proj.id))) {
        return false;
      }
    }

    // Filtro Ano
    if (filtros.anos && filtros.anos.length > 0) {
      if (!filtros.anos.includes(String(os.ano_referencia))) {
        return false;
      }
    }

    // Filtro Mês
    if (filtros.meses && filtros.meses.length > 0) {
      if (!filtros.meses.includes(aloc.mes_referencia.toUpperCase())) {
        return false;
      }
    }

    // Filtro Situação SGC
    if (filtros.situacoesSgc && filtros.situacoesSgc.length > 0) {
      if (!filtros.situacoesSgc.includes((os.situacao_sgc || '').trim())) {
        return false;
      }
    }

    // Filtro Situação Passivo 2026
    if (filtros.situacoesPassivo && filtros.situacoesPassivo.length > 0) {
      const passivo = (os.situacao_passivo_2026 || '').trim();
      const isSemPassivo = !passivo || passivo.toUpperCase() === 'NULL';
      const matchValor = filtros.situacoesPassivo.includes(passivo);
      const matchSemPassivo = filtros.situacoesPassivo.includes('__SEM_PASSIVO__') && isSemPassivo;
      if (!matchValor && !matchSemPassivo) {
        return false;
      }
    }

    // Termo de Busca
    if (termo) {
      const matchOS = String(os.numero_os).includes(termo) || String(os.ano_referencia).includes(termo);
      const matchProf = (aloc.nome_profissional || '').toLowerCase().includes(termo);
      const matchProj =
        (proj.nome_projeto || '').toLowerCase().includes(termo) ||
        (proj.sigla_projeto || '').toLowerCase().includes(termo) ||
        (proj.sigla_secretaria || '').toLowerCase().includes(termo);
      const matchPerfil =
        (perfil?.nome_perfil || '').toLowerCase().includes(termo) ||
        (perfil?.item_contratacao || '').toLowerCase().includes(termo);
      const matchDoc = (aloc.documento_referencia || '').toLowerCase().includes(termo);

      if (!matchOS && !matchProf && !matchProj && !matchPerfil && !matchDoc) {
        return false;
      }
    }

    return true;
  });

  // 1. Dados Gerais das Alocações
  const indGerais = calcularIndicadoresConsolidados(alocacoesFiltradas, mapaOS);

  // 2. Dados das Alocações para 2025
  const alocs2025 = alocacoesFiltradas.filter((a) => {
    const os = mapaOS.get(a.ordem_servico_id);
    return os && os.ano_referencia === 2025;
  });
  const ind2025 = calcularIndicadoresConsolidados(alocs2025, mapaOS);

  // 3. Dados das Alocações para 2026
  const alocs2026 = alocacoesFiltradas.filter((a) => {
    const os = mapaOS.get(a.ordem_servico_id);
    return os && os.ano_referencia === 2026;
  });
  const ind2026 = calcularIndicadoresConsolidados(alocs2026, mapaOS);

  // 4. Distribuição mensal dos indicadores
  const indMensais: IndicadoresMesLinha[] = MESES_ANO.map((mes) => {
    const alocsDoMes = alocacoesFiltradas.filter((a) => a.mes_referencia.toUpperCase() === mes);
    const ind = calcularIndicadoresConsolidados(alocsDoMes, mapaOS);
    const percentualCusto = indGerais.custoTotalOS > 0 ? (ind.custoTotalOS / indGerais.custoTotalOS) * 100 : 0;
    return {
      mes,
      mesAbrev: MESES_ABREV[mes],
      ...ind,
      percentualCusto,
    };
  });

  let currentY = margin;

  // Helper para desenhar a barra de cabeçalho institucional em cada página
  const drawPageHeader = (pageNum: number) => {
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, pageWidth, 4.5, 'F');
    doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.rect(0, 4.5, pageWidth, 1.2, 'F');

    if (pageNum > 1) {
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, 9.5, pageWidth - margin, 9.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`Emitido em: ${dataHoraEmissao}`, pageWidth - margin, 7.8, { align: 'right' });
    }
  };

  // =========================================================================
  // PÁGINA 1: CABEÇALHO, FILTROS, DADOS GERAIS E COMPARATIVO 2025 x 2026
  // =========================================================================
  drawPageHeader(1);

  currentY = 12;

  // Título e Subtítulo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('RELATÓRIO CONSOLIDADO DAS ALOCAÇÕES', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Emitido em: ${dataHoraEmissao} (Horário de Brasília)`, pageWidth - margin, currentY, { align: 'right' });

  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(
    'Dashboard analítico gerencial com indicadores consolidados, comparativo 2025 x 2026 e distribuição mensal.',
    margin,
    currentY
  );

  currentY += 4.5;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 4.5;

  // =========================================================================
  // SEÇÃO DE FILTROS APLICADOS (Linha a linha, sem sobreposição)
  // =========================================================================
  const filtrosAtivos: { rotulo: string; valor: string }[] = [];

  if (filtros.secretarias && filtros.secretarias.length > 0) {
    filtrosAtivos.push({
      rotulo: 'Secretaria(s)',
      valor: filtros.secretarias.join(', '),
    });
  }

  if (filtros.projetosIds && filtros.projetosIds.length > 0) {
    const descProjetos = filtros.projetosIds
      .map((id) => {
        const proj = mapaProjetosStr.get(id);
        return proj ? (proj.sigla_projeto ? proj.sigla_projeto : proj.nome_projeto) : `ID ${id}`;
      })
      .join(', ');
    filtrosAtivos.push({
      rotulo: 'Projeto(s)',
      valor: descProjetos,
    });
  }

  if (filtros.anos && filtros.anos.length > 0) {
    filtrosAtivos.push({
      rotulo: 'Ano(s)',
      valor: filtros.anos.join(', '),
    });
  }

  if (filtros.meses && filtros.meses.length > 0) {
    filtrosAtivos.push({
      rotulo: 'Mês(es)',
      valor: filtros.meses.join(', '),
    });
  }

  if (filtros.situacoesSgc && filtros.situacoesSgc.length > 0) {
    filtrosAtivos.push({
      rotulo: 'Situação(ões) SGC',
      valor: filtros.situacoesSgc.join(', '),
    });
  }

  if (filtros.situacoesPassivo && filtros.situacoesPassivo.length > 0) {
    const descPassivo = filtros.situacoesPassivo
      .map((p) => (p === '__SEM_PASSIVO__' ? '(Não informado)' : p))
      .join(', ');
    filtrosAtivos.push({
      rotulo: 'Situação(ões) Passivo 2026',
      valor: descPassivo,
    });
  }

  if (filtros.termoBusca && filtros.termoBusca.trim().length > 0) {
    filtrosAtivos.push({
      rotulo: 'Termo de Busca',
      valor: `"${filtros.termoBusca.trim()}"`,
    });
  }

  const lineHeight = 3.8;
  const paddingX = 4.5;
  const maxFilterWidth = contentWidth - paddingX * 2;

  interface ItemFiltroFormatado {
    rotulo: string;
    prefixW: number;
    linhas: string[];
  }

  const itensFormatados: ItemFiltroFormatado[] = [];

  if (filtrosAtivos.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    for (const f of filtrosAtivos) {
      const prefix = `• ${f.rotulo}: `;
      doc.setFont('helvetica', 'bold');
      const prefixW = doc.getTextWidth(prefix);
      doc.setFont('helvetica', 'normal');
      const linhas = doc.splitTextToSize(f.valor, maxFilterWidth - prefixW);
      itensFormatados.push({
        rotulo: f.rotulo,
        prefixW,
        linhas: Array.isArray(linhas) ? linhas : [linhas],
      });
    }
  }

  const totalLinhasTexto =
    filtrosAtivos.length === 0 ? 1 : itensFormatados.reduce((acc, curr) => acc + curr.linhas.length, 0);

  const filterBoxHeight = Math.max(12, 6.5 + totalLinhasTexto * lineHeight + 2);

  // Retângulo do painel de filtros
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, filterBoxHeight, 1.5, 1.5, 'FD');

  // Faixa esquerda indicativa
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.roundedRect(margin, currentY, 2.2, filterBoxHeight, 0.8, 0.8, 'F');

  // Título da seção
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(blueTheme[0], blueTheme[1], blueTheme[2]);
  doc.text('PARÂMETROS E FILTROS APLICADOS NESTE RELATÓRIO:', margin + paddingX, currentY + 4.8);

  let posY = currentY + 4.8 + lineHeight;

  if (filtrosAtivos.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.2);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Sem nenhum filtro selecionado ou aplicado', margin + paddingX, posY);
  } else {
    for (const item of itensFormatados) {
      const prefix = `• ${item.rotulo}: `;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(prefix, margin + paddingX, posY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);

      const firstLine = item.linhas[0] || '';
      doc.text(firstLine, margin + paddingX + item.prefixW, posY);
      posY += lineHeight;

      for (let i = 1; i < item.linhas.length; i++) {
        doc.text(item.linhas[i], margin + paddingX + item.prefixW, posY);
        posY += lineHeight;
      }
    }
  }

  currentY += filterBoxHeight + 5;

  // =========================================================================
  // SEÇÃO 1: DADOS GERAIS DAS ALOCAÇÕES (5 INDICADORES)
  // =========================================================================
  doc.setFillColor(blueTheme[0], blueTheme[1], blueTheme[2]);
  doc.roundedRect(margin, currentY, 3, 7, 0.8, 0.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('1. DADOS GERAIS DAS ALOCAÇÕES', margin + 5, currentY + 5.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Consolidação dos 5 indicadores principais para o escopo filtrado', margin + 74, currentY + 5.2);

  currentY += 8.5;

  // Renderizar 5 cartões KPI
  const numCards = 5;
  const cardGap = 2.5;
  const cardWidth = (contentWidth - cardGap * (numCards - 1)) / numCards; // ~34.4mm
  const cardHeight = 16.5;

  const cardsGerais = [
    {
      titulo: 'Total de Alocações',
      valor: formatNumber(indGerais.totalAlocacoes),
      sub: 'itens alocados',
      cor: primaryNavy,
      borda: [203, 213, 225] as [number, number, number],
    },
    {
      titulo: 'Profissionais Distintos',
      valor: formatNumber(indGerais.profissionaisDistintos),
      sub: 'profissionais únicos',
      cor: accentBlue,
      borda: [186, 230, 253] as [number, number, number],
    },
    {
      titulo: 'Quantidade de Projetos',
      valor: formatNumber(indGerais.quantidadeProjetos),
      sub: 'projetos atendidos',
      cor: tealColor,
      borda: [153, 246, 228] as [number, number, number],
    },
    {
      titulo: 'Ordens de Serviço',
      valor: formatNumber(indGerais.quantidadeOrdensServico),
      sub: 'OSs vinculadas',
      cor: purpleColor,
      borda: [233, 213, 255] as [number, number, number],
    },
    {
      titulo: 'Custo Total das OS',
      valor: formatCurrency(indGerais.custoTotalOS),
      sub: 'orçamento de alocações',
      cor: amberColor,
      borda: [254, 215, 170] as [number, number, number],
    },
  ];

  cardsGerais.forEach((c, idx) => {
    const cardX = margin + idx * (cardWidth + cardGap);
    // Card background
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(c.borda[0], c.borda[1], c.borda[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Top accent line
    doc.setFillColor(c.cor[0], c.cor[1], c.cor[2]);
    doc.rect(cardX, currentY, cardWidth, 1.4, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(c.titulo.toUpperCase(), cardX + cardWidth / 2, currentY + 4.5, { align: 'center' });

    // Value
    doc.setFont('helvetica', 'bold');
    // Ajustar tamanho se valor for longo
    doc.setFontSize(c.valor.length > 13 ? 7.8 : 9.5);
    doc.setTextColor(c.cor[0], c.cor[1], c.cor[2]);
    doc.text(c.valor, cardX + cardWidth / 2, currentY + 10.5, { align: 'center' });

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(c.sub, cardX + cardWidth / 2, currentY + 14.5, { align: 'center' });
  });

  currentY += cardHeight + 6;

  // =========================================================================
  // SEÇÃO 2 & 3: DADOS DAS ALOCAÇÕES PARA 2025 E 2026 (COMPARATIVO E NOTAS)
  // =========================================================================
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.roundedRect(margin, currentY, 3, 7, 0.8, 0.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('2. COMPARATIVO ANALÍTICO: ANO DE REFERÊNCIA 2025 x 2026', margin + 5, currentY + 5.2);

  currentY += 8.5;

  // Tabela Comparativa de Indicadores 2025 x 2026
  const calcPerc = (val: number, total: number) => (total > 0 ? `${((val / total) * 100).toFixed(1)}%` : '0.0%');

  const dadosTabelaComparativa = [
    [
      'Quantidade total de alocações',
      formatNumber(ind2025.totalAlocacoes),
      formatNumber(ind2026.totalAlocacoes),
      formatNumber(indGerais.totalAlocacoes),
      calcPerc(ind2025.totalAlocacoes, indGerais.totalAlocacoes),
      calcPerc(ind2026.totalAlocacoes, indGerais.totalAlocacoes),
    ],
    [
      'Quantidade de profissionais distintos',
      formatNumber(ind2025.profissionaisDistintos),
      formatNumber(ind2026.profissionaisDistintos),
      formatNumber(indGerais.profissionaisDistintos),
      calcPerc(ind2025.profissionaisDistintos, indGerais.profissionaisDistintos),
      calcPerc(ind2026.profissionaisDistintos, indGerais.profissionaisDistintos),
    ],
    [
      'Quantidade de Projetos',
      formatNumber(ind2025.quantidadeProjetos),
      formatNumber(ind2026.quantidadeProjetos),
      formatNumber(indGerais.quantidadeProjetos),
      calcPerc(ind2025.quantidadeProjetos, indGerais.quantidadeProjetos),
      calcPerc(ind2026.quantidadeProjetos, indGerais.quantidadeProjetos),
    ],
    [
      'Quantidade de Ordens de Serviço',
      formatNumber(ind2025.quantidadeOrdensServico),
      formatNumber(ind2026.quantidadeOrdensServico),
      formatNumber(indGerais.quantidadeOrdensServico),
      calcPerc(ind2025.quantidadeOrdensServico, indGerais.quantidadeOrdensServico),
      calcPerc(ind2026.quantidadeOrdensServico, indGerais.quantidadeOrdensServico),
    ],
    [
      'Custo total das OS (R$)',
      formatCurrency(ind2025.custoTotalOS),
      formatCurrency(ind2026.custoTotalOS),
      formatCurrency(indGerais.custoTotalOS),
      calcPerc(ind2025.custoTotalOS, indGerais.custoTotalOS),
      calcPerc(ind2026.custoTotalOS, indGerais.custoTotalOS),
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    head: [
      [
        'INDICADOR CONSOLIDADO',
        'ANO 2025 (PASSIVO)',
        'ANO 2026 (EXERCÍCIO)',
        'TOTAL GERAL',
        '% ANO 2025',
        '% ANO 2026',
      ],
    ],
    body: dadosTabelaComparativa,
    styles: {
      fontSize: 7.2,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 },
      textColor: [31, 41, 55],
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 34, 64],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 54, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 26, halign: 'right' },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    theme: 'plain',
  });

  const lastTableY = (doc as any).lastAutoTable.finalY;
  currentY = lastTableY + 4;

  // Caixas de Notas Explicativas Obrigatórias (2025 e 2026)
  const boxWidth = (contentWidth - 3) / 2;
  const boxHeight = 15;

  // Caixa 2025
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');
  doc.setFillColor(217, 119, 6);
  doc.roundedRect(margin, currentY, 2, boxHeight, 0.8, 0.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(180, 83, 9);
  doc.text('Dados das Alocações para 2025:', margin + 4, currentY + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(120, 53, 15);
  const texto2025 =
    'Os dados se referem a Ordens de Serviço demandadas em 2025 e que foram executadas em 2026.';
  const linhas2025 = doc.splitTextToSize(texto2025, boxWidth - 7);
  doc.text(linhas2025, margin + 4, currentY + 8);

  // Caixa 2026
  const box26X = margin + boxWidth + 3;
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.roundedRect(box26X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');
  doc.setFillColor(5, 150, 105);
  doc.roundedRect(box26X, currentY, 2, boxHeight, 0.8, 0.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(4, 120, 87);
  doc.text('Dados das Alocações para 2026:', box26X + 4, currentY + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(6, 78, 59);
  const texto2026 =
    'Os dados se referem a Ordens de Serviço demandadas em 2026, considerando que algumas já foram executadas e que outras estão em execução ou em planejamento.';
  const linhas2026 = doc.splitTextToSize(texto2026, boxWidth - 7);
  doc.text(linhas2026, box26X + 4, currentY + 8);

  currentY += boxHeight + 5;

  // =========================================================================
  // GRÁFICO COMPARATIVO EM VETORES (2025 x 2026)
  // =========================================================================
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  const chartBoxHeight = 44;
  doc.roundedRect(margin, currentY, contentWidth, chartBoxHeight, 2, 2, 'FD');

  // Cabeçalho do Gráfico
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('GRÁFICO COMPARATIVO DE INDICADORES: ANO 2025 x ANO 2026', margin + 4, currentY + 4.8);

  // Legenda do Gráfico
  const legX = pageWidth - margin - 75;
  doc.setFillColor(amberColor[0], amberColor[1], amberColor[2]);
  doc.rect(legX, currentY + 2.4, 3, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('2025 (Exec. em 2026)', legX + 4, currentY + 4.4);

  doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.rect(legX + 38, currentY + 2.4, 3, 2.5, 'F');
  doc.text('2026 (Exercício)', legX + 42, currentY + 4.4);

  // Renderizar barras comparativas horizontais para os 5 indicadores
  const chartStartY = currentY + 8;
  const barCategories = [
    {
      nome: 'Custo Total (R$)',
      v25: ind2025.custoTotalOS,
      v26: ind2026.custoTotalOS,
      max: Math.max(ind2025.custoTotalOS, ind2026.custoTotalOS, 1),
      isCurrency: true,
    },
    {
      nome: 'Qtd Alocações',
      v25: ind2025.totalAlocacoes,
      v26: ind2026.totalAlocacoes,
      max: Math.max(ind2025.totalAlocacoes, ind2026.totalAlocacoes, 1),
      isCurrency: false,
    },
    {
      nome: 'Profissionais Distintos',
      v25: ind2025.profissionaisDistintos,
      v26: ind2026.profissionaisDistintos,
      max: Math.max(ind2025.profissionaisDistintos, ind2026.profissionaisDistintos, 1),
      isCurrency: false,
    },
    {
      nome: 'Projetos',
      v25: ind2025.quantidadeProjetos,
      v26: ind2026.quantidadeProjetos,
      max: Math.max(ind2025.quantidadeProjetos, ind2026.quantidadeProjetos, 1),
      isCurrency: false,
    },
    {
      nome: 'Ordens de Serviço',
      v25: ind2025.quantidadeOrdensServico,
      v26: ind2026.quantidadeOrdensServico,
      max: Math.max(ind2025.quantidadeOrdensServico, ind2026.quantidadeOrdensServico, 1),
      isCurrency: false,
    },
  ];

  const maxBarLength = 80; // mm
  const catSpacing = 6.6; // mm
  const barThickness = 2.2; // mm

  barCategories.forEach((cat, i) => {
    const rowY = chartStartY + i * catSpacing;

    // Label do indicador
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(cat.nome, margin + 4, rowY + 3.2);

    const barStartX = margin + 48;

    // Barra 2025
    const len25 = Math.max(1, (cat.v25 / cat.max) * maxBarLength);
    doc.setFillColor(amberColor[0], amberColor[1], amberColor[2]);
    doc.roundedRect(barStartX, rowY, len25, barThickness, 0.4, 0.4, 'F');

    // Valor 2025
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(amberColor[0], amberColor[1], amberColor[2]);
    const txt25 = cat.isCurrency ? formatCurrency(cat.v25) : formatNumber(cat.v25);
    doc.text(txt25, barStartX + len25 + 1.5, rowY + 1.8);

    // Barra 2026
    const len26 = Math.max(1, (cat.v26 / cat.max) * maxBarLength);
    doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.roundedRect(barStartX, rowY + barThickness + 0.6, len26, barThickness, 0.4, 0.4, 'F');

    // Valor 2026
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
    const txt26 = cat.isCurrency ? formatCurrency(cat.v26) : formatNumber(cat.v26);
    doc.text(txt26, barStartX + len26 + 1.5, rowY + barThickness + 0.6 + 1.8);

    // Linha divisória sutil
    if (i < barCategories.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin + 4, rowY + catSpacing - 0.4, pageWidth - margin - 4, rowY + catSpacing - 0.4);
    }
  });

  // =========================================================================
  // PÁGINA 2: DISTRIBUIÇÃO MENSAL DOS INDICADORES (TABELA E GRÁFICOS)
  // =========================================================================
  doc.addPage();
  drawPageHeader(2);

  currentY = 14;

  doc.setFillColor(blueTheme[0], blueTheme[1], blueTheme[2]);
  doc.roundedRect(margin, currentY, 3, 7, 0.8, 0.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('3. DISTRIBUIÇÃO MENSAL DOS INDICADORES', margin + 5, currentY + 5.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Detalhamento e totalização dos 5 indicadores para cada mês de referência', margin + 78, currentY + 5.2);

  currentY += 8.5;

  // Tabela da Distribuição Mensal
  const linhasTabelaMensal = indMensais.map((m) => [
    m.mes,
    formatNumber(m.totalAlocacoes),
    formatNumber(m.profissionaisDistintos),
    formatNumber(m.quantidadeProjetos),
    formatNumber(m.quantidadeOrdensServico),
    formatCurrency(m.custoTotalOS),
    `${m.percentualCusto.toFixed(1)}%`,
  ]);

  // Linha de totalização geral
  const linhaTotalMensal = [
    'TOTAL GERAL CONSOLIDADO',
    formatNumber(indGerais.totalAlocacoes),
    formatNumber(indGerais.profissionaisDistintos),
    formatNumber(indGerais.quantidadeProjetos),
    formatNumber(indGerais.quantidadeOrdensServico),
    formatCurrency(indGerais.custoTotalOS),
    '100.0%',
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    head: [
      [
        'MÊS DE REFERÊNCIA',
        'TOTAL ALOCAÇÕES',
        'PROFISSIONAIS DISTINTOS',
        'QTD PROJETOS',
        'ORDENS DE SERVIÇO',
        'CUSTO TOTAL (R$)',
        '% CUSTO TOTAL',
      ],
    ],
    body: [...linhasTabelaMensal, linhaTotalMensal],
    styles: {
      fontSize: 6.8,
      cellPadding: { top: 1.8, bottom: 1.8, left: 2, right: 2 },
      textColor: [31, 41, 55],
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 34, 64],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 6.8,
    },
    columnStyles: {
      0: { cellWidth: 40, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 23, halign: 'right' },
      2: { cellWidth: 27, halign: 'right' },
      3: { cellWidth: 21, halign: 'right' },
      4: { cellWidth: 23, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 20, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      // Destaque para a linha de total
      if (data.row.index === linhasTabelaMensal.length) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [15, 34, 64];
      }
    },
    theme: 'plain',
  });

  const lastTableMensalY = (doc as any).lastAutoTable.finalY;
  currentY = lastTableMensalY + 5;

  // =========================================================================
  // SEÇÃO 4: GRÁFICOS ANALÍTICOS DA DISTRIBUIÇÃO MENSAL
  // =========================================================================
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.roundedRect(margin, currentY, 3, 7, 0.8, 0.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('4. GRÁFICOS ANALÍTICOS DA DISTRIBUIÇÃO MENSAL', margin + 5, currentY + 5.2);

  currentY += 8.5;

  // Gráfico A: Evolução do Custo Total Mensal (R$)
  const chartHeight = 44;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, chartHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('A. EVOLUÇÃO DO CUSTO TOTAL DAS ORDENS DE SERVIÇO POR MÊS (R$)', margin + 4, currentY + 4.8);

  // Valor máximo de custo entre os meses
  const maxCustoMes = Math.max(...indMensais.map((m) => m.custoTotalOS), 1);

  // Área do gráfico
  const chartPlotX = margin + 8;
  const chartPlotY = currentY + 9;
  const chartPlotWidth = contentWidth - 16;
  const chartPlotHeight = 24;
  const barPlotWidth = chartPlotWidth / 12;

  // Linhas de grade horizontais
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  [0, 0.25, 0.5, 0.75, 1].forEach((fraction) => {
    const gridY = chartPlotY + chartPlotHeight * (1 - fraction);
    doc.line(chartPlotX, gridY, chartPlotX + chartPlotWidth, gridY);
  });

  // Linha de base
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(chartPlotX, chartPlotY + chartPlotHeight, chartPlotX + chartPlotWidth, chartPlotY + chartPlotHeight);

  // Barras de custo mensal
  indMensais.forEach((m, idx) => {
    const bHeight = maxCustoMes > 0 ? (m.custoTotalOS / maxCustoMes) * chartPlotHeight : 0;
    const bX = chartPlotX + idx * barPlotWidth + barPlotWidth * 0.18;
    const bW = barPlotWidth * 0.64;
    const bY = chartPlotY + chartPlotHeight - bHeight;

    if (bHeight > 0) {
      // Barra preenchida
      doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      doc.roundedRect(bX, bY, bW, bHeight, 0.5, 0.5, 'F');

      // Valor no topo da barra (formato compacto em milhares se grande)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.8);
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);

      let labelCusto = '';
      if (m.custoTotalOS >= 1_000_000) {
        labelCusto = `${(m.custoTotalOS / 1_000_000).toFixed(1)}M`;
      } else if (m.custoTotalOS >= 1000) {
        labelCusto = `${(m.custoTotalOS / 1000).toFixed(0)}k`;
      } else {
        labelCusto = `${Math.round(m.custoTotalOS)}`;
      }
      doc.text(labelCusto, bX + bW / 2, bY - 1, { align: 'center' });
    }

    // Label do mês abaixo da linha de base
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(m.mesAbrev, bX + bW / 2, chartPlotY + chartPlotHeight + 3.2, { align: 'center' });
  });

  currentY += chartHeight + 4;

  // Gráfico B: Comparativo Mensal de Quantidade de Alocações e Profissionais Distintos
  const chartBHeight = 44;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, chartBHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('B. DISTRIBUIÇÃO DE VOLUME: ALOCAÇÕES vs PROFISSIONAIS POR MÊS', margin + 4, currentY + 4.8);

  // Legenda Gráfico B
  const legBX = pageWidth - margin - 65;
  doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.rect(legBX, currentY + 2.4, 3, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Alocações', legBX + 4, currentY + 4.4);

  doc.setFillColor(purpleColor[0], purpleColor[1], purpleColor[2]);
  doc.rect(legBX + 26, currentY + 2.4, 3, 2.5, 'F');
  doc.text('Profissionais', legBX + 30, currentY + 4.4);

  const maxVolume = Math.max(...indMensais.map((m) => Math.max(m.totalAlocacoes, m.profissionaisDistintos)), 1);

  const chartBPlotX = margin + 8;
  const chartBPlotY = currentY + 9;
  const chartBPlotWidth = contentWidth - 16;
  const chartBPlotHeight = 24;
  const slotWidth = chartBPlotWidth / 12;
  const singleBarW = slotWidth * 0.35;

  // Linhas de grade horizontais
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  [0, 0.25, 0.5, 0.75, 1].forEach((fraction) => {
    const gridY = chartBPlotY + chartBPlotHeight * (1 - fraction);
    doc.line(chartBPlotX, gridY, chartBPlotX + chartBPlotWidth, gridY);
  });

  // Linha de base
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(chartBPlotX, chartBPlotY + chartBPlotHeight, chartBPlotX + chartBPlotWidth, chartBPlotY + chartBPlotHeight);

  indMensais.forEach((m, idx) => {
    const slotX = chartBPlotX + idx * slotWidth;

    // Barra 1: Total Alocações
    const hAloc = maxVolume > 0 ? (m.totalAlocacoes / maxVolume) * chartBPlotHeight : 0;
    const xAloc = slotX + slotWidth * 0.12;
    const yAloc = chartBPlotY + chartBPlotHeight - hAloc;

    if (hAloc > 0) {
      doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.roundedRect(xAloc, yAloc, singleBarW, hAloc, 0.4, 0.4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.8);
      doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.text(String(m.totalAlocacoes), xAloc + singleBarW / 2, yAloc - 0.8, { align: 'center' });
    }

    // Barra 2: Profissionais Distintos
    const hProf = maxVolume > 0 ? (m.profissionaisDistintos / maxVolume) * chartBPlotHeight : 0;
    const xProf = slotX + slotWidth * 0.12 + singleBarW + 0.8;
    const yProf = chartBPlotY + chartBPlotHeight - hProf;

    if (hProf > 0) {
      doc.setFillColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.roundedRect(xProf, yProf, singleBarW, hProf, 0.4, 0.4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.8);
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.text(String(m.profissionaisDistintos), xProf + singleBarW / 2, yProf - 0.8, { align: 'center' });
    }

    // Label do mês abaixo da linha de base
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(m.mesAbrev, slotX + slotWidth / 2, chartBPlotY + chartBPlotHeight + 3.2, { align: 'center' });
  });

  // =========================================================================
  // RODAPÉ INSTITUCIONAL EM TODAS AS PÁGINAS
  // =========================================================================
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Linha superior do rodapé
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  return doc;
}

/**
 * Dispara o download automático do arquivo PDF consolidado no navegador
 */
export function baixarRelatorioConsolidadoAlocacoesPDF(
  options: GerarRelatorioConsolidadoOptions,
  customFilename?: string
): void {
  const doc = gerarRelatorioConsolidadoAlocacoesPDF(options);
  const dataHoje = new Date();
  const year = dataHoje.getFullYear();
  const month = String(dataHoje.getMonth() + 1).padStart(2, '0');
  const day = String(dataHoje.getDate()).padStart(2, '0');
  const hours = String(dataHoje.getHours()).padStart(2, '0');
  const minutes = String(dataHoje.getMinutes()).padStart(2, '0');

  const filename =
    customFilename || `Relatorio_Consolidado_Alocacoes_SisGOS_${year}${month}${day}_${hours}${minutes}.pdf`;
  doc.save(filename);
}
