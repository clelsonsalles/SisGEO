import React, { useState } from 'react';
import { SisgosProvider } from './context/SisgosContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { GestaoOS } from './components/GestaoOS';
import { DashboardAnalitico } from './components/DashboardAnalitico';
import { ParametrosPerfis } from './components/ParametrosPerfis';
import { ParametrosProjetos } from './components/ParametrosProjetos';
import { SpringBootViewer } from './components/SpringBootViewer';
import { ERDiagram } from './components/ERDiagram';
import { DDLViewer } from './components/DDLViewer';
import { DataDictionary } from './components/DataDictionary';
import { BusinessRuleSimulator } from './components/BusinessRuleSimulator';
import { QueriesViewer } from './components/QueriesViewer';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('gestao-os');

  const isDarkAdminTab = [
    'admin-der',
    'admin-ddl',
    'admin-dicionario',
    'admin-simulador',
    'admin-consultas',
  ].includes(activeTab);

  return (
    <SisgosProvider>
      <div className="min-vh-100 d-flex flex-column bg-light text-dark font-sans">
        {/* Responsive Bootstrap 5 Navigation with Menu Structure */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content Container */}
        <main className="flex-grow-1">
          {/* Main Module: Gestão de OSs */}
          {activeTab === 'gestao-os' && <GestaoOS onNavigate={setActiveTab} />}

          {/* Módulo BI: Dashboard Analítico */}
          {activeTab === 'dashboard-analitico' && <DashboardAnalitico onNavigate={setActiveTab} />}

          {/* Parâmetros: Perfis Contratados */}
          {activeTab === 'param-perfis' && <ParametrosPerfis />}

          {/* Parâmetros: Projetos */}
          {activeTab === 'param-projetos' && <ParametrosProjetos />}

          {/* Administração: Backend Spring Boot Java */}
          {activeTab === 'admin-springboot' && <SpringBootViewer />}

          {/* Administração: Telas do Modelo de Banco de Dados */}
          {isDarkAdminTab && (
            <div className="bg-slate-950 text-slate-100 min-vh-100 py-4 px-3 px-md-4">
              <div className="container-fluid" style={{ maxWidth: 1400 }}>
                {/* Admin Header breadcrumb */}
                <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom border-slate-800">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-slate-800 text-slate-300 border border-slate-700">
                      Administração
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className="text-indigo-400 fw-semibold">
                      {activeTab === 'admin-der' && 'Diagrama DER (Modelo Relacional)'}
                      {activeTab === 'admin-ddl' && 'Scripts DDL SQL Multidialeto'}
                      {activeTab === 'admin-dicionario' && 'Dicionário de Dados & Metadados'}
                      {activeTab === 'admin-simulador' && 'Simulador de Regra & Trigger de Banco'}
                      {activeTab === 'admin-consultas' && 'Consultas SQL & Relatórios Gerenciais'}
                    </span>
                  </div>
                  <span className="text-slate-500 small d-none d-sm-inline">
                    PostgreSQL 14+ • Spring Boot 3.3 • Java 21
                  </span>
                </div>

                {activeTab === 'admin-der' && <ERDiagram />}
                {activeTab === 'admin-ddl' && <DDLViewer />}
                {activeTab === 'admin-dicionario' && <DataDictionary />}
                {activeTab === 'admin-simulador' && <BusinessRuleSimulator />}
                {activeTab === 'admin-consultas' && <QueriesViewer />}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-top py-3 text-muted small mt-auto">
          <div className="container-fluid px-md-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <div>
              <strong className="text-dark">SisGOS</strong> — Sistema de Gestão de Ordens de Serviço & Alocações
            </div>
            <div className="text-muted" style={{ fontSize: '12px' }}>
              Front-End Bootstrap 5 & JavaScript • Back-End Spring Boot Java 21 • Banco de Dados PostgreSQL
            </div>
          </div>
        </footer>
      </div>
    </SisgosProvider>
  );
}
