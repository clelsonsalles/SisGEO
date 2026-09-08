package br.gov.sisgos.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projetos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Projeto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome_projeto", length = 200, nullable = false)
    private String nomeProjeto;

    @Column(name = "sigla_projeto", length = 50, nullable = false, unique = true)
    private String siglaProjeto;

    @Column(name = "descricao", length = 500)
    private String descricao;

    @Column(name = "nome_secretaria", length = 200, nullable = false)
    private String nomeSecretaria;

    @Column(name = "sigla_secretaria", length = 50, nullable = false)
    private String siglaSecretaria;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "atualizado_em")
    private OffsetDateTime atualizadoEm;

    @OneToMany(mappedBy = "projeto")
    @Builder.Default
    private List<OrdemServico> ordensServico = new ArrayList<>();

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
