import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_PROJETOS,
  INITIAL_PERFIS,
  INITIAL_ORDENS_SERVICO,
  INITIAL_ALOCACOES,
} from './src/data/initialData';
import { Projeto, PerfilContratado, OrdemServico, AlocacaoPerfilOs } from './src/types/models';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data store initialized with seed
let projetos: Projeto[] = JSON.parse(JSON.stringify(INITIAL_PROJETOS));
let perfis: PerfilContratado[] = JSON.parse(JSON.stringify(INITIAL_PERFIS));
let ordensServico: OrdemServico[] = JSON.parse(JSON.stringify(INITIAL_ORDENS_SERVICO));
let alocacoes: AlocacaoPerfilOs[] = JSON.parse(JSON.stringify(INITIAL_ALOCACOES));

let nextOsId = 100;
let nextAlocacaoId = 100;
let nextProjetoId = 10;
let nextPerfilId = 10;

// Helper: Calculate OS Total Value
function getOsTotal(osId: number): number {
  return alocacoes
    .filter((a) => a.ordem_servico_id === osId)
    .reduce((sum, a) => sum + (a.custo_alocacao || 0), 0);
}

/* =========================================================================
   RESTful API Endpoints (Base: /api/v1)
========================================================================= */

// 1. Health & Service Info
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'SisGOS RESTful API Service',
    framework: 'Express + Vite Node.js / Spring Boot Contract Specification',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      ordens_servico: '/api/v1/ordens-servico',
      ordens_servico_detalhadas: '/api/v1/ordens-servico/detalhadas',
      projetos: '/api/v1/projetos',
      perfis_contratados: '/api/v1/perfis-contratados',
      dashboard: '/api/v1/dashboard/resumo',
      profissionais: '/api/v1/ordens-servico/profissionais/nomes-distintos',
    },
  });
});

// 2. Ordens de Serviço
app.get('/api/v1/ordens-servico', (req, res) => {
  const result = ordensServico.map((os) => {
    const proj = projetos.find((p) => p.id === os.projeto_id);
    const osAlocacoes = alocacoes.filter((a) => a.ordem_servico_id === os.id);
    const valorTotal = osAlocacoes.reduce((sum, a) => sum + (a.custo_alocacao || 0), 0);

    return {
      ...os,
      projeto: proj ? { id: proj.id, nome: proj.nome_projeto, sigla: proj.sigla_projeto, secretaria: proj.sigla_secretaria } : null,
      total_alocacoes: osAlocacoes.length,
      valor_total_calculado: Number(valorTotal.toFixed(2)),
    };
  });

  res.json(result);
});

app.post('/api/v1/ordens-servico', (req, res) => {
  const {
    projeto_id,
    numero_os,
    ano_referencia,
    mes_referencia,
    alocacao_sgc,
    entrega_sgc,
    descricao_sgc,
    situacao_sgc,
    situacao_passivo_2026,
  } = req.body;

  if (!projeto_id || !numero_os || !ano_referencia || !mes_referencia) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes (projeto_id, numero_os, ano_referencia, mes_referencia).' });
  }

  const projExists = projetos.some((p) => p.id === Number(projeto_id));
  if (!projExists) {
    return res.status(400).json({ error: `Projeto com ID ${projeto_id} não encontrado.` });
  }

  const newOs: OrdemServico = {
    id: ++nextOsId,
    projeto_id: Number(projeto_id),
    numero_os: Number(numero_os),
    ano_referencia: Number(ano_referencia),
    mes_referencia,
    alocacao_sgc: Boolean(alocacao_sgc),
    entrega_sgc: Boolean(entrega_sgc),
    descricao_sgc: Boolean(descricao_sgc),
    situacao_sgc: situacao_sgc || 'Em Execução',
    situacao_passivo_2026: situacao_passivo_2026 || 'A Empenhar',
    criado_em: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  ordensServico.push(newOs);
  res.status(201).json(newOs);
});

