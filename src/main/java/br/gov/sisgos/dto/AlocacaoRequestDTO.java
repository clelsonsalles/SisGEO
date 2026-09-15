package br.gov.sisgos.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlocacaoRequestDTO {

    @NotNull(message = "O ID do perfil contratado é obrigatório.")
    private Long perfilContratadoId;

    @NotBlank(message = "O mês de referência é obrigatório.")
    private String mesReferencia;

    @NotBlank(message = "O nome do profissional é obrigatório.")
    private String nomeProfissional;

    @NotNull(message = "O percentual de alocação é obrigatório.")
    @Min(value = 0, message = "Percentual mínimo é 0%.")
    @Max(value = 100, message = "Percentual máximo é 100%.")
    private Integer percentualAlocacao;
}
