import axios from 'axios';

export interface SalesOrderItem {
  salesOrderItemId?: number;
  finishedProductId: number;
  quantity: number;
  unitPrice: number;
}

export interface Payment {
  paymentId?: number;
  paymentAmount: number;
  paymentDate?: string;
  paymentMethod: string;
}

export interface SalesOrder {
  salesOrderId: number;
  customerId: number;
  employeeId: number;
  orderDate?: string;
  orderStatus: string; // Pending, Delivered, Cancelled
  totalAmount: number;
  salesOrderItems: SalesOrderItem[];
  payments?: Payment[];
}

export interface SalesOrderInput {
  customerId: number;
  employeeId: number;
  orderDate?: string;
  orderStatus: string;
  salesOrderItems: SalesOrderItem[];
  payments?: Payment[];
}

export interface SalesInvoice {
  invoiceNumber: number;
  salesOrderId: number;
  customerId: number;
  orderDate?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
}

export interface PaginatedSalesOrders {
  content: SalesOrder[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface DropdownItem {
  id: number;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const tokenType = localStorage.getItem('tokenType') || 'Bearer';
  return token ? { Authorization: `${tokenType} ${token}` } : {};
};

export const salesOrderService = {
  async getSalesOrders(page: number = 0, size: number = 10): Promise<PaginatedSalesOrders> {
    const response = await axios.get<any>(`/api/sales-orders`, {
      headers: getAuthHeaders(),
      params: {
        page,
        size,
        sort: 'salesOrderId,desc'
      }
    });

    if (response.data && Array.isArray(response.data.content)) {
      return {
        content: response.data.content,
        totalElements: response.data.totalElements ?? response.data.content.length,
        totalPages: response.data.totalPages ?? 1,
        size: response.data.size ?? size,
        number: response.data.number ?? page,
      };
    }

    if (Array.isArray(response.data)) {
      return {
        content: response.data,
        totalElements: response.data.length,
        totalPages: 1,
        size: response.data.length,
        number: 0,
      };
    }

    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: size,
      number: page,
    };
  },

  async getSalesOrderById(id: number): Promise<SalesOrder> {
    const response = await axios.get<SalesOrder>(`/api/sales-orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async createSalesOrder(order: SalesOrderInput): Promise<SalesOrder> {
    const response = await axios.post<SalesOrder>(`/api/sales-orders`, order, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async updateSalesOrder(id: number, order: SalesOrderInput): Promise<SalesOrder> {
    const response = await axios.put<SalesOrder>(`/api/sales-orders/${id}`, order, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async deliverSalesOrder(id: number, warehouseId: number): Promise<any> {
    const response = await axios.post<any>(`/api/sales-orders/${id}/deliver`, null, {
      headers: getAuthHeaders(),
      params: {
        warehouseId
      }
    });
    return response.data;
  },

  async generateInvoice(id: number): Promise<SalesInvoice> {
    const response = await axios.get<SalesInvoice>(`/api/sales-orders/${id}/invoice`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async deleteSalesOrder(id: number): Promise<void> {
    await axios.delete(`/api/sales-orders/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  // Helper APIs for dropdown support lists
  async getCustomers(): Promise<DropdownItem[]> {
    try {
      const response = await axios.get<any>(`/api/customers`, {
        headers: getAuthHeaders(),
        params: { page: 0, size: 500 }
      });
      const cList = response.data?.content || response.data || [];
      return cList.map((c: any) => ({
        id: c.customerId || c.id,
        name: c.customerName || c.name || `Customer #${c.customerId || c.id}`,
        email: c.email,
        address: c.address,
        phone: c.contactNo
      }));
    } catch {
      return [];
    }
  },

  async getEmployees(): Promise<DropdownItem[]> {
    try {
      const response = await axios.get<any>(`/api/employees`, {
        headers: getAuthHeaders(),
        params: { page: 0, size: 500 }
      });
      const empList = response.data?.content || response.data || [];
      return empList.map((e: any) => ({
        id: e.employeeId || e.id,
        name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.username || `Employee #${e.employeeId || e.id}`
      }));
    } catch {
      return [];
    }
  },

  async getFinishedProducts(): Promise<any[]> {
    try {
      const response = await axios.get<any>(`/api/items`, {
        headers: getAuthHeaders(),
        params: { page: 0, size: 500 }
      });
      return response.data?.content || response.data || [];
    } catch {
      return [];
    }
  },

  async getWarehouses(): Promise<DropdownItem[]> {
    try {
      const response = await axios.get<any>(`/api/warehouses`, {
        headers: getAuthHeaders(),
        params: { page: 0, size: 200 }
      });
      const wList = response.data?.content || response.data || [];
      return wList.map((w: any) => ({
        id: w.warehouseId || w.id,
        name: w.warehouseName || w.name || `Warehouse #${w.warehouseId || w.id}`
      }));
    } catch {
      return [];
    }
  }
};
