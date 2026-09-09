package br.gov.sisgos.dto;

import br.gov.sisgos.domain.entity.PerfilContratado;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerfilContratadoDTO {

    private Long id;

    @NotBlank(message = "O item de contratação é obrigatório.")
    @JsonProperty("item_contratacao")
    @JsonAlias({"itemContratacao", "item_contratacao"})
    private String itemContratacao;

    @NotBlank(message = "O nome do perfil é obrigatório.")
    @JsonProperty("nome_perfil")
    @JsonAlias({"nomePerfil", "nome_perfil"})
    private String nomePerfil;

    @NotBlank(message = "O documento de referência é obrigatório.")
    @JsonProperty("documento_referencia")
    @JsonAlias({"documentoReferencia", "documento_referencia"})
    private String documentoReferencia;

    @JsonProperty("vigente")
    @Builder.Default
    private Boolean vigente = true;

    @NotNull(message = "O custo mensal do perfil é obrigatório.")
    @DecimalMin(value = "0.00", message = "O custo mensal não pode ser negativo.")
    @JsonProperty("custo_mensal_perfil")
    @JsonAlias({"custoMensalPerfil", "custo_mensal_perfil"})
    private BigDecimal custoMensalPerfil;

    @NotNull(message = "A quantidade mensal contratada é obrigatória.")
    @Min(value = 0, message = "A quantidade contratada não pode ser negativa.")
    @JsonProperty("quantidade_mensal_contratada")
    @JsonAlias({"quantidadeMensalContratada", "quantidade_mensal_contratada"})
    private Integer quantidadeMensalContratada;

    @JsonProperty("criado_em")
    @JsonAlias({"criadoEm", "criado_em"})
    private OffsetDateTime criadoEm;

    @JsonProperty("atualizado_em")
    @JsonAlias({"atualizadoEm", "atualizado_em"})
    private OffsetDateTime atualizadoEm;

    public static PerfilContratadoDTO fromEntity(PerfilContratado entity) {
        if (entity == null) return null;
        return PerfilContratadoDTO.builder()
                .id(entity.getId())
                .itemContratacao(entity.getItemContratacao())
                .nomePerfil(entity.getNomePerfil())
                .documentoReferencia(entity.getDocumentoReferencia())
                .vigente(entity.getVigente())
                .custoMensalPerfil(entity.getCustoMensalPerfil())
                .quantidadeMensalContratada(entity.getQuantidadeMensalContratada())
                .criadoEm(entity.getCriadoEm())
                .atualizadoEm(entity.getAtualizadoEm())
                .build();
    }

    public PerfilContratado toEntity() {
        return PerfilContratado.builder()
                .id(this.id)
                .itemContratacao(this.itemContratacao != null ? this.itemContratacao.trim() : null)
                .nomePerfil(this.nomePerfil != null ? this.nomePerfil.trim() : null)
                .documentoReferencia(this.documentoReferencia != null ? this.documentoReferencia.trim() : "")
                .vigente(this.vigente != null ? this.vigente : true)
                .custoMensalPerfil(this.custoMensalPerfil)
                .quantidadeMensalContratada(this.quantidadeMensalContratada != null ? this.quantidadeMensalContratada : 1)
                .build();
    }
}
