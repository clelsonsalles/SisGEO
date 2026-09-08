package br.gov.sisgos.dto;

import br.gov.sisgos.domain.entity.OrdemServico;
import br.gov.sisgos.domain.entity.Projeto;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdemServicoCompletaResponseDTO {

    private Long id;
    private Integer numeroOs;
    private Integer anoReferencia;
    private String mesReferencia;
    private Boolean alocacaoSgc;
    private Boolean entregaSgc;
    private Boolean descricaoSgc;
    private String situacaoSgc;
    private String situacaoPassivo2026;
    private OffsetDateTime criadoEm;
    private Long projetoId;
    private ProjetoDTO projeto;
    private Integer totalAlocacoes;
    private BigDecimal valorTotalCalculado;
    @Builder.Default
    private List<AlocacaoResponseDTO> alocacoes = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjetoDTO {
        private Long id;
        private String nomeProjeto;
        private String siglaProjeto;
        private String descricao;
        private String nomeSecretaria;
        private String siglaSecretaria;
        private OffsetDateTime criadoEm;

        public static ProjetoDTO fromEntity(Projeto entity) {
            if (entity == null) return null;
            return ProjetoDTO.builder()
                    .id(entity.getId())
                    .nomeProjeto(entity.getNomeProjeto())
                    .siglaProjeto(entity.getSiglaProjeto())
                    .descricao(entity.getDescricao())
                    .nomeSecretaria(entity.getNomeSecretaria())
                    .siglaSecretaria(entity.getSiglaSecretaria())
                    .criadoEm(entity.getCriadoEm())
                    .build();
        }
    }

    public static OrdemServicoCompletaResponseDTO fromEntity(OrdemServico entity) {
        if (entity == null) return null;
        List<AlocacaoResponseDTO> alocs = entity.getAlocacoes() != null
                ? entity.getAlocacoes().stream().map(AlocacaoResponseDTO::fromEntity).toList()
                : new ArrayList<>();

        return OrdemServicoCompletaResponseDTO.builder()
                .id(entity.getId())
                .numeroOs(entity.getNumeroOs())
                .anoReferencia(entity.getAnoReferencia())
                .mesReferencia(entity.getMesReferencia())
                .alocacaoSgc(entity.getAlocacaoSgc())
                .entregaSgc(entity.getEntregaSgc())
                .descricaoSgc(entity.getDescricaoSgc())
                .situacaoSgc(entity.getSituacaoSgc())
                .situacaoPassivo2026(entity.getSituacaoPassivo2026())
                .criadoEm(entity.getCriadoEm())
                .projetoId(entity.getProjeto() != null ? entity.getProjeto().getId() : null)
                .projeto(ProjetoDTO.fromEntity(entity.getProjeto()))
                .totalAlocacoes(alocs.size())
                .valorTotalCalculado(entity.getValorTotalOs())
                .alocacoes(alocs)
                .build();
    }
}
