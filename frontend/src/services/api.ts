import {
  AOI,
  ChangeEvent,
  Project,
  SatelliteObservation,
  AlertNotification,
  AlertRule,
  AnalysisRunParams,
  ReviewStatus,
  X402Challenge,
  X402PaymentRecord
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api';

function getAuthHeaders(contentType = 'application/json'): HeadersInit {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const ApiService = {
  // Authentication
  async login(email: string, password: string):Promise<{ access_token: string; token_type: string }> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
    }
    return data;
  },

  async register(email: string, password: string, fullName?: string, organization?: string): Promise<any> {
    const payload: Record<string, any> = { email, password };
    if (fullName) payload.full_name = fullName;
    if (organization) payload.organization = organization;

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return await res.json();
  },

  async getMe(): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return null;
    return await res.json();
  },

  // Projects Management
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to load projects: ${res.statusText}`);
    }
    return await res.json();
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(project)
    });
    if (!res.ok) {
      throw new Error(`Failed to create project: ${res.statusText}`);
    }
    return await res.json();
  },

  // AOI Management
  async getAois(): Promise<AOI[]> {
    const res = await fetch(`${API_BASE}/aois`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to load AOIs: ${res.statusText}`);
    }
    return await res.json();
  },

  async createAoi(aoiData: Partial<AOI>): Promise<AOI> {
    const res = await fetch(`${API_BASE}/aois`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(aoiData)
    });
    if (!res.ok) {
      throw new Error(`Failed to create AOI: ${res.statusText}`);
    }
    return await res.json();
  },

  // Satellite Observations (STAC / Sensor passes)
  async getObservations(aoiId: string): Promise<SatelliteObservation[]> {
    const res = await fetch(`${API_BASE}/aois/${aoiId}/observations`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to load satellite observations: ${res.statusText}`);
    }
    return await res.json();
  },

  // Events & Alerts
  async getEvents(aoiId?: string): Promise<ChangeEvent[]> {
    const url = aoiId ? `${API_BASE}/events?aoi_id=${aoiId}` : `${API_BASE}/events`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to load change events: ${res.statusText}`);
    }
    return await res.json();
  },

  async updateReviewStatus(eventId: string, status: ReviewStatus, notes?: string): Promise<ChangeEvent> {
    const res = await fetch(`${API_BASE}/events/${eventId}/review`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes })
    });
    if (!res.ok) {
      throw new Error(`Failed to update review status: ${res.statusText}`);
    }
    return await res.json();
  },

  // Trigger Change Detection Analysis
  async runAnalysis(params: AnalysisRunParams): Promise<{ status: string; event: ChangeEvent }> {
    const res = await fetch(`${API_BASE}/analysis/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis execution failed' }));
      throw new Error(err.detail || 'Analysis execution failed');
    }
    const event = await res.json();
    return { status: 'COMPLETED', event };
  },

  // Alert Notifications & Rules
  async getAlertNotifications(): Promise<AlertNotification[]> {
    const res = await fetch(`${API_BASE}/alerts`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to load alert notifications: ${res.statusText}`);
    }
    return await res.json();
  },

  async dispatchAlert(notification: Partial<AlertNotification>): Promise<AlertNotification> {
    const res = await fetch(`${API_BASE}/alerts/dispatch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(notification)
    });
    if (!res.ok) {
      throw new Error(`Failed to dispatch alert: ${res.statusText}`);
    }
    return await res.json();
  },

  async getAlertRules(): Promise<AlertRule[]> {
    const res = await fetch(`${API_BASE}/alerts/rules`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to load alert rules: ${res.statusText}`);
    }
    return await res.json();
  },

  async saveAlertRule(rule: Partial<AlertRule>): Promise<AlertRule> {
    const res = await fetch(`${API_BASE}/alerts/rules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(rule)
    });
    if (!res.ok) {
      throw new Error(`Failed to save alert rule: ${res.statusText}`);
    }
    return await res.json();
  },

  // AlgoKit x402 Micropayments
  async getX402Challenge(resource: string, amountAlgo?: number): Promise<X402Challenge> {
    const url = amountAlgo !== undefined
      ? `${API_BASE}/x402/challenge?resource=${encodeURIComponent(resource)}&amount_algo=${amountAlgo}`
      : `${API_BASE}/x402/challenge?resource=${encodeURIComponent(resource)}`;
    const res = await fetch(url);
    if (res.status === 402) {
      return await res.json();
    }
    throw new Error(`Unexpected status ${res.status} when requesting x402 challenge`);
  },

  async verifyX402Payment(
    challengeToken: string,
    txId: string,
    wallet: string,
    serviceName?: string,
    amountAlgo?: number
  ): Promise<{ success: boolean; message: string; record?: X402PaymentRecord }> {
    const res = await fetch(`${API_BASE}/x402/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challenge_token: challengeToken,
        transaction_id: txId,
        sender_wallet: wallet,
        service_name: serviceName,
        amount_algo: amountAlgo
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'x402 verification failed' }));
      throw new Error(err.detail || 'x402 payment verification failed');
    }
    return await res.json();
  },

  async getX402Records(): Promise<X402PaymentRecord[]> {
    const res = await fetch(`${API_BASE}/x402/records`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to load payment records: ${res.statusText}`);
    }
    return await res.json();
  },

  async checkHealth(): Promise<{ status: string; satellite_provider?: string } | null> {
    try {
      const base = API_BASE.replace(/\/api$/, '');
      const res = await fetch(`${base}/health`);
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem('token');
  }
};
