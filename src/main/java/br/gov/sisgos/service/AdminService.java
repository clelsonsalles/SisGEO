package br.gov.sisgos.service;

import br.gov.sisgos.domain.entity.AlocacaoPerfilOs;
import br.gov.sisgos.domain.entity.OrdemServico;
import br.gov.sisgos.domain.entity.PerfilContratado;
import br.gov.sisgos.domain.entity.Projeto;
import br.gov.sisgos.repository.AlocacaoPerfilOsRepository;
import br.gov.sisgos.repository.OrdemServicoRepository;
import br.gov.sisgos.repository.PerfilContratadoRepository;
import br.gov.sisgos.repository.ProjetoRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final ProjetoRepository projetoRepository;
    private final PerfilContratadoRepository perfilRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final AlocacaoPerfilOsRepository alocacaoRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void clearAllData() {
        log.info("Executando limpeza completa de todas as tabelas do SisGOS...");
        try {
            // Tenta execução direta do TRUNCATE CASCADE do PostgreSQL para reiniciar sequências de ID
            entityManager.createNativeQuery("TRUNCATE TABLE alocacoes_perfil_os, ordens_servico, projetos, perfis_contratados RESTART IDENTITY CASCADE").executeUpdate();
            log.info("Tabelas limpas com TRUNCATE CASCADE com sucesso.");
        } catch (Exception e) {
            log.warn("Falha no TRUNCATE nativo ({}), executando exclusão via repositórios JPA...", e.getMessage());
            alocacaoRepository.deleteAllInBatch();
            ordemServicoRepository.deleteAllInBatch();
            projetoRepository.deleteAllInBatch();
            perfilRepository.deleteAllInBatch();
            log.info("Tabelas limpas via deleteAllInBatch.");
        }
    }

    @Transactional
    public void resetToInitialSeed() {
        log.info("Restaurando banco de dados para a semente inicial oficial (Seed Data)...");
        clearAllData();

        // 1. Perfis Contratados
        PerfilContratado p1 = PerfilContratado.builder()
                .itemContratacao("Item 01")
                .nomePerfil("Líder Técnico / Arquiteto de Software")
                .documentoReferencia("Contrato 45/2024 - Lote 1")
                .vigente(true)
                .custoMensalPerfil(new BigDecimal("18500.00"))
                .quantidadeMensalContratada(3)
                .build();

        PerfilContratado p2 = PerfilContratado.builder()
                .itemContratacao("Item 02")
                .nomePerfil("Desenvolvedor Full-Stack Sênior")
                .documentoReferencia("Contrato 45/2024 - Lote 1")
                .vigente(true)
                .custoMensalPerfil(new BigDecimal("14200.00"))
                .quantidadeMensalContratada(6)
                .build();

        PerfilContratado p3 = PerfilContratado.builder()
                .itemContratacao("Item 03")
                .nomePerfil("Desenvolvedor Full-Stack Pleno")
                .documentoReferencia("Contrato 45/2024 - Lote 1")
                .vigente(true)
                .custoMensalPerfil(new BigDecimal("9800.00"))
                .quantidadeMensalContratada(10)
                .build();

        PerfilContratado p4 = PerfilContratado.builder()
                .itemContratacao("Item 04")
                .nomePerfil("Analista de Requisitos e Negócios Pleno")
                .documentoReferencia("Contrato 45/2024 - Lote 2")
                .vigente(true)
                .custoMensalPerfil(new BigDecimal("9500.00"))
                .quantidadeMensalContratada(4)
                .build();

        PerfilContratado p5 = PerfilContratado.builder()
                .itemContratacao("Item 05")
                .nomePerfil("Engenheiro de DevOps / Cloud Sênior")
                .documentoReferencia("Contrato 45/2024 - Lote 2")
                .vigente(true)
                .custoMensalPerfil(new BigDecimal("15000.00"))
                .quantidadeMensalContratada(2)
                .build();

        PerfilContratado p6 = PerfilContratado.builder()
                .itemContratacao("Item 06")
                .nomePerfil("Designer UI/UX Pleno")
                .documentoReferencia("Contrato 45/2024 - Lote 2")
                .vigente(true)
                .custoMensalPerfil(new BigDecimal("8700.00"))
                .quantidadeMensalContratada(2)
                .build();

        List<PerfilContratado> perfisSalvos = perfilRepository.saveAll(Arrays.asList(p1, p2, p3, p4, p5, p6));

        // 2. Projetos
        Projeto proj1 = Projeto.builder()
                .nomeProjeto("Sistema de Gestão Corporativa Integrada")
                .siglaProjeto("SGC-CORP")
                .descricao("Modernização do fluxo de processos e compras governamentais")
                .nomeSecretaria("Secretaria de Planejamento e Gestão")
                .siglaSecretaria("SEPLAG")
                .build();

        Projeto proj2 = Projeto.builder()
                .nomeProjeto("Portal da Transparência e Arrecadação Digital")
                .siglaProjeto("TRANS-SEFAZ")
                .descricao("Plataforma fiscal de autoatendimento ao contribuinte")
                .nomeSecretaria("Secretaria da Fazenda")
                .siglaSecretaria("SEFAZ")
                .build();

        Projeto proj3 = Projeto.builder()
                .nomeProjeto("Prontuário Eletrônico Unificado Estadual")
                .siglaProjeto("PEU-SAUDE")
                .descricao("Integração de unidades de saúde e regulação de leitos")
                .nomeSecretaria("Secretaria de Estado de Saúde")
                .siglaSecretaria("SES")
                .build();

        Projeto proj4 = Projeto.builder()
                .nomeProjeto("Plataforma de Gestão da Educação Básica")
                .siglaProjeto("EDU-DIGITAL")
                .descricao("Acompanhamento pedagógico, merenda e frequência escolar")
                .nomeSecretaria("Secretaria de Estado de Educação")
                .siglaSecretaria("SEDUC")
                .build();

        List<Projeto> projetosSalvos = projetoRepository.saveAll(Arrays.asList(proj1, proj2, proj3, proj4));

        // 3. Ordens de Serviço
        OrdemServico os1 = OrdemServico.builder()
                .projeto(projetosSalvos.get(0))
                .numeroOs(101)
                .anoReferencia(2026)
                .alocacaoSgc(true)
                .entregaSgc(true)
                .descricaoSgc(true)
                .situacaoSgc("Atestada pelo Fiscal")
                .situacaoPassivo2026("Liquidado")
                .nePlanejamento("2026NE000142")
                .neFaturamento("2026NE000189")
                .processoSeiPagamento("SEI-08001/002341/2026")
                .build();

        OrdemServico os2 = OrdemServico.builder()
                .projeto(projetosSalvos.get(0))
                .numeroOs(102)
                .anoReferencia(2026)
                .alocacaoSgc(true)
                .entregaSgc(true)
                .descricaoSgc(false)
                .situacaoSgc("Em Execução")
                .situacaoPassivo2026("A Empenhar")
                .nePlanejamento("2026NE000142")
                .neFaturamento(null)
                .processoSeiPagamento(null)
                .build();

        OrdemServico os3 = OrdemServico.builder()
                .projeto(projetosSalvos.get(1))
                .numeroOs(201)
                .anoReferencia(2026)
                .alocacaoSgc(true)
                .entregaSgc(false)
                .descricaoSgc(true)
                .situacaoSgc("Em Validação SGC")
                .situacaoPassivo2026("Passivo Reconhecido")
                .nePlanejamento("2026NE000215")
                .neFaturamento("2026NE000280")
                .processoSeiPagamento("SEI-08001/002955/2026")
                .build();

        OrdemServico os4 = OrdemServico.builder()
                .projeto(projetosSalvos.get(2))
                .numeroOs(301)
                .anoReferencia(2026)
                .alocacaoSgc(false)
                .entregaSgc(false)
                .descricaoSgc(false)
                .situacaoSgc("Planejada")
                .situacaoPassivo2026("Sem Passivo")
                .nePlanejamento("2026NE000301")
                .neFaturamento("2026NE000301")
                .processoSeiPagamento("SEI-08001/003112/2026")
                .build();

        List<OrdemServico> ossSalvas = ordemServicoRepository.saveAll(Arrays.asList(os1, os2, os3, os4));

        // 4. Alocações de Perfil
        AlocacaoPerfilOs a1 = new AlocacaoPerfilOs();
        a1.setOrdemServico(ossSalvas.get(0));
        a1.setMesReferencia("JANEIRO");
        a1.setNomeProfissional("Carlos Eduardo Silveira");
        a1.setPercentualAlocacao(new BigDecimal("50.00"));
        a1.aplicarRegraDeNegocio(perfisSalvos.get(0));

        AlocacaoPerfilOs a2 = new AlocacaoPerfilOs();
        a2.setOrdemServico(ossSalvas.get(0));
        a2.setMesReferencia("JANEIRO");
        a2.setNomeProfissional("Mariana Souza Ribeiro");
        a2.setPercentualAlocacao(new BigDecimal("45.50"));
        a2.aplicarRegraDeNegocio(perfisSalvos.get(1));

        AlocacaoPerfilOs a3 = new AlocacaoPerfilOs();
        a3.setOrdemServico(ossSalvas.get(1));
        a3.setMesReferencia("FEVEREIRO");
        a3.setNomeProfissional("Mariana Souza Ribeiro");
        a3.setPercentualAlocacao(new BigDecimal("50.00"));
        a3.aplicarRegraDeNegocio(perfisSalvos.get(1));

        AlocacaoPerfilOs a4 = new AlocacaoPerfilOs();
        a4.setOrdemServico(ossSalvas.get(1));
        a4.setMesReferencia("FEVEREIRO");
        a4.setNomeProfissional("Lucas Pinheiro Castro");
        a4.setPercentualAlocacao(new BigDecimal("100.00"));
        a4.aplicarRegraDeNegocio(perfisSalvos.get(2));

        AlocacaoPerfilOs a5 = new AlocacaoPerfilOs();
        a5.setOrdemServico(ossSalvas.get(2));
        a5.setMesReferencia("MARÇO");
        a5.setNomeProfissional("Ana Beatriz Medeiros");
        a5.setPercentualAlocacao(new BigDecimal("100.00"));
        a5.aplicarRegraDeNegocio(perfisSalvos.get(4));

        alocacaoRepository.saveAll(Arrays.asList(a1, a2, a3, a4, a5));
        log.info("Carga inicial de dados finalizada com sucesso.");
    }

    @Transactional(readOnly = true)
    public String gerarDumpSql() {
        List<PerfilContratado> perfis = perfilRepository.findAll();
        List<Projeto> projetos = projetoRepository.findAll();
        List<OrdemServico> ordens = ordemServicoRepository.findAll();
        List<AlocacaoPerfilOs> alocacoes = alocacaoRepository.findAll();

        StringBuilder sb = new StringBuilder();
        sb.append("-- ========================================================================\n");
        sb.append("-- SisGOS - Sistema de Gestão de Ordens de Serviço & Alocações de Perfil\n");
        sb.append("-- DUMP COMPLETO DA BASE DE DADOS POSTGRESQL (.sql)\n");
        sb.append("-- Exportado via Spring Boot 3.3 / Hibernate JPA\n");
        sb.append("-- ========================================================================\n\n");
        sb.append("SET client_encoding = 'UTF8';\n");
        sb.append("SET standard_conforming_strings = on;\n");
        sb.append("SET timezone = 'America/Sao_Paulo';\n\n");
        sb.append("BEGIN;\n\n");

        sb.append("-- 1. DDL: Limpeza e Criação das Tabelas\n");
        sb.append("DROP TABLE IF EXISTS alocacoes_perfil_os CASCADE;\n");
        sb.append("DROP TABLE IF EXISTS ordens_servico CASCADE;\n");
        sb.append("DROP TABLE IF EXISTS projetos CASCADE;\n");
        sb.append("DROP TABLE IF EXISTS perfis_contratados CASCADE;\n\n");

        sb.append("CREATE TABLE perfis_contratados (\n");
        sb.append("    id BIGSERIAL PRIMARY KEY,\n");
        sb.append("    item_contratacao VARCHAR(100) NOT NULL,\n");
        sb.append("    nome_perfil VARCHAR(150) NOT NULL,\n");
        sb.append("    documento_referencia VARCHAR(255) NOT NULL,\n");
        sb.append("    vigente BOOLEAN NOT NULL DEFAULT TRUE,\n");
        sb.append("    custo_mensal_perfil NUMERIC(12, 2) NOT NULL,\n");
        sb.append("    quantidade_mensal_contratada INTEGER NOT NULL,\n");
        sb.append("    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,\n");
        sb.append("    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP\n");
        sb.append(");\n\n");

        sb.append("CREATE TABLE projetos (\n");
        sb.append("    id BIGSERIAL PRIMARY KEY,\n");
        sb.append("    nome_projeto VARCHAR(200) NOT NULL,\n");
        sb.append("    sigla_projeto VARCHAR(50) NOT NULL,\n");
        sb.append("    descricao VARCHAR(500),\n");
        sb.append("    nome_secretaria VARCHAR(200) NOT NULL,\n");
        sb.append("    sigla_secretaria VARCHAR(50) NOT NULL,\n");
        sb.append("    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,\n");
        sb.append("    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,\n");
        sb.append("    CONSTRAINT unq_projetos_sigla UNIQUE (sigla_projeto)\n");
        sb.append(");\n\n");

        sb.append("CREATE TABLE ordens_servico (\n");
        sb.append("    id BIGSERIAL PRIMARY KEY,\n");
        sb.append("    projeto_id BIGINT NOT NULL,\n");
        sb.append("    numero_os INTEGER NOT NULL,\n");
        sb.append("    ano_referencia INTEGER NOT NULL,\n");
        sb.append("    alocacao_sgc BOOLEAN NOT NULL DEFAULT FALSE,\n");
        sb.append("    entrega_sgc BOOLEAN NOT NULL DEFAULT FALSE,\n");
        sb.append("    descricao_sgc BOOLEAN NOT NULL DEFAULT FALSE,\n");
        sb.append("    situacao_sgc VARCHAR(100),\n");
        sb.append("    situacao_passivo_2026 VARCHAR(100),\n");
        sb.append("    ne_planejamento VARCHAR(60),\n");
        sb.append("    ne_faturamento VARCHAR(60),\n");
        sb.append("    processo_sei_pagamento VARCHAR(60),\n");
        sb.append("    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,\n");
        sb.append("    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,\n");
        sb.append("    CONSTRAINT fk_os_projeto FOREIGN KEY (projeto_id) REFERENCES projetos (id) ON UPDATE CASCADE ON DELETE RESTRICT,\n");
        sb.append("    CONSTRAINT unq_os_projeto_ano_numero UNIQUE (projeto_id, numero_os, ano_referencia)\n");
        sb.append(");\n\n");

        sb.append("CREATE TABLE alocacoes_perfil_os (\n");
        sb.append("    id BIGSERIAL PRIMARY KEY,\n");
        sb.append("    ordem_servico_id BIGINT NOT NULL,\n");
        sb.append("    perfil_contratado_id BIGINT NOT NULL,\n");
        sb.append("    mes_referencia VARCHAR(20) NOT NULL,\n");
        sb.append("    nome_profissional VARCHAR(200) NOT NULL,\n");
        sb.append("    percentual_alocacao NUMERIC(5, 2) NOT NULL,\n");
        sb.append("    documento_referencia VARCHAR(255) NOT NULL,\n");
        sb.append("    custo_mensal_perfil NUMERIC(12, 2) NOT NULL,\n");
        sb.append("    custo_alocacao NUMERIC(12, 2) NOT NULL,\n");
        sb.append("    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,\n");
        sb.append("    CONSTRAINT fk_alocacao_os FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico (id) ON UPDATE CASCADE ON DELETE CASCADE,\n");
        sb.append("    CONSTRAINT fk_alocacao_perfil FOREIGN KEY (perfil_contratado_id) REFERENCES perfis_contratados (id) ON UPDATE CASCADE ON DELETE RESTRICT,\n");
        sb.append("    CONSTRAINT unq_alocacao_os_perfil_mes UNIQUE (ordem_servico_id, nome_profissional, mes_referencia)\n");
        sb.append(");\n\n");

        sb.append("-- 2. DML: Carga de Dados Atuais\n");
        if (!perfis.isEmpty()) {
            sb.append("INSERT INTO perfis_contratados (id, item_contratacao, nome_perfil, documento_referencia, vigente, custo_mensal_perfil, quantidade_mensal_contratada, criado_em) VALUES\n");
            for (int i = 0; i < perfis.size(); i++) {
                PerfilContratado p = perfis.get(i);
                sb.append(String.format("  (%d, '%s', '%s', '%s', %s, %s, %d, '%s')",
                        p.getId(),
                        p.getItemContratacao().replace("'", "''"),
                        p.getNomePerfil().replace("'", "''"),
                        p.getDocumentoReferencia().replace("'", "''"),
                        p.getVigente() != null && p.getVigente() ? "TRUE" : "FALSE",
                        p.getCustoMensalPerfil() != null ? p.getCustoMensalPerfil().toPlainString() : "0.00",
                        p.getQuantidadeMensalContratada() != null ? p.getQuantidadeMensalContratada() : 1,
                        p.getCriadoEm() != null ? p.getCriadoEm().toString() : "CURRENT_TIMESTAMP"));
                sb.append(i == perfis.size() - 1 ? ";\n\n" : ",\n");
            }
        }

        if (!projetos.isEmpty()) {
            sb.append("INSERT INTO projetos (id, nome_projeto, sigla_projeto, descricao, nome_secretaria, sigla_secretaria, criado_em) VALUES\n");
            for (int i = 0; i < projetos.size(); i++) {
                Projeto pr = projetos.get(i);
                sb.append(String.format("  (%d, '%s', '%s', '%s', '%s', '%s', '%s')",
                        pr.getId(),
                        pr.getNomeProjeto().replace("'", "''"),
                        pr.getSiglaProjeto().replace("'", "''"),
                        pr.getDescricao() != null ? pr.getDescricao().replace("'", "''") : "",
                        pr.getNomeSecretaria().replace("'", "''"),
                        pr.getSiglaSecretaria().replace("'", "''"),
                        pr.getCriadoEm() != null ? pr.getCriadoEm().toString() : "CURRENT_TIMESTAMP"));
                sb.append(i == projetos.size() - 1 ? ";\n\n" : ",\n");
            }
        }

        if (!ordens.isEmpty()) {
            sb.append("INSERT INTO ordens_servico (id, projeto_id, numero_os, ano_referencia, alocacao_sgc, entrega_sgc, descricao_sgc, situacao_sgc, situacao_passivo_2026, ne_planejamento, ne_faturamento, processo_sei_pagamento, criado_em) VALUES\n");
            for (int i = 0; i < ordens.size(); i++) {
                OrdemServico os = ordens.get(i);
                Long pId = os.getProjeto() != null ? os.getProjeto().getId() : 1L;
                String passivo = os.getSituacaoPassivo2026() != null && !os.getSituacaoPassivo2026().isBlank() ? "'" + os.getSituacaoPassivo2026().replace("'", "''") + "'" : "NULL";
                String nePlan = os.getNePlanejamento() != null ? "'" + os.getNePlanejamento().replace("'", "''") + "'" : "NULL";
                String neFat = os.getNeFaturamento() != null ? "'" + os.getNeFaturamento().replace("'", "''") + "'" : "NULL";
                String sei = os.getProcessoSeiPagamento() != null ? "'" + os.getProcessoSeiPagamento().replace("'", "''") + "'" : "NULL";

                sb.append(String.format("  (%d, %d, %d, %d, %s, %s, %s, '%s', %s, %s, %s, %s, '%s')",
                        os.getId(),
                        pId,
                        os.getNumeroOs(),
                        os.getAnoReferencia(),
                        Boolean.TRUE.equals(os.getAlocacaoSgc()) ? "TRUE" : "FALSE",
                        Boolean.TRUE.equals(os.getEntregaSgc()) ? "TRUE" : "FALSE",
                        Boolean.TRUE.equals(os.getDescricaoSgc()) ? "TRUE" : "FALSE",
                        os.getSituacaoSgc() != null ? os.getSituacaoSgc().replace("'", "''") : "Em Execução",
                        passivo,
                        nePlan,
                        neFat,
                        sei,
                        os.getCriadoEm() != null ? os.getCriadoEm().toString() : "CURRENT_TIMESTAMP"));
                sb.append(i == ordens.size() - 1 ? ";\n\n" : ",\n");
            }
        }

        if (!alocacoes.isEmpty()) {
            sb.append("INSERT INTO alocacoes_perfil_os (id, ordem_servico_id, perfil_contratado_id, mes_referencia, nome_profissional, percentual_alocacao, documento_referencia, custo_mensal_perfil, custo_alocacao, criado_em) VALUES\n");
            for (int i = 0; i < alocacoes.size(); i++) {
                AlocacaoPerfilOs a = alocacoes.get(i);
                Long osId = a.getOrdemServico() != null ? a.getOrdemServico().getId() : 1L;
                Long perfId = a.getPerfilContratado() != null ? a.getPerfilContratado().getId() : 1L;

                sb.append(String.format("  (%d, %d, %d, '%s', '%s', %s, '%s', %s, %s, '%s')",
                        a.getId(),
                        osId,
                        perfId,
                        a.getMesReferencia().replace("'", "''"),
                        a.getNomeProfissional().replace("'", "''"),
                        a.getPercentualAlocacao() != null ? a.getPercentualAlocacao().toPlainString() : "0.00",
                        a.getDocumentoReferencia() != null ? a.getDocumentoReferencia().replace("'", "''") : "",
                        a.getCustoMensalPerfil() != null ? a.getCustoMensalPerfil().toPlainString() : "0.00",
                        a.getCustoAlocacao() != null ? a.getCustoAlocacao().toPlainString() : "0.00",
                        a.getCriadoEm() != null ? a.getCriadoEm().toString() : "CURRENT_TIMESTAMP"));
                sb.append(i == alocacoes.size() - 1 ? ";\n\n" : ",\n");
            }
        }

        sb.append("SELECT setval('perfis_contratados_id_seq', COALESCE((SELECT MAX(id) FROM perfis_contratados), 1));\n");
        sb.append("SELECT setval('projetos_id_seq', COALESCE((SELECT MAX(id) FROM projetos), 1));\n");
        sb.append("SELECT setval('ordens_servico_id_seq', COALESCE((SELECT MAX(id) FROM ordens_servico), 1));\n");
        sb.append("SELECT setval('alocacoes_perfil_os_id_seq', COALESCE((SELECT MAX(id) FROM alocacoes_perfil_os), 1));\n\n");
        sb.append("COMMIT;\n");

        return sb.toString();
    }
}
