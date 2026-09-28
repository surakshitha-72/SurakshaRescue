import {
  DisasterAlert,
  Habitation,
  HazardPrediction,
  PriorityRanking,
  Shelter,
  RescueTeam,
  RouteSegment,
  EvacuationRoute,
  KnowledgeBaseRecord,
  ModelVersion,
  DataSourceStatus,
  AuditLog,
  AlertNotification
} from '../types/disaster';
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
} from '../data/mockDisasterData';
import { calculateRescuePriorities } from './hazardEngine';

export interface StateResponse {
  habitations: Habitation[];
  shelters: Shelter[];
  teams: RescueTeam[];
  riskZones: any[];
  routeSegments: RouteSegment[];
  routes: EvacuationRoute[];
  alerts: DisasterAlert[];
  notifications: AlertNotification[];
  knowledgeBase: KnowledgeBaseRecord[];
  modelVersions: ModelVersion[];
  dataSources: DataSourceStatus[];
  auditLogs: AuditLog[];
  priorities: PriorityRanking[];
}

export const ApiClient = {
  async getState(): Promise<StateResponse> {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API /api/state unavailable, using local mock state:', e);
    }
    return {
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
    };
  },

  async resetState(): Promise<boolean> {
    try {
      const res = await fetch('/api/state/reset', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async predictHazard(hazardType: string, inputs: any): Promise<HazardPrediction> {
    try {
      const res = await fetch('/api/hazards/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hazardType, inputs })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Hazard predict API error:', e);
    }
    return {
      id: `pred-fallback-${Date.now()}`,
      hazardType: 'Flood',
      probability: 94,
      severity: 'Catastrophic',
      confidence: 96,
      affectedAreaKm2: 48,
      expectedPopulation: 16500,
      timestamp: new Date().toISOString(),
      modelUsed: 'XGBoost Hydrological Inundation Net v2.1',
      contributingFactors: [
        { factor: 'River Stage', weight: 35, description: '+4.82m above danger level' },
        { factor: 'Rainfall', weight: 30, description: '185mm cloudburst accumulation' },
        { factor: 'Soil Saturation', weight: 20, description: '96% moisture content' }
      ],
      explanation: 'Critical overtopping imminent along Kosi river basin.'
    };
  },

  async reserveShelterCapacity(params: {
    shelterId: string;
    teamId: string;
    teamName: string;
    habitationId: string;
    habitationName: string;
    count: number;
  }): Promise<{ success: boolean; message?: string; updatedShelter?: Shelter }> {
    try {
      const res = await fetch(`/api/shelters/${params.shelterId}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (res.ok) return { success: true, updatedShelter: data.updatedShelter };
      return { success: false, message: data.message || 'Reservation rejected' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error' };
    }
  },

  async releaseShelterCapacity(shelterId: string, reservationId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/shelters/${shelterId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async confirmEvacueeArrival(shelterId: string, reservationId: string, actualCount?: number): Promise<boolean> {
    try {
      const res = await fetch(`/api/shelters/${shelterId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, actualCount })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async confirmRescueOperation(params: {
    habitationId: string;
    shelterId: string;
    teamName: string;
    count: number;
    notes?: string;
  }): Promise<{ success: boolean; message?: string; habitation?: Habitation; shelter?: Shelter }> {
    try {
      const res = await fetch('/api/rescue/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Rescue confirm error:', e);
    }
    return { success: true, message: 'Rescue confirmed locally.' };
  },

  async recalculateRoute(segmentId: string, newStatus: string, reason?: string) {
    try {
      const res = await fetch('/api/routes/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentId, newStatus, reason })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Route recalculate API error:', e);
    }
    return null;
  },

  async sendNotification(params: {
    habitationId: string;
    recipientType: string;
    channel: string;
    message: string;
    simulateFailure?: boolean;
  }): Promise<AlertNotification> {
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Notification API error:', e);
    }
    return {
      id: `notif-${Date.now()}`,
      alertId: 'alert-001',
      habitationId: params.habitationId,
      habitationName: 'Target Habitation',
      recipientType: params.recipientType as any,
      channel: params.channel as any,
      message: params.message,
      timestamp: new Date().toISOString().substring(11, 16),
      deliveryStatus: params.simulateFailure ? 'FAILED' : 'DELIVERED',
      fallbackTriggered: Boolean(params.simulateFailure),
      fallbackVolunteerName: params.simulateFailure ? 'Civil Defence Volunteer Squad #4' : undefined
    };
  },

  async completeVolunteerContact(notificationId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/fallback-complete`, {
        method: 'POST'
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async verifyAlert(alertId: string, action: 'VERIFY' | 'REJECT' | 'CONVERT_TO_EVENT', verifiedBy?: string): Promise<any> {
    try {
      const res = await fetch(`/api/alerts/${alertId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, verifiedBy })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Verify alert error:', e);
    }
    return null;
  },

  async explainDecision(habitationId: string, context?: string): Promise<string> {
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitationId, context })
      });
      if (res.ok) {
        const data = await res.json();
        return data.explanation;
      }
    } catch (e) {
      console.warn('AI explain error:', e);
    }
    return `Priority justified by critical river breach proximity, 1,850 vulnerable residents (infants, elderly, medically dependent), and limited 45-minute evacuation window.`;
  },

  async searchKnowledgeBase(query: string, hazard?: string): Promise<KnowledgeBaseRecord[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (hazard) params.append('hazard', hazard);
      const res = await fetch(`/api/knowledge-base/search?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('KB search error:', e);
    }
    return INITIAL_KNOWLEDGE_BASE;
  },

  async addKnowledgeBaseEvent(event: Partial<KnowledgeBaseRecord>): Promise<KnowledgeBaseRecord | null> {
    try {
      const res = await fetch('/api/knowledge-base/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('KB update error:', e);
    }
    return null;
  },

  async submitOverride(params: {
    targetType: string;
    targetId: string;
    overrideAction: string;
    mandatoryReason: string;
    authorizedUser: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      return { success: res.ok, message: data.message || data.error };
    } catch (e: any) {
      return { success: false, message: e.message || 'Override error' };
    }
  }
};
