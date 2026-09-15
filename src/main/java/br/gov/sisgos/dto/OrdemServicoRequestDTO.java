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
public class OrdemServicoRequestDTO {

    @NotNull(message = "O ID do projeto é obrigatório.")
    private Long projetoId;

    @NotNull(message = "O número da Ordem de Serviço é obrigatório.")
    @Min(value = 1, message = "O número da OS deve ser maior que zero.")
    private Integer numeroOs;

    @NotNull(message = "O ano de referência é obrigatório.")
    @Min(value = 2000, message = "Ano mínimo permitido é 2000.")
    @Max(value = 2100, message = "Ano máximo permitido é 2100.")
    private Integer anoReferencia;

    private Boolean alocacaoSgc = false;
    private Boolean entregaSgc = false;
    private Boolean descricaoSgc = false;
    private String situacaoSgc;
    private String situacaoPassivo2026;
}
