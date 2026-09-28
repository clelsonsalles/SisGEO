package br.gov.sisgos.controller;

import br.gov.sisgos.domain.entity.AlocacaoPerfilOs;
import br.gov.sisgos.domain.entity.OrdemServico;
import br.gov.sisgos.domain.entity.PerfilContratado;
import br.gov.sisgos.repository.AlocacaoPerfilOsRepository;
import br.gov.sisgos.repository.OrdemServicoRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Dashboard", description = "Endpoints de métricas agregadas e inteligência gerencial (BI)")
public class DashboardController {

    private final OrdemServicoRepository ordemServicoRepository;
    private final AlocacaoPerfilOsRepository alocacaoRepository;

    @GetMapping("/resumo")
    @Transactional(readOnly = true)
    @Operation(summary = "Obter resumo consolidado das métricas executivas e distribuição por perfil")
    public ResponseEntity<Map<String, Object>> obterResumo() {
        List<OrdemServico> ordens = ordemServicoRepository.findAll();
        List<AlocacaoPerfilOs> alocacoes = alocacaoRepository.findAll();

        int totalOs = ordens.size();
        int totalAlocacoes = alocacoes.size();

        BigDecimal valorTotal = alocacoes.stream()
                .map(AlocacaoPerfilOs::getCustoAlocacao)
                .filter(c -> c != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal mediaPorOs = totalOs > 0
                ? valorTotal.divide(BigDecimal.valueOf(totalOs), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> metricas = new LinkedHashMap<>();
        metricas.put("total_ordens_servico", totalOs);
        metricas.put("total_alocacoes_equipe", totalAlocacoes);
        metricas.put("valor_total_consolidado", valorTotal);
        metricas.put("media_por_os", mediaPorOs);

        Map<String, Map<String, Object>> distribuicaoPorPerfil = new LinkedHashMap<>();
        for (AlocacaoPerfilOs a : alocacoes) {
            PerfilContratado p = a.getPerfilContratado();
            String nome = (p != null && p.getNomePerfil() != null) ? p.getNomePerfil() : "Perfil #" + a.getId();
            
            distribuicaoPorPerfil.putIfAbsent(nome, new LinkedHashMap<>());
            Map<String, Object> item = distribuicaoPorPerfil.get(nome);

            int qtd = (int) item.getOrDefault("quantidade", 0) + 1;
            BigDecimal valor = ((BigDecimal) item.getOrDefault("valorTotal", BigDecimal.ZERO))
                    .add(a.getCustoAlocacao() != null ? a.getCustoAlocacao() : BigDecimal.ZERO);

            item.put("quantidade", qtd);
            item.put("valorTotal", valor.setScale(2, RoundingMode.HALF_UP));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("metricas", metricas);
        response.put("distribuicao_por_perfil", distribuicaoPorPerfil);

        return ResponseEntity.ok(response);
    }
}
