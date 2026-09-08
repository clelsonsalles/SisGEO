import React, { useState, useEffect } from 'react';
import { SPRING_BOOT_FILES } from '../data/springBootCode';

export const SpringBootViewer: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Live API Console States
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/ordens-servico/detalhadas');
  const [selectedMethod, setSelectedMethod] = useState<'GET' | 'POST' | 'DELETE'>('GET');
  const [requestBody, setRequestBody] = useState<string>('');
  const [apiLoading, setApiLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<number | null>(null);
  const [apiDuration, setApiDuration] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const selectedFile = SPRING_BOOT_FILES[selectedFileIndex] || SPRING_BOOT_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFiles = SPRING_BOOT_FILES.filter((f) => {
    if (filterCategory === 'ALL') return true;
    return f.category === filterCategory;
  });

  // Endpoints catalogue for interactive testing
  const availableEndpoints = [
    { method: 'GET', path: '/api/v1/ordens-servico/detalhadas', label: '★ GET /ordens-servico/detalhadas (OS + Projeto + Alocações)', body: '' },
    { method: 'GET', path: '/api/v1/health', label: 'Health Check da API', body: '' },
    { method: 'GET', path: '/api/v1/ordens-servico', label: 'Listar Ordens de Serviço (Calculadas)', body: '' },
    { method: 'GET', path: '/api/v1/ordens-servico/1', label: 'Detalhes da OS #1 (com Alocações)', body: '' },
    { method: 'GET', path: '/api/v1/ordens-servico/1/alocacoes', label: 'Listar Alocações da OS #1', body: '' },
    { method: 'GET', path: '/api/v1/ordens-servico/profissionais/nomes-distintos', label: 'Nomes de Profissionais Únicos', body: '' },
    { method: 'GET', path: '/api/v1/projetos', label: 'Listar Todos os Projetos', body: '' },
    { method: 'GET', path: '/api/v1/perfis-contratados', label: 'Listar Perfis Contratados', body: '' },
    { method: 'GET', path: '/api/v1/dashboard/resumo', label: 'Métricas e Resumo BI do Dashboard', body: '' },
    {
      method: 'POST',
      path: '/api/v1/ordens-servico',
      label: 'Criar Nova OS (POST)',
      body: JSON.stringify(
        {
          projeto_id: 1,
          numero_os: 305,
          ano_referencia: 2026,
          mes_referencia: 'MARÇO',
          alocacao_sgc: true,
          entrega_sgc: true,
          descricao_sgc: true,
          situacao_sgc: 'Em Execução',
          situacao_passivo_2026: 'A Empenhar',
        },
        null,
        2
      ),
    },
  ];

  const handleSelectEndpointPreset = (ep: typeof availableEndpoints[0]) => {
    setSelectedEndpoint(ep.path);
    setSelectedMethod(ep.method as any);
    setRequestBody(ep.body);
    setApiResponse(null);
    setApiStatus(null);
    setApiError(null);
  };

  const handleExecuteRequest = async () => {
    setApiLoading(true);
    setApiResponse(null);
    setApiStatus(null);
    setApiError(null);

    const startTime = performance.now();

    try {
      const options: RequestInit = {
        method: selectedMethod,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };

      if (selectedMethod === 'POST' && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint, options);
      const endTime = performance.now();
      setApiDuration(Math.round(endTime - startTime));
      setApiStatus(res.status);

      const data = await res.json();
      setApiResponse(data);
    } catch (err: any) {
      const endTime = performance.now();
      setApiDuration(Math.round(endTime - startTime));
      setApiError(err.message || 'Erro ao conectar ao endpoint');
    } finally {
      setApiLoading(false);
    }
  };

  // Run health check on initial load for instant demonstration
  useEffect(() => {
    handleExecuteRequest();
  }, []);

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-danger text-white px-2 py-1 fw-bold">
              <i className="bi bi-hdd-network-fill me-1"></i>
              Backend Spring Boot & RESTful API
            </span>
            <span className="badge bg-light text-dark border">Java 21 LTS</span>
            <span className="badge bg-light text-dark border">Spring Data JPA</span>
            <span className="badge bg-success-subtle text-success border border-success-subtle fw-semibold">
              Live Express Backend Ativo
            </span>
          </div>
          <h2 className="fw-bold text-dark mb-0">Endpoints RESTful & Arquitetura de Serviços</h2>
          <p className="text-muted mb-0 small">
            Acesse e teste os endpoints REST da aplicação diretamente no navegador ou utilize os contratos Java Spring Boot.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm px-3 fw-semibold"
            onClick={handleCopy}
          >
            <i className={`bi ${copied ? 'bi-check-lg text-success' : 'bi-clipboard'} me-1`}></i>
            {copied ? 'Código Copiado!' : 'Copiar Código Java'}
          </button>
        </div>
      </div>

      {/* NOVO: Console Interativo de Testes dos Endpoints REST */}
      <div className="card border-0 shadow-sm mb-4 border-start border-primary border-4 bg-white">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
              <i className="bi bi-play-circle-fill"></i>
            </div>
            <div>
              <span className="fw-bold text-dark fs-6">Console Interativo de Teste de Endpoints REST</span>
              <small className="text-muted d-block" style={{ fontSize: '12px' }}>
                Dispare requisições HTTP reais e inspecione a resposta JSON, headers e status em tempo real
              </small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <span className="badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1">
              <i className="bi bi-lightning-charge-fill"></i> Servidor Online (Porta 3000)
            </span>
          </div>
        </div>

        <div className="card-body p-3">
          {/* Quick Presets Buttons */}
          <div className="mb-3">
            <label className="form-label small fw-bold text-secondary mb-1">
              Atalhos Rápidos de Endpoints:
            </label>
            <div className="d-flex flex-wrap gap-1">
              {availableEndpoints.map((ep, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`btn btn-sm ${
                    selectedEndpoint === ep.path && selectedMethod === ep.method
                      ? 'btn-primary text-white'
                      : 'btn-outline-secondary bg-light'
                  }`}
                  onClick={() => handleSelectEndpointPreset(ep)}
                  style={{ fontSize: '12px' }}
                >
                  <span className={`badge me-1 ${ep.method === 'GET' ? 'bg-success' : 'bg-primary'}`}>
                    {ep.method}
                  </span>
                  {ep.path}
                </button>
              ))}
            </div>
          </div>

          {/* Request Bar */}
          <div className="row g-2 mb-3">
            <div className="col-auto">
              <select
                className="form-select form-select-sm fw-bold font-monospace shadow-none"
                style={{ width: '100px' }}
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value as any)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="col">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted font-monospace">
                  {window.location.origin}
                </span>
                <input
                  type="text"
                  className="form-control font-monospace fw-semibold"
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  placeholder="/api/v1/..."
                />
              </div>
            </div>

            <div className="col-auto">
              <button
                type="button"
                className="btn btn-primary btn-sm px-3 fw-bold d-flex align-items-center gap-1"
                onClick={handleExecuteRequest}
                disabled={apiLoading}
              >
                {apiLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Chamando...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-fill"></i>
                    <span>Executar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* POST Body input if POST is selected */}
          {selectedMethod === 'POST' && (
            <div className="mb-3">
              <label className="form-label small fw-bold text-secondary mb-1">
                JSON Body da Requisição:
              </label>
              <textarea
                className="form-control font-monospace small bg-dark text-light p-2"
                rows={4}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder='{ "campo": "valor" }'
              ></textarea>
            </div>
          )}

          {/* Response Box */}
          <div className="bg-light rounded p-3 border">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold small text-dark">Resposta HTTP:</span>
                {apiStatus !== null && (
                  <span
                    className={`badge ${
                      apiStatus >= 200 && apiStatus < 300
                        ? 'bg-success'
                        : apiStatus >= 400
                        ? 'bg-danger'
                        : 'bg-warning'
                    }`}
                  >
                    HTTP {apiStatus}
                  </span>
                )}
                {apiDuration !== null && (
                  <span className="text-muted small">
                    <i className="bi bi-stopwatch me-1"></i>
                    {apiDuration} ms
                  </span>
                )}
              </div>

              {apiResponse && (
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-decoration-none text-muted"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
                    alert('JSON copiado para a área de transferência!');
                  }}
                >
                  <i className="bi bi-clipboard me-1"></i>Copiar JSON
                </button>
              )}
            </div>

            {apiError ? (
              <div className="alert alert-danger mb-0 small py-2">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {apiError}
              </div>
            ) : (
              <pre
                className="bg-dark text-success p-3 rounded mb-0 small font-monospace"
                style={{ maxHeight: '280px', overflowY: 'auto' }}
              >
                {apiResponse
                  ? JSON.stringify(apiResponse, null, 2)
                  : '// Clique em "Executar" para enviar a requisição HTTP.'}
              </pre>
            )}
          </div>
        </div>

        {/* Guia de Como Chamar Externamente */}
        <div className="card-footer bg-light py-2 px-3 small border-top text-muted">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <span className="fw-bold text-dark d-block mb-1">
                <i className="bi bi-terminal me-1 text-primary"></i>
                Como chamar via cURL no seu terminal:
              </span>
              <code className="bg-white p-1 rounded border text-dark d-block text-truncate">
                curl -X {selectedMethod} "{window.location.origin}{selectedEndpoint}"
              </code>
            </div>
            <div className="col-12 col-md-6">
              <span className="fw-bold text-dark d-block mb-1">
                <i className="bi bi-code-slash me-1 text-success"></i>
                Como chamar via JavaScript (Fetch API):
              </span>
              <code className="bg-white p-1 rounded border text-dark d-block text-truncate">
                fetch('{selectedEndpoint}').then(r =&gt; r.json()).then(console.log);
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* REST API Endpoints Overview Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-dark text-white py-3 d-flex justify-content-between align-items-center">
          <span className="fw-bold">
            <i className="bi bi-hdd-network me-2 text-primary"></i>
            Catálogo Completo de Endpoints RESTful (Prefixo: <code>/api/v1</code>)
          </span>
          <span className="badge bg-success">Status: 200 OK</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '100px' }}>Método</th>
                  <th style={{ width: '30%' }}>Endpoint</th>
                  <th style={{ width: '40%' }}>Descrição do Serviço & Regra</th>
                  <th>Parâmetros / Body</th>
                </tr>
              </thead>
              <tbody className="small">
                <tr className="table-success-subtle">
                  <td><span className="badge bg-success">GET</span></td>
                  <td><strong className="font-monospace text-primary">/api/v1/ordens-servico/detalhadas</strong></td>
                  <td>
                    <strong>Endpoint Completo Unificado:</strong> Retorna todas as Ordens de Serviço cadastradas com todos os dados da OS, dados completos do Projeto vinculado (nome, sigla, secretaria) e a lista completa de alocações dos perfis com snapshots de custo e perfil contratado.
                  </td>
                  <td><span className="badge bg-success text-white">Novo Endpoint</span></td>
                </tr>
                <tr>
                  <td><span className="badge bg-success">GET</span></td>
                  <td><code>/api/v1/health</code></td>
                  <td>Health check e metadados de status e versão dos microserviços.</td>
                  <td><em>Nenhum</em></td>
                </tr>
                <tr>
                  <td><span className="badge bg-success">GET</span></td>
                  <td><code>/api/v1/ordens-servico</code></td>
                  <td>Lista todas as OSs com o valor total calculado dinamicamente pela soma das alocações.</td>
                  <td><code>Filtros opcionais</code></td>
                </tr>
                <tr>
                  <td><span className="badge bg-primary">POST</span></td>
                  <td><code>/api/v1/ordens-servico</code></td>
                  <td>Cria uma nova OS vinculando ao ID do Projeto existente.</td>
                  <td><code>OrdemServicoRequestDTO</code></td>
                </tr>
                <tr>
                  <td><span className="badge bg-info text-dark">GET</span></td>
                  <td><code>/api/v1/ordens-servico/{'{id}'}</code></td>
                  <td>Retorna detalhes da OS e lista de suas alocações com snapshots.</td>
                  <td><code>id: Long</code></td>
                </tr>
                <tr>
                  <td><span className="badge bg-warning text-dark">PUT</span></td>
                  <td><code>/api/v1/ordens-servico/{'{id}'}</code></td>
                  <td>Atualiza campos da OS (situação no SGC, indicadores, passivo).</td>
                  <td><code>OrdemServicoRequestDTO</code></td>
                </tr>
                <tr>
                  <td><span className="badge bg-danger">DELETE</span></td>
                  <td><code>/api/v1/ordens-servico/{'{id}'}</code></td>
                  <td>Remove a OS e suas alocações associadas (Cascade Delete).</td>
                  <td><code>id: Long</code></td>
                </tr>
                <tr className="table-primary-subtle">
                  <td><span className="badge bg-success">GET</span></td>
                  <td><code>/api/v1/ordens-servico/{'{id}'}/alocacoes</code></td>
                  <td>Lista todas as alocações da OS na tabela <code>alocacoes_perfil_os</code>.</td>
                  <td><code>id: Long (OS ID)</code></td>
                </tr>
                <tr className="table-primary-subtle">
                  <td><span className="badge bg-primary">POST</span></td>
                  <td><code>/api/v1/ordens-servico/{'{id}'}/alocacoes</code></td>
                  <td>
                    <strong>Regra de Negócio:</strong> Busca o perfil contratado, copia custo mensal e doc ref, calcula custo = (% * custo) / 100.
                  </td>
                  <td><code>AlocacaoRequestDTO</code></td>
                </tr>
                <tr className="table-primary-subtle">
                  <td><span className="badge bg-info text-dark">GET</span></td>
                  <td><code>/api/v1/ordens-servico/profissionais/nomes-distintos</code></td>
                  <td>Retorna lista de nomes distintos de profissionais para sugestão/autocomplete.</td>
                  <td><em>Nenhum</em></td>
                </tr>
                <tr>
                  <td><span className="badge bg-success">GET</span></td>
                  <td><code>/api/v1/perfis-contratados</code></td>
                  <td>Lista perfis contratados com vigência, custo mensal e quantidade.</td>
                  <td><code>vigente: Boolean</code></td>
                </tr>
                <tr>
                  <td><span className="badge bg-success">GET</span></td>
                  <td><code>/api/v1/projetos</code></td>
                  <td>Lista todos os projetos cadastrados com secretaria e unidade.</td>
                  <td><em>Nenhum</em></td>
                </tr>
                <tr>
                  <td><span className="badge bg-success">GET</span></td>
                  <td><code>/api/v1/dashboard/resumo</code></td>
                  <td>Retorna resumo consolidado para BI (Total de OSs, Valor Consolidado, Distribuição).</td>
                  <td><em>Nenhum</em></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Code Browser Section */}
      <div className="row g-3">
        {/* File Tree */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light py-3 d-flex justify-content-between align-items-center">
              <span className="fw-bold text-dark">
                <i className="bi bi-folder2-open me-2 text-warning"></i>
                Estrutura de Arquivos Java
              </span>
              <select
                className="form-select form-select-sm"
                style={{ width: '130px' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="ALL">Todos</option>
                <option value="controller">Controllers</option>
                <option value="service">Services</option>
                <option value="entity">Entities</option>
                <option value="config">Configs</option>
                <option value="devops">Docker & DevOps</option>
              </select>
            </div>
            <div className="list-group list-group-flush" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredFiles.map((file, idx) => {
                const originalIndex = SPRING_BOOT_FILES.findIndex((f) => f.path === file.path);
                const isSelected = originalIndex === selectedFileIndex;
                return (
                  <button
                    key={file.path}
                    type="button"
                    className={`list-group-item list-group-item-action py-3 px-3 border-0 border-bottom ${
                      isSelected ? 'bg-primary text-white' : ''
                    }`}
                    onClick={() => setSelectedFileIndex(originalIndex)}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold fs-7 font-monospace">
                        <i className={`bi ${file.name.endsWith('.yml') ? 'bi-gear-fill' : file.name.endsWith('.xml') ? 'bi-filetype-xml' : 'bi-filetype-java'} me-2`}></i>
                        {file.name}
                      </span>
                      <span className={`badge ${isSelected ? 'bg-white text-primary' : 'bg-light text-muted border'}`}>
                        {file.category}
                      </span>
                    </div>
                    <small className={`d-block text-truncate ${isSelected ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '11px' }}>
                      {file.path}
                    </small>
                    <small className={`d-block mt-1 ${isSelected ? 'text-white' : 'text-secondary'}`} style={{ fontSize: '11px' }}>
                      {file.description}
                    </small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-dark text-white py-2 px-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold font-monospace text-warning me-2">
                  {selectedFile.name}
                </span>
                <span className="badge bg-secondary font-monospace text-white small">
                  {selectedFile.path}
                </span>
              </div>
              <span className="text-muted small">Java 21 / Spring Boot 3.3</span>
            </div>
            <div className="card-body p-0 bg-dark">
              <pre
                className="text-light p-3 m-0 font-monospace"
                style={{
                  fontSize: '13px',
                  lineHeight: '1.6',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  backgroundColor: '#1e1e1e',
                }}
              >
                <code>{selectedFile.code}</code>
              </pre>
            </div>
            <div className="card-footer bg-light py-2 px-3 d-flex justify-content-between align-items-center small">
              <span className="text-muted">
                <strong>Linhas:</strong> {selectedFile.code.split('\n').length} | <strong>Tamanho:</strong> {selectedFile.code.length} bytes
              </span>
              <span className="text-muted">
                Spring Boot Starter Web + Spring Data JPA + Bean Validation + Springdoc OpenAPI
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
