/**
 * FrankAI Frontend - API Client
 * =============================
 * Centralized HTTP client for all backend API calls.
 * Handles JWT token management, error handling, and request/response typing.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// ── Token Management ─────────────────────────────────────────

const TOKEN_KEY = 'frankai_token'
const USER_KEY = 'frankai_user'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setUserData(user: any): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getUserData(): any | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(USER_KEY)
  return data ? JSON.parse(data) : null
}

// ── HTTP Client ──────────────────────────────────────────────

interface ApiError {
  status: number
  detail: string
}

class ApiClientError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
    this.name = 'ApiClientError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Don't set Content-Type for FormData (file uploads)
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle 401/403 globally — clear token and redirect to login
  if (response.status === 401 || response.status === 403) {
    removeToken()
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
    // throw new ApiClientError(response.status, 'Session expired. Please log in again.')
  }

  if (response.status === 204) {
    return {} as T
  }

  const json = await response.json()

  if (!response.ok) {
    // Backend wraps errors as { status: false, status_code, message, data }
    // but may also return raw { detail: "..." } errors
    const isWrapped = json && typeof json === 'object' && !Array.isArray(json) && 'message' in json
    throw new ApiClientError(
      response.status,
      isWrapped ? json.message : (json?.detail || 'An error occurred'),
    )
  }

  // Unwrap standardized backend wrapper { status, status_code, message, data }
  // Some endpoints (e.g. admin) return raw data without the wrapper
  if (json && typeof json === 'object' && !Array.isArray(json) && 'status' in json && 'data' in json) {
    return (json as Record<string, unknown>).data as T
  }
  return json as T
}

// ── Typed API Methods ────────────────────────────────────────

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: 'admin' | 'estimator'
}

export interface UserResponse {
  _id: string
  id: string
  name: string
  email: string
  role: 'admin' | 'estimator'
  is_active: boolean
  created_at: string
  last_login: string | null
  avatar_url?: string | null
  avatar_public_id?: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: UserResponse
}

// Project types
export interface ProjectResponse {
  _id: string
  id: string
  name: string
  notes?: string
  status: 'processing' | 'needs-review' | 'ready' | 'exported'
  pages: number
  file_size: string
  file_name: string
  mapping_complete: boolean
  mappingComplete?: boolean
  created_at: string
  createdAt?: string
  last_exported_at?: string
  lastExportedAt?: string | null
  symbols_count: number
  user_id: string
  file_public_id?: string
}

export interface DetectedSymbol {
  _id?: string
  id: string
  type: string
  label: string
  confidence: number
  page: number
  x: number
  y: number
  verified: boolean
  note?: string
}

export interface MappingRow {
  _id?: string
  symbolType?: string
  symbol_type?: string
  productCode?: string
  product_code?: string
  description: string
  unit: string
  notes: string
  status: 'mapped' | 'unmapped'
}

export interface ProjectDetailResponse extends ProjectResponse {
  symbols: DetectedSymbol[]
  mappings: MappingRow[]
}

function normalizeProject<T extends ProjectResponse>(project: T): T {
  const createdAt = project.created_at || project.createdAt || ''
  const lastExportedAt = project.last_exported_at || project.lastExportedAt || undefined
  const mappingComplete = project.mapping_complete ?? project.mappingComplete ?? false

  return {
    ...project,
    created_at: createdAt,
    createdAt,
    last_exported_at: lastExportedAt,
    lastExportedAt,
    mapping_complete: mappingComplete,
    mappingComplete,
  }
}

export interface DashboardStats {
  plans_processed: number
  avg_processing_time: string
  avg_confidence: string
  total_symbols: number
}

export interface UploadResponse {
  file_name: string
  file_size: string
  pages: number
  public_id: string
  secure_url: string
}

export interface ExportData {
  project_name: string
  export_mode: string
  total_items: number
  total_categories: number
  rows: Array<{
    product_code?: string
    description?: string
    quantity: number
    unit?: string
    notes?: string
    symbol_type?: string
  }>
}

// Admin types
export interface SymbolCategory {
  _id: string
  name: string
  description: string
  active: boolean
  symbol_count?: number
}

export interface MappingTemplate {
  _id: string
  name: string
  description: string
  created_at: string
  is_default: boolean
  mappings: MappingRow[]
}

export interface TeamMember {
  _id: string
  name: string
  email: string
  role: string
  last_login: string | null
}

export interface ActivityLog {
  _id: string
  action: string
  user: string
  type: string
  created_at: string
}

export interface SystemHealth {
  services: Array<{
    name: string
    status: string
    latency: string
  }>
}

// ── Auth API ─────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    request<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<UserResponse>('/auth/me'),

  updateMe: (data: { name?: string; email?: string }) =>
    request<UserResponse>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  uploadAvatar: async (file: File) => {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/auth/me/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    if (response.status === 401 || response.status === 403) {
      removeToken()
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
      // throw new ApiClientError(response.status, 'Session expired. Please log in again.')
    }

    const json = await response.json()
    if (!response.ok) {
      const isWrapped = json && typeof json === 'object' && !Array.isArray(json) && 'message' in json
      throw new ApiClientError(
        response.status,
        isWrapped ? json.message : (json?.detail || 'Image upload failed'),
      )
    }

    // Unwrap backend wrapper { status, status_code, message, data }
    if (json && typeof json === 'object' && !Array.isArray(json) && 'status' in json && 'data' in json) {
      return (json as Record<string, unknown>).data as UserResponse
    }
    return json as UserResponse
  },

  forgotPassword: (email: string) =>
    request<{ email: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyResetToken: (email: string, token: string) =>
    request<Record<string, unknown>>('/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    }),

  resetPassword: (email: string, token: string, new_password: string) =>
    request<UserResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, new_password }),
    }),
}

// ── Projects API ─────────────────────────────────────────────

export const projectsApi = {
  getStats: () =>
    request<DashboardStats>('/projects/stats'),

  list: (params?: {
    status?: string
    search?: string
    skip?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status)
    if (params?.search) searchParams.set('search', params.search)
    if (params?.skip !== undefined) searchParams.set('skip', String(params.skip))
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return request<ProjectResponse[]>(`/projects/${qs ? `?${qs}` : ''}`).then((projects) =>
      projects.map(normalizeProject),
    )
  },

  getById: (id: string) =>
    request<ProjectDetailResponse>(`/projects/${id}`).then(normalizeProject),

  create: (data: {
    name: string
    notes?: string
    status?: string
    pages: number
    file_size: string
    file_name: string
    mapping_complete?: boolean
    file_public_id?: string
  }) =>
    request<ProjectResponse>('/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(normalizeProject),

  update: (id: string, data: Record<string, unknown>) =>
    request<ProjectResponse>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(normalizeProject),

  delete: (id: string) =>
    request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    }),

  // Symbols
  batchSaveSymbols: (projectId: string, symbols: Record<string, unknown>[]) =>
    request<Record<string, unknown>>(`/projects/${projectId}/symbols`, {
      method: 'PATCH',
      body: JSON.stringify(symbols),
    }),

  updateSymbol: (projectId: string, symbolId: string, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/projects/${projectId}/symbols/${symbolId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteSymbol: (projectId: string, symbolId: string) =>
    request<{ message: string }>(`/projects/${projectId}/symbols/${symbolId}`, {
      method: 'DELETE',
    }),

  // Mappings
  saveMappings: (projectId: string, mappings: MappingRow[]) => {
    // Normalize mapping keys for backend (camelCase -> snake_case)
    const normalized = mappings.map(m => ({
      symbolType: m.symbolType || m.symbol_type,
      product_code: m.productCode || m.product_code || '',
      description: m.description || '',
      unit: m.unit || 'ea',
      notes: m.notes || '',
      status: m.status || 'unmapped',
    }))
    return request<Record<string, unknown>>(`/projects/${projectId}/mappings`, {
      method: 'PATCH',
      body: JSON.stringify(normalized),
    })
  },

  // Export
  export: (projectId: string, mode: 'basic' | 'simpro' = 'simpro') =>
    request<ExportData>(`/projects/${projectId}/export?mode=${mode}`),

  // Upload
  uploadPdf: async (file: File) => {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)

    const url = `${API_BASE_URL}/projects/upload`
    const response = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    if (response.status === 401 || response.status === 403) {
      removeToken()
      if (typeof window !== 'undefined') window.location.href = '/login'
      // throw new ApiClientError(response.status, 'Session expired.')
    }

    const json = await response.json()
    if (!response.ok) {
      const isWrapped = json && typeof json === 'object' && !Array.isArray(json) && 'message' in json
      throw new ApiClientError(
        response.status,
        isWrapped ? json.message : (json?.detail || 'Upload failed'),
      )
    }

    // Unwrap backend wrapper { status, status_code, message, data }
    if (json && typeof json === 'object' && !Array.isArray(json) && 'status' in json && 'data' in json) {
      return (json as Record<string, unknown>).data as UploadResponse
    }
    return json as UploadResponse
  },
}

// ── Admin API ────────────────────────────────────────────────

export const adminApi = {
  // Symbol Categories
  listCategories: () =>
    request<SymbolCategory[]>('/admin/symbol-categories'),

  createCategory: (data: { name: string; description: string }) =>
    request<SymbolCategory>('/admin/symbol-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: Record<string, unknown>) =>
    request<SymbolCategory>(`/admin/symbol-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    request<{ message: string }>(`/admin/symbol-categories/${id}`, {
      method: 'DELETE',
    }),

  // Mapping Templates
  listTemplates: () =>
    request<MappingTemplate[]>('/admin/mapping-templates'),

  createTemplate: (data: {
    name: string
    description: string
    mappings: MappingRow[]
    is_default?: boolean
  }) =>
    request<MappingTemplate>('/admin/mapping-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTemplate: (id: string, data: Record<string, unknown>) =>
    request<MappingTemplate>(`/admin/mapping-templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTemplate: (id: string) =>
    request<{ message: string }>(`/admin/mapping-templates/${id}`, {
      method: 'DELETE',
    }),

  applyTemplate: (templateId: string, projectId: string) =>
    request<Record<string, unknown>>(`/admin/mapping-templates/${templateId}/apply/${projectId}`, {
      method: 'POST',
    }),

  // Team
  inviteMember: (data: {
    name: string
    email: string
    role: 'admin' | 'estimator'
  }) =>
    request<TeamMember>('/admin/team/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listTeam: () =>
    request<TeamMember[]>('/admin/team'),

  updateTeamMember: (userId: string, data: Record<string, unknown>) =>
    request<TeamMember>(`/admin/team/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  removeTeamMember: (userId: string) =>
    request<{ message: string }>(`/admin/team/${userId}`, {
      method: 'DELETE',
    }),

  // Activity
  getActivity: (limit: number = 10) =>
    request<ActivityLog[]>(`/admin/activity?limit=${limit}`),

  // System Health
  getSystemHealth: () =>
    request<SystemHealth>('/admin/system-health'),
}

export { ApiClientError }
export default { authApi, projectsApi, adminApi }
