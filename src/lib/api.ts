// Cliente HTTP simples para a API do CRM.
// Configure VITE_API_URL e VITE_API_KEY no seu .env (frontend).

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const API_KEY = (import.meta.env.VITE_API_KEY as string | undefined) ?? "";

export interface Client {
  id: string;
  name: string;
  company: string | null;
  birth_date: string | null; // ISO date "YYYY-MM-DD"
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientInput {
  name: string;
  company?: string | null;
  birth_date?: string | null;
  notes?: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      "VITE_API_URL não configurada. Defina no .env do frontend.",
      0
    );
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
      ...(init.headers || {}),
    },
  });

  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* sem corpo */
  }

  if (!res.ok) {
    const message =
      (body as { error?: string })?.error ||
      `Erro ${res.status} na requisição`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}

export const clientsApi = {
  list: () => request<Client[]>("/clients"),
  get: (id: string) => request<Client>(`/clients/${id}`),
  create: (data: ClientInput) =>
    request<Client>("/clients", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: ClientInput) =>
    request<Client>(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`/clients/${id}`, { method: "DELETE" }),
};

export const apiConfig = {
  url: API_URL,
  hasKey: Boolean(API_KEY),
};
