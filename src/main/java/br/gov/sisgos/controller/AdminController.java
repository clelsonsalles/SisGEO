package br.gov.sisgos.controller;

import br.gov.sisgos.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Administração do Banco", description = "Endpoints para gerenciamento do ciclo de dados (Seed e Limpeza de Tabelas)")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/clear-data")
    @Operation(summary = "Limpar todas as tabelas do banco de dados (exclusão física direta no PostgreSQL)")
    public ResponseEntity<Map<String, Object>> clearData() {
        adminService.clearAllData();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Todos os dados foram excluídos fisicamente do banco de dados e as tabelas estão limpas."
        ));
    }

    @PostMapping("/reset-seed")
    @Operation(summary = "Restaurar dados padrões de demonstração (Seed) diretamente no banco de dados")
    public ResponseEntity<Map<String, Object>> resetSeed() {
        adminService.resetToInitialSeed();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Base de dados PostgreSQL restaurada com a semente de dados padrão (Seed) com sucesso."
        ));
    }
}
