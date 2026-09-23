package br.gov.sisgos.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

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
    @DecimalMin(value = "0.00", message = "Percentual mínimo é 0%.")
    @DecimalMax(value = "100.00", message = "Percentual máximo é 100%.")
    @Digits(integer = 3, fraction = 2, message = "O percentual de alocação deve ter no máximo 2 casas decimais.")
    private BigDecimal percentualAlocacao;

    /**
     * Opcional: ID da nova Ordem de Serviço caso deseje alterar a OS vinculada à alocação
     */
    private Long novaOrdemServicoId;
}
