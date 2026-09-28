import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TABLES_METADATA } from '../data/schemaData';
import { POSTGRESQL_DDL } from '../data/sqlDialects';
import { QUERIES_LIST } from '../data/queriesData';

export interface PdfGenerationOptions {
  includeDer?: boolean;
  includeDdl?: boolean;
  includeDictionary?: boolean;
  includeQueries?: boolean;
  institutionName?: string;
  systemName?: string;
  issuerName?: string;
}

/**
 * Utilitário profissional para geração de PDF do Relatório de Gestão de Dados do SisGOS
 */
export function generateDataManagementPdf(options: PdfGenerationOptions = {}): jsPDF {
  const {
    includeDer = true,
    includeDdl = true,
    includeDictionary = true,
    includeQueries = true,
    institutionName = 'GOVERNO DO ESTADO • SECRETARIA DE ADMINISTRAÇÃO E PLANEJAMENTO',
    systemName = 'SisGOS - Sistema de Gestão de Ordens de Serviço & Alocações de Perfil',
    issuerName = 'Coordenação de Governança de Dados & TI',
  } = options;

  // Cria documento A4 em modo retrato (Portrait), unidades em milímetros
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

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const currentDateTime = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  });

  // Cores do tema corporativo / governamental
  const primaryColor: [number, number, number] = [15, 34, 64]; // #0f2240 Azul Marinho Profundo
  const secondaryColor: [number, number, number] = [30, 58, 138]; // #1e3a8a Azul Institucional
  const accentColor: [number, number, number] = [2, 132, 199]; // #0284c7 Azul Céu
  const textColor: [number, number, number] = [31, 41, 55]; // #1f2937 Cinza Escuro
  const mutedTextColor: [number, number, number] = [107, 114, 128]; // #6b7280 Cinza Médio

  let currentY = margin;

  // =========================================================================
  // HELPER: Desenhar cabeçalho e rodapé em páginas de conteúdo
  // =========================================================================
  const drawPageDecorations = (pageNumber: number, totalPages: number) => {
    // Não desenha na capa (página 1)
    if (pageNumber === 1) return;

    // Cabeçalho da página
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 13, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 13, pageWidth - margin, 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('SisGOS • RELATÓRIO OFICIAL DE GESTÃO DE DADOS', margin, 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text('POSTGRESQL 16 • MODELO RELACIONAL', pageWidth - margin, 9, { align: 'right' });

    // Rodapé da página
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(`Emitido em: ${currentDateTime} • Ambiente de Produção`, margin, pageHeight - 7);

    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  // Helper para checar limite de página e avançar se necessário
  const checkPageBreak = (neededHeight: number): void => {
    if (currentY + neededHeight > pageHeight - 18) {
      doc.addPage();
      currentY = 20; // Espaço abaixo do cabeçalho
    }
  };

  // =========================================================================
  // 1. CAPA OFICIAL (PÁGINA 1)
  // =========================================================================
  // Barra superior decorativa
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 6, 'F');
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 6, pageWidth, 2, 'F');

  // Cabeçalho Institucional
  currentY = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(institutionName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

  currentY += 5;
  doc.setFontSize(8);
  doc.text(issuerName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

  // Linha separadora discreta
  currentY += 8;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin + 30, currentY, pageWidth - margin - 30, currentY);

  // Emblema Central / Brasão Vetorial Estilizado
  currentY += 20;
  const emblemCenterX = pageWidth / 2;
  const emblemCenterY = currentY + 12;

  // Círculo de fundo
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(1.2);
  doc.circle(emblemCenterX, emblemCenterY, 18, 'FD');

  // Desenho de banco de dados / ícone vetorial geométrico
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(emblemCenterX - 9, emblemCenterY - 9, 18, 5, 1, 1, 'F');
  doc.roundedRect(emblemCenterX - 9, emblemCenterY - 2, 18, 5, 1, 1, 'F');
  doc.roundedRect(emblemCenterX - 9, emblemCenterY + 5, 18, 5, 1, 1, 'F');

  currentY += 40;

  // Caixa de Título Principal com destaque
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, currentY, contentWidth, 54, 3, 3, 'FD');

  // Faixa esquerda de destaque na caixa
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(margin, currentY, 3, 54, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('DOCUMENTO TÉCNICO OFICIAL DE ARQUITETURA & BANCO DE DADOS', margin + 8, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RELATÓRIO DE GESTÃO DE DADOS', margin + 8, currentY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(systemName, margin + 8, currentY + 31);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(
    'Modelagem Relacional (DER), Scripts DDL PostgreSQL 16+, Dicionário de Metadados e Catálogo de Consultas SQL.',
    margin + 8,
    currentY + 41
  );

  currentY += 66;

  // Grade de Destaques / Sumário das Seções
  const boxWidth = (contentWidth - 6) / 2;
  const boxHeight = 22;

  // Card 1: DER
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('1. Diagrama DER Relacional', margin + 4, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Modelagem conceitual e lógica: 4 tabelas,', margin + 4, currentY + 12);
  doc.text('cardinalidades 1:N e N:N resolvida com integridade.', margin + 4, currentY + 17);

  // Card 2: DDL
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + boxWidth + 6, currentY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('2. Scripts DDL PostgreSQL', margin + boxWidth + 10, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('DDL nativo com Constraints, Triggers PL/pgSQL,', margin + boxWidth + 10, currentY + 12);
  doc.text('Índices de performance e auditoria temporal.', margin + boxWidth + 10, currentY + 17);

  currentY += boxHeight + 4;

  // Card 3: Dicionário
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('3. Dicionário de Metadados', margin + 4, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Mapeamento exaustivo de 33 atributos físicos,', margin + 4, currentY + 12);
  doc.text('tipagem relacional, nulidade, chaves e regras.', margin + 4, currentY + 17);

  // Card 4: Consultas
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + boxWidth + 6, currentY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('4. Consultas & Relatórios SQL', margin + boxWidth + 10, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Queries analíticas consolidadas por pasta governamental,', margin + boxWidth + 10, currentY + 12);
  doc.text('auditoria de passivo orçamentário e equipe.', margin + boxWidth + 10, currentY + 17);

  // Rodapé da capa com dados de homologação
  currentY = pageHeight - 38;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('INFORMAÇÕES DE GOVERNANÇA & EMISSÃO:', margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`• Data de Emissão: ${currentDate} (${currentDateTime})`, margin, currentY);
  doc.text(`• SGDB Alvo: PostgreSQL 14+ / 16 (Engine Oficial)`, pageWidth / 2, currentY);

  currentY += 4.5;
  doc.text('• Padrão Arquitetural: 3ª Forma Normal (3FN) com Snapshot Histórico', margin, currentY);
  doc.text('• Autenticação & Auditoria: SisGOS Engine v1.0.0-PROD', pageWidth / 2, currentY);

  // =========================================================================
  // 2. SEÇÃO 1: DIAGRAMA DE ENTIDADE-RELACIONAMENTO (DER RELACIONAL)
  // =========================================================================
  if (includeDer) {
    doc.addPage();
    currentY = 20;

    // Cabeçalho da Seção 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('1. DIAGRAMA DE ENTIDADE-RELACIONAMENTO (DER)', margin, currentY);

    currentY += 5;
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, currentY, margin + 40, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(
      'A modelagem relacional do SisGOS foi concebida sob rigorosos padrões de normalização (3ª Forma Normal), garantindo integridade referencial estrita, não-redundância e rastreabilidade contábil-orçamentária através do mecanismo de snapshot histórico.',
      margin,
      currentY,
      { maxWidth: contentWidth, lineHeightFactor: 1.3 }
    );

    currentY += 14;

    // =====================================================================
    // DESENHO VETORIAL DO DER NO PRÓPRIO PDF
    // =====================================================================
    // Bloco container do diagrama
    const diagramBoxHeight = 115;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, contentWidth, diagramBoxHeight, 2, 2, 'FD');

    // Título do diagrama
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('MAPA CONCEITUAL & FÍSICO DE TABELAS E INTEGRIDADE REFERENCIAL', margin + 4, currentY + 6);

    const entY = currentY + 12;

    // Helper para desenhar caixas de entidades no diagrama
    const drawEntityBox = (
      x: number,
      y: number,
      w: number,
      title: string,
      typeTag: string,
      color: [number, number, number],
      items: { name: string; type: string; isPk?: boolean; isFk?: boolean }[]
    ) => {
      const h = 8 + items.length * 4.6 + 2;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.6);
      doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

      // Cabeçalho da entidade
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(x, y, w, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(title, x + 3, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(typeTag, x + w - 3, y + 5, { align: 'right' });

      // Atributos
      let rowY = y + 10.5;
      items.forEach((it) => {
        if (it.isPk) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(220, 38, 38); // Vermelho PK
          doc.text('PK', x + 3, rowY);
        } else if (it.isFk) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(2, 132, 199); // Azul FK
          doc.text('FK', x + 3, rowY);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
          doc.text('•', x + 3.5, rowY);
        }

        doc.setFont('helvetica', it.isPk || it.isFk ? 'bold' : 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(it.name, x + 8, rowY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
        doc.text(it.type, x + w - 3, rowY, { align: 'right' });

        rowY += 4.6;
      });

      return h;
    };

    // Entidade 1: Projetos (Topo Esquerda)
    const projX = margin + 4;
    const projY = entY;
    const projW = 54;
    drawEntityBox(projX, projY, projW, 'projetos', 'ENTIDADE FORTE', [16, 185, 129], [
      { name: 'id', type: 'BIGSERIAL', isPk: true },
      { name: 'sigla_projeto', type: 'VARCHAR(50) [UQ]' },
      { name: 'nome_projeto', type: 'VARCHAR(200)' },
      { name: 'sigla_secretaria', type: 'VARCHAR(50)' },
      { name: 'nome_secretaria', type: 'VARCHAR(200)' },
    ]);

    // Entidade 2: Perfis Contratados (Topo Direita)
    const perfX = margin + contentWidth - 58;
    const perfY = entY;
    const perfW = 54;
    drawEntityBox(perfX, perfY, perfW, 'perfis_contratados', 'ENTIDADE FORTE', [139, 92, 246], [
      { name: 'id', type: 'BIGSERIAL', isPk: true },
      { name: 'nome_perfil', type: 'VARCHAR(150)' },
      { name: 'custo_mensal_perfil', type: 'NUMERIC(12,2)' },
      { name: 'documento_referencia', type: 'VARCHAR(255)' },
      { name: 'vigente', type: 'BOOLEAN' },
    ]);

    // Entidade 3: Ordens de Serviço (Meio Centro)
    const osX = margin + 4;
    const osY = entY + 44;
    const osW = 62;
    drawEntityBox(osX, osY, osW, 'ordens_servico', 'ENTIDADE GERENCIAL', [37, 99, 235], [
      { name: 'id', type: 'BIGSERIAL', isPk: true },
      { name: 'projeto_id', type: 'BIGINT', isFk: true },
      { name: 'numero_os', type: 'INTEGER' },
      { name: 'ano_referencia', type: 'INTEGER' },
      { name: 'situacao_sgc', type: 'VARCHAR(100)' },
      { name: 'situacao_passivo_2026', type: 'VARCHAR(100)' },
      { name: 'alocacao/entrega/desc_sgc', type: 'BOOLEAN' },
    ]);

    // Entidade 4: Alocações de Perfil (Direita / Associativa)
    const alocX = margin + contentWidth - 76;
    const alocY = entY + 44;
    const alocW = 72;
    drawEntityBox(alocX, alocY, alocW, 'alocacoes_perfil_os', 'ASSOCIATIVA (N:N)', [217, 119, 6], [
      { name: 'id', type: 'BIGSERIAL', isPk: true },
      { name: 'ordem_servico_id', type: 'BIGINT', isFk: true },
      { name: 'perfil_contratado_id', type: 'BIGINT', isFk: true },
      { name: 'mes_referencia', type: 'VARCHAR(30)' },
      { name: 'nome_profissional', type: 'VARCHAR(150)' },
      { name: 'percentual_alocacao', type: 'NUMERIC(5,2)' },
      { name: 'documento_referencia', type: 'VARCHAR(255) [SNP]' },
      { name: 'custo_mensal_perfil', type: 'NUMERIC(12,2) [SNP]' },
      { name: 'custo_alocacao', type: 'NUMERIC(12,2) [CALC]' },
    ]);

    // Linhas de Relacionamento Vetoriais com Legenda de Cardinalidade
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.6);

    // Linha 1: projetos (1) -> ordens_servico (N)
    doc.setDrawColor(16, 185, 129);
    doc.line(projX + 27, projY + 34, osX + 27, osY);
    // Marcador 1:N
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(16, 185, 129);
    doc.text('(1)', projX + 29, projY + 37);
    doc.text('(N)', osX + 29, osY - 2);

    // Linha 2: ordens_servico (1) -> alocacoes_perfil_os (N)
    doc.setDrawColor(37, 99, 235);
    doc.line(osX + osW, osY + 20, alocX, alocY + 20);
    doc.setTextColor(37, 99, 235);
    doc.text('(1)', osX + osW + 1, osY + 18);
    doc.text('(N)', alocX - 5, alocY + 18);

    // Linha 3: perfis_contratados (1) -> alocacoes_perfil_os (N)
    doc.setDrawColor(139, 92, 246);
    doc.line(perfX + 27, perfY + 34, alocX + 36, alocY);
    doc.setTextColor(139, 92, 246);
    doc.text('(1)', perfX + 29, perfY + 37);
    doc.text('(N)', alocX + 38, alocY - 2);

    // Legenda no rodapé da caixa do DER
    const legY = currentY + diagramBoxHeight - 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Legenda: [PK] Chave Primária • [FK] Chave Estrangeira • [SNP] Snapshot Histórico • [CALC] Campo Derivado Trigger', margin + 4, legY);

    currentY += diagramBoxHeight + 8;

    // Tabela explicativa de cardinalidades e integridade referencial
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: {
        fillColor: secondaryColor,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: textColor,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      head: [['Relacionamento', 'Tabelas Envolvidas', 'Tipo', 'Chave Estrangeira (FK)', 'Ação Referencial']],
      body: [
        [
          '1. Alocação de OS em Projeto',
          'projetos ➔ ordens_servico',
          '1:N (Um para Muitos)',
          'ordens_servico.projeto_id ➔ projetos.id',
          'ON UPDATE CASCADE\nON DELETE RESTRICT',
        ],
        [
          '2. Alocação de Equipe na OS',
          'ordens_servico ➔ alocacoes_perfil_os',
          '1:N (Um para Muitos)',
          'alocacoes.ordem_servico_id ➔ ordens_servico.id',
          'ON UPDATE CASCADE\nON DELETE CASCADE',
        ],
        [
          '3. Associação de Perfil Contratado',
          'perfis_contratados ➔ alocacoes_perfil_os',
          '1:N (Um para Muitos)',
          'alocacoes.perfil_contratado_id ➔ perfis.id',
          'ON UPDATE CASCADE\nON DELETE RESTRICT',
        ],
      ],
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // =========================================================================
  // 3. SEÇÃO 2: SCRIPTS DDL SQL PARA POSTGRESQL (14+ / 16)
  // =========================================================================
  if (includeDdl) {
    doc.addPage();
    currentY = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('2. SCRIPTS DDL SQL PARA POSTGRESQL (14+ / 16)', margin, currentY);

    currentY += 5;
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, currentY, margin + 40, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(
      'Estrutura física completa com criação de tabelas, chaves primárias BIGSERIAL, chaves estrangeiras com ações em cascata, restrições CHECK de validação matemática, índices e função trigger PL/pgSQL para automação de regras contratuais.',
      margin,
      currentY,
      { maxWidth: contentWidth, lineHeightFactor: 1.3 }
    );

    currentY += 12;

    // Blocos com os DDLs divididos por tabela e trigger
    const ddlSections = [
      {
        title: 'Tabela 1: perfis_contratados (Catálogo Oficial de Itens e Perfis)',
        sql: `-- 1. Perfis Contratados
CREATE TABLE perfis_contratados (
    id BIGSERIAL PRIMARY KEY,
    item_contratacao VARCHAR(100) NOT NULL,
    nome_perfil VARCHAR(150) NOT NULL,
    documento_referencia VARCHAR(255) NOT NULL,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    custo_mensal_perfil NUMERIC(12, 2) NOT NULL,
    quantidade_mensal_contratada INTEGER NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_perfis_custo_positivo CHECK (custo_mensal_perfil >= 0.00),
    CONSTRAINT chk_perfis_qtd_positiva CHECK (quantidade_mensal_contratada >= 0)
);`,
      },
      {
        title: 'Tabela 2: projetos (Iniciativas e Secretarias)',
        sql: `-- 2. Projetos Governamentais
CREATE TABLE projetos (
    id BIGSERIAL PRIMARY KEY,
    nome_projeto VARCHAR(200) NOT NULL,
    sigla_projeto VARCHAR(50) NOT NULL,
    descricao VARCHAR(500),
    nome_secretaria VARCHAR(200) NOT NULL,
    sigla_secretaria VARCHAR(50) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unq_projetos_sigla UNIQUE (sigla_projeto)
);`,
      },
      {
        title: 'Tabela 3: ordens_servico (Ordens de Serviço e Etapas do SGC)',
        sql: `-- 3. Ordens de Serviço (1 Projeto -> N Ordens de Serviço)
CREATE TABLE ordens_servico (
    id BIGSERIAL PRIMARY KEY,
    projeto_id BIGINT NOT NULL,
    numero_os INTEGER NOT NULL,
    ano_referencia INTEGER NOT NULL,
    alocacao_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    entrega_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    descricao_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    situacao_sgc VARCHAR(100),
    situacao_passivo_2026 VARCHAR(100),
    ne_planejamento VARCHAR(60),
    ne_faturamento VARCHAR(60),
    processo_sei_pagamento VARCHAR(60),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_os_projeto FOREIGN KEY (projeto_id) 
        REFERENCES projetos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_os_numero_positivo CHECK (numero_os > 0),
    CONSTRAINT chk_os_ano_valido CHECK (ano_referencia >= 2000),
    CONSTRAINT unq_os_numero_ano_projeto UNIQUE (numero_os, ano_referencia, projeto_id)
);
CREATE INDEX idx_ordens_servico_projeto ON ordens_servico (projeto_id);`,
      },
      {
        title: 'Tabela 4: alocacoes_perfil_os (Associativa N:N com Snapshots e Custos)',
        sql: `-- 4. Alocações de Perfil na OS (N Perfis <-> N OSs)
CREATE TABLE alocacoes_perfil_os (
    id BIGSERIAL PRIMARY KEY,
    ordem_servico_id BIGINT NOT NULL,
    perfil_contratado_id BIGINT NOT NULL,
    mes_referencia VARCHAR(30) NOT NULL,
    nome_profissional VARCHAR(150) NOT NULL,
    percentual_alocacao NUMERIC(5, 2) NOT NULL,
    documento_referencia VARCHAR(255) NOT NULL,
    custo_mensal_perfil NUMERIC(12, 2) NOT NULL,
    custo_alocacao NUMERIC(12, 2) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_alocacao_os FOREIGN KEY (ordem_servico_id) 
        REFERENCES ordens_servico (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_alocacao_perfil FOREIGN KEY (perfil_contratado_id) 
        REFERENCES perfis_contratados (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_alocacao_percentual CHECK (percentual_alocacao > 0.00 AND percentual_alocacao <= 100.00),
    CONSTRAINT chk_alocacao_custo_positivo CHECK (custo_alocacao >= 0.00)
);
CREATE INDEX idx_alocacoes_os ON alocacoes_perfil_os (ordem_servico_id);
CREATE INDEX idx_alocacoes_perfil ON alocacoes_perfil_os (perfil_contratado_id);`,
      },
      {
        title: 'Automação: Trigger PL/pgSQL para Cálculo e Snapshot Automático',
        sql: `-- 5. Função e Trigger de Banco PL/pgSQL
CREATE OR REPLACE FUNCTION fn_trg_processar_alocacao_perfil()
RETURNS TRIGGER AS $$
DECLARE
    v_custo_perfil NUMERIC(12, 2);
    v_doc_ref VARCHAR(255);
BEGIN
    -- Captura snapshot histórico do perfil se não informado
    IF NEW.custo_mensal_perfil IS NULL OR NEW.custo_mensal_perfil <= 0 THEN
        SELECT custo_mensal_perfil, documento_referencia
        INTO v_custo_perfil, v_doc_ref
        FROM perfis_contratados
        WHERE id = NEW.perfil_contratado_id;

        NEW.custo_mensal_perfil := COALESCE(v_custo_perfil, 0.00);
        IF NEW.documento_referencia IS NULL OR NEW.documento_referencia = '' THEN
            NEW.documento_referencia := COALESCE(v_doc_ref, 'CONTRATO-PADRÃO');
        END IF;
    END IF;

    -- Fórmula matemática automática: custo = (custo_mensal * percentual) / 100
    NEW.custo_alocacao := ROUND((NEW.custo_mensal_perfil * (NEW.percentual_alocacao / 100.00)), 2);
    NEW.atualizado_em := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_calcular_custo_alocacao
BEFORE INSERT OR UPDATE ON alocacoes_perfil_os
FOR EACH ROW EXECUTE FUNCTION fn_trg_processar_alocacao_perfil();`,
      },
    ];

    ddlSections.forEach((sec) => {
      const lines = sec.sql.split('\n');
      const boxHeight = 8 + lines.length * 3.3 + 4;
      checkPageBreak(boxHeight + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(sec.title, margin, currentY);

      currentY += 4;

      doc.setFillColor(15, 23, 42); // #0f172a Dark Slate
      doc.roundedRect(margin, currentY, contentWidth, boxHeight, 1.5, 1.5, 'F');

      doc.setFont('courier', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(226, 232, 240); // #e2e8f0

      let textY = currentY + 4;
      lines.forEach((l) => {
        // Highlight de comentários
        if (l.trim().startsWith('--')) {
          doc.setTextColor(148, 163, 184); // #94a3b8
        } else if (
          l.includes('PRIMARY KEY') ||
          l.includes('FOREIGN KEY') ||
          l.includes('REFERENCES') ||
          l.includes('CONSTRAINT') ||
          l.includes('CREATE TABLE')
        ) {
          doc.setTextColor(125, 211, 252); // #7dd3fc
        } else {
          doc.setTextColor(241, 245, 249);
        }
        doc.text(l, margin + 3, textY);
        textY += 3.3;
      });

      currentY += boxHeight + 6;
    });
  }

  // =========================================================================
  // 4. SEÇÃO 3: DICIONÁRIO DE DADOS & METADADOS DE TODAS AS TABELAS
  // =========================================================================
  if (includeDictionary) {
    doc.addPage();
    currentY = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('3. DICIONÁRIO DE DADOS & METADADOS DAS TABELAS', margin, currentY);

    currentY += 5;
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, currentY, margin + 40, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(
      'Catálogo exaustivo de entidades, colunas, tipos primitivos, chaves primárias e estrangeiras, regras de validação (CHECK constraints) e descrições semânticas de negócio.',
      margin,
      currentY,
      { maxWidth: contentWidth, lineHeightFactor: 1.3 }
    );

    currentY += 8;

    TABLES_METADATA.forEach((tbl, tblIdx) => {
      checkPageBreak(35);

      // Título da Tabela no Dicionário
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Tabela 3.${tblIdx + 1}: ${tbl.name} (${tbl.displayName})`, margin, currentY);

      currentY += 4.5;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.text(tbl.description, margin, currentY, { maxWidth: contentWidth });

      currentY += 5;

      const rows = tbl.columns.map((c) => {
        let keyLabel = '-';
        if (c.isPk) keyLabel = 'PK';
        if (c.isFk) keyLabel = 'FK';
        if (c.isPk && c.isFk) keyLabel = 'PK / FK';

        return [
          c.name,
          c.type,
          c.nullable ? 'Sim' : 'Não',
          keyLabel,
          c.defaultValue || c.checkConstraint || '-',
          c.description,
        ];
      });

      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        headStyles: {
          fillColor: secondaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7,
          cellPadding: 2,
        },
        bodyStyles: {
          fontSize: 6.5,
          textColor: textColor,
          cellPadding: 1.8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold' },
          1: { cellWidth: 26 },
          2: { cellWidth: 12, halign: 'center' },
          3: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
          4: { cellWidth: 28 },
          5: { cellWidth: 'auto' },
        },
        head: [['Coluna Física', 'Tipo de Dado', 'Nulo?', 'Chave', 'Padrão / Regra', 'Descrição de Negócio']],
        body: rows,
        margin: { left: margin, right: margin },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    });
  }

  // =========================================================================
  // 5. SEÇÃO 4: CONSULTAS SQL & RELATÓRIOS GERENCIAIS
  // =========================================================================
  if (includeQueries) {
    doc.addPage();
    currentY = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('4. CONSULTAS SQL & RELATÓRIOS GERENCIAIS', margin, currentY);

    currentY += 5;
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, currentY, margin + 40, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(
      'Conjunto padronizado de scripts SQL analíticos (DQL) otimizados para acompanhamento orçamentário, prestação de contas governamentais, auditoria de pendências no SGC e acompanhamento do passivo 2026.',
      margin,
      currentY,
      { maxWidth: contentWidth, lineHeightFactor: 1.3 }
    );

    currentY += 10;

    QUERIES_LIST.forEach((query, qIdx) => {
      const sqlLines = query.sql.split('\n');
      const boxHeight = 6 + sqlLines.length * 3.3 + 4;
      const totalBlockNeeded = 22 + boxHeight;

      checkPageBreak(totalBlockNeeded);

      // Card de cabeçalho da Consulta
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`4.${qIdx + 1} ${query.title}`, margin + 3, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(`[${query.category.toUpperCase()}]`, pageWidth - margin - 3, currentY + 5.5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.text(query.description, margin + 3, currentY + 10.5, { maxWidth: contentWidth - 6 });

      currentY += 16;

      // Objetivo Operacional
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text('Objetivo Gerencial: ', margin, currentY);
      const objWidth = doc.getTextWidth('Objetivo Gerencial: ');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.text(query.objective, margin + objWidth, currentY, { maxWidth: contentWidth - objWidth });

      currentY += 5;

      // Bloco de Código SQL
      doc.setFillColor(15, 23, 42); // #0f172a
      doc.roundedRect(margin, currentY, contentWidth, boxHeight, 1.5, 1.5, 'F');

      doc.setFont('courier', 'normal');
      doc.setFontSize(6.2);

      let sqlY = currentY + 4;
      sqlLines.forEach((line) => {
        if (line.includes('SELECT') || line.includes('FROM') || line.includes('JOIN') || line.includes('GROUP BY') || line.includes('ORDER BY') || line.includes('WHERE')) {
          doc.setTextColor(125, 211, 252);
        } else {
          doc.setTextColor(241, 245, 249);
        }
        doc.text(line, margin + 3, sqlY);
        sqlY += 3.3;
      });

      currentY += boxHeight + 8;
    });
  }

  // =========================================================================
  // 6. ENCERRAMENTO E NUMERAÇÃO DE PÁGINAS EM 2 PASSOS
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageDecorations(i, totalPages);
  }

  return doc;
}

/**
 * Função utilitária para disparar o download direto do arquivo .pdf no navegador
 */
export function downloadDataManagementPdf(options: PdfGenerationOptions = {}, customFilename?: string): void {
  const doc = generateDataManagementPdf(options);
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
  const filename = customFilename || `Relatorio_Gestao_Dados_SisGOS_${dateStr}.pdf`;
  doc.save(filename);
}
