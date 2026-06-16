import axios from 'axios';

export interface Supplier {
  supplierId: number;
  supplierName: string;
  contactNo: string;
  email: string;
  address: string;
  supplierStatus: string; // e.g. "ACTIVE", "INACTIVE"
  contactPerson: string;
  phone: string;
  createdDate?: string; // Fallback field requested by UI
  lastUpdatedDate?: string; // Fallback field requested by UI
}

export interface SupplierInput {
  supplierName: string;
  contactNo: string;
  email: string;
  address: string;
  supplierStatus: string;
  contactPerson: string;
  phone: string;
}

export interface PaginatedSuppliers {
  content: Supplier[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const tokenType = localStorage.getItem('tokenType') || 'Bearer';
  return token ? { Authorization: `${tokenType} ${token}` } : {};
};

export const supplierService = {
  async getSuppliers(page: number = 0, size: number = 10): Promise<PaginatedSuppliers> {
    const response = await axios.get<any>(`/api/suppliers`, {
      headers: getAuthHeaders(),
      params: {
        page,
        size,
        sort: 'supplierId,desc' // Default sorting by ID descending
      }
    });

    // Handle standard Spring Boot Page response
    if (response.data && Array.isArray(response.data.content)) {
      return {
        content: response.data.content,
        totalElements: response.data.totalElements ?? response.data.content.length,
        totalPages: response.data.totalPages ?? 1,
        size: response.data.size ?? size,
        number: response.data.number ?? page,
      };
    }

    // Handle raw array response (if backend gets modified or returned list directly)
    if (Array.isArray(response.data)) {
      return {
        content: response.data,
        totalElements: response.data.length,
        totalPages: 1,
        size: response.data.length,
        number: 0,
      };
    }

    // Fallback empty state
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: size,
      number: page,
    };
  },

  async getSupplierById(id: number): Promise<Supplier> {
    const response = await axios.get<Supplier>(`/api/suppliers/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async createSupplier(supplier: SupplierInput): Promise<Supplier> {
    const response = await axios.post<Supplier>(`/api/suppliers`, supplier, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async updateSupplier(id: number, supplier: SupplierInput): Promise<Supplier> {
    const response = await axios.put<Supplier>(`/api/suppliers/${id}`, supplier, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async deleteSupplier(id: number): Promise<void> {
    await axios.delete(`/api/suppliers/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
