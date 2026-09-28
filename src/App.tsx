import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PipelineProgressBar, PIPELINE_STEPS } from './components/PipelineProgressBar';
import { CommandCenterView } from './views/CommandCenterView';
import { RescueWorkflowView } from './views/RescueWorkflowView';
import { LiveMapView } from './views/LiveMapView';
import { DisastersHubView } from './views/DisastersHubView';
import { HistoryHubView } from './views/HistoryHubView';
import { HazardPredictionView } from './views/HazardPredictionView';
import { RedZonesView } from './views/RedZonesView';
import { VulnerabilityView } from './views/VulnerabilityView';
import { RescuePrioritizationView } from './views/RescuePrioritizationView';
import { SheltersCapacityView } from './views/SheltersCapacityView';
import { RescueTeamsView } from './views/RescueTeamsView';
import { RouteSafetyView } from './views/RouteSafetyView';
import { AlertsView } from './views/AlertsView';
import { DataSourcesView } from './views/DataSourcesView';
import { KnowledgeBaseView } from './views/KnowledgeBaseView';
import { ContinuousLearningView } from './views/ContinuousLearningView';
import { AuditLogsView } from './views/AuditLogsView';
import { DisasterSimulationModal } from './components/DisasterSimulationModal';
import { AIExplanationModal } from './components/AIExplanationModal';
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
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

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
    setCurrentStepIndex(0);
    setCurrentTab('command-center');
  };

  const handleSelectStep = (index: number, tabKey: string) => {
    setCurrentStepIndex(index);
    setCurrentTab(tabKey);
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
    // Switch to Rescue Mode to guide evacuation
    setCurrentTab('rescue');
  };

  const selectedExplanationHabitation: Habitation | null =
    state.habitations.find(h => h.id === aiExplanationHabId) || null;
  const selectedPriorityItem: PriorityRanking | undefined =
    state.priorities.find(p => p.habitationId === aiExplanationHabId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* 1. Header & Dual Navigation (Desktop & Mobile) */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          const foundIdx = PIPELINE_STEPS.findIndex(s => s.tabKey === tab);
          if (foundIdx !== -1) setCurrentStepIndex(foundIdx);
        }}
        userRole={userRole}
        onChangeRole={setUserRole}
        onRunSimulation={() => setIsSimulating(true)}
        onResetState={handleResetState}
        isSimulating={isSimulating}
        alertCount={state.alerts.length}
      />

      {/* 2. Persistent 10-Step Operational Workflow Ribbon */}
      <PipelineProgressBar
        currentStepIndex={currentStepIndex}
        onSelectStep={handleSelectStep}
      />

      {/* 3. Main Operational View Area (with bottom padding for mobile bar) */}
      <main className="flex-1 overflow-x-hidden pb-20 md:pb-6">
        {/* Core Dashboard */}
        {currentTab === 'command-center' && (
          <CommandCenterView
            habitations={state.habitations}
            shelters={state.shelters}
            teams={state.teams}
            riskZones={state.riskZones}
            routeSegments={state.routeSegments}
            routes={state.routes}
            priorities={state.priorities}
            alerts={state.alerts}
            onSelectHabitation={(id) => {}}
            onSelectShelter={(id) => {
              setCurrentTab('centres');
            }}
            onTriggerEvacuation={handleTriggerEvacuation}
            onRequestAIExplanation={(id) => setAiExplanationHabId(id)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {/* Live India Map View */}
        {currentTab === 'map' && (
          <LiveMapView
            habitations={state.habitations}
            shelters={state.shelters}
            teams={state.teams}
            riskZones={state.riskZones}
            routeSegments={state.routeSegments}
            routes={state.routes}
            onTriggerEvacuation={handleTriggerEvacuation}
            onRequestAIExplanation={(id) => setAiExplanationHabId(id)}
            onLaunchRescueForHabitation={(id) => {
              setCurrentTab('rescue');
            }}
          />
        )}

        {/* Primary Rescue Workflow & Rescue Mode View */}
        {currentTab === 'rescue' && (
          <RescueWorkflowView
            habitations={state.habitations}
            shelters={state.shelters}
            teams={state.teams}
            riskZones={state.riskZones}
            routeSegments={state.routeSegments}
            routes={state.routes}
            onRefreshState={refreshState}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {/* Disasters Hub */}
        {currentTab === 'disasters' && (
          <DisastersHubView
            riskZones={state.riskZones}
            habitations={state.habitations}
            shelters={state.shelters}
            onRefreshState={refreshState}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onTriggerEvacuation={handleTriggerEvacuation}
          />
        )}

        {/* Relocation Centres */}
        {(currentTab === 'centres' || currentTab === 'shelters') && (
          <SheltersCapacityView
            shelters={state.shelters}
            teams={state.teams}
            habitations={state.habitations}
            onRefreshState={refreshState}
          />
        )}

        {/* Alerts & Notifications */}
        {currentTab === 'alerts' && (
          <AlertsView
            alerts={state.alerts}
            notifications={state.notifications}
            habitations={state.habitations}
            onRefreshState={refreshState}
          />
        )}

        {/* History Hub */}
        {currentTab === 'history' && (
          <HistoryHubView
            knowledgeBase={state.knowledgeBase}
            modelVersions={state.modelVersions}
            dataSources={state.dataSources}
            auditLogs={state.auditLogs}
            onRefreshState={refreshState}
          />
        )}

        {/* Legacy / Direct Module Views (Preserving 100% of existing functionality) */}
        {currentTab === 'hazard-prediction' && (
          <HazardPredictionView
            onApplyPredictionToMap={(pred) => {
              refreshState();
              setCurrentTab('map');
            }}
          />
        )}

        {currentTab === 'red-zones' && (
          <RedZonesView
            riskZones={state.riskZones}
            shelters={state.shelters}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'vulnerability' && (
          <VulnerabilityView
            habitations={state.habitations}
            onSelectHabitation={(id) => {}}
            onTriggerEvacuation={handleTriggerEvacuation}
          />
        )}

        {currentTab === 'rescue-priorities' && (
          <RescuePrioritizationView
            priorities={state.priorities}
            onTriggerEvacuation={handleTriggerEvacuation}
            onRequestAIExplanation={(id) => setAiExplanationHabId(id)}
          />
        )}

        {currentTab === 'rescue-teams' && (
          <RescueTeamsView
            teams={state.teams}
            habitations={state.habitations}
            shelters={state.shelters}
          />
        )}

        {currentTab === 'route-safety' && (
          <RouteSafetyView
            routeSegments={state.routeSegments}
            routes={state.routes}
            onRefreshState={refreshState}
          />
        )}

        {currentTab === 'data-sources' && (
          <DataSourcesView
            dataSources={state.dataSources}
            onRefreshState={refreshState}
          />
        )}

        {currentTab === 'knowledge-base' && (
          <KnowledgeBaseView
            records={state.knowledgeBase}
            onRefreshState={refreshState}
          />
        )}

        {currentTab === 'learning' && (
          <ContinuousLearningView
            modelVersions={state.modelVersions}
            onRefreshState={refreshState}
          />
        )}

        {currentTab === 'audit-logs' && (
          <AuditLogsView auditLogs={state.auditLogs} />
        )}
      </main>

      {/* 4. End-to-End Disaster Scenario Simulation Modal */}
      <DisasterSimulationModal
        isOpen={isSimulating}
        onClose={() => setIsSimulating(false)}
        onRefreshState={refreshState}
        onJumpToTab={(tab) => {
          setCurrentTab(tab);
          const foundIdx = PIPELINE_STEPS.findIndex(s => s.tabKey === tab);
          if (foundIdx !== -1) setCurrentStepIndex(foundIdx);
        }}
      />

      {/* 5. AI Decision Explanation Modal */}
      <AIExplanationModal
        isOpen={Boolean(aiExplanationHabId)}
        onClose={() => setAiExplanationHabId(null)}
        habitation={selectedExplanationHabitation}
        priorityItem={selectedPriorityItem}
      />
    </div>
  );
}
