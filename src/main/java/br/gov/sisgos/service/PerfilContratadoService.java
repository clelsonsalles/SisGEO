package br.gov.sisgos.service;

import br.gov.sisgos.domain.entity.PerfilContratado;
import br.gov.sisgos.dto.PerfilContratadoDTO;
import br.gov.sisgos.repository.AlocacaoPerfilOsRepository;
import br.gov.sisgos.repository.PerfilContratadoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PerfilContratadoService {

    private final PerfilContratadoRepository perfilRepository;
    private final AlocacaoPerfilOsRepository alocacaoRepository;

    @Transactional(readOnly = true)
    public List<PerfilContratadoDTO> listarTodos(Boolean apenasVigentes) {
        List<PerfilContratado> perfis;
        if (Boolean.TRUE.equals(apenasVigentes)) {
            perfis = perfilRepository.findByVigenteTrue();
        } else {
            perfis = perfilRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        }
        return perfis.stream().map(PerfilContratadoDTO::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public PerfilContratadoDTO buscarPorId(Long id) {
        PerfilContratado perfil = perfilRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Perfil contratado não encontrado com ID: " + id));
        return PerfilContratadoDTO.fromEntity(perfil);
    }

    @Transactional
    public PerfilContratadoDTO criar(PerfilContratadoDTO dto) {
        PerfilContratado entity = dto.toEntity();
        PerfilContratado salvo = perfilRepository.save(entity);
        return PerfilContratadoDTO.fromEntity(salvo);
    }

    @Transactional
    public PerfilContratadoDTO atualizar(Long id, PerfilContratadoDTO dto) {
        PerfilContratado entity = perfilRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Perfil contratado não encontrado com ID: " + id));

        entity.setItemContratacao(dto.getItemContratacao().trim());
        entity.setNomePerfil(dto.getNomePerfil().trim());
        entity.setDocumentoReferencia(dto.getDocumentoReferencia() != null ? dto.getDocumentoReferencia().trim() : "");
        if (dto.getVigente() != null) {
            entity.setVigente(dto.getVigente());
        }
        entity.setCustoMensalPerfil(dto.getCustoMensalPerfil());
        entity.setQuantidadeMensalContratada(dto.getQuantidadeMensalContratada());

        return PerfilContratadoDTO.fromEntity(entity);
    }

    @Transactional
    public PerfilContratadoDTO alternarVigencia(Long id) {
        PerfilContratado entity = perfilRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Perfil contratado não encontrado com ID: " + id));
        entity.setVigente(!Boolean.TRUE.equals(entity.getVigente()));
        return PerfilContratadoDTO.fromEntity(entity);
    }

    @Transactional
    public void excluir(Long id) {
        PerfilContratado entity = perfilRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Perfil contratado não encontrado com ID: " + id));

        // Verifica se há alocações vinculadas
        boolean emUso = alocacaoRepository.findAll().stream()
                .anyMatch(a -> a.getPerfilContratado() != null && a.getPerfilContratado().getId().equals(id));
        if (emUso) {
            throw new IllegalStateException("Não é possível excluir o perfil pois existem alocações vinculadas a ele.");
        }

        perfilRepository.delete(entity);
    }
}