// GET /api/v1/ordens-servico/detalhadas - Listar todas as OSs com dados da OS, do Projeto e das Alocações de Perfil
app.get('/api/v1/ordens-servico/detalhadas', (req, res) => {
  const result = ordensServico.map((os) => {
    const proj = projetos.find((p) => p.id === os.projeto_id);
    const osAlocacoes = alocacoes
      .filter((a) => a.ordem_servico_id === os.id)
      .map((a) => {
        const perf = perfis.find((p) => p.id === a.perfil_contratado_id);
        return {
          id: a.id,
          ordem_servico_id: a.ordem_servico_id,
          perfil_contratado_id: a.perfil_contratado_id,
          nome_profissional: a.nome_profissional,
          percentual_alocacao: a.percentual_alocacao,
          documento_referencia: a.documento_referencia,
          custo_mensal_perfil: a.custo_mensal_perfil,
          custo_alocacao: a.custo_alocacao,
          criado_em: a.criado_em,
          perfil: perf
            ? {
                id: perf.id,
                item_contratacao: perf.item_contratacao,
                nome_perfil: perf.nome_perfil,
                vigente: perf.vigente,
                custo_mensal_perfil: perf.custo_mensal_perfil,
                quantidade_mensal_contratada: perf.quantidade_mensal_contratada,
              }
            : null,
        };
      });

    const valorTotal = osAlocacoes.reduce((sum, a) => sum + (a.custo_alocacao || 0), 0);

    return {
      id: os.id,
      numero_os: os.numero_os,
      ano_referencia: os.ano_referencia,
      mes_referencia: os.mes_referencia,
      alocacao_sgc: os.alocacao_sgc,
      entrega_sgc: os.entrega_sgc,
      descricao_sgc: os.descricao_sgc,
      situacao_sgc: os.situacao_sgc,
      situacao_passivo_2026: os.situacao_passivo_2026,
      criado_em: os.criado_em,
      projeto_id: os.projeto_id,
      projeto: proj
        ? {
            id: proj.id,
            nome_projeto: proj.nome_projeto,
            sigla_projeto: proj.sigla_projeto,
            descricao: proj.descricao,
            nome_secretaria: proj.nome_secretaria,
            sigla_secretaria: proj.sigla_secretaria,
            criado_em: proj.criado_em,
          }
        : null,
      total_alocacoes: osAlocacoes.length,
      valor_total_calculado: Number(valorTotal.toFixed(2)),
      alocacoes: osAlocacoes,
    };
  });

  res.json(result);
});

app.get('/api/v1/ordens-servico/:id', (req, res) => {
  const id = Number(req.params.id);
  const os = ordensServico.find((o) => o.id === id);
  if (!os) {
    return res.status(404).json({ error: `Ordem de Serviço com ID ${id} não encontrada.` });
  }

  const proj = projetos.find((p) => p.id === os.projeto_id);
  const osAlocacoes = alocacoes.filter((a) => a.ordem_servico_id === id);
  const valorTotal = osAlocacoes.reduce((sum, a) => sum + (a.custo_alocacao || 0), 0);

  res.json({
    ...os,
    projeto: proj || null,
    valor_total_calculado: Number(valorTotal.toFixed(2)),
    alocacoes: osAlocacoes,
  });
});

app.put('/api/v1/ordens-servico/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = ordensServico.findIndex((o) => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Ordem de Serviço com ID ${id} não encontrada.` });
  }

  ordensServico[index] = {
    ...ordensServico[index],
    ...req.body,
    id, // protect ID
  };

  res.json(ordensServico[index]);
});

app.delete('/api/v1/ordens-servico/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = ordensServico.findIndex((o) => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Ordem de Serviço com ID ${id} não encontrada.` });
  }

  // Cascade delete allocations
  const removedAllocations = alocacoes.filter((a) => a.ordem_servico_id === id).length;
  alocacoes = alocacoes.filter((a) => a.ordem_servico_id !== id);
  ordensServico.splice(index, 1);

  res.json({
    message: `Ordem de Serviço #${id} removida com sucesso.`,
    alocacoes_removidas: removedAllocations,
  });
});

