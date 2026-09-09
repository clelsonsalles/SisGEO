package br.gov.sisgos.controller;

import br.gov.sisgos.dto.PerfilContratadoDTO;
import br.gov.sisgos.service.PerfilContratadoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/perfis-contratados")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Perfis Contratados", description = "Endpoints de gerenciamento dos perfis de profissionais e seus custos contratuais")
public class PerfilContratadoController {

    private final PerfilContratadoService perfilService;

    @GetMapping
    @Operation(summary = "Listar todos os perfis contratados")
    public ResponseEntity<List<PerfilContratadoDTO>> listarTodos(
            @RequestParam(required = false) Boolean vigente) {
        return ResponseEntity.ok(perfilService.listarTodos(vigente));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar perfil contratado por ID")
    public ResponseEntity<PerfilContratadoDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(perfilService.buscarPorId(id));
    }

    @PostMapping
    @Operation(summary = "Cadastrar novo perfil contratado")
    public ResponseEntity<PerfilContratadoDTO> criar(@Valid @RequestBody PerfilContratadoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(perfilService.criar(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar dados de um perfil contratado")
    public ResponseEntity<PerfilContratadoDTO> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody PerfilContratadoDTO dto) {
        return ResponseEntity.ok(perfilService.atualizar(id, dto));
    }

    @PatchMapping("/{id}/vigencia")
    @Operation(summary = "Alternar situação de vigência do perfil (ativo/inativo)")
    public ResponseEntity<PerfilContratadoDTO> alternarVigencia(@PathVariable Long id) {
        return ResponseEntity.ok(perfilService.alternarVigencia(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir um perfil contratado se não estiver em uso")
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        try {
            perfilService.excluir(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }
}
