// Cliente HTTP para a API do CRM, com JWT Bearer.
// Inclui um fallback "modo demo" quando o backend Node/Express não está
// disponível (ex.: preview estático do Lovable). Em produção real o backend
// responde JSON normalmente e o fallback nunca é acionado.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "/api";
const TOKEN_KEY = "crm.token";
const DEMO_FLAG = "crm.demo";

export type Role = "user" | "admin" | "super_admin";

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  company: string | null;
   birth_date: string | null;
   email: string | null;
   phone: string | null;
   cpf_cnpj: string | null;
   source: string | null;
   notes: string | null;
  created_by: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

 export interface ClientInput {
   name: string;
   company?: string | null;
   birth_date?: string | null;
   email?: string | null;
   phone?: string | null;
   cpf_cnpj?: string | null;
   source?: string | null;
   notes?: string | null;
 }
 
 export interface ClientRecord {
   id: string;
   client_id: string;
   tenant_id: string;
   description: string;
   type: string | null;
   created_by: string | null;
   created_by_name?: string | null;
   created_at: string;
 }
 
 export interface RecordInput {
   description: string;
   type?: string | null;
 }
 
export interface AuthUser {
  id: string;
  tenantId: string | null;
  name: string;
  email: string;
  role: Role;
}

export interface AdminUser {
  id: string;
  tenant_id: string | null;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface AdminStats {
  ok: true;
  stats: { tenants: number; users: number; clients: number };
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

// =====================================================================
// MODO DEMO (fallback para preview sem backend)
// =====================================================================
const DEMO_USER: AuthUser = {
  id: "demo-master",
  tenantId: "demo-tenant",
  name: "Padilha Master",
  email: "padilha.ctt@gmail.com",
  role: "super_admin",
};
const DEMO_CREDENTIALS = {
  email: "padilha.ctt@gmail.com",
  password: "mp469535",
};
 const DEMO_CLIENTS_KEY = "crm.demo.clients";
 const DEMO_RECORDS_KEY = "crm.demo.records";
 
 const demoStore = {
  isOn: () => localStorage.getItem(DEMO_FLAG) === "1",
  enable: () => localStorage.setItem(DEMO_FLAG, "1"),
  disable: () => localStorage.removeItem(DEMO_FLAG),
  loadClients: (): Client[] => {
    try {
      return JSON.parse(localStorage.getItem(DEMO_CLIENTS_KEY) || "[]");
    } catch {
      return [];
    }
  },
   saveClients: (cs: Client[]) =>
     localStorage.setItem(DEMO_CLIENTS_KEY, JSON.stringify(cs)),
   loadRecords: (clientId: string): ClientRecord[] => {
     try {
       const allRaw = localStorage.getItem(DEMO_RECORDS_KEY) || "[]";
       const all: ClientRecord[] = JSON.parse(allRaw);
       return all
         .filter((r) => r.client_id === clientId)
         .sort((a, b) => b.created_at.localeCompare(a.created_at));
     } catch {
       return [];
     }
   },
    saveRecords: (rs: ClientRecord[]) =>
      localStorage.setItem(DEMO_RECORDS_KEY, JSON.stringify(rs)),
    addRecord: (r: ClientRecord) => {
      const allRaw = localStorage.getItem(DEMO_RECORDS_KEY) || "[]";
      const all: ClientRecord[] = JSON.parse(allRaw);
      all.push(r);
      localStorage.setItem(DEMO_RECORDS_KEY, JSON.stringify(all));
    },
 };

function uid() {
  return (crypto as { randomUUID?: () => string }).randomUUID?.() ??
    `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Detecta se o backend está respondendo. Cacheado por sessão.
let backendAvailable: boolean | null = null;
async function probeBackend(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const res = await fetch(`${API_URL}/health`, { method: "GET" });
    const ct = res.headers.get("content-type") || "";
    backendAvailable = res.ok && ct.includes("application/json");
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
}

// =====================================================================
// HTTP request
// =====================================================================
async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };
  if (auth) {
    const token = tokenStore.get();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch (e) {
    throw new ApiError((e as Error).message || "Falha de rede", 0);
  }

  if (res.status === 401 && auth) {
    tokenStore.clear();
    onUnauthorized?.();
  }
  if (res.status === 204) return undefined as T;

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    // Backend ausente (preview estático devolveu HTML). Sinaliza para o caller
    // decidir se cai no modo demo.
    throw new ApiError("Backend indisponível (resposta não-JSON)", 502);
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    throw new ApiError("Resposta inválida do servidor", 502);
  }

  if (!res.ok) {
    const message =
      (body as { error?: string })?.error || `Erro ${res.status} na requisição`;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

// =====================================================================
// Auth API
// =====================================================================
 export interface Origin {
   id: string;
   name: string;
 }
 
 export interface OriginInput {
   name: string;
 }
 
export const authApi = {
  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const ok = await probeBackend();
    if (!ok) {
      // Fallback demo
      const e = email.trim().toLowerCase();
      if (e !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
        throw new ApiError("Credenciais inválidas (modo demo)", 401);
      }
      demoStore.enable();
      return { token: "demo-token", user: DEMO_USER };
    }
    return request<{ token: string; user: AuthUser }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false
    );
  },
  async me(): Promise<AuthUser> {
    if (demoStore.isOn() && tokenStore.get() === "demo-token") {
      return DEMO_USER;
    }
    return request<AuthUser>("/auth/me");
  },
};

 // =====================================================================
 // Origins API
 // =====================================================================
 export const originsApi = {
   async list(): Promise<string[]> {
     if (demoStore.isOn()) {
       const saved = localStorage.getItem("crm.sources");
       return saved ? JSON.parse(saved) : ["Indicação", "Lead"];
     }
     return request<string[]>("/origins");
   },
   async create(data: OriginInput): Promise<string> {
     if (demoStore.isOn()) {
       const saved = localStorage.getItem("crm.sources");
       const sources: string[] = saved ? JSON.parse(saved) : ["Indicação", "Lead"];
       if (!sources.includes(data.name)) {
         const updated = [...sources, data.name];
         localStorage.setItem("crm.sources", JSON.stringify(updated));
       }
       return data.name;
     }
     return request<string>("/origins", { method: "POST", body: JSON.stringify(data) });
   },
 };
 
// =====================================================================
// Clients API
// =====================================================================
export const clientsApi = {
  async list(): Promise<Client[]> {
    if (demoStore.isOn()) return demoStore.loadClients();
    return request<Client[]>("/clients");
  },
  async get(id: string): Promise<Client> {
    if (demoStore.isOn()) {
      const c = demoStore.loadClients().find((x) => x.id === id);
      if (!c) throw new ApiError("Cliente não encontrado", 404);
      return c;
    }
    return request<Client>(`/clients/${id}`);
  },
  async create(data: ClientInput): Promise<Client> {
    if (demoStore.isOn()) {
      const now = new Date().toISOString();
      const c: Client = {
        id: uid(),
        tenant_id: DEMO_USER.tenantId ?? "demo-tenant",
        name: data.name,
        company: data.company ?? null,
         birth_date: data.birth_date ?? null,
         email: data.email ?? null,
         phone: data.phone ?? null,
         cpf_cnpj: data.cpf_cnpj ?? null,
         source: data.source ?? null,
         notes: data.notes ?? null,
        created_by: DEMO_USER.id,
        created_by_name: DEMO_USER.name,
        created_at: now,
        updated_at: now,
      };
      const all = [c, ...demoStore.loadClients()];
      demoStore.saveClients(all);
      return c;
    }
    return request<Client>("/clients", { method: "POST", body: JSON.stringify(data) });
  },
  async update(id: string, data: ClientInput): Promise<Client> {
    if (demoStore.isOn()) {
      const all = demoStore.loadClients();
      const i = all.findIndex((x) => x.id === id);
      if (i < 0) throw new ApiError("Cliente não encontrado", 404);
      all[i] = {
        ...all[i],
        name: data.name,
        company: data.company ?? null,
         birth_date: data.birth_date ?? null,
         email: data.email ?? null,
         phone: data.phone ?? null,
         cpf_cnpj: data.cpf_cnpj ?? null,
         source: data.source ?? null,
         notes: data.notes ?? null,
        updated_at: new Date().toISOString(),
      };
      demoStore.saveClients(all);
      return all[i];
    }
    return request<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  async remove(id: string): Promise<void> {
    if (demoStore.isOn()) {
      demoStore.saveClients(demoStore.loadClients().filter((x) => x.id !== id));
      return;
    }
    return request<void>(`/clients/${id}`, { method: "DELETE" });
  },
};

// =====================================================================
// Admin API
// =====================================================================
export const adminApi = {
  async overview(): Promise<AdminStats> {
    if (demoStore.isOn()) {
      return {
        ok: true,
        stats: { tenants: 1, users: 1, clients: demoStore.loadClients().length },
      };
    }
    return request<AdminStats>("/admin");
  },
   async listUsers(): Promise<AdminUser[]> {
     if (demoStore.isOn()) {
       return [
         {
           id: DEMO_USER.id,
           tenant_id: DEMO_USER.tenantId,
           name: DEMO_USER.name,
           email: DEMO_USER.email,
           role: DEMO_USER.role,
           created_at: new Date().toISOString(),
         },
       ];
     }
     return request<AdminUser[]>("/admin/users");
   },
 };
 
 // =====================================================
 // Records API
 // =====================================================
 export const recordsApi = {
   async list(clientId: string): Promise<ClientRecord[]> {
     if (demoStore.isOn()) return demoStore.loadRecords(clientId);
     return request<ClientRecord[]>(`/clients/${clientId}/records`);
   },
   async create(clientId: string, data: RecordInput): Promise<ClientRecord> {
     if (demoStore.isOn()) {
       const now = new Date().toISOString();
       const r: ClientRecord = {
         id: uid(),
         client_id: clientId,
         tenant_id: "demo-tenant",
         description: data.description,
         type: data.type ?? null,
         created_by: "demo-master",
         created_by_name: "Padilha Master",
         created_at: now,
       };
        demoStore.addRecord(r);
    async update(clientId: string, recordId: string, data: RecordInput): Promise<ClientRecord> {
      if (demoStore.isOn()) {
        const allRaw = localStorage.getItem(DEMO_RECORDS_KEY) || "[]";
        const all: ClientRecord[] = JSON.parse(allRaw);
        const i = all.findIndex((x) => x.id === recordId);
        if (i < 0) throw new ApiError("Registro não encontrado", 404);
        all[i] = {
          ...all[i],
          description: data.description,
          type: data.type ?? null,
        };
        demoStore.saveRecords(all);
        return all[i];
      }
      return request<ClientRecord>(`/clients/${clientId}/records/${recordId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    async remove(clientId: string, recordId: string): Promise<void> {
      if (demoStore.isOn()) {
        const allRaw = localStorage.getItem(DEMO_RECORDS_KEY) || "[]";
        const all: ClientRecord[] = JSON.parse(allRaw);
        demoStore.saveRecords(all.filter((x) => x.id !== recordId));
        return;
      }
      return request<void>(`/clients/${clientId}/records/${recordId}`, {
        method: "DELETE",
      });
    },
       return r;
     }
     return request<ClientRecord>(`/clients/${clientId}/records`, {
       method: "POST",
       body: JSON.stringify(data),
     });
   },
 };

// Limpa flag demo no logout (chamado pelo AuthContext indiretamente via tokenStore.clear()).
const _origClear = tokenStore.clear;
tokenStore.clear = () => {
  demoStore.disable();
  _origClear();
};

export const apiConfig = { url: API_URL, isDemo: () => demoStore.isOn() };
