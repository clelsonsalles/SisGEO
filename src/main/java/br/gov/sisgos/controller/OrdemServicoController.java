package br.gov.sisgos.controller;

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
@RequestMapping("/api/v1/ordens-servico")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Ordens de Serviço", description = "Endpoints de gerenciamento do ciclo de vida das OS e alocação de perfis")
public class OrdemServicoController {

    private final OrdemServicoService ordemServicoService;
    private final AlocacaoService alocacaoService;

    @GetMapping
    @Operation(summary = "Listar todas as Ordens de Serviço (suporta ?detalhadas=true)")
    public ResponseEntity<?> listarTodas(
            @RequestParam(name = "detalhadas", required = false, defaultValue = "false") Boolean detalhadas,
            @RequestParam(name = "detalhes", required = false, defaultValue = "false") Boolean detalhes) {
        if (Boolean.TRUE.equals(detalhadas) || Boolean.TRUE.equals(detalhes)) {
            return ResponseEntity.ok(ordemServicoService.listarTodasDetalhadas());
        }
        return ResponseEntity.ok(ordemServicoService.listarTodas());
    }

    @GetMapping({"/detalhadas", "/detalhes"})
    @Operation(summary = "Listar todas as Ordens de Serviço completas: dados da OS, dados do Projeto e alocações de perfis")
    public ResponseEntity<List<OrdemServicoCompletaResponseDTO>> listarTodasDetalhadas() {
        return ResponseEntity.ok(ordemServicoService.listarTodasDetalhadas());
    }

    @GetMapping("/situacoes-sgc")
    @Operation(summary = "Listar situações SGC distintas cadastradas no banco de dados")
    public ResponseEntity<List<String>> listarSituacoesSgc() {
        return ResponseEntity.ok(ordemServicoService.obterSituacoesSgc());
    }

    @GetMapping("/situacoes-passivo")
    @Operation(summary = "Listar situações Passivo 2026 distintas cadastradas no banco de dados")
    public ResponseEntity<List<String>> listarSituacoesPassivo() {
        return ResponseEntity.ok(ordemServicoService.obterSituacoesPassivo());
    }

    @GetMapping("/profissionais/nomes-distintos")
    @Operation(summary = "Listar nomes distintos de profissionais cadastrados para sugestão/autocomplete")
    public ResponseEntity<List<String>> listarNomesProfissionaisDistintos() {
        return ResponseEntity.ok(alocacaoService.obterNomesProfissionaisDistintos());
    }

    @GetMapping("/{id:[0-9]+}")
    @Operation(summary = "Obter detalhes de uma Ordem de Serviço por ID")
    public ResponseEntity<OrdemServicoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ordemServicoService.buscarPorId(id));
    }

    @PostMapping
    @Operation(summary = "Criar nova Ordem de Serviço vinculando a um Projeto")
    public ResponseEntity<OrdemServicoResponseDTO> criar(@Valid @RequestBody OrdemServicoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ordemServicoService.criar(dto));
    }

    @PutMapping("/{id:[0-9]+}")
    @Operation(summary = "Atualizar dados de uma Ordem de Serviço")
    public ResponseEntity<OrdemServicoResponseDTO> atualizar(
            @PathVariable Long id, 
            @Valid @RequestBody OrdemServicoRequestDTO dto) {
        return ResponseEntity.ok(ordemServicoService.atualizar(id, dto));
    }

    @DeleteMapping("/{id:[0-9]+}")
    @Operation(summary = "Excluir uma Ordem de Serviço e suas alocações")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        ordemServicoService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // ENDPOINTS DE ALOCAÇÃO DE PERFIS NA OS (N:N)
    // ==========================================

    @GetMapping("/{id:[0-9]+}/alocacoes")
    @Operation(summary = "Listar perfis alocados na Ordem de Serviço")
    public ResponseEntity<List<AlocacaoResponseDTO>> listarAlocacoes(@PathVariable Long id) {
        return ResponseEntity.ok(alocacaoService.listarPorOrdemServico(id));
    }

    @PostMapping("/{id:[0-9]+}/alocacoes")
    @Operation(summary = "Alocar perfil na OS aplicando regra de cópia e cálculo automático")
    public ResponseEntity<AlocacaoResponseDTO> alocarPerfil(
            @PathVariable Long id, 
            @Valid @RequestBody AlocacaoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alocacaoService.alocarPerfilNaOs(id, dto));
    }

    @PutMapping("/{id:[0-9]+}/alocacoes/{alocacaoId:[0-9]+}")
    @Operation(summary = "Atualizar alocação de perfil na Ordem de Serviço")
    public ResponseEntity<AlocacaoResponseDTO> atualizarAlocacao(
            @PathVariable Long id,
            @PathVariable Long alocacaoId,
            @Valid @RequestBody AlocacaoRequestDTO dto) {
        return ResponseEntity.ok(alocacaoService.atualizarAlocacao(alocacaoId, dto));
    }

    @PutMapping({"/{id:[0-9]+}/alocacoes/{alocacaoId:[0-9]+}/alterar-os", "/alocacoes/{alocacaoId:[0-9]+}/alterar-os"})
    @Operation(summary = "Alterar a Ordem de Serviço de uma alocação de perfil existente")
    public ResponseEntity<AlocacaoResponseDTO> alterarOrdemServico(
            @PathVariable(required = false) Long id,
            @PathVariable Long alocacaoId,
            @RequestBody AlocacaoRequestDTO dto) {
        Long novaOsId = dto.getNovaOrdemServicoId();
        return ResponseEntity.ok(alocacaoService.alterarOrdemServico(alocacaoId, novaOsId));
    }

    @DeleteMapping({"/{id:[0-9]+}/alocacoes/{alocacaoId:[0-9]+}", "/alocacoes/{alocacaoId:[0-9]+}"})
    @Operation(summary = "Remover alocação de perfil da Ordem de Serviço")
    public ResponseEntity<Void> removerAlocacao(
            @PathVariable(required = false) Long id, 
            @PathVariable Long alocacaoId) {
        alocacaoService.removerAlocacao(alocacaoId);
        return ResponseEntity.noContent().build();
    }
}
