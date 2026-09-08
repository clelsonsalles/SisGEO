package br.gov.sisgos.service;

import br.gov.sisgos.domain.entity.OrdemServico;
import br.gov.sisgos.domain.entity.Projeto;
import br.gov.sisgos.dto.OrdemServicoCompletaResponseDTO;
import br.gov.sisgos.dto.OrdemServicoRequestDTO;
import br.gov.sisgos.dto.OrdemServicoResponseDTO;
import br.gov.sisgos.repository.OrdemServicoRepository;
import br.gov.sisgos.repository.ProjetoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrdemServicoService {

    private final OrdemServicoRepository ordemServicoRepository;
    private final ProjetoRepository projetoRepository;

    @Transactional(readOnly = true)
    public List<OrdemServicoResponseDTO> listarTodas() {
        return ordemServicoRepository.findAllWithDetails()
                .stream()
                .map(OrdemServicoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrdemServicoCompletaResponseDTO> listarTodasDetalhadas() {
        return ordemServicoRepository.findAllWithDetails()
                .stream()
                .map(OrdemServicoCompletaResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrdemServicoResponseDTO buscarPorId(Long id) {
        return ordemServicoRepository.findByIdWithDetails(id)
                .map(OrdemServicoResponseDTO::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Ordem de Serviço não encontrada com ID: " + id));
    }

    @Transactional
    public OrdemServicoResponseDTO criar(OrdemServicoRequestDTO dto) {
        Projeto projeto = projetoRepository.findById(dto.getProjetoId())
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com ID: " + dto.getProjetoId()));

        OrdemServico os = OrdemServico.builder()
                .projeto(projeto)
                .numeroOs(dto.getNumeroOs())
                .anoReferencia(dto.getAnoReferencia())
                .mesReferencia(dto.getMesReferencia().toUpperCase().trim())
                .alocacaoSgc(Boolean.TRUE.equals(dto.getAlocacaoSgc()))
                .entregaSgc(Boolean.TRUE.equals(dto.getEntregaSgc()))
                .descricaoSgc(Boolean.TRUE.equals(dto.getDescricaoSgc()))
                .situacaoSgc(dto.getSituacaoSgc() != null ? dto.getSituacaoSgc() : "Em Execução")
                .situacaoPassivo2026(dto.getSituacaoPassivo2026() != null ? dto.getSituacaoPassivo2026() : "A Empenhar")
                .build();

        OrdemServico salva = ordemServicoRepository.save(os);
        return OrdemServicoResponseDTO.fromEntity(salva);
    }

    @Transactional
    public OrdemServicoResponseDTO atualizar(Long id, OrdemServicoRequestDTO dto) {
        OrdemServico os = ordemServicoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ordem de Serviço não encontrada com ID: " + id));

        if (!os.getProjeto().getId().equals(dto.getProjetoId())) {
            Projeto novoProj = projetoRepository.findById(dto.getProjetoId())
                    .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com ID: " + dto.getProjetoId()));
            os.setProjeto(novoProj);
        }

        os.setNumeroOs(dto.getNumeroOs());
        os.setAnoReferencia(dto.getAnoReferencia());
        os.setMesReferencia(dto.getMesReferencia().toUpperCase().trim());
        os.setAlocacaoSgc(Boolean.TRUE.equals(dto.getAlocacaoSgc()));
        os.setEntregaSgc(Boolean.TRUE.equals(dto.getEntregaSgc()));
        os.setDescricaoSgc(Boolean.TRUE.equals(dto.getDescricaoSgc()));
        os.setSituacaoSgc(dto.getSituacaoSgc());
        os.setSituacaoPassivo2026(dto.getSituacaoPassivo2026());

        return OrdemServicoResponseDTO.fromEntity(os);
    }

    @Transactional
    public void excluir(Long id) {
        if (!ordemServicoRepository.existsById(id)) {
            throw new EntityNotFoundException("Ordem de Serviço não encontrada com ID: " + id);
        }
        ordemServicoRepository.deleteById(id);
    }
}
