package br.gov.sisgos.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "perfis_contratados")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerfilContratado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_contratacao", length = 100, nullable = false)
    private String itemContratacao;

    @Column(name = "nome_perfil", length = 150, nullable = false)
    private String nomePerfil;

    @Column(name = "documento_referencia", length = 255, nullable = false)
    private String documentoReferencia;

    @Column(name = "vigente", nullable = false)
    private Boolean vigente = true;

    @Column(name = "custo_mensal_perfil", precision = 12, scale = 2, nullable = false)
    private BigDecimal custoMensalPerfil;

    @Column(name = "quantidade_mensal_contratada", nullable = false)
    private Integer quantidadeMensalContratada;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "atualizado_em")
    private OffsetDateTime atualizadoEm;

    @PrePersist
    public void prePersist() {
        this.criadoEm = OffsetDateTime.now();
        this.atualizadoEm = OffsetDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.atualizadoEm = OffsetDateTime.now();
    }
}
