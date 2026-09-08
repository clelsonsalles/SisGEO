package br.gov.sisgos.repository;

import br.gov.sisgos.domain.entity.PerfilContratado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerfilContratadoRepository extends JpaRepository<PerfilContratado, Long> {
    List<PerfilContratado> findByVigenteTrue();
}
