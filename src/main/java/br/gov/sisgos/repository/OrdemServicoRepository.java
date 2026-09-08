package br.gov.sisgos.repository;

import br.gov.sisgos.domain.entity.OrdemServico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {

    @Query("SELECT DISTINCT os FROM OrdemServico os JOIN FETCH os.projeto LEFT JOIN FETCH os.alocacoes a LEFT JOIN FETCH a.perfilContratado")
    List<OrdemServico> findAllWithDetails();

    @Query("SELECT os FROM OrdemServico os JOIN FETCH os.projeto LEFT JOIN FETCH os.alocacoes a LEFT JOIN FETCH a.perfilContratado WHERE os.id = :id")
    Optional<OrdemServico> findByIdWithDetails(Long id);

    List<OrdemServico> findByProjetoId(Long projetoId);
}
