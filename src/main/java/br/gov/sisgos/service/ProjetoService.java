package br.gov.sisgos.service;

import br.gov.sisgos.domain.entity.Projeto;
import br.gov.sisgos.dto.ProjetoDTO;
import br.gov.sisgos.repository.OrdemServicoRepository;
import br.gov.sisgos.repository.ProjetoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjetoService {

    private final ProjetoRepository projetoRepository;
    private final OrdemServicoRepository ordemServicoRepository;

    @Transactional(readOnly = true)
    public List<ProjetoDTO> listarTodos() {
        return projetoRepository.findAll(Sort.by(Sort.Direction.ASC, "id"))
                .stream()
                .map(ProjetoDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjetoDTO buscarPorId(Long id) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com ID: " + id));
        return ProjetoDTO.fromEntity(projeto);
    }

    @Transactional
    public ProjetoDTO criar(ProjetoDTO dto) {
        Projeto entity = dto.toEntity();
        Projeto salvo = projetoRepository.save(entity);
        return ProjetoDTO.fromEntity(salvo);
    }

    @Transactional
    public ProjetoDTO atualizar(Long id, ProjetoDTO dto) {
        Projeto entity = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com ID: " + id));

        entity.setNomeProjeto(dto.getNomeProjeto().trim());
        entity.setSiglaProjeto(dto.getSiglaProjeto().trim().toUpperCase());
        entity.setDescricao(dto.getDescricao() != null ? dto.getDescricao().trim() : "");
        entity.setNomeSecretaria(dto.getNomeSecretaria().trim());
        entity.setSiglaSecretaria(dto.getSiglaSecretaria().trim().toUpperCase());

        return ProjetoDTO.fromEntity(entity);
    }

    @Transactional
    public void excluir(Long id) {
        Projeto entity = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com ID: " + id));

        // Verifica se há Ordens de Serviço vinculadas ao projeto
        boolean emUso = ordemServicoRepository.findAll().stream()
                .anyMatch(os -> os.getProjeto() != null && os.getProjeto().getId().equals(id));
        if (emUso) {
            throw new IllegalStateException("Não é possível excluir o projeto pois existem Ordens de Serviço associadas a ele.");
        }

        projetoRepository.delete(entity);
    }
}
