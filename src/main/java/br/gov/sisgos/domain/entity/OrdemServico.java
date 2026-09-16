package br.gov.sisgos.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordens_servico")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    @Column(name = "numero_os", nullable = false)
    private Integer numeroOs;

    @Column(name = "ano_referencia", nullable = false)
    private Integer anoReferencia;

    @Column(name = "alocacao_sgc", nullable = false)
    @Builder.Default
    private Boolean alocacaoSgc = false;

    @Column(name = "entrega_sgc", nullable = false)
    @Builder.Default
    private Boolean entregaSgc = false;

    @Column(name = "descricao_sgc", nullable = false)
    @Builder.Default
    private Boolean descricaoSgc = false;

    @Column(name = "situacao_sgc", length = 100)
    private String situacaoSgc;

    @Column(name = "situacao_passivo_2026", length = 100)
    private String situacaoPassivo2026;

    @Column(name = "ne_planejamento", length = 60)
    private String nePlanejamento;

    @Column(name = "ne_faturamento", length = 60)
    private String neFaturamento;

    @Column(name = "processo_sei_pagamento", length = 60)
    private String processoSeiPagamento;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "atualizado_em")
    private OffsetDateTime atualizadoEm;

    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AlocacaoPerfilOs> alocacoes = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.criadoEm = OffsetDateTime.now();
        this.atualizadoEm = OffsetDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.atualizadoEm = OffsetDateTime.now();
    }

    public BigDecimal getValorTotalOs() {
        if (this.alocacoes == null || this.alocacoes.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return this.alocacoes.stream()
                .map(AlocacaoPerfilOs::getCustoAlocacao)
                .filter(c -> c != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
