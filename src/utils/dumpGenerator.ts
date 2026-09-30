import { Projeto, PerfilContratado, OrdemServico, AlocacaoPerfilOs } from '../types/models';

export interface DumpOptions {
  includeDdl?: boolean;
  includeData?: boolean;
  includeTriggers?: boolean;
  includeDrop?: boolean;
}

function sqlStr(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  const str = String(val).trim();
  if (str === '' || str.toUpperCase() === 'NULL') return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function sqlNum(val: any, decimals?: number): string {
  if (val === null || val === undefined) return 'NULL';
  const n = Number(val);
  if (isNaN(n)) return 'NULL';
  if (decimals !== undefined) return n.toFixed(decimals);
  return String(n);
}

function sqlBool(val: any): string {
  return Boolean(val) ? 'TRUE' : 'FALSE';
}

function sqlTimestamp(val: any): string {
  if (!val) return 'CURRENT_TIMESTAMP';
  const clean = String(val).replace('T', ' ').substring(0, 19);
  return `'${clean}'::timestamptz`;
}

export function generateSqlDump(
  projetos: Projeto[],
  perfis: PerfilContratado[],
  ordens: OrdemServico[],
  alocacoes: AlocacaoPerfilOs[],
  options: DumpOptions = {}
): string {
  const {
    includeDdl = true,
    includeData = true,
    includeTriggers = true,
    includeDrop = true,
  } = options;

  const now = new Date();
  const timestampIso = now.toISOString();
  const dataFormatada = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const lines: string[] = [];

  // Cabeçalho Oficial do DUMP
  lines.push('-- ========================================================================');
  lines.push('-- SisGOS - Sistema de Gestão de Ordens de Serviço & Alocações de Perfil');
  lines.push('-- DUMP COMPLETO DA BASE DE DADOS POSTGRESQL (.sql)');
  lines.push(`-- Data de Extração: ${dataFormatada} (${timestampIso})`);
  lines.push('-- Dialeto Alvo: PostgreSQL 14 / 15 / 16+ (Compatível com Cloud SQL, Docker & RDS)');
  lines.push(`-- Total de Registros Exportados:`);
  lines.push(`--   • Projetos: ${projetos.length}`);
  lines.push(`--   • Perfis Contratados: ${perfis.length}`);
  lines.push(`--   • Ordens de Serviço: ${ordens.length}`);
  lines.push(`--   • Alocações de Perfil na OS: ${alocacoes.length}`);
  lines.push('-- ========================================================================');
  lines.push('');
  lines.push('SET client_encoding = \'UTF8\';');
  lines.push('SET standard_conforming_strings = on;');
  lines.push('SET check_function_bodies = false;');
  lines.push('SET xmloption = content;');
  lines.push('SET client_min_messages = warning;');
  lines.push('SET row_security = off;');
  lines.push('SET timezone = \'America/Sao_Paulo\';');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');

  // SEÇÃO DDL (Estrutura)
  if (includeDdl) {
    lines.push('-- ========================================================================');
    lines.push('-- 1. ESTRUTURA DAS TABELAS RELACIONAIS (DDL)');
    lines.push('-- ========================================================================');
    lines.push('');

    if (includeDrop) {
      lines.push('-- Limpeza de estruturas anteriores para recriação limpa');
      lines.push('DROP TABLE IF EXISTS alocacoes_perfil_os CASCADE;');
      lines.push('DROP TABLE IF EXISTS ordens_servico CASCADE;');
      lines.push('DROP TABLE IF EXISTS projetos CASCADE;');
      lines.push('DROP TABLE IF EXISTS perfis_contratados CASCADE;');
      lines.push('DROP FUNCTION IF EXISTS fn_trg_processar_alocacao_perfil() CASCADE;');
      lines.push('');
    }

    lines.push('-- ------------------------------------------------------------------------');
    lines.push('-- Tabela 1: perfis_contratados');
    lines.push('-- ------------------------------------------------------------------------');
    lines.push('CREATE TABLE perfis_contratados (');
    lines.push('    id BIGSERIAL PRIMARY KEY,');
    lines.push('    item_contratacao VARCHAR(100) NOT NULL,');
    lines.push('    nome_perfil VARCHAR(150) NOT NULL,');
    lines.push('    documento_referencia VARCHAR(255) NOT NULL,');
    lines.push('    vigente BOOLEAN NOT NULL DEFAULT TRUE,');
    lines.push('    custo_mensal_perfil NUMERIC(12, 2) NOT NULL,');
    lines.push('    quantidade_mensal_contratada INTEGER NOT NULL,');
    lines.push('    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,');
    lines.push('    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,');
    lines.push('    CONSTRAINT chk_perfis_custo_positivo CHECK (custo_mensal_perfil >= 0.00),');
    lines.push('    CONSTRAINT chk_perfis_qtd_positiva CHECK (quantidade_mensal_contratada >= 0)');
    lines.push(');');
    lines.push('');
    lines.push('COMMENT ON TABLE perfis_contratados IS \'Catálogo de perfis contratados com seus custos e documentos base\';');
    lines.push('');

    lines.push('-- ------------------------------------------------------------------------');
    lines.push('-- Tabela 2: projetos');
    lines.push('-- ------------------------------------------------------------------------');
    lines.push('CREATE TABLE projetos (');
    lines.push('    id BIGSERIAL PRIMARY KEY,');
    lines.push('    nome_projeto VARCHAR(200) NOT NULL,');
    lines.push('    sigla_projeto VARCHAR(50) NOT NULL,');
    lines.push('    descricao VARCHAR(500),');
    lines.push('    nome_secretaria VARCHAR(200) NOT NULL,');
    lines.push('    sigla_secretaria VARCHAR(50) NOT NULL,');
    lines.push('    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,');
    lines.push('    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,');
    lines.push('    CONSTRAINT unq_projetos_sigla UNIQUE (sigla_projeto)');
    lines.push(');');
    lines.push('');
    lines.push('COMMENT ON TABLE projetos IS \'Cadastro de projetos institucionais vinculados às Secretarias de Estado\';');
    lines.push('');

    lines.push('-- ------------------------------------------------------------------------');
    lines.push('-- Tabela 3: ordens_servico (1 Projeto -> N Ordens de Serviço)');
    lines.push('-- ------------------------------------------------------------------------');
    lines.push('CREATE TABLE ordens_servico (');
    lines.push('    id BIGSERIAL PRIMARY KEY,');
    lines.push('    projeto_id BIGINT NOT NULL,');
    lines.push('    numero_os INTEGER NOT NULL,');
    lines.push('    ano_referencia INTEGER NOT NULL,');
    lines.push('    alocacao_sgc BOOLEAN NOT NULL DEFAULT FALSE,');
    lines.push('    entrega_sgc BOOLEAN NOT NULL DEFAULT FALSE,');
    lines.push('    descricao_sgc BOOLEAN NOT NULL DEFAULT FALSE,');
    lines.push('    situacao_sgc VARCHAR(100),');
    lines.push('    situacao_passivo_2026 VARCHAR(100),');
    lines.push('    ne_planejamento VARCHAR(60),');
    lines.push('    ne_faturamento VARCHAR(60),');
    lines.push('    processo_sei_pagamento VARCHAR(60),');
    lines.push('    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,');
    lines.push('    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,');
    lines.push('    CONSTRAINT fk_os_projeto FOREIGN KEY (projeto_id) REFERENCES projetos (id) ON UPDATE CASCADE ON DELETE RESTRICT,');
    lines.push('    CONSTRAINT chk_os_numero_positivo CHECK (numero_os > 0),');
    lines.push('    CONSTRAINT unq_os_projeto_ano_numero UNIQUE (projeto_id, numero_os, ano_referencia)');
    lines.push(');');
    lines.push('');
    lines.push('CREATE INDEX idx_os_projeto_id ON ordens_servico(projeto_id);');
    lines.push('CREATE INDEX idx_os_ano ON ordens_servico(ano_referencia);');
    lines.push('');
    lines.push('COMMENT ON TABLE ordens_servico IS \'Ordens de Serviço anuais emitidas no âmbito dos projetos\';');
    lines.push('');

    lines.push('-- ------------------------------------------------------------------------');
    lines.push('-- Tabela 4: alocacoes_perfil_os (N:N entre OS e Perfil com snapshot de custo)');
    lines.push('-- ------------------------------------------------------------------------');
    lines.push('CREATE TABLE alocacoes_perfil_os (');
    lines.push('    id BIGSERIAL PRIMARY KEY,');
    lines.push('    ordem_servico_id BIGINT NOT NULL,');
    lines.push('    perfil_contratado_id BIGINT NOT NULL,');
    lines.push('    mes_referencia VARCHAR(20) NOT NULL,');
    lines.push('    nome_profissional VARCHAR(200) NOT NULL,');
    lines.push('    percentual_alocacao NUMERIC(5, 2) NOT NULL,');
    lines.push('    documento_referencia VARCHAR(255) NOT NULL,');
    lines.push('    custo_mensal_perfil NUMERIC(12, 2) NOT NULL,');
    lines.push('    custo_alocacao NUMERIC(12, 2) NOT NULL,');
    lines.push('    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,');
    lines.push('    CONSTRAINT fk_alocacao_os FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico (id) ON UPDATE CASCADE ON DELETE CASCADE,');
    lines.push('    CONSTRAINT fk_alocacao_perfil FOREIGN KEY (perfil_contratado_id) REFERENCES perfis_contratados (id) ON UPDATE CASCADE ON DELETE RESTRICT,');
    lines.push('    CONSTRAINT chk_percentual_alocacao CHECK (percentual_alocacao >= 0.00 AND percentual_alocacao <= 100.00),');
    lines.push('    CONSTRAINT chk_custo_mensal_positivo CHECK (custo_mensal_perfil >= 0.00),');
    lines.push('    CONSTRAINT chk_custo_alocacao_positivo CHECK (custo_alocacao >= 0.00),');
    lines.push('    CONSTRAINT chk_os_mes_valido CHECK (');
    lines.push('        mes_referencia IN (');
    lines.push('            \'JANEIRO\', \'FEVEREIRO\', \'MARÇO\', \'ABRIL\', ');
    lines.push('            \'MAIO\', \'JUNHO\', \'JULHO\', \'AGOSTO\', ');
    lines.push('            \'SETEMBRO\', \'OUTUBRO\', \'NOVEMBRO\', \'DEZEMBRO\'');
    lines.push('        )');
    lines.push('    ),');
    lines.push('    CONSTRAINT unq_alocacao_os_perfil_mes UNIQUE (ordem_servico_id, nome_profissional, mes_referencia)');
    lines.push(');');
    lines.push('');
    lines.push('CREATE INDEX idx_alocacoes_os_id ON alocacoes_perfil_os(ordem_servico_id);');
    lines.push('CREATE INDEX idx_alocacoes_perfil_id ON alocacoes_perfil_os(perfil_contratado_id);');
    lines.push('CREATE INDEX idx_alocacoes_os_nome_mes ON alocacoes_perfil_os(ordem_servico_id, nome_profissional, mes_referencia);');
    lines.push('');
    lines.push('COMMENT ON TABLE alocacoes_perfil_os IS \'Alocação de equipe técnica nas Ordens de Serviço com valores calculados\';');
    lines.push('');

    // Trigger de Automação
    if (includeTriggers) {
      lines.push('-- ------------------------------------------------------------------------');
      lines.push('-- Trigger PL/pgSQL: Automação da Regra de Negócio de Cálculo e Snapshot');
      lines.push('-- ------------------------------------------------------------------------');
      lines.push('CREATE OR REPLACE FUNCTION fn_trg_processar_alocacao_perfil()');
      lines.push('RETURNS TRIGGER AS $$');
      lines.push('DECLARE');
      lines.push('    v_custo_mensal NUMERIC(12, 2);');
      lines.push('    v_doc_ref VARCHAR(255);');
      lines.push('    v_vigente BOOLEAN;');
      lines.push('BEGIN');
      lines.push('    SELECT custo_mensal_perfil, documento_referencia, vigente');
      lines.push('      INTO v_custo_mensal, v_doc_ref, v_vigente');
      lines.push('      FROM perfis_contratados');
      lines.push('     WHERE id = NEW.perfil_contratado_id;');
      lines.push('');
      lines.push('    IF NOT FOUND THEN');
      lines.push('        RAISE EXCEPTION \'Perfil contratado ID % não localizado.\', NEW.perfil_contratado_id;');
      lines.push('    END IF;');
      lines.push('');
      lines.push('    -- Snapshot do valor e documento vigente');
      lines.push('    NEW.custo_mensal_perfil := v_custo_mensal;');
      lines.push('    NEW.documento_referencia := v_doc_ref;');
      lines.push('    NEW.custo_alocacao := ROUND((NEW.percentual_alocacao * v_custo_mensal) / 100.0, 2);');
      lines.push('');
      lines.push('    RETURN NEW;');
      lines.push('END;');
      lines.push('$$ LANGUAGE plpgsql;');
      lines.push('');
      lines.push('DROP TRIGGER IF EXISTS trg_before_insert_update_alocacao ON alocacoes_perfil_os;');
      lines.push('CREATE TRIGGER trg_before_insert_update_alocacao');
      lines.push('BEFORE INSERT OR UPDATE ON alocacoes_perfil_os');
      lines.push('FOR EACH ROW');
      lines.push('EXECUTE FUNCTION fn_trg_processar_alocacao_perfil();');
      lines.push('');
    }
  }

  // SEÇÃO DML (Dados INSERT)
  if (includeData) {
    lines.push('-- ========================================================================');
    lines.push('-- 2. DADOS ATUAIS DA BASE DE DADOS (DML INSERTs)');
    lines.push('-- ========================================================================');
    lines.push('');

    // 2.1 perfis_contratados
    lines.push(`-- 2.1 Carga: perfis_contratados (${perfis.length} registros)`);
    if (perfis.length > 0) {
      lines.push('INSERT INTO perfis_contratados (id, item_contratacao, nome_perfil, documento_referencia, vigente, custo_mensal_perfil, quantidade_mensal_contratada, criado_em) VALUES');
      const perfilRows = perfis.map((p, idx) => {
        const isLast = idx === perfis.length - 1;
        const row = `(${p.id}, ${sqlStr(p.item_contratacao)}, ${sqlStr(p.nome_perfil)}, ${sqlStr(p.documento_referencia)}, ${sqlBool(p.vigente)}, ${sqlNum(p.custo_mensal_perfil, 2)}, ${sqlNum(p.quantidade_mensal_contratada)}, ${sqlTimestamp(p.criado_em)})`;
        return `  ${row}${isLast ? ';' : ','}`;
      });
      lines.push(...perfilRows);
    } else {
      lines.push('-- (Nenhum registro cadastrado)');
    }
    lines.push('');

    // 2.2 projetos
    lines.push(`-- 2.2 Carga: projetos (${projetos.length} registros)`);
    if (projetos.length > 0) {
      lines.push('INSERT INTO projetos (id, nome_projeto, sigla_projeto, descricao, nome_secretaria, sigla_secretaria, criado_em) VALUES');
      const projRows = projetos.map((p, idx) => {
        const isLast = idx === projetos.length - 1;
        const row = `(${p.id}, ${sqlStr(p.nome_projeto)}, ${sqlStr(p.sigla_projeto)}, ${sqlStr(p.descricao)}, ${sqlStr(p.nome_secretaria)}, ${sqlStr(p.sigla_secretaria)}, ${sqlTimestamp(p.criado_em)})`;
        return `  ${row}${isLast ? ';' : ','}`;
      });
      lines.push(...projRows);
    } else {
      lines.push('-- (Nenhum registro cadastrado)');
    }
    lines.push('');

    // 2.3 ordens_servico
    lines.push(`-- 2.3 Carga: ordens_servico (${ordens.length} registros)`);
    if (ordens.length > 0) {
      lines.push('INSERT INTO ordens_servico (id, projeto_id, numero_os, ano_referencia, alocacao_sgc, entrega_sgc, descricao_sgc, situacao_sgc, situacao_passivo_2026, ne_planejamento, ne_faturamento, processo_sei_pagamento, criado_em) VALUES');
      const osRows = ordens.map((os, idx) => {
        const isLast = idx === ordens.length - 1;
        const passivo = (os.situacao_passivo_2026 && os.situacao_passivo_2026.trim() !== '') ? os.situacao_passivo_2026.trim() : null;
        const row = `(${os.id}, ${os.projeto_id}, ${os.numero_os}, ${os.ano_referencia}, ${sqlBool(os.alocacao_sgc)}, ${sqlBool(os.entrega_sgc)}, ${sqlBool(os.descricao_sgc)}, ${sqlStr(os.situacao_sgc)}, ${sqlStr(passivo)}, ${sqlStr(os.ne_planejamento)}, ${sqlStr(os.ne_faturamento)}, ${sqlStr(os.processo_sei_pagamento)}, ${sqlTimestamp(os.criado_em)})`;
        return `  ${row}${isLast ? ';' : ','}`;
      });
      lines.push(...osRows);
    } else {
      lines.push('-- (Nenhum registro cadastrado)');
    }
    lines.push('');

    // 2.4 alocacoes_perfil_os
    lines.push(`-- 2.4 Carga: alocacoes_perfil_os (${alocacoes.length} registros)`);
    if (alocacoes.length > 0) {
      lines.push('INSERT INTO alocacoes_perfil_os (id, ordem_servico_id, perfil_contratado_id, mes_referencia, nome_profissional, percentual_alocacao, documento_referencia, custo_mensal_perfil, custo_alocacao, criado_em) VALUES');
      const alocRows = alocacoes.map((a, idx) => {
        const isLast = idx === alocacoes.length - 1;
        const row = `(${a.id}, ${a.ordem_servico_id}, ${a.perfil_contratado_id}, ${sqlStr(a.mes_referencia)}, ${sqlStr(a.nome_profissional)}, ${sqlNum(a.percentual_alocacao, 2)}, ${sqlStr(a.documento_referencia)}, ${sqlNum(a.custo_mensal_perfil, 2)}, ${sqlNum(a.custo_alocacao, 2)}, ${sqlTimestamp(a.criado_em)})`;
        return `  ${row}${isLast ? ';' : ','}`;
      });
      lines.push(...alocRows);
    } else {
      lines.push('-- (Nenhum registro cadastrado)');
    }
    lines.push('');

    // Sincronização de sequências SERIAL do PostgreSQL
    lines.push('-- ------------------------------------------------------------------------');
    lines.push('-- 3. AJUSTE DE SEQUÊNCIAS SERIAL (IDs AUTOINCREMENT)');
    lines.push('-- ------------------------------------------------------------------------');
    lines.push('SELECT setval(\'perfis_contratados_id_seq\', COALESCE((SELECT MAX(id) FROM perfis_contratados), 1));');
    lines.push('SELECT setval(\'projetos_id_seq\', COALESCE((SELECT MAX(id) FROM projetos), 1));');
    lines.push('SELECT setval(\'ordens_servico_id_seq\', COALESCE((SELECT MAX(id) FROM ordens_servico), 1));');
    lines.push('SELECT setval(\'alocacoes_perfil_os_id_seq\', COALESCE((SELECT MAX(id) FROM alocacoes_perfil_os), 1));');
    lines.push('');
  }

  lines.push('COMMIT;');
  lines.push('');
  lines.push('-- ========================================================================');
  lines.push('-- FIM DO DUMP SisGOS');
  lines.push('-- ========================================================================');

  return lines.join('\n');
}

export function downloadSqlFile(sqlContent: string, customFilename?: string): void {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = customFilename || `dump_sisgos_${dateStr}.sql`;
  const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
