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
    private Integer anoReferencia;

    private Boolean alocacaoSgc = false;
    private Boolean entregaSgc = false;
    private Boolean descricaoSgc = false;
    private String situacaoSgc;
    private String situacaoPassivo2026;
}
