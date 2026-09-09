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
                .mesReferencia("JANEIRO")
                .alocacaoSgc(true)
                .entregaSgc(true)
                .descricaoSgc(true)
                .situacaoSgc("Atestada pelo Fiscal")
                .situacaoPassivo2026("Liquidado")
                .build();

        OrdemServico os2 = OrdemServico.builder()
                .projeto(projetosSalvos.get(0))
                .numeroOs(102)
                .anoReferencia(2026)
                .mesReferencia("FEVEREIRO")
                .alocacaoSgc(true)
                .entregaSgc(true)
                .descricaoSgc(false)
                .situacaoSgc("Em Execução")
                .situacaoPassivo2026("A Empenhar")
                .build();

        OrdemServico os3 = OrdemServico.builder()
                .projeto(projetosSalvos.get(1))
                .numeroOs(201)
                .anoReferencia(2026)
                .mesReferencia("JANEIRO")
                .alocacaoSgc(true)
                .entregaSgc(false)
                .descricaoSgc(true)
                .situacaoSgc("Em Validação SGC")
                .situacaoPassivo2026("Passivo Reconhecido")
                .build();

        OrdemServico os4 = OrdemServico.builder()
                .projeto(projetosSalvos.get(2))
                .numeroOs(301)
                .anoReferencia(2026)
                .mesReferencia("MARÇO")
                .alocacaoSgc(false)
                .entregaSgc(false)
                .descricaoSgc(false)
                .situacaoSgc("Planejada")
                .situacaoPassivo2026("Sem Passivo")
                .build();

        List<OrdemServico> ossSalvas = ordemServicoRepository.saveAll(Arrays.asList(os1, os2, os3, os4));

        // 4. Alocações de Perfil
        AlocacaoPerfilOs a1 = new AlocacaoPerfilOs();
        a1.setOrdemServico(ossSalvas.get(0));
        a1.setNomeProfissional("Carlos Eduardo Silveira");
        a1.setPercentualAlocacao(50);
        a1.aplicarRegraDeNegocio(perfisSalvos.get(0));

        AlocacaoPerfilOs a2 = new AlocacaoPerfilOs();
        a2.setOrdemServico(ossSalvas.get(0));
        a2.setNomeProfissional("Mariana Souza Ribeiro");
        a2.setPercentualAlocacao(45);
        a2.aplicarRegraDeNegocio(perfisSalvos.get(1));

        AlocacaoPerfilOs a3 = new AlocacaoPerfilOs();
        a3.setOrdemServico(ossSalvas.get(1));
        a3.setNomeProfissional("Mariana Souza Ribeiro");
        a3.setPercentualAlocacao(50);
        a3.aplicarRegraDeNegocio(perfisSalvos.get(1));

        AlocacaoPerfilOs a4 = new AlocacaoPerfilOs();
        a4.setOrdemServico(ossSalvas.get(1));
        a4.setNomeProfissional("Lucas Pinheiro Castro");
        a4.setPercentualAlocacao(100);
        a4.aplicarRegraDeNegocio(perfisSalvos.get(2));

        AlocacaoPerfilOs a5 = new AlocacaoPerfilOs();
        a5.setOrdemServico(ossSalvas.get(2));
        a5.setNomeProfissional("Ana Beatriz Medeiros");
        a5.setPercentualAlocacao(100);
        a5.aplicarRegraDeNegocio(perfisSalvos.get(4));

        alocacaoRepository.saveAll(Arrays.asList(a1, a2, a3, a4, a5));
        log.info("Carga inicial de dados finalizada com sucesso.");
    }
}
