import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CommandCenterView } from './views/CommandCenterView';
import { DisasterSimulationModal } from './components/DisasterSimulationModal';
import { AIExplanationModal } from './components/AIExplanationModal';
import { AdminKnowledgeSourcesModal } from './components/AdminKnowledgeSourcesModal';
import { ApiClient, StateResponse } from './services/apiClient';
import { UserRole, Habitation, PriorityRanking } from './types/disaster';
import {
  INITIAL_HABITATIONS,
  INITIAL_SHELTERS,
  INITIAL_RESCUE_TEAMS,
  INITIAL_RISK_ZONES,
  INITIAL_ROUTE_SEGMENTS,
  INITIAL_EVACUATION_ROUTES,
  INITIAL_ALERTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_KNOWLEDGE_BASE,
  INITIAL_MODEL_VERSIONS,
  INITIAL_DATA_SOURCES,
  INITIAL_AUDIT_LOGS
} from './data/mockDisasterData';
import { calculateRescuePriorities } from './services/hazardEngine';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('command-center');
  const [userRole, setUserRole] = useState<UserRole>('AUTHORITY');
  const [resetCount, setResetCount] = useState<number>(0);

  // App State
  const [state, setState] = useState<StateResponse>({
    habitations: INITIAL_HABITATIONS,
    shelters: INITIAL_SHELTERS,
    teams: INITIAL_RESCUE_TEAMS,
    riskZones: INITIAL_RISK_ZONES,
    routeSegments: INITIAL_ROUTE_SEGMENTS,
    routes: INITIAL_EVACUATION_ROUTES,
    alerts: INITIAL_ALERTS,
    notifications: INITIAL_NOTIFICATIONS,
    knowledgeBase: INITIAL_KNOWLEDGE_BASE,
    modelVersions: INITIAL_MODEL_VERSIONS,
    dataSources: INITIAL_DATA_SOURCES,
    auditLogs: INITIAL_AUDIT_LOGS,
    priorities: calculateRescuePriorities(INITIAL_HABITATIONS, INITIAL_SHELTERS, INITIAL_RESCUE_TEAMS)
  });

  // Modal states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [aiExplanationHabId, setAiExplanationHabId] = useState<string | null>(null);
  const [isRagModalOpen, setIsRagModalOpen] = useState<boolean>(false);

  // Load initial state from server API
  const refreshState = async () => {
    const data = await ApiClient.getState();
    setState(data);
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleResetState = async () => {
    await ApiClient.resetState();
    await refreshState();
    setResetCount(prev => prev + 1);
    setCurrentTab('command-center');
  };

  const handleTriggerEvacuation = async (habId: string) => {
    const targetHab = state.habitations.find(h => h.id === habId);
    if (!targetHab) return;

    await ApiClient.sendNotification({
      habitationId: habId,
      recipientType: 'COMMUNITY',
      channel: 'SMS',
      message: `PRIORITY 1 EVACUATION NOTICE: Water level in ${targetHab.name} is rising rapidly. Evacuate immediately toward designated shelter.`,
      simulateFailure: false
    });

    await refreshState();
  };

  const selectedExplanationHabitation: Habitation | null =
    state.habitations.find(h => h.id === aiExplanationHabId) || null;
  const selectedPriorityItem: PriorityRanking | undefined =
    state.priorities.find(p => p.habitationId === aiExplanationHabId);

  // Consolidated Navigation: Sync tabs to workflow steps (Requirement 1 & 2)
  const initialWorkflowStage: 'welcome' | 1 | 2 | 3 =
    currentTab === 'map' || currentTab === 'rescue'
      ? 2
      : currentTab === 'centres' || currentTab === 'shelters'
      ? 3
      : 'welcome';

  return (
    <div className="min-h-screen bg-[#011627] text-slate-100 flex flex-col font-sans selection:bg-sky-400 selection:text-slate-950">
      {/* 1. Header & Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        userRole={userRole}
        onChangeRole={setUserRole}
        onRunSimulation={() => setIsSimulating(true)}
        onResetState={handleResetState}
        isSimulating={isSimulating}
        alertCount={state.alerts.length}
        onOpenRagKnowledgeModal={() => setIsRagModalOpen(true)}
      />

      {/* 2. Main Operational View Area */}
      <main className="flex-1 overflow-x-hidden pb-12">
        <CommandCenterView
          key={`cmd-center-${resetCount}-${currentTab}`}
          habitations={state.habitations}
          shelters={state.shelters}
          teams={state.teams}
          riskZones={state.riskZones}
          routeSegments={state.routeSegments}
          routes={state.routes}
          priorities={state.priorities}
          alerts={state.alerts}
          ragAdvisory={state.ragAdvisory}
          initialWorkflowStage={initialWorkflowStage}
          onSelectHabitation={() => {}}
          onSelectShelter={() => setCurrentTab('centres')}
          onTriggerEvacuation={handleTriggerEvacuation}
          onRequestAIExplanation={(id) => setAiExplanationHabId(id)}
          onNavigateTab={(tab) => setCurrentTab(tab)}
          onRefreshState={refreshState}
          onOpenRagKnowledgeModal={() => setIsRagModalOpen(true)}
        />
      </main>

      {/* Admin Knowledge Sources & AI Prediction Modal */}
      <AdminKnowledgeSourcesModal
        isOpen={isRagModalOpen}
        onClose={() => setIsRagModalOpen(false)}
        onForecastUpdated={() => refreshState()}
      />

      {/* Disaster Scenario Simulation Modal */}
      <DisasterSimulationModal
        isOpen={isSimulating}
        onClose={() => setIsSimulating(false)}
        onRefreshState={refreshState}
        onJumpToTab={(tab) => {
          setCurrentTab(tab);
        }}
      />

      {/* AI Decision Explanation Modal */}
      <AIExplanationModal
        isOpen={Boolean(aiExplanationHabId)}
        onClose={() => setAiExplanationHabId(null)}
        habitation={selectedExplanationHabitation}
        priorityItem={selectedPriorityItem}
      />
    </div>
  );
}
