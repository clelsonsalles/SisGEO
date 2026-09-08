package br.gov.sisgos.dto;

import br.gov.sisgos.domain.entity.OrdemServico;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

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
    private String mesReferencia;
    private Boolean alocacaoSgc;
    private Boolean entregaSgc;
    private Boolean descricaoSgc;
    private String situacaoSgc;
    private String situacaoPassivo2026;
    private Integer totalAlocacoes;
    private BigDecimal valorTotalCalculado;
    private OffsetDateTime criadoEm;

    public static OrdemServicoResponseDTO fromEntity(OrdemServico entity) {
        if (entity == null) return null;
        return OrdemServicoResponseDTO.builder()
                .id(entity.getId())
                .projetoId(entity.getProjeto() != null ? entity.getProjeto().getId() : null)
                .nomeProjeto(entity.getProjeto() != null ? entity.getProjeto().getNomeProjeto() : null)
                .siglaProjeto(entity.getProjeto() != null ? entity.getProjeto().getSiglaProjeto() : null)
                .siglaSecretaria(entity.getProjeto() != null ? entity.getProjeto().getSiglaSecretaria() : null)
                .numeroOs(entity.getNumeroOs())
                .anoReferencia(entity.getAnoReferencia())
                .mesReferencia(entity.getMesReferencia())
                .alocacaoSgc(entity.getAlocacaoSgc())
                .entregaSgc(entity.getEntregaSgc())
                .descricaoSgc(entity.getDescricaoSgc())
                .situacaoSgc(entity.getSituacaoSgc())
                .situacaoPassivo2026(entity.getSituacaoPassivo2026())
                .totalAlocacoes(entity.getAlocacoes() != null ? entity.getAlocacoes().size() : 0)
                .valorTotalCalculado(entity.getValorTotalOs())
                .criadoEm(entity.getCriadoEm())
                .build();
    }
}