// 3. Alocações de Perfil na OS
app.get('/api/v1/ordens-servico/:id/alocacoes', (req, res) => {
  const id = Number(req.params.id);
  const osExists = ordensServico.some((o) => o.id === id);
  if (!osExists) {
    return res.status(404).json({ error: `Ordem de Serviço com ID ${id} não encontrada.` });
  }

  const items = alocacoes.filter((a) => a.ordem_servico_id === id);
  res.json(items);
});

app.post('/api/v1/ordens-servico/:id/alocacoes', (req, res) => {
  const osId = Number(req.params.id);
  const os = ordensServico.find((o) => o.id === osId);
  if (!os) {
    return res.status(404).json({ error: `Ordem de Serviço com ID ${osId} não encontrada.` });
  }

  const { perfil_contratado_id, nome_profissional, percentual_alocacao } = req.body;
  if (!perfil_contratado_id || !nome_profissional || percentual_alocacao === undefined) {
    return res.status(400).json({ error: 'Campos perfil_contratado_id, nome_profissional e percentual_alocacao são obrigatórios.' });
  }

  const perfil = perfis.find((p) => p.id === Number(perfil_contratado_id));
  if (!perfil) {
    return res.status(400).json({ error: `Perfil contratado com ID ${perfil_contratado_id} não encontrado.` });
  }

  const percentual = Number(percentual_alocacao);
  if (percentual <= 0 || percentual > 100) {
    return res.status(400).json({ error: 'O percentual de alocação deve estar entre 1 e 100%.' });
  }

  // Business Rule: Copy snapshot and calculate allocation cost
  const custoBase = Number(perfil.custo_mensal_perfil);
  const custoCalculado = Number(((percentual * custoBase) / 100).toFixed(2));

  const newAlocacao: AlocacaoPerfilOs = {
    id: ++nextAlocacaoId,
    ordem_servico_id: osId,
    perfil_contratado_id: perfil.id,
    nome_profissional: String(nome_profissional).trim(),
    percentual_alocacao: percentual,
    documento_referencia: perfil.documento_referencia,
    custo_mensal_perfil: custoBase,
    custo_alocacao: custoCalculado,
    criado_em: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  alocacoes.push(newAlocacao);

  res.status(201).json({
    alocacao: newAlocacao,
    novo_total_os: Number(getOsTotal(osId).toFixed(2)),
  });
});

app.delete('/api/v1/ordens-servico/alocacoes/:alocacaoId', (req, res) => {
  const alocacaoId = Number(req.params.alocacaoId);
  const index = alocacoes.findIndex((a) => a.id === alocacaoId);
  if (index === -1) {
    return res.status(404).json({ error: `Alocação com ID ${alocacaoId} não encontrada.` });
  }

  const osId = alocacoes[index].ordem_servico_id;
  alocacoes.splice(index, 1);

  res.json({
    message: `Alocação #${alocacaoId} removida com sucesso.`,
    novo_total_os: Number(getOsTotal(osId).toFixed(2)),
  });
});

// 4. Profissionais - Nomes distintos
app.get('/api/v1/ordens-servico/profissionais/nomes-distintos', (req, res) => {
  const nomes = Array.from(
    new Set(alocacoes.map((a) => a.nome_profissional.trim()).filter(Boolean))
  ).sort();

  res.json(nomes);
});

// 5. Perfis Contratados
app.get('/api/v1/perfis-contratados', (req, res) => {
  const { vigente } = req.query;
  let items = perfis;
  if (vigente !== undefined) {
    const isVigente = vigente === 'true';
    items = items.filter((p) => p.vigente === isVigente);
  }
  res.json(items);
});

app.post('/api/v1/perfis-contratados', (req, res) => {
  const { item_contratacao, nome_perfil, documento_referencia, vigente, custo_mensal_perfil, quantidade_mensal_contratada } = req.body;
  if (!item_contratacao || !nome_perfil || custo_mensal_perfil === undefined) {
    return res.status(400).json({ error: 'item_contratacao, nome_perfil e custo_mensal_perfil são obrigatórios.' });
  }

  const newPerfil: PerfilContratado = {
    id: ++nextPerfilId,
    item_contratacao,
    nome_perfil,
    documento_referencia: documento_referencia || '',
    vigente: vigente !== undefined ? Boolean(vigente) : true,
    custo_mensal_perfil: Number(custo_mensal_perfil),
    quantidade_mensal_contratada: Number(quantidade_mensal_contratada) || 1,
    criado_em: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  perfis.push(newPerfil);
  res.status(201).json(newPerfil);
});

app.get('/api/v1/perfis-contratados/:id', (req, res) => {
  const id = Number(req.params.id);
  const perfil = perfis.find((p) => p.id === id);
  if (!perfil) {
    return res.status(404).json({ error: `Perfil #${id} não encontrado.` });
  }
  res.json(perfil);
});

// 6. Projetos
app.get('/api/v1/projetos', (req, res) => {
  res.json(projetos);
});

app.post('/api/v1/projetos', (req, res) => {
  const { nome_projeto, sigla_projeto, descricao, nome_secretaria, sigla_secretaria } = req.body;
  if (!nome_projeto || !sigla_projeto || !nome_secretaria || !sigla_secretaria) {
    return res.status(400).json({ error: 'nome_projeto, sigla_projeto, nome_secretaria e sigla_secretaria são obrigatórios.' });
  }

  const newProj: Projeto = {
    id: ++nextProjetoId,
    nome_projeto,
    sigla_projeto,
    descricao: descricao || '',
    nome_secretaria,
    sigla_secretaria,
    criado_em: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  projetos.push(newProj);
  res.status(201).json(newProj);
});

// 7. Dashboard Analítico Consolidado (BI)
app.get('/api/v1/dashboard/resumo', (req, res) => {
  const totalValor = alocacoes.reduce((sum, a) => sum + (a.custo_alocacao || 0), 0);
  const totalOs = ordensServico.length;
  const totalAlocacoes = alocacoes.length;

  // Group by profile
  const porPerfil: { [nome: string]: { quantidade: number; valorTotal: number } } = {};
  alocacoes.forEach((a) => {
    const perf = perfis.find((p) => p.id === a.perfil_contratado_id);
    const nome = perf ? perf.nome_perfil : `Perfil #${a.perfil_contratado_id}`;
    if (!porPerfil[nome]) {
      porPerfil[nome] = { quantidade: 0, valorTotal: 0 };
    }
    porPerfil[nome].quantidade += 1;
    porPerfil[nome].valorTotal += a.custo_alocacao;
  });

  res.json({
    metricas: {
      total_ordens_servico: totalOs,
      total_alocacoes_equipe: totalAlocacoes,
      valor_total_consolidado: Number(totalValor.toFixed(2)),
      media_por_os: totalOs > 0 ? Number((totalValor / totalOs).toFixed(2)) : 0,
    },
    distribuicao_por_perfil: porPerfil,
  });
});

// 8. Administração: Restaurar dados de demonstração (Seed)
app.post('/api/v1/admin/reset-seed', (req, res) => {
  projetos = JSON.parse(JSON.stringify(INITIAL_PROJETOS));
  perfis = JSON.parse(JSON.stringify(INITIAL_PERFIS));
  ordensServico = JSON.parse(JSON.stringify(INITIAL_ORDENS_SERVICO));
  alocacoes = JSON.parse(JSON.stringify(INITIAL_ALOCACOES));
  res.json({ success: true, message: 'Base de dados restaurada com os dados de demonstração (Seed).' });
});

// 9. Administração: Limpar todos os dados (Tabelas vazias)
app.post('/api/v1/admin/clear-data', (req, res) => {
  projetos = [];
  perfis = [];
  ordensServico = [];
  alocacoes = [];
  res.json({ success: true, message: 'Todos os dados foram excluídos e as tabelas estão limpas.' });
});

/* =========================================================================
   Vite Middleware & Static Hosting
========================================================================= */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SisGOS Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
