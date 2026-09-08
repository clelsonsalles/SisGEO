package br.gov.sisgos.service;

import br.gov.sisgos.domain.entity.AlocacaoPerfilOs;
import br.gov.sisgos.domain.entity.OrdemServico;
import br.gov.sisgos.domain.entity.PerfilContratado;
import br.gov.sisgos.dto.AlocacaoRequestDTO;
import br.gov.sisgos.dto.AlocacaoResponseDTO;
import br.gov.sisgos.repository.AlocacaoPerfilOsRepository;
import br.gov.sisgos.repository.OrdemServicoRepository;
import br.gov.sisgos.repository.PerfilContratadoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlocacaoService {

    private final AlocacaoPerfilOsRepository alocacaoRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final PerfilContratadoRepository perfilRepository;

    @Transactional(readOnly = true)
    public List<AlocacaoResponseDTO> listarPorOrdemServico(Long osId) {
        return alocacaoRepository.findByOrdemServicoId(osId)
                .stream()
                .map(AlocacaoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> obterNomesProfissionaisDistintos() {
        return alocacaoRepository.findDistinctNomeProfissional();
    }

    @Transactional
    public AlocacaoResponseDTO alocarPerfilNaOs(Long osId, AlocacaoRequestDTO dto) {
        OrdemServico os = ordemServicoRepository.findById(osId)
                .orElseThrow(() -> new EntityNotFoundException("Ordem de Serviço não encontrada com ID: " + osId));

        PerfilContratado perfil = perfilRepository.findById(dto.getPerfilContratadoId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil contratado não encontrado com ID: " + dto.getPerfilContratadoId()));

        AlocacaoPerfilOs alocacao = new AlocacaoPerfilOs();
        alocacao.setOrdemServico(os);
        alocacao.setNomeProfissional(dto.getNomeProfissional().trim());
        alocacao.setPercentualAlocacao(dto.getPercentualAlocacao());

        // Aplicação da regra de negócio de snapshot e cálculo proporcional
        alocacao.aplicarRegraDeNegocio(perfil);

        AlocacaoPerfilOs salva = alocacaoRepository.save(alocacao);
        return AlocacaoResponseDTO.fromEntity(salva);
    }

    @Transactional
    public void removerAlocacao(Long alocacaoId) {
        if (!alocacaoRepository.existsById(alocacaoId)) {
            throw new EntityNotFoundException("Alocação não encontrada com ID: " + alocacaoId);
        }
        alocacaoRepository.deleteById(alocacaoId);
    }
}
