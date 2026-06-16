import axios from 'axios';

export interface Customer {
  customerId: number;
  customerName: string;
  contactNo: string;
  email: string;
  address: string;
  customerType: string; // Map to Status e.g. "ACTIVE", "INACTIVE"
  registrationDate?: string;
  // Derived helper fields for consistent UI mapping
  contactPerson?: string;
  phone?: string;
  createdDate?: string;
  lastUpdatedDate?: string;
}

export interface CustomerInput {
  customerName: string;
  contactNo: string;
  email: string;
  address: string;
  customerType: string; // Saved as Status: ACTIVE/INACTIVE
  registrationDate?: string;
}

export interface PaginatedCustomers {
  content: Customer[];
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

export const customerService = {
  async getCustomers(page: number = 0, size: number = 10): Promise<PaginatedCustomers> {
    const response = await axios.get<any>(`/api/customers`, {
      headers: getAuthHeaders(),
      params: {
        page,
        size,
        sort: 'customerId,desc' // Default sorting by ID descending
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

    // Handle raw array response (if returned list directly)
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

  async getCustomerById(id: number): Promise<Customer> {
    const response = await axios.get<Customer>(`/api/customers/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async createCustomer(customer: CustomerInput): Promise<Customer> {
    const response = await axios.post<Customer>(`/api/customers`, customer, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async updateCustomer(id: number, customer: CustomerInput): Promise<Customer> {
    const response = await axios.put<Customer>(`/api/customers/${id}`, customer, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async deleteCustomer(id: number): Promise<void> {
    await axios.delete(`/api/customers/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
