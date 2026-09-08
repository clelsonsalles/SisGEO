package br.gov.sisgos.repository;

import br.gov.sisgos.domain.entity.Projeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjetoRepository extends JpaRepository<Projeto, Long> {
    Optional<Projeto> findBySiglaProjeto(String siglaProjeto);
}
