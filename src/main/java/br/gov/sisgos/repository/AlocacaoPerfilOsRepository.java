package br.gov.sisgos.repository;

import br.gov.sisgos.domain.entity.AlocacaoPerfilOs;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlocacaoPerfilOsRepository extends JpaRepository<AlocacaoPerfilOs, Long> {

    List<AlocacaoPerfilOs> findByOrdemServicoId(Long ordemServicoId);

    @Query("SELECT DISTINCT a.nomeProfissional FROM AlocacaoPerfilOs a ORDER BY a.nomeProfissional ASC")
    List<String> findDistinctNomeProfissional();
}
