import { Projeto, PerfilContratado, OrdemServico, AlocacaoPerfilOs } from '../types/models';

export function normalizePerfil(item: any): PerfilContratado {
  return {
    id: Number(item.id),
    item_contratacao: item.item_contratacao ?? item.itemContratacao ?? '',
    nome_perfil: item.nome_perfil ?? item.nomePerfil ?? '',
    documento_referencia: item.documento_referencia ?? item.documentoReferencia ?? '',
    vigente: item.vigente !== undefined ? Boolean(item.vigente) : true,
    custo_mensal_perfil: Number(item.custo_mensal_perfil ?? item.custoMensalPerfil ?? 0),
    quantidade_mensal_contratada: Number(item.quantidade_mensal_contratada ?? item.quantidadeMensalContratada ?? 1),
    criado_em: item.criado_em ?? item.criadoEm ?? '',
  };
}

export function normalizeProjeto(item: any): Projeto {
  return {
    id: Number(item.id),
    nome_projeto: item.nome_projeto ?? item.nomeProjeto ?? '',
    sigla_projeto: item.sigla_projeto ?? item.siglaProjeto ?? '',
    descricao: item.descricao ?? '',
    nome_secretaria: item.nome_secretaria ?? item.nomeSecretaria ?? '',
    sigla_secretaria: item.sigla_secretaria ?? item.siglaSecretaria ?? '',
    criado_em: item.criado_em ?? item.criadoEm ?? '',
  };
}

export function normalizeOrdemServico(item: any): OrdemServico {
  // Captura resiliente do campo situacao_passivo_2026 suportando:
  // - snake_case exato (situacao_passivo_2026)
  // - camelCase (situacaoPassivo2026)
  // - Jackson SnakeCase sem sublinhado antes de número (situacao_passivo2026)
  // - nomes sem o ano (situacao_passivo, situacaoPassivo, passivo)
  // - nomes abreviados (passivo_2026, passivo2026)
  // - formatos em MAIÚSCULAS de bancos/queries nativas (SITUACAO_PASSIVO_2026, SITUACAO_PASSIVO, etc.)
  const rawPassivo =
    item.situacao_passivo_2026 ??
    item.situacaoPassivo2026 ??
    item.situacao_passivo2026 ??
    item.situacao_passivo ??
    item.situacaoPassivo ??
    item.passivo_2026 ??
    item.passivo2026 ??
    item.passivo ??
    item.SITUACAO_PASSIVO_2026 ??
    item.SITUACAO_PASSIVO ??
    item.SITUACAO_PASSIVO2026 ??
    item.SITUACAOPASSIVO2026;

  const finalPassivo =
    rawPassivo !== null && rawPassivo !== undefined && String(rawPassivo).trim() !== ''
      ? String(rawPassivo).trim()
      : 'A Empenhar';

  return {
    id: Number(item.id),
    projeto_id: Number(item.projeto_id ?? item.projetoId ?? (item.projeto ? item.projeto.id : 0)),
    numero_os: Number(item.numero_os ?? item.numeroOs ?? 0),
    ano_referencia: Number(item.ano_referencia ?? item.anoReferencia ?? 2026),
    alocacao_sgc: Boolean(item.alocacao_sgc ?? item.alocacaoSgc),
    entrega_sgc: Boolean(item.entrega_sgc ?? item.entregaSgc),
    descricao_sgc: Boolean(item.descricao_sgc ?? item.descricaoSgc),
    situacao_sgc: item.situacao_sgc ?? item.situacaoSgc ?? item.SITUACAO_SGC ?? 'Em Execução',
    situacao_passivo_2026: finalPassivo,
    ne_planejamento: item.ne_planejamento ?? item.nePlanejamento ?? item.NE_PLANEJAMENTO ?? null,
    ne_faturamento: item.ne_faturamento ?? item.neFaturamento ?? item.NE_FATURAMENTO ?? null,
    processo_sei_pagamento: item.processo_sei_pagamento ?? item.processoSeiPagamento ?? item.PROCESSO_SEI_PAGAMENTO ?? null,
    criado_em: item.criado_em ?? item.criadoEm ?? item.CRIADO_EM ?? '',
  };
}

export function normalizeAlocacao(item: any, fallbackOsId?: number): AlocacaoPerfilOs {
  return {
    id: Number(item.id),
    ordem_servico_id: Number(item.ordem_servico_id ?? item.ordemServicoId ?? fallbackOsId ?? 0),
    perfil_contratado_id: Number(item.perfil_contratado_id ?? item.perfilContratadoId ?? 0),
    mes_referencia: (item.mes_referencia ?? item.mesReferencia ?? 'JANEIRO').toUpperCase(),
    nome_profissional: item.nome_profissional ?? item.nomeProfissional ?? '',
    percentual_alocacao: Number(item.percentual_alocacao ?? item.percentualAlocacao ?? 0),
    documento_referencia: item.documento_referencia ?? item.documentoReferencia ?? '',
    custo_mensal_perfil: Number(item.custo_mensal_perfil ?? item.custoMensalPerfil ?? 0),
    custo_alocacao: Number(item.custo_alocacao ?? item.custoAlocacao ?? 0),
    criado_em: item.criado_em ?? item.criadoEm ?? '',
  };
}

