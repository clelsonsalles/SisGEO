# ========================================================================
# DOCKERFILE MULTI-STAGE BUILD - SISGOS FULL-STACK
# Aplicação: SisGOS (Spring Boot 3 + Frontend React / Bootstrap 5 + PostgreSQL)
# ========================================================================

# ------------------------------------------------------------------------
# STAGE 1: Build do Front-End (Vite + React + Bootstrap 5 + Chart.js)
# ------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Otimização de cache para dependências npm
COPY package.json package-lock.json* bun.lock* ./
RUN npm ci || npm install

# Copia código-fonte do front-end e executa compilação estática dos ativos SPA
COPY . .
RUN mkdir -p public

# Compila os ativos estáticos do frontend (HTML, JS, CSS) destinados ao Spring Boot
RUN npm run build:client

# ------------------------------------------------------------------------
# STAGE 2: Build do Back-End Java (Maven + OpenJDK 21)
# ------------------------------------------------------------------------
FROM maven:3.9.6-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /workspace

# Otimização de cache de dependências Maven
COPY pom.xml .
RUN mvn dependency:resolve -B || true

# Copia código-fonte Java e recursos
COPY src/main/resources ./src/main/resources
COPY src/main/java ./src/main/java

# Incorpora os arquivos estáticos compilados do frontend no diretório static do Spring Boot
COPY --from=frontend-builder /app/dist ./src/main/resources/static

# Compila o pacote da aplicação full-stack gerando o arquivo .jar executável
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------
# STAGE 3: Runtime de Produção Leve (Eclipse Temurin JRE Alpine)
# ------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL maintainer="Equipe DevOps SisGOS <devops@sisgos.gov.br>"
LABEL description="Imagem de Produção SisGOS Full-Stack (Spring Boot + React SPA + PostgreSQL)"

# Criação de usuário e grupo não-root para conformidade e segurança em produção
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Instala curl / wget para suporte a healthcheck no container
RUN apk --no-cache add curl wget

# Copia o artefato .jar gerado no Stage 2
COPY --from=backend-builder /workspace/target/*.jar /app/app.jar

# Define permissões restritas para o usuário de serviço
RUN chown -R appuser:appgroup /app

# Troca para o usuário não-root
USER appuser

# Porta padrão de escuta da aplicação Spring Boot
EXPOSE 8080

# Configurações otimizadas de JVM para containers (CGroups v2, heap dinâmico, /dev/urandom)
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

# Healthcheck nativo do container para verificar a integridade da API REST
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:8080/api/v1/health || exit 1

# Comando de inicialização do microserviço
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
