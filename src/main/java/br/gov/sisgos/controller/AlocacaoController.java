package br.gov.sisgos.controller;

import br.gov.sisgos.dto.AlocacaoRequestDTO;
import br.gov.sisgos.dto.AlocacaoResponseDTO;
import br.gov.sisgos.service.AlocacaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/alocacoes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Alocações", description = "Endpoints diretos de gerenciamento e movimentação de alocações")
public class AlocacaoController {

    private final AlocacaoService alocacaoService;

    @GetMapping("/{id:[0-9]+}")
    @Operation(summary = "Obter alocação por ID")
    public ResponseEntity<AlocacaoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(alocacaoService.buscarPorId(id));
    }

    @PutMapping("/{id:[0-9]+}/alterar-os")
    @Operation(summary = "Alterar a Ordem de Serviço de uma alocação existente")
    public ResponseEntity<AlocacaoResponseDTO> alterarOrdemServico(
            @PathVariable Long id,
            @RequestBody AlocacaoRequestDTO dto) {
        Long novaOsId = dto.getNovaOrdemServicoId();
        return ResponseEntity.ok(alocacaoService.alterarOrdemServico(id, novaOsId));
    }

    @PutMapping("/{id:[0-9]+}")
    @Operation(summary = "Atualizar alocação diretamente por ID")
    public ResponseEntity<AlocacaoResponseDTO> atualizarAlocacao(
            @PathVariable Long id,
            @Valid @RequestBody AlocacaoRequestDTO dto) {
        return ResponseEntity.ok(alocacaoService.atualizarAlocacao(id, dto));
    }

    @DeleteMapping("/{id:[0-9]+}")
    @Operation(summary = "Remover alocação diretamente por ID")
    public ResponseEntity<Void> removerAlocacao(@PathVariable Long id) {
        alocacaoService.removerAlocacao(id);
        return ResponseEntity.noContent().build();
    }
}
