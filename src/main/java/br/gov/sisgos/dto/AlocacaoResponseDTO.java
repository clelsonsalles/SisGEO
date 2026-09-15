package br.gov.sisgos.dto;

import br.gov.sisgos.domain.entity.AlocacaoPerfilOs;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlocacaoResponseDTO {

    private Long id;
    private Long ordemServicoId;
    private Long perfilContratadoId;
    private String nomePerfil;
    private String itemContratacao;
    private String mesReferencia;
    private String nomeProfissional;
    private Integer percentualAlocacao;
    private String documentoReferencia;
    private BigDecimal custoMensalPerfil;
    private BigDecimal custoAlocacao;
    private OffsetDateTime criadoEm;

    public static AlocacaoResponseDTO fromEntity(AlocacaoPerfilOs entity) {
        if (entity == null) return null;
        return AlocacaoResponseDTO.builder()
                .id(entity.getId())
                .ordemServicoId(entity.getOrdemServico() != null ? entity.getOrdemServico().getId() : null)
                .perfilContratadoId(entity.getPerfilContratado() != null ? entity.getPerfilContratado().getId() : null)
                .nomePerfil(entity.getPerfilContratado() != null ? entity.getPerfilContratado().getNomePerfil() : null)
                .itemContratacao(entity.getPerfilContratado() != null ? entity.getPerfilContratado().getItemContratacao() : null)
                .mesReferencia(entity.getMesReferencia())
                .nomeProfissional(entity.getNomeProfissional())
                .percentualAlocacao(entity.getPercentualAlocacao())
                .documentoReferencia(entity.getDocumentoReferencia())
                .custoMensalPerfil(entity.getCustoMensalPerfil())
                .custoAlocacao(entity.getCustoAlocacao())
                .criadoEm(entity.getCriadoEm())
                .build();
    }
}
