import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Projeto, OrdemServico, PerfilContratado, AlocacaoPerfilOs, MesReferencia } from '../types/models';
import { formatCurrency, formatNumber } from './formatters';

export interface FiltrosRelatorioAlocacoes {
  secretarias: string[];
  projetosIds: string[];
  anos: string[];
  meses: string[];
  situacoesSgc: string[];
  situacoesPassivo: string[];
  termoBusca: string;
}

export interface EstruturaOSRelatorio {
  os: OrdemServico;
  alocacoes: AlocacaoPerfilOs[];
  custoTotalAlocacoesMes: number;
  valorTotalGeralOS: number;
}

export interface EstruturaProjetoRelatorio {
  projeto: Projeto;
  custoTotalProjetoMes: number;
  totalAlocacoesProjetoMes: number;
  ordens: EstruturaOSRelatorio[];
}

export interface EstruturaMesRelatorio {
  mes: MesReferencia;
  custoTotalMes: number;
  totalAlocacoesMes: number;
  totalProfissionais: number;
  projetos: EstruturaProjetoRelatorio[];
}

export interface DadosRelatorioAlocacoes {
  meses: EstruturaMesRelatorio[];
  totalAlocacoes: number;
  totalCustoGeral: number;
  totalProfissionaisGeral: number;
  totalOSsGeral: number;
  totalProjetosGeral: number;
}

export interface GerarRelatorioAlocacoesOptions {
  filtros: FiltrosRelatorioAlocacoes;
  dados: DadosRelatorioAlocacoes;
  todosProjetos: Projeto[];
  todosPerfis: PerfilContratado[];
}

/**
 * Gera o documento PDF profissional do Relatório Gerencial de Alocações do SisGOS
 */
