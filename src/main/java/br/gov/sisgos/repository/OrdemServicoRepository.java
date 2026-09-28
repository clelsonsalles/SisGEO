package br.gov.sisgos.repository;

import br.gov.sisgos.domain.entity.OrdemServico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {

    @Query("SELECT DISTINCT os FROM OrdemServico os LEFT JOIN FETCH os.projeto LEFT JOIN FETCH os.alocacoes a LEFT JOIN FETCH a.perfilContratado")
    List<OrdemServico> findAllWithDetails();

    @Query("SELECT os FROM OrdemServico os LEFT JOIN FETCH os.projeto LEFT JOIN FETCH os.alocacoes a LEFT JOIN FETCH a.perfilContratado WHERE os.id = :id")
    Optional<OrdemServico> findByIdWithDetails(Long id);

    List<OrdemServico> findByProjetoId(Long projetoId);

    @Query("SELECT DISTINCT os.situacaoSgc FROM OrdemServico os WHERE os.situacaoSgc IS NOT NULL AND TRIM(os.situacaoSgc) <> '' ORDER BY os.situacaoSgc ASC")
    List<String> findDistinctSituacaoSgc();

    @Query("SELECT DISTINCT os.situacaoPassivo2026 FROM OrdemServico os WHERE os.situacaoPassivo2026 IS NOT NULL AND TRIM(os.situacaoPassivo2026) <> '' ORDER BY os.situacaoPassivo2026 ASC")
    List<String> findDistinctSituacaoPassivo2026();
}