export const apiService = {
  // 1. Perfis Contratados
  async getPerfis(): Promise<PerfilContratado[]> {
    const res = await fetch('/api/v1/perfis-contratados');
    if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar perfis`);
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizePerfil) : [];
  },

  async createPerfil(data: Omit<PerfilContratado, 'id' | 'criado_em'>): Promise<PerfilContratado> {
    const res = await fetch('/api/v1/perfis-contratados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao cadastrar perfil`);
    return normalizePerfil(await res.json());
  },

  async updatePerfil(id: number, data: Partial<PerfilContratado>): Promise<PerfilContratado> {
    const res = await fetch(`/api/v1/perfis-contratados/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao atualizar perfil`);
    return normalizePerfil(await res.json());
  },

  async toggleVigenciaPerfil(id: number): Promise<PerfilContratado> {
    const res = await fetch(`/api/v1/perfis-contratados/${id}/vigencia`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao alternar vigência`);
    return normalizePerfil(await res.json());
  },

  async deletePerfil(id: number): Promise<void> {
    const res = await fetch(`/api/v1/perfis-contratados/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(errText || `HTTP ${res.status} ao excluir perfil`);
    }
  },

  // 2. Projetos
  async getProjetos(): Promise<Projeto[]> {
    const res = await fetch('/api/v1/projetos');
    if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar projetos`);
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeProjeto) : [];
  },

  async createProjeto(data: Omit<Projeto, 'id' | 'criado_em'>): Promise<Projeto> {
    const res = await fetch('/api/v1/projetos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao cadastrar projeto`);
    return normalizeProjeto(await res.json());
  },

  async updateProjeto(id: number, data: Partial<Projeto>): Promise<Projeto> {
    const res = await fetch(`/api/v1/projetos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao atualizar projeto`);
    return normalizeProjeto(await res.json());
  },

  async deleteProjeto(id: number): Promise<void> {
    const res = await fetch(`/api/v1/projetos/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(errText || `HTTP ${res.status} ao excluir projeto`);
    }
  },

  // 3. Ordens de Serviço & Alocações
  async getOrdensServicoDetalhadas(): Promise<{ ordens: OrdemServico[]; alocacoes: AlocacaoPerfilOs[] }> {
    let rawList: any[] = [];
    try {
      const res = await fetch('/api/v1/ordens-servico/detalhadas');
      if (res.ok) {
        rawList = await res.json();
      } else {
        // Se a rota /detalhadas não existir (ex: HTTP 404 em backend externo), faz fallback para a rota padrão /api/v1/ordens-servico
        console.warn(`[SisGOS] /api/v1/ordens-servico/detalhadas retornou ${res.status}. Tentando /api/v1/ordens-servico...`);
        const fallbackRes = await fetch('/api/v1/ordens-servico');
        if (fallbackRes.ok) {
          rawList = await fallbackRes.json();
        } else {
          throw new Error(`HTTP ${fallbackRes.status} ao carregar ordens de serviço`);
        }
      }
    } catch (err) {
      // Se falhar a conexão direta com /detalhadas, tenta ainda /api/v1/ordens-servico
      const fallbackRes = await fetch('/api/v1/ordens-servico').catch(() => null);
      if (fallbackRes && fallbackRes.ok) {
        rawList = await fallbackRes.json();
      } else {
        throw err;
      }
    }

    if (!Array.isArray(rawList)) return { ordens: [], alocacoes: [] };

    const ordens: OrdemServico[] = [];
    const alocacoes: AlocacaoPerfilOs[] = [];

    for (const item of rawList) {
      ordens.push(normalizeOrdemServico(item));
      if (Array.isArray(item.alocacoes)) {
        for (const aloc of item.alocacoes) {
          alocacoes.push(normalizeAlocacao(aloc, item.id));
        }
      }
    }

    return { ordens, alocacoes };
  },

  async createOrdemServico(data: Omit<OrdemServico, 'id' | 'criado_em'>): Promise<OrdemServico> {
    const res = await fetch('/api/v1/ordens-servico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        projetoId: data.projeto_id,
        numeroOs: data.numero_os,
        anoReferencia: data.ano_referencia,
        alocacaoSgc: data.alocacao_sgc,
        entregaSgc: data.entrega_sgc,
        descricaoSgc: data.descricao_sgc,
        situacaoSgc: data.situacao_sgc,
        situacaoPassivo2026: data.situacao_passivo_2026,
        nePlanejamento: data.ne_planejamento,
        neFaturamento: data.ne_faturamento,
        processoSeiPagamento: data.processo_sei_pagamento,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao cadastrar ordem de serviço`);
    return normalizeOrdemServico(await res.json());
  },

  async updateOrdemServico(id: number, data: Partial<OrdemServico>): Promise<OrdemServico> {
    const res = await fetch(`/api/v1/ordens-servico/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        ...(data.projeto_id !== undefined && { projetoId: data.projeto_id }),
        ...(data.numero_os !== undefined && { numeroOs: data.numero_os }),
        ...(data.ano_referencia !== undefined && { anoReferencia: data.ano_referencia }),
        ...(data.alocacao_sgc !== undefined && { alocacaoSgc: data.alocacao_sgc }),
        ...(data.entrega_sgc !== undefined && { entregaSgc: data.entrega_sgc }),
        ...(data.descricao_sgc !== undefined && { descricaoSgc: data.descricao_sgc }),
        ...(data.situacao_sgc !== undefined && { situacaoSgc: data.situacao_sgc }),
        ...(data.situacao_passivo_2026 !== undefined && { situacaoPassivo2026: data.situacao_passivo_2026 }),
        ...(data.ne_planejamento !== undefined && { nePlanejamento: data.ne_planejamento }),
        ...(data.ne_faturamento !== undefined && { neFaturamento: data.ne_faturamento }),
        ...(data.processo_sei_pagamento !== undefined && { processoSeiPagamento: data.processo_sei_pagamento }),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao atualizar ordem de serviço`);
    return normalizeOrdemServico(await res.json());
  },

  async deleteOrdemServico(id: number): Promise<void> {
    const res = await fetch(`/api/v1/ordens-servico/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao excluir ordem de serviço`);
  },

  async getSituacoesSgc(): Promise<string[]> {
    const res = await fetch('/api/v1/ordens-servico/situacoes-sgc');
    if (!res.ok) throw new Error(`HTTP ${res.status} ao obter situações SGC`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getSituacoesPassivo(): Promise<string[]> {
    const res = await fetch('/api/v1/ordens-servico/situacoes-passivo');
    if (!res.ok) throw new Error(`HTTP ${res.status} ao obter situações Passivo 2026`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  // 4. Alocações (N:N)
  async createAlocacao(
    osId: number,
    data: {
      perfil_contratado_id: number;
      mes_referencia?: string;
      nome_profissional: string;
      percentual_alocacao: number;
    }
  ): Promise<AlocacaoPerfilOs> {
    const res = await fetch(`/api/v1/ordens-servico/${osId}/alocacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        perfilContratadoId: data.perfil_contratado_id,
        perfil_contratado_id: data.perfil_contratado_id,
        mesReferencia: data.mes_referencia,
        mes_referencia: data.mes_referencia,
        nomeProfissional: data.nome_profissional,
        nome_profissional: data.nome_profissional,
        percentualAlocacao: data.percentual_alocacao,
        percentual_alocacao: data.percentual_alocacao,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao alocar perfil`);
    const resp = await res.json();
    const alocData = resp.alocacao ? resp.alocacao : resp;
    return normalizeAlocacao(alocData, osId);
  },

  async updateAlocacao(
    osId: number,
    alocacaoId: number,
    data: {
      perfil_contratado_id: number;
      mes_referencia?: string;
      nome_profissional: string;
      percentual_alocacao: number;
    }
  ): Promise<AlocacaoPerfilOs> {
    const res = await fetch(`/api/v1/ordens-servico/${osId}/alocacoes/${alocacaoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        perfilContratadoId: data.perfil_contratado_id,
        perfil_contratado_id: data.perfil_contratado_id,
        mesReferencia: data.mes_referencia,
        mes_referencia: data.mes_referencia,
        nomeProfissional: data.nome_profissional,
        nome_profissional: data.nome_profissional,
        percentualAlocacao: data.percentual_alocacao,
        percentual_alocacao: data.percentual_alocacao,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao atualizar alocação`);
    const resp = await res.json();
    return normalizeAlocacao(resp, osId);
  },

  async deleteAlocacao(osId: number, alocacaoId: number): Promise<void> {
    // Tenta primeiro a rota aninhada do Spring Boot /api/v1/ordens-servico/{id}/alocacoes/{alocId}
    let res = await fetch(`/api/v1/ordens-servico/${osId}/alocacoes/${alocacaoId}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status === 404) {
      // Fallback para rota simples /api/v1/ordens-servico/alocacoes/{alocId} se necessário
      res = await fetch(`/api/v1/ordens-servico/alocacoes/${alocacaoId}`, {
        method: 'DELETE',
      });
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ao remover alocação`);
  },

  // 5. Administração do Banco
  async adminClearData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/v1/admin/clear-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao limpar banco de dados`);
    return await res.json();
  },

  async adminResetSeed(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/v1/admin/reset-seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao restaurar semente do banco`);
    return await res.json();
  },
};
