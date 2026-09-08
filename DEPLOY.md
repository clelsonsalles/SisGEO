# Guia DevOps de Implantação e Execução com Docker & Docker Compose
## Sistema de Gestão de Ordens de Serviço (SisGOS)

Este documento contém o guia arquitetural e operacional para empacotamento, conteinerização e execução do **SisGOS** em ambiente de homologação ou produção utilizando **Docker** e **Docker Compose**.

---

### 1. Arquitetura da Solução em Containers

A solução é composta por dois containers isolados comunicando-se por meio de uma rede bridge interna dedicada:

```text
       +-------------------------------------------------------------+
       |               REDE INTERNA (sisgos-network)                 |
       |                                                             |
       |  +-------------------------+     +-----------------------+  |
       |  | Container 1: postgres   |     | Container 2: app      |  |
       |  | (PostgreSQL 16 Alpine)  |     | (Spring Boot 3 + SPA) |  |
       |  |                         |     |                       |  |
       |  | - Porta: 5432           |<----| - Porta: 8080         |  |
       |  | - Volume: postgres_data |(JPA)| - Healthcheck: /health|  |
       |  | - Init: /init.sql       |     | - Multi-Stage Build   |  |
       |  +-------------------------+     +-----------------------+  |
       +-------------------------------------------------------------+
                 |                                      |
         Porta Host: 5432                       Porta Host: 8080
       (Admin DB / DBeaver)                   (Navegador / Swagger)
```

1. **Container 1 (`sisgos-postgres`)**:
   - Imagem: `postgres:16-alpine` (otimizada e segura).
   - Script de Inicialização: Mapeamento de `./init.sql` para `/docker-entrypoint-initdb.d/01-init.sql` (cria tabelas, índices, triggers PL/pgSQL e efetua a carga inicial de seeds).
   - Persistência: Volume nomeado `sisgos_postgres_data`.
   - Healthcheck: Teste nativo `pg_isready -U sisgos_user -d sisgos_db`.

2. **Container 2 (`sisgos-app`)**:
   - Imagem: Multi-Stage Build baseada em OpenJDK (`eclipse-temurin:21-jre-alpine`).
   - Front-end SPA: Compilado no Stage 1 e embutido em `src/main/resources/static/` para servir a interface web e as APIs REST no mesmo host e porta (8080).
   - Segurança: Execução sob usuário de sistema não-root (`appuser:appgroup`).
   - Dependência Controlada: `depends_on` com `condition: service_healthy` assegurando que a API só inicializa após o PostgreSQL responder com sucesso.

---

### 2. Estrutura dos Arquivos Criados

| Arquivo | Finalidade |
| :--- | :--- |
| `Dockerfile` | Multi-stage build (Stage 1: Frontend Node/Vite -> Stage 2: Maven Java 21 -> Stage 3: JRE Alpine de Produção) |
| `docker-compose.yml` | Orquestração dos serviços, volumes, redes, portas, variáveis de ambiente e healthchecks |
| `init.sql` | DDL das tabelas relacionais, constraints, triggers automáticos e carga de dados de exemplo (seeds) |
| `.dockerignore` | Prevenção de envio de arquivos temporários, `node_modules` e `.git` para o contexto do daemon Docker |
| `pom.xml` | Configuração Maven oficial para compilação Spring Boot 3.3.x com Java 21 |
| `src/main/resources/application.yml` | Configuração de profile de produção do Spring Data JPA / HikariCP com variáveis de ambiente |

---

### 3. Passo a Passo de Execução

#### Pré-requisitos:
- **Docker Engine** (versão 20.10+ ou Docker Desktop)
- **Docker Compose** (versão 2.0+)

#### Passo 1: Construir as imagens e iniciar os containers
Execute na raiz do projeto:
```bash
docker compose up -d --build
```
> O Docker fará o build do front-end, o empacotamento do .jar com o Maven e subirá o PostgreSQL e a aplicação em segundo plano.

#### Passo 2: Acompanhar os logs de inicialização
```bash
# Ver logs de todos os containers
docker compose logs -f

# Ver logs apenas da aplicação Spring Boot
docker compose logs -f app

# Ver logs do banco PostgreSQL
docker compose logs -f postgres
```

#### Passo 3: Verificar o status e a integridade (Healthcheck)
```bash
docker compose ps
```
Você verá:
```text
NAME                IMAGE                        COMMAND                  SERVICE      STATUS                    PORTS
sisgos-postgres     postgres:16-alpine           "docker-entrypoint.s…"   postgres     Up (healthy)              0.0.0.0:5432->5432/tcp
sisgos-app          sisgos/fullstack-app:latest  "java -jar /app/app…"    app          Up (healthy)              0.0.0.0:8080->8080/tcp
```

---

### 4. Acessando a Aplicação e os Endpoints

Após os containers estarem com status `healthy`:

- **Aplicação Web (Interface Completa)**: `http://localhost:8080`
- **Swagger UI / Documentação Interativa**: `http://localhost:8080/swagger-ui/index.html`
- **Healthcheck da API**: `http://localhost:8080/api/v1/health`
- **Listagem Detalhada de OSs**: `http://localhost:8080/api/v1/ordens-servico/detalhadas`

---

### 5. Comandos Úteis de Operação e Manutenção

```bash
# Acessar o terminal interativo do PostgreSQL dentro do container
docker compose exec postgres psql -U sisgos_user -d sisgos_db

# Verificar as tabelas criadas no banco
# Dentro do psql: \dt

# Reiniciar apenas a aplicação (sem reiniciar o banco)
docker compose restart app

# Parar os containers mantendo os dados persistidos no volume
docker compose down

# Parar os containers e DELETAR os volumes (reseta o banco de dados)
docker compose down -v
```
