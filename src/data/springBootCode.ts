export interface JavaFile {
  path: string;
  name: string;
  package: string;
  category: 'controller' | 'service' | 'entity' | 'repository' | 'dto' | 'config' | 'devops';
  description: string;
  code: string;
}

export const SPRING_BOOT_FILES: JavaFile[] = [
  {
    path: 'pom.xml',
    name: 'pom.xml',
    package: 'root',
    category: 'config',
    description: 'Configuração Maven com Spring Boot 3.3.x, Java 21, Spring Data JPA, PostgreSQL Driver e Swagger/OpenAPI',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.3</version>
        <relativePath/>
    </parent>

    <groupId>br.gov.sisgos</groupId>
    <artifactId>sisgos-backend</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>SisGOS - Sistema de Gestão de Ordens de Serviço</name>
    <description>API RESTful Spring Boot para Gestão de Ordens de Serviço e Alocação de Perfis</description>

    <properties>
        <java.version>21</java.version>
        <springdoc.version>2.6.0</springdoc.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web (RESTful APIs) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Data JPA & Hibernate -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- Driver JDBC PostgreSQL -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Bean Validation (Hibernate Validator) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Documentação Swagger / OpenAPI 3 -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>\${springdoc.version}</version>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testes -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`
  },
  {
    path: 'src/main/resources/application.yml',
    name: 'application.yml',
    package: 'resources',
    category: 'config',
    description: 'Configurações de conexão do PostgreSQL e JPA Hibernate',
    code: `server:
  port: 8080
  servlet:
    context-path: /api/v1

spring:
  application:
    name: sisgos-backend

  datasource:
    url: jdbc:postgresql://localhost:5432/sisgos_db
    username: postgres
    password: postgres_password
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000

  jpa:
    database: postgresql
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate
    show-sql: true
    properties:
      hibernate:
        format_sql: true

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
    operationsSorter: method`
  },
  {
    path: 'src/main/java/br/gov/sisgos/domain/entity/OrdemServico.java',
    name: 'OrdemServico.java',
    package: 'br.gov.sisgos.domain.entity',
    category: 'entity',
    description: 'Entidade JPA Ordem de Serviço com relacionamento com Projeto e Alocações',
    code: `package br.gov.sisgos.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordens_servico")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    @Column(name = "numero_os", nullable = false)
    private Integer numeroOs;

    @Column(name = "ano_referencia", nullable = false)
    private Integer anoReferencia;

    @Column(name = "alocacao_sgc", nullable = false)
    private Boolean alocacaoSgc = false;

    @Column(name = "entrega_sgc", nullable = false)
    private Boolean entregaSgc = false;

    @Column(name = "descricao_sgc", nullable = false)
    private Boolean descricaoSgc = false;

    @Column(name = "situacao_sgc", length = 100)
    private String situacaoSgc;

    @Column(name = "situacao_passivo_2026", length = 100)
    private String situacaoPassivo2026;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "atualizado_em")
    private OffsetDateTime atualizadoEm;

    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AlocacaoPerfilOs> alocacoes = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.criadoEm = OffsetDateTime.now();
        this.atualizadoEm = OffsetDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.atualizadoEm = OffsetDateTime.now();
    }

    /**
     * Regra de Negócio: Calcula o valor total da Ordem de Serviço
     * somando o valor de cada alocação associada à OS.
     */
    public BigDecimal getValorTotalOs() {
        if (this.alocacoes == null || this.alocacoes.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return this.alocacoes.stream()
                .map(AlocacaoPerfilOs::getCustoAlocacao)
                .filter(custo -> custo != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}`
  },
  {
    path: 'src/main/java/br/gov/sisgos/domain/entity/AlocacaoPerfilOs.java',
    name: 'AlocacaoPerfilOs.java',
    package: 'br.gov.sisgos.domain.entity',
    category: 'entity',
    description: 'Entidade associativa N:N com snapshots e cálculo do custo da alocação',
    code: `package br.gov.sisgos.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "alocacoes_perfil_os",
    uniqueConstraints = @UniqueConstraint(
        name = "unq_alocacao_os_perfil_mes",
        columnNames = {"ordem_servico_id", "perfil_contratado_id", "mes_referencia"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlocacaoPerfilOs {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ordem_servico_id", nullable = false)
    private OrdemServico ordemServico;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_contratado_id", nullable = false)
    private PerfilContratado perfilContratado;

    @Column(name = "mes_referencia", length = 20, nullable = false)
    private String mesReferencia;

    @Column(name = "nome_profissional", length = 200, nullable = false)
    private String nomeProfissional;

    @Column(name = "percentual_alocacao", precision = 5, scale = 2, nullable = false)
    private BigDecimal percentualAlocacao;

    @Column(name = "documento_referencia", length = 255, nullable = false)
    private String documentoReferencia;

    @Column(name = "custo_mensal_perfil", precision = 12, scale = 2, nullable = false)
    private BigDecimal custoMensalPerfil;

    @Column(name = "custo_alocacao", precision = 12, scale = 2, nullable = false)
    private BigDecimal custoAlocacao;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @PrePersist
    public void prePersist() {
        this.criadoEm = OffsetDateTime.now();
    }

    /**
     * Aplicação da Regra de Negócio:
     * 1. Copia custo_mensal_perfil e documento_referencia do Perfil Contratado
     * 2. Calcula custo_alocacao = (percentual * custo_mensal) / 100
     */
    public void aplicarRegraDeNegocio(PerfilContratado perfil) {
        this.perfilContratado = perfil;
        this.documentoReferencia = perfil.getDocumentoReferencia();
        this.custoMensalPerfil = perfil.getCustoMensalPerfil();

        if (this.percentualAlocacao != null && this.custoMensalPerfil != null) {
            this.custoAlocacao = this.percentualAlocacao.multiply(this.custoMensalPerfil)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            this.custoAlocacao = BigDecimal.ZERO;
        }
    }
}`
  },
  {
    path: 'src/main/java/br/gov/sisgos/service/AlocacaoService.java',
    name: 'AlocacaoService.java',
    package: 'br.gov.sisgos.service',
    category: 'service',
    description: 'Serviço Spring que executa a regra de negócio e gestão da tabela associativa',
    code: `package br.gov.sisgos.service;

import br.gov.sisgos.domain.entity.AlocacaoPerfilOs;
import br.gov.sisgos.domain.entity.OrdemServico;
import br.gov.sisgos.domain.entity.PerfilContratado;
import br.gov.sisgos.dto.AlocacaoRequestDTO;
import br.gov.sisgos.dto.AlocacaoResponseDTO;
import br.gov.sisgos.repository.AlocacaoPerfilOsRepository;
import br.gov.sisgos.repository.OrdemServicoRepository;
import br.gov.sisgos.repository.PerfilContratadoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlocacaoService {

    private final AlocacaoPerfilOsRepository alocacaoRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final PerfilContratadoRepository perfilRepository;

    @Transactional(readOnly = true)
    public List<AlocacaoResponseDTO> listarPorOrdemServico(Long osId) {
        return alocacaoRepository.findByOrdemServicoId(osId)
                .stream()
                .map(AlocacaoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> obterNomesProfissionaisDistintos() {
        return alocacaoRepository.findDistinctNomeProfissional();
    }

    @Transactional
    public AlocacaoResponseDTO alocarPerfilNaOs(Long osId, AlocacaoRequestDTO dto) {
        OrdemServico os = ordemServicoRepository.findById(osId)
                .orElseThrow(() -> new EntityNotFoundException("Ordem de Serviço não encontrada: " + osId));

        PerfilContratado perfil = perfilRepository.findById(dto.getPerfilContratadoId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil contratado não encontrado: " + dto.getPerfilContratadoId()));

        AlocacaoPerfilOs alocacao = new AlocacaoPerfilOs();
        alocacao.setOrdemServico(os);
        alocacao.setNomeProfissional(dto.getNomeProfissional().trim());
        alocacao.setPercentualAlocacao(dto.getPercentualAlocacao());

        // APLICAÇÃO DA REGRA DE NEGÓCIO:
        alocacao.aplicarRegraDeNegocio(perfil);

        AlocacaoPerfilOs salva = alocacaoRepository.save(alocacao);
        return AlocacaoResponseDTO.fromEntity(salva);
    }

    @Transactional
    public void removerAlocacao(Long alocacaoId) {
        if (!alocacaoRepository.existsById(alocacaoId)) {
            throw new EntityNotFoundException("Alocação não encontrada: " + alocacaoId);
        }
        alocacaoRepository.deleteById(alocacaoId);
    }
}`
  },
  {
    path: 'src/main/java/br/gov/sisgos/controller/OrdemServicoController.java',
    name: 'OrdemServicoController.java',
    package: 'br.gov.sisgos.controller',
    category: 'controller',
    description: 'Controller REST com todos os endpoints para ciclo de vida das Ordens de Serviço',
    code: `package br.gov.sisgos.controller;

import br.gov.sisgos.dto.*;
import br.gov.sisgos.service.AlocacaoService;
import br.gov.sisgos.service.OrdemServicoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ordens-servico")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Ordens de Serviço", description = "Endpoints de gerenciamento do ciclo de vida das OS e alocação de perfis")
public class OrdemServicoController {

    private final OrdemServicoService ordemServicoService;
    private final AlocacaoService alocacaoService;

    @GetMapping
    @Operation(summary = "Listar todas as Ordens de Serviço com valor total calculado")
    public ResponseEntity<List<OrdemServicoResponseDTO>> listarTodas() {
        return ResponseEntity.ok(ordemServicoService.listarTodas());
    }

    @GetMapping("/detalhadas")
    @Operation(summary = "Listar todas as Ordens de Serviço completas: dados da OS, dados do Projeto e alocações de perfis")
    public ResponseEntity<List<OrdemServicoCompletaResponseDTO>> listarTodasDetalhadas() {
        return ResponseEntity.ok(ordemServicoService.listarTodasDetalhadas());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter detalhes de uma Ordem de Serviço por ID")
    public ResponseEntity<OrdemServicoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ordemServicoService.buscarPorId(id));
    }

    @PostMapping
    @Operation(summary = "Criar nova Ordem de Serviço vinculando a um Projeto")
    public ResponseEntity<OrdemServicoResponseDTO> criar(@Valid @RequestBody OrdemServicoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ordemServicoService.criar(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar dados de uma Ordem de Serviço")
    public ResponseEntity<OrdemServicoResponseDTO> atualizar(
            @PathVariable Long id, 
            @Valid @RequestBody OrdemServicoRequestDTO dto) {
        return ResponseEntity.ok(ordemServicoService.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir uma Ordem de Serviço e suas alocações")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        ordemServicoService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // ENDPOINTS DE ALOCAÇÃO DE PERFIS NA OS (N:N)
    // ==========================================

    @GetMapping("/{id}/alocacoes")
    @Operation(summary = "Listar perfis alocados na Ordem de Serviço")
    public ResponseEntity<List<AlocacaoResponseDTO>> listarAlocacoes(@PathVariable Long id) {
        return ResponseEntity.ok(alocacaoService.listarPorOrdemServico(id));
    }

    @PostMapping("/{id}/alocacoes")
    @Operation(summary = "Alocar perfil na OS aplicando regra de cópia e cálculo automático")
    public ResponseEntity<AlocacaoResponseDTO> alocarPerfil(
            @PathVariable Long id, 
            @Valid @RequestBody AlocacaoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alocacaoService.alocarPerfilNaOs(id, dto));
    }

    @DeleteMapping("/{id}/alocacoes/{alocacaoId}")
    @Operation(summary = "Remover alocação de perfil da Ordem de Serviço")
    public ResponseEntity<Void> removerAlocacao(
            @PathVariable Long id, 
            @PathVariable Long alocacaoId) {
        alocacaoService.removerAlocacao(alocacaoId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profissionais/nomes-distintos")
    @Operation(summary = "Listar nomes distintos de profissionais cadastrados para sugestão/autocomplete")
    public ResponseEntity<List<String>> listarNomesProfissionaisDistintos() {
        return ResponseEntity.ok(alocacaoService.obterNomesProfissionaisDistintos());
    }
}`
  },
  {
    path: 'Dockerfile',
    name: 'Dockerfile',
    package: 'devops',
    category: 'devops',
    description: 'Multi-Stage Build Dockerfile: Stage 1 (Frontend Node), Stage 2 (Maven Java 21) e Stage 3 (JRE Alpine não-root)',
    code: `# ========================================================================
# DOCKERFILE MULTI-STAGE BUILD - SISGOS FULL-STACK
# Aplicação: SisGOS (Spring Boot 3 + Frontend React / Bootstrap 5 + PostgreSQL)
# ========================================================================

# ------------------------------------------------------------------------
# STAGE 1: Build do Front-End (Vite + React + Bootstrap 5 + Chart.js)
# ------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY package.json package-lock.json* bun.lock* ./
RUN npm ci || npm install

COPY index.html tsconfig.json vite.config.ts server.ts* ./
COPY public ./public
COPY src ./src

# Compila os ativos estáticos do frontend (HTML, JS, CSS) para o Spring Boot
RUN npm run build:client

# ------------------------------------------------------------------------
# STAGE 2: Build do Back-End Java (Maven + OpenJDK 21)
# ------------------------------------------------------------------------
FROM maven:3.9.6-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /workspace

COPY pom.xml .
RUN mvn dependency:resolve -B || true

COPY src/main/resources ./src/main/resources
COPY src/main/java ./src/main/java

# Incorpora os arquivos estáticos compilados do frontend no diretório static do Spring Boot
COPY --from=frontend-builder /app/dist ./src/main/resources/static

RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------
# STAGE 3: Runtime de Produção Leve (Eclipse Temurin JRE Alpine)
# ------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL maintainer="Equipe DevOps SisGOS <devops@sisgos.gov.br>"

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
RUN apk --no-cache add curl wget

COPY --from=backend-builder /workspace/target/*.jar /app/app.jar
RUN chown -R appuser:appgroup /app

USER appuser
EXPOSE 8080

ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \\
  CMD wget -q --spider http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]`
  },
  {
    path: 'docker-compose.yml',
    name: 'docker-compose.yml',
    package: 'devops',
    category: 'devops',
    description: 'Orquestrador Docker Compose com PostgreSQL 16 (Healthcheck + Volume + DDL Init) e Spring Boot Full-Stack',
    code: `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: sisgos-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: \${POSTGRES_DB:-sisgos_db}
      POSTGRES_USER: \${POSTGRES_USER:-sisgos_user}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-sisgos_secret_pass}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    ports:
      - "\${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-sisgos_user} -d \${POSTGRES_DB:-sisgos_db}"]
      interval: 5s
      timeout: 5s
      retries: 6
      start_period: 10s
    networks:
      - sisgos-network

  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: sisgos/fullstack-app:latest
    container_name: sisgos-app
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/\${POSTGRES_DB:-sisgos_db}
      SPRING_DATASOURCE_USERNAME: \${POSTGRES_USER:-sisgos_user}
      SPRING_DATASOURCE_PASSWORD: \${POSTGRES_PASSWORD:-sisgos_secret_pass}
      SPRING_JPA_HIBERNATE_DDL_AUTO: validate
      SPRING_JPA_DATABASE_PLATFORM: org.hibernate.dialect.PostgreSQLDialect
      JAVA_TOOL_OPTIONS: >-
        -XX:+UseContainerSupport
        -XX:MaxRAMPercentage=75.0
        -XX:+ExitOnOutOfMemoryError
        -Djava.security.egd=file:/dev/./urandom
    ports:
      - "\${APP_PORT:-8080}:8080"
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://localhost:8080/api/v1/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s
    networks:
      - sisgos-network

networks:
  sisgos-network:
    name: sisgos-network
    driver: bridge

volumes:
  postgres_data:
    name: sisgos_postgres_data
    driver: local`
  },
  {
    path: 'init.sql',
    name: 'init.sql',
    package: 'devops',
    category: 'devops',
    description: 'Script DDL completo com constraints, índices, triggers PL/pgSQL e carga de dados de semente (seeds)',
    code: `-- ========================================================================
-- SISTEMA DE GESTÃO DE ORDENS DE SERVIÇO - SisGOS
-- SCRIPT DE INICIALIZAÇÃO DO BANCO DE DADOS POSTGRESQL (init.sql)
-- MAPEAMENTO: /docker-entrypoint-initdb.d/01-init.sql
-- ========================================================================

SET client_encoding = 'UTF8';
SET timezone = 'America/Sao_Paulo';

-- 1. Tabela: Perfis Contratados
CREATE TABLE IF NOT EXISTS perfis_contratados (
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
);

-- 2. Tabela: Projetos
CREATE TABLE IF NOT EXISTS projetos (
    id BIGSERIAL PRIMARY KEY,
    nome_projeto VARCHAR(200) NOT NULL,
    sigla_projeto VARCHAR(50) NOT NULL,
    descricao VARCHAR(500),
    nome_secretaria VARCHAR(200) NOT NULL,
    sigla_secretaria VARCHAR(50) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_projetos_sigla UNIQUE (sigla_projeto)
);

-- 3. Tabela: Ordens de Serviço
CREATE TABLE IF NOT EXISTS ordens_servico (
    id BIGSERIAL PRIMARY KEY,
    projeto_id BIGINT NOT NULL,
    numero_os INTEGER NOT NULL,
    ano_referencia INTEGER NOT NULL,
    alocacao_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    entrega_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    descricao_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    situacao_sgc VARCHAR(100),
    situacao_passivo_2026 VARCHAR(100),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_os_projeto FOREIGN KEY (projeto_id) REFERENCES projetos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_os_numero_positivo CHECK (numero_os > 0),
    CONSTRAINT unq_os_projeto_ano_num UNIQUE (projeto_id, numero_os, ano_referencia)
);

-- 4. Tabela: Alocações de Perfis na OS (N:N)
CREATE TABLE IF NOT EXISTS alocacoes_perfil_os (
    id BIGSERIAL PRIMARY KEY,
    ordem_servico_id BIGINT NOT NULL,
    perfil_contratado_id BIGINT NOT NULL,
    mes_referencia VARCHAR(20) NOT NULL,
    nome_profissional VARCHAR(200) NOT NULL,
    percentual_alocacao NUMERIC(5, 2) NOT NULL,
    documento_referencia VARCHAR(255) NOT NULL,
    custo_mensal_perfil NUMERIC(12, 2) NOT NULL,
    custo_alocacao NUMERIC(12, 2) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alocacao_os FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico (id) ON DELETE CASCADE,
    CONSTRAINT fk_alocacao_perfil FOREIGN KEY (perfil_contratado_id) REFERENCES perfis_contratados (id),
    CONSTRAINT chk_percentual_alocacao CHECK (percentual_alocacao >= 0.00 AND percentual_alocacao <= 100.00),
    CONSTRAINT chk_os_mes_valido CHECK (
        mes_referencia IN (
            'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 
            'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 
            'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
        )
    ),
    CONSTRAINT unq_alocacao_os_perfil_mes UNIQUE (ordem_servico_id, perfil_contratado_id, mes_referencia)
);

-- 5. Trigger PL/pgSQL
CREATE OR REPLACE FUNCTION fn_trg_processar_alocacao_perfil()
RETURNS TRIGGER AS $$
DECLARE
    v_custo_mensal NUMERIC(12, 2);
    v_doc_ref VARCHAR(255);
BEGIN
    SELECT custo_mensal_perfil, documento_referencia
      INTO v_custo_mensal, v_doc_ref
      FROM perfis_contratados
     WHERE id = NEW.perfil_contratado_id;

    NEW.custo_mensal_perfil := v_custo_mensal;
    NEW.documento_referencia := v_doc_ref;
    NEW.custo_alocacao := ROUND((NEW.percentual_alocacao::NUMERIC * v_custo_mensal) / 100.0, 2);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_before_insert_update_alocacao ON alocacoes_perfil_os;
CREATE TRIGGER trg_before_insert_update_alocacao
BEFORE INSERT OR UPDATE ON alocacoes_perfil_os
FOR EACH ROW EXECUTE FUNCTION fn_trg_processar_alocacao_perfil();`
  }
];
