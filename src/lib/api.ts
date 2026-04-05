// Requests go to same origin — Next.js rewrites proxy /api/* to the backend
const API_BASE_URL = '';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface LoginResponse {
  role: number;
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

// Backend standard response: { code, data, errors, status }
interface BackendResponse<T> {
  code: number;
  data: T | null;
  errors: string | null;
  status: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  // Merge custom headers (e.g. Authorization)
  if (options.headers) {
    const custom = new Headers(options.headers);
    custom.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const body: BackendResponse<T> = await response.json();

    if (!response.ok || body.status === 'ERROR') {
      return {
        success: false,
        message: body.errors || `Request failed with status ${body.code || response.status}`,
      };
    }

    return {
      success: true,
      data: body.data ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

export const authApi = {
  login: (body: LoginRequest) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  register: (body: RegisterRequest) =>
    request<string>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ── CoffeeShop Types ──

export interface CoffeeShopUser {
  id: string;
  username: string;
  role: number;
}

export interface FotoProfil {
  id: string;
  filename: string;
  url: string;
}

export interface CoffeeShop {
  id: string;
  nama_toko: string;
  alamat: string;
  deskripsi: string;
  tags: string;
  latitude: number | null;
  longitude: number | null;
  user: CoffeeShopUser;
  fotoProfil: FotoProfil | null;
  city?: string;
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
  facebook?: string;
  twitter?: string;
}

export interface CoffeeShopSubmitRequest {
  nama_toko: string;
  alamat: string;
  deskripsi: string;
  tags: string;
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
  facebook?: string;
  twitter?: string;
}

export const coffeeshopApi = {
  getMine: (token: string) =>
    request<CoffeeShop>('/api/coffeeshop/mine', {
      headers: createAuthHeaders(token),
    }),

  submit: (token: string, body: CoffeeShopSubmitRequest, shopId?: string) =>
    request<CoffeeShop>(`/api/coffeeshop/submit${shopId ? `?shopId=${shopId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: createAuthHeaders(token),
    }),

  uploadFotoProfil: async (token: string, shopId: string, file: File): Promise<ApiResponse<FotoProfil>> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/coffeeshop/foto-profil/upload/${shopId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const body = await response.json();

      if (!response.ok || body.status === 'ERROR') {
        return { success: false, message: body.errors || 'Upload gagal' };
      }
      return { success: true, data: body.data ?? undefined };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Network error' };
    }
  },
};

export function createAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

// ── Menu Types ──

export interface MenuFoto {
  id: string;
  filename: string;
  url: string;
}

export interface MenuItem {
  id: string;
  nama: string;
  harga: number;
  deskripsi: string;
  foto: MenuFoto[];
}

export interface MenuSubmitRequest {
  nama: string;
  harga: number;
  deskripsi: string;
}

export const menuApi = {
  getByShop: (token: string, shopId: string) =>
    request<MenuItem[]>(`/api/menu/${shopId}`, {
      headers: createAuthHeaders(token),
    }),

  getDetail: (token: string, menuId: string) =>
    request<MenuItem>(`/api/menu/${menuId}/detail`, {
      headers: createAuthHeaders(token),
    }),

  submit: async (token: string, shopId: string, body: MenuSubmitRequest, fotos?: File[]): Promise<ApiResponse<MenuItem>> => {
    const formData = new FormData();
    formData.append('nama', body.nama);
    formData.append('harga', body.harga.toString());
    formData.append('deskripsi', body.deskripsi);
    if (fotos) {
      fotos.forEach((f) => formData.append('foto', f));
    }

    try {
      const response = await fetch(`/api/menu/${shopId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || data.status === 'ERROR') {
        return { success: false, message: data.errors || 'Submit gagal' };
      }
      return { success: true, data: data.data ?? undefined };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Network error' };
    }
  },

  update: async (token: string, menuId: string, body: MenuSubmitRequest, fotos?: File[]): Promise<ApiResponse<MenuItem>> => {
    const formData = new FormData();
    formData.append('nama', body.nama);
    formData.append('harga', body.harga.toString());
    formData.append('deskripsi', body.deskripsi);
    if (fotos) {
      fotos.forEach((f) => formData.append('foto', f));
    }

    try {
      const response = await fetch(`/api/menu/${menuId}/update`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || data.status === 'ERROR') {
        return { success: false, message: data.errors || 'Update gagal' };
      }
      return { success: true, data: data.data ?? undefined };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Network error' };
    }
  },

  uploadFoto: async (token: string, menuId: string, files: File[]): Promise<ApiResponse<MenuItem>> => {
    const formData = new FormData();
    files.forEach((f) => formData.append('foto', f));

    try {
      const response = await fetch(`/api/menu/${menuId}/upload-foto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || data.status === 'ERROR') {
        return { success: false, message: data.errors || 'Upload gagal' };
      }
      return { success: true, data: data.data ?? undefined };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Network error' };
    }
  },

  deleteFoto: async (token: string, menuId: string, fotoId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`/api/menu/${menuId}/delete-foto/${fotoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || data.status === 'ERROR') {
        return { success: false, message: data.errors || 'Hapus foto gagal' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Network error' };
    }
  },

  deleteMenu: async (token: string, menuId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`/api/menu/${menuId}/delete`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || data.status === 'ERROR') {
        return { success: false, message: data.errors || 'Hapus menu gagal' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Network error' };
    }
  },
};

export { request, API_BASE_URL };
