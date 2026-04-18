// Cliente HTTP para a API do CRM, com JWT Bearer.
// O nginx injeta a x-api-key (perímetro). O JWT identifica usuário/tenant.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "/api";
const TOKEN_KEY = "crm.token";

export type Role = "user" | "admin" | "super_admin";

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  company: string | null;
  birth_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientInput {
  name: string;
  company?: string | null;
  birth_date?: string | null;
  notes?: string | null;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
}

export interface AdminUser {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface NewUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
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

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };
  if (auth) {
    const token = tokenStore.get();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && auth) {
    tokenStore.clear();
    onUnauthorized?.();
  }
  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* sem corpo */
  }

  if (!res.ok) {
    const message =
      (body as { error?: string })?.error || `Erro ${res.status} na requisição`;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false
    ),
  me: () => request<AuthUser>("/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const clientsApi = {
  list: () => request<Client[]>("/clients"),
  get: (id: string) => request<Client>(`/clients/${id}`),
  create: (data: ClientInput) =>
    request<Client>("/clients", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: ClientInput) =>
    request<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/clients/${id}`, { method: "DELETE" }),
};

export const adminApi = {
  listUsers: () => request<AdminUser[]>("/admin/users"),
  createUser: (data: NewUserInput) =>
    request<AdminUser>("/admin/users", { method: "POST", body: JSON.stringify(data) }),
  updateRole: (id: string, role: Role) =>
    request<AdminUser>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  deleteUser: (id: string) =>
    request<void>(`/admin/users/${id}`, { method: "DELETE" }),
  listInvites: () => request<Invite[]>("/admin/invites"),
  createInvite: (data: NewInviteInput) =>
    request<{ invite: Invite; token: string }>("/admin/invites", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  revokeInvite: (id: string) =>
    request<void>(`/admin/invites/${id}`, { method: "DELETE" }),
};

export interface Invite {
  id: string;
  tenant_id: string;
  email: string | null;
  role: Role;
  created_by: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
}

export interface NewInviteInput {
  email?: string;
  role: Role;
  expiresInHours: number;
}

export interface InviteLookup {
  email: string | null;
  role: Role;
  expires_at: string;
}

export const invitesApi = {
  lookup: (token: string) =>
    request<InviteLookup>(
      `/invites/lookup?token=${encodeURIComponent(token)}`,
      {},
      false
    ),
  accept: (token: string, name: string, password: string) =>
    request<{ token: string; user: AuthUser }>(
      "/invites/accept",
      {
        method: "POST",
        body: JSON.stringify({ token, name, password }),
      },
      false
    ),
};

export const apiConfig = { url: API_URL };
