package br.gov.sisgos.controller;

import br.gov.sisgos.dto.ProjetoDTO;
import br.gov.sisgos.service.ProjetoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projetos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Projetos", description = "Endpoints de gerenciamento dos projetos institucionais e secretarias")
public class ProjetoController {

    private final ProjetoService projetoService;

    @GetMapping
    @Operation(summary = "Listar todos os projetos cadastrados")
    public ResponseEntity<List<ProjetoDTO>> listarTodos() {
        return ResponseEntity.ok(projetoService.listarTodos());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar projeto por ID")
    public ResponseEntity<ProjetoDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(projetoService.buscarPorId(id));
    }

    @PostMapping
    @Operation(summary = "Cadastrar novo projeto")
    public ResponseEntity<ProjetoDTO> criar(@Valid @RequestBody ProjetoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projetoService.criar(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar projeto existente")
    public ResponseEntity<ProjetoDTO> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ProjetoDTO dto) {
        return ResponseEntity.ok(projetoService.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir projeto se não possuir OS vinculada")
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        try {
            projetoService.excluir(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }
}