export function gerarRelatorioGerencialAlocacoesPDF(options: GerarRelatorioAlocacoesOptions): jsPDF {
  const { filtros, dados, todosProjetos, todosPerfis } = options;

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

  // Cores do tema corporativo e governamental
  const primaryNavy: [number, number, number] = [15, 34, 64]; // #0f2240
  const blueTheme: [number, number, number] = [30, 58, 138]; // #1e3a8a
  const accentBlue: [number, number, number] = [2, 132, 199]; // #0284c7
  const textDark: [number, number, number] = [31, 41, 55]; // #1f2937
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748b
  const bgLight: [number, number, number] = [248, 250, 252]; // #f8fafc
  const borderLight: [number, number, number] = [226, 232, 240]; // #e2e8f0

  // Mapa rápido de perfis
  const mapaPerfis = new Map(todosPerfis.map((p) => [p.id, p]));
  const mapaProjetos = new Map(todosProjetos.map((p) => [String(p.id), p]));

  let currentY = margin;

  // Helper para verificar espaço na página
  const checkPageBreak = (neededHeight: number): void => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = 18;
    }
  };

  // =========================================================================
  // 1. CABEÇALHO INSTITUCIONAL SUPERIOR
  // =========================================================================
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  currentY = 13;

  // Título e Subtítulo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('RELATÓRIO GERENCIAL DAS ALOCAÇÕES', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Emitido em: ${dataHoraEmissao} (Horário de Brasília)`, pageWidth - margin, currentY, { align: 'right' });

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Visão consolidada cronológica e orçamentária por Mês, Projeto e Ordem de Serviço.', margin, currentY);

  currentY += 5;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 5;

  // =========================================================================
  // 2. PAINEL DE INFORMAÇÕES DOS FILTROS APLICADOS
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
        const proj = mapaProjetos.get(id);
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

  // Medição e quebra de linhas para renderização sem colunas (linha única por filtro)
  const lineHeight = 4.2;
  const paddingX = 5;
  const maxWidth = contentWidth - (paddingX * 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  interface ItemFiltroFormatado {
    rotulo: string;
    prefixW: number;
    linhas: string[];
  }

  const itensFormatados: ItemFiltroFormatado[] = [];

  if (filtrosAtivos.length > 0) {
    for (const f of filtrosAtivos) {
      const prefix = `• ${f.rotulo}: `;
      doc.setFont('helvetica', 'bold');
      const prefixW = doc.getTextWidth(prefix);
      doc.setFont('helvetica', 'normal');
      const linhas = doc.splitTextToSize(f.valor, maxWidth - prefixW);
      itensFormatados.push({
        rotulo: f.rotulo,
        prefixW,
        linhas: Array.isArray(linhas) ? linhas : [linhas],
      });
    }
  }

  const totalLinhasTexto = filtrosAtivos.length === 0
    ? 1
    : itensFormatados.reduce((acc, curr) => acc + curr.linhas.length, 0);

  const filterBoxHeight = Math.max(14, 7.5 + totalLinhasTexto * lineHeight + 2.5);

  // Retângulo do painel de filtros
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, filterBoxHeight, 2, 2, 'FD');

  // Faixa esquerda indicativa
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.roundedRect(margin, currentY, 2.5, filterBoxHeight, 1, 1, 'F');

  // Título da seção
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(blueTheme[0], blueTheme[1], blueTheme[2]);
  doc.text('PARÂMETROS E FILTROS APLICADOS NESTE RELATÓRIO:', margin + paddingX, currentY + 5.2);

  // Conteúdo dos filtros
  if (filtrosAtivos.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Sem nenhum filtro selecionado ou aplicado', margin + paddingX, currentY + 10.5);
  } else {
    let lineY = currentY + 10;
    doc.setFontSize(7.5);

    for (const item of itensFormatados) {
      const prefix = `• ${item.rotulo}: `;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(prefix, margin + paddingX, lineY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);

      item.linhas.forEach((subLinha, idx) => {
        if (idx === 0) {
          doc.text(subLinha, margin + paddingX + item.prefixW, lineY);
        } else {
          lineY += lineHeight;
          doc.text(subLinha, margin + paddingX + item.prefixW, lineY);
        }
      });

      lineY += lineHeight;
    }
  }

  currentY += filterBoxHeight + 5;

  // =========================================================================
  // 3. INDICADORES RESUMO / QUADRO EXECUTIVO
  // =========================================================================
  const cardCount = 4;
  const gap = 3;
  const cardW = (contentWidth - gap * (cardCount - 1)) / cardCount;
  const cardH = 14;

  const kpis = [
    { label: 'ALOCAÇÕES FILTRADAS', val: formatNumber(dados.totalAlocacoes), color: blueTheme },
    { label: 'CUSTO TOTAL PERÍODO', val: formatCurrency(dados.totalCustoGeral), color: [16, 110, 60] as [number, number, number] },
    { label: 'PROFISSIONAIS DISTINTOS', val: formatNumber(dados.totalProfissionaisGeral), color: [14, 116, 144] as [number, number, number] },
    { label: 'PROJETOS / OSS', val: `${formatNumber(dados.totalProjetosGeral)} Proj. / ${formatNumber(dados.totalOSsGeral)} OSs`, color: primaryNavy },
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * (cardW + gap);
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(kpiX, currentY, cardW, cardH, 1.5, 1.5, 'FD');

    // Linha superior colorida
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(kpiX, currentY, cardW, 1.2, 0.5, 0.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(kpi.label, kpiX + 3, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, kpiX + 3, currentY + 11);
  });

  currentY += cardH + 6;

  // =========================================================================
  // 4. DETALHAMENTO DAS ALOCAÇÕES POR MÊS, PROJETO E ORDEM DE SERVIÇO
  // =========================================================================
  if (dados.meses.length === 0) {
    checkPageBreak(30);
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Nenhuma alocação encontrada para os filtros selecionados.', margin + contentWidth / 2, currentY + 11, {
      align: 'center',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      'Ajuste os filtros de busca ou selecione outros meses, secretarias ou projetos.',
      margin + contentWidth / 2,
      currentY + 17,
      { align: 'center' }
    );

    currentY += 30;
  } else {
    // Itera pelos meses
    dados.meses.forEach((mesData) => {
      checkPageBreak(25);

      // Faixa / Banner do Mês
      doc.setFillColor(blueTheme[0], blueTheme[1], blueTheme[2]);
      doc.roundedRect(margin, currentY, contentWidth, 8, 1.5, 1.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`MÊS DE REFERÊNCIA: ${mesData.mes.toUpperCase()}`, margin + 4, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(
        `Alocações: ${mesData.totalAlocacoesMes} | Profissionais: ${mesData.totalProfissionais} | Custo no Mês: ${formatCurrency(mesData.custoTotalMes)}`,
        pageWidth - margin - 4,
        currentY + 5.5,
        { align: 'right' }
      );

      currentY += 11;

      // Itera pelos projetos dentro do mês
      mesData.projetos.forEach((projData) => {
        checkPageBreak(20);

        // Cabeçalho do Projeto
        doc.setFillColor(236, 242, 254);
        doc.setDrawColor(199, 210, 254);
        doc.setLineWidth(0.4);
        doc.roundedRect(margin, currentY, contentWidth, 7, 1, 1, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(blueTheme[0], blueTheme[1], blueTheme[2]);
        doc.text(
          `PROJETO: [${projData.projeto.sigla_projeto}] ${projData.projeto.nome_projeto}`,
          margin + 3,
          currentY + 4.8
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(
          `Secretaria: ${projData.projeto.sigla_secretaria} | Custo Projeto no Mês: ${formatCurrency(projData.custoTotalProjetoMes)}`,
          pageWidth - margin - 3,
          currentY + 4.8,
          { align: 'right' }
        );

        currentY += 9;

        // Itera pelas Ordens de Serviço do projeto
        projData.ordens.forEach((osData) => {
          checkPageBreak(28);

          // Card de Cabeçalho da Ordem de Serviço
          const os = osData.os;
          const osHeaderH = 14;

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.3);
          doc.roundedRect(margin, currentY, contentWidth, osHeaderH, 1, 1, 'FD');

          // Faixa lateral verde/azul
          doc.setFillColor(16, 185, 129);
          doc.roundedRect(margin, currentY, 2, osHeaderH, 0.5, 0.5, 'F');

          // Linha 1 do Header da OS
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
          doc.text(`Ordem de Serviço Nº ${os.numero_os}/${os.ano_referencia}`, margin + 5, currentY + 4.5);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.8);
          doc.setTextColor(textDark[0], textDark[1], textDark[2]);
          doc.text(`Situação SGC: `, margin + 65, currentY + 4.5);
          doc.setFont('helvetica', 'bold');
          doc.text(`${os.situacao_sgc || 'Não definida'}`, margin + 83, currentY + 4.5);

          doc.setFont('helvetica', 'normal');
          doc.text(`Passivo 2026: `, margin + 120, currentY + 4.5);
          doc.setFont('helvetica', 'bold');
          doc.text(`${os.situacao_passivo_2026 || '(Não informado)'}`, margin + 138, currentY + 4.5);

          // Linha 2 do Header da OS com os campos NE Planejamento, NE Faturamento, Processo SEI
          const row2Y = currentY + 9.5;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);

          const nePlan = os.ne_planejamento?.trim() || '—';
          const neFat = os.ne_faturamento?.trim() || '—';
          const procSei = os.processo_sei_pagamento?.trim() || '—';

          doc.text(`NE Planejamento: `, margin + 5, row2Y);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(textDark[0], textDark[1], textDark[2]);
          doc.text(nePlan, margin + 26, row2Y);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
          doc.text(`NE Faturamento: `, margin + 65, row2Y);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(textDark[0], textDark[1], textDark[2]);
          doc.text(neFat, margin + 86, row2Y);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
          doc.text(`Processo SEI: `, margin + 120, row2Y);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(textDark[0], textDark[1], textDark[2]);
          doc.text(procSei, margin + 138, row2Y);

          currentY += osHeaderH + 2;

          // Tabela de Alocações desta OS
          const tableRows = osData.alocacoes.map((aloc) => {
            const perfil = mapaPerfis.get(aloc.perfil_contratado_id);
            const nomePerfil = perfil?.nome_perfil || `Perfil ID ${aloc.perfil_contratado_id}`;
            const itemRef = perfil?.item_contratacao || aloc.documento_referencia || '—';
            const perc = `${aloc.percentual_alocacao}%`;
            const custoMensal = formatCurrency(aloc.custo_mensal_perfil);
            const custoAloc = formatCurrency(aloc.custo_alocacao);

            return [aloc.nome_profissional || '(Sem nome)', nomePerfil, itemRef, perc, custoMensal, custoAloc];
          });

          // Linha de Rodapé da tabela com os totais da OS
          tableRows.push([
            {
              content: `Total da OS ${os.numero_os}/${os.ano_referencia} no Mês (${osData.alocacoes.length} alocações) • Valor Geral Total da OS: ${formatCurrency(osData.valorTotalGeralOS)}`,
              colSpan: 5,
              styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] },
            } as any,
            {
              content: formatCurrency(osData.custoTotalAlocacoesMes),
              styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 34, 64] },
            } as any,
          ]);

          autoTable(doc, {
            startY: currentY,
            theme: 'grid',
            headStyles: {
              fillColor: [71, 85, 105], // Slate-600
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 6.8,
              cellPadding: 1.5,
            },
            bodyStyles: {
              fontSize: 6.5,
              textColor: textDark,
              cellPadding: 1.5,
            },
            alternateRowStyles: {
              fillColor: [249, 250, 251],
            },
            columnStyles: {
              0: { cellWidth: 46, fontStyle: 'bold' }, // Profissional
              1: { cellWidth: 44 }, // Perfil
              2: { cellWidth: 32 }, // Item/Doc
              3: { cellWidth: 16, halign: 'center' }, // %
              4: { cellWidth: 22, halign: 'right' }, // Custo Mensal
              5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }, // Custo Alocado
            },
            head: [['Profissional', 'Perfil Contratado', 'Item / Ref. Contrato', '% Aloc.', 'Custo Perfil', 'Custo Alocação']],
            body: tableRows,
            margin: { left: margin, right: margin },
          });

          currentY = (doc as any).lastAutoTable.finalY + 5;
        });

        currentY += 2;
      });

      currentY += 3;
    });
  }

  // =========================================================================
  // 5. DECORAÇÕES E NUMERAÇÃO DE PÁGINAS (PÁGINA X DE Y)
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Linha de cabeçalho sutil em todas as páginas exceto topo da pág 1
    if (p > 1) {
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.rect(0, 0, pageWidth, 9, 'F');
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, 9, pageWidth - margin, 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`Emitido em: ${dataHoraEmissao}`, pageWidth - margin, 6.5, { align: 'right' });
    }

    // Linha de rodapé
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
 * Dispara o download automático do arquivo PDF no navegador
 */
export function baixarRelatorioGerencialAlocacoesPDF(options: GerarRelatorioAlocacoesOptions, customFilename?: string): void {
  const doc = gerarRelatorioGerencialAlocacoesPDF(options);
  const dataHoje = new Date();
  const year = dataHoje.getFullYear();
  const month = String(dataHoje.getMonth() + 1).padStart(2, '0');
  const day = String(dataHoje.getDate()).padStart(2, '0');
  const hours = String(dataHoje.getHours()).padStart(2, '0');
  const minutes = String(dataHoje.getMinutes()).padStart(2, '0');

  const filename = customFilename || `Relatorio_Gerencial_Alocacoes_SisGOS_${year}${month}${day}_${hours}${minutes}.pdf`;
  doc.save(filename);
}
