package br.gov.sisgos.dto;

import br.gov.sisgos.domain.entity.Projeto;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjetoDTO {

    private Long id;

    @NotBlank(message = "O nome do projeto é obrigatório.")
    @JsonProperty("nome_projeto")
    @JsonAlias({"nomeProjeto", "nome_projeto"})
    private String nomeProjeto;

    @NotBlank(message = "A sigla do projeto é obrigatória.")
    @JsonProperty("sigla_projeto")
    @JsonAlias({"siglaProjeto", "sigla_projeto"})
    private String siglaProjeto;

    @JsonProperty("descricao")
    private String descricao;

    @NotBlank(message = "O nome da secretaria é obrigatório.")
    @JsonProperty("nome_secretaria")
    @JsonAlias({"nomeSecretaria", "nome_secretaria"})
    private String nomeSecretaria;

    @NotBlank(message = "A sigla da secretaria é obrigatória.")
    @JsonProperty("sigla_secretaria")
    @JsonAlias({"siglaSecretaria", "sigla_secretaria"})
    private String siglaSecretaria;

    @JsonProperty("criado_em")
    @JsonAlias({"criadoEm", "criado_em"})
    private OffsetDateTime criadoEm;

    @JsonProperty("atualizado_em")
    @JsonAlias({"atualizadoEm", "atualizado_em"})
    private OffsetDateTime atualizadoEm;

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
                .atualizadoEm(entity.getAtualizadoEm())
                .build();
    }

    public Projeto toEntity() {
        return Projeto.builder()
                .id(this.id)
                .nomeProjeto(this.nomeProjeto != null ? this.nomeProjeto.trim() : null)
                .siglaProjeto(this.siglaProjeto != null ? this.siglaProjeto.trim().toUpperCase() : null)
                .descricao(this.descricao != null ? this.descricao.trim() : "")
                .nomeSecretaria(this.nomeSecretaria != null ? this.nomeSecretaria.trim() : null)
                .siglaSecretaria(this.siglaSecretaria != null ? this.siglaSecretaria.trim().toUpperCase() : null)
                .build();
    }
}
