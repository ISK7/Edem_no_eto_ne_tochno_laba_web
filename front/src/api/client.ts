import type {
  AdminListResponse,
  CarBrand,
  CreateRequestPayload,
  RequestStatus,
  SortOption,
  TestDriveRequest,
  User,
} from '../types';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
  allowRefresh?: boolean;
}

interface SessionPayload {
  user: User;
  accessToken: string;
}

interface ErrorPayload {
  error?: {
    message?: string;
    fields?: Record<string, string>;
    code?: string;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;
  readonly code?: string;

  constructor(
    message: string,
    status = 0,
    fields: Record<string, string> = {},
    code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<SessionPayload | null> | null = null;
let sessionLostHandler: (() => void) | null = null;

export function setSessionLostHandler(handler: (() => void) | null): void {
  sessionLostHandler = handler;
}

export function clearAccessToken(): void {
  accessToken = null;
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Не удалось связаться с сервером. Проверьте подключение.', 0);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = (payload as ErrorPayload | null)?.error;
    throw new ApiError(
      error?.message ?? `Ошибка запроса (${response.status})`,
      response.status,
      error?.fields ?? {},
      error?.code,
    );
  }

  return payload as T;
}

async function performRefresh(): Promise<SessionPayload | null> {
  try {
    const session = await rawRequest<SessionPayload>('/auth/refresh', {
      method: 'POST',
      auth: false,
    });
    accessToken = session.accessToken;
    return session;
  } catch {
    accessToken = null;
    return null;
  }
}

function refreshSession(): Promise<SessionPayload | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requiresAuth = options.auth ?? true;

  if (requiresAuth && !accessToken) {
    const session = await refreshSession();
    if (!session) {
      sessionLostHandler?.();
      throw new ApiError('Сессия истекла. Войдите снова.', 401, {}, 'SESSION_EXPIRED');
    }
  }

  try {
    return await rawRequest<T>(path, options);
  } catch (error) {
    const canRefresh =
      error instanceof ApiError &&
      error.status === 401 &&
      requiresAuth &&
      options.allowRefresh !== false;

    if (!canRefresh) throw error;

    const session = await refreshSession();
    if (!session) {
      sessionLostHandler?.();
      throw new ApiError('Сессия истекла. Войдите снова.', 401, {}, 'SESSION_EXPIRED');
    }

    return rawRequest<T>(path, { ...options, allowRefresh: false });
  }
}

async function submitAuth(path: string, body: unknown): Promise<User> {
  const session = await rawRequest<SessionPayload>(path, {
    method: 'POST',
    body,
    auth: false,
  });
  accessToken = session.accessToken;
  return session.user;
}

export const authApi = {
  login(login: string, password: string): Promise<User> {
    return submitAuth('/auth/login', { login, password });
  },

  register(values: {
    login: string;
    password: string;
    fullName: string;
    phone: string;
    email: string;
  }): Promise<User> {
    return submitAuth('/auth/register', values);
  },

  async restore(): Promise<User | null> {
    const session = await refreshSession();
    return session?.user ?? null;
  },

  async logout(): Promise<void> {
    try {
      await rawRequest('/auth/logout', { method: 'POST', auth: false });
    } finally {
      accessToken = null;
    }
  },
};

export const catalogApi = {
  async cars(): Promise<CarBrand[]> {
    const data = await request<{ brands: CarBrand[] }>('/catalog/cars', { auth: false });
    return data.brands;
  },
};

export const requestsApi = {
  async mine(): Promise<TestDriveRequest[]> {
    const data = await request<{ requests: TestDriveRequest[] }>('/requests');
    return data.requests;
  },

  async create(payload: CreateRequestPayload): Promise<TestDriveRequest> {
    const data = await request<{ request: TestDriveRequest }>('/requests', {
      method: 'POST',
      body: payload,
    });
    return data.request;
  },
};

export interface AdminQuery {
  page: number;
  pageSize: number;
  status: RequestStatus | 'ALL';
  search: string;
  sort: SortOption;
}

export const adminApi = {
  list(query: AdminQuery): Promise<AdminListResponse> {
    const params = new URLSearchParams({
      page: String(query.page),
      pageSize: String(query.pageSize),
      status: query.status,
      search: query.search,
      sort: query.sort,
    });

    return request<AdminListResponse>(`/admin/requests?${params.toString()}`);
  },

  async schedule(): Promise<TestDriveRequest[]> {
    const data = await request<{ requests: TestDriveRequest[] }>('/admin/schedule');
    return data.requests;
  },

  async updateStatus(
    id: number,
    status: 'APPROVED' | 'COMPLETED' | 'REJECTED',
    rejectionReason?: string,
  ): Promise<TestDriveRequest> {
    const data = await request<{ request: TestDriveRequest }>(
      `/admin/requests/${id}/status`,
      {
        method: 'PATCH',
        body: { status, rejectionReason },
      },
    );
    return data.request;
  },
};
