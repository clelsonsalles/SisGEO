package br.gov.sisgos.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@CrossOrigin(origins = "*")
@Tag(name = "Health Check", description = "Monitoramento de integridade e catálogo de endpoints")
public class HealthController {

    @GetMapping
    @Operation(summary = "Verificar status e endpoints da API RESTful")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("status", "UP");
        resp.put("service", "SisGOS RESTful API Service");
        resp.put("framework", "Spring Boot 3.3.x + Java 21 / PostgreSQL 16");
        resp.put("timestamp", OffsetDateTime.now().toString());
        resp.put("version", "1.0.0");

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("ordens_servico", "/api/v1/ordens-servico");
        endpoints.put("ordens_servico_detalhadas", "/api/v1/ordens-servico/detalhadas");
        endpoints.put("projetos", "/api/v1/projetos");
        endpoints.put("perfis_contratados", "/api/v1/perfis-contratados");
        endpoints.put("dashboard", "/api/v1/dashboard/resumo");
        endpoints.put("profissionais", "/api/v1/ordens-servico/profissionais/nomes-distintos");
        resp.put("endpoints", endpoints);

        return ResponseEntity.ok(resp);
    }
}
