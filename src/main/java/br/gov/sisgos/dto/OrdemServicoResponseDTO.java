package br.gov.sisgos.dto;

import br.gov.sisgos.domain.entity.OrdemServico;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdemServicoResponseDTO {

    private Long id;
    private Long projetoId;
    private String nomeProjeto;
    private String siglaProjeto;
    private String siglaSecretaria;
    private Integer numeroOs;
    private Integer anoReferencia;
    private String mesesAlocados;
    private Boolean alocacaoSgc;
    private Boolean entregaSgc;
    private Boolean descricaoSgc;
    private String situacaoSgc;
    private String situacaoPassivo2026;
    private String nePlanejamento;
    private String neFaturamento;
    private String processoSeiPagamento;
    private Integer totalAlocacoes;
    private BigDecimal valorTotalCalculado;
    private OffsetDateTime criadoEm;

    public static OrdemServicoResponseDTO fromEntity(OrdemServico entity) {
        if (entity == null) return null;

        String meses = "";
        if (entity.getAlocacoes() != null && !entity.getAlocacoes().isEmpty()) {
            List<String> listaMeses = entity.getAlocacoes().stream()
                    .map(a -> a.getMesReferencia())
                    .filter(m -> m != null && !m.isBlank())
                    .distinct()
                    .toList();
            meses = String.join(", ", listaMeses);
        }

        return OrdemServicoResponseDTO.builder()
                .id(entity.getId())
                .projetoId(entity.getProjeto() != null ? entity.getProjeto().getId() : null)
                .nomeProjeto(entity.getProjeto() != null ? entity.getProjeto().getNomeProjeto() : null)
                .siglaProjeto(entity.getProjeto() != null ? entity.getProjeto().getSiglaProjeto() : null)
                .siglaSecretaria(entity.getProjeto() != null ? entity.getProjeto().getSiglaSecretaria() : null)
                .numeroOs(entity.getNumeroOs())
                .anoReferencia(entity.getAnoReferencia())
                .mesesAlocados(meses)
                .alocacaoSgc(entity.getAlocacaoSgc())
                .entregaSgc(entity.getEntregaSgc())
                .descricaoSgc(entity.getDescricaoSgc())
                .situacaoSgc(entity.getSituacaoSgc())
                .situacaoPassivo2026(entity.getSituacaoPassivo2026())
                .nePlanejamento(entity.getNePlanejamento())
                .neFaturamento(entity.getNeFaturamento())
                .processoSeiPagamento(entity.getProcessoSeiPagamento())
                .totalAlocacoes(entity.getAlocacoes() != null ? entity.getAlocacoes().size() : 0)
                .valorTotalCalculado(entity.getValorTotalOs())
                .criadoEm(entity.getCriadoEm())
                .build();
    }
}
