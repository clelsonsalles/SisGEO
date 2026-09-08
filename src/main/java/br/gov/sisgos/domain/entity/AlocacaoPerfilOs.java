package br.gov.sisgos.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;

@Entity
@Table(name = "alocacoes_perfil_os")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlocacaoPerfilOs {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ordem_servico_id", nullable = false)
    private OrdemServico ordemServico;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_contratado_id", nullable = false)
    private PerfilContratado perfilContratado;

    @Column(name = "nome_profissional", length = 200, nullable = false)
    private String nomeProfissional;

    @Column(name = "percentual_alocacao", nullable = false)
    private Integer percentualAlocacao;

    @Column(name = "documento_referencia", length = 255, nullable = false)
    private String documentoReferencia;

    @Column(name = "custo_mensal_perfil", precision = 12, scale = 2, nullable = false)
    private BigDecimal custoMensalPerfil;

    @Column(name = "custo_alocacao", precision = 12, scale = 2, nullable = false)
    private BigDecimal custoAlocacao;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @PrePersist
    public void prePersist() {
        this.criadoEm = OffsetDateTime.now();
    }

    public void aplicarRegraDeNegocio(PerfilContratado perfil) {
        this.perfilContratado = perfil;
        this.documentoReferencia = perfil.getDocumentoReferencia();
        this.custoMensalPerfil = perfil.getCustoMensalPerfil();

        if (this.percentualAlocacao != null && this.custoMensalPerfil != null) {
            BigDecimal perc = BigDecimal.valueOf(this.percentualAlocacao);
            this.custoAlocacao = perc.multiply(this.custoMensalPerfil)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            this.custoAlocacao = BigDecimal.ZERO;
        }
    }
}
