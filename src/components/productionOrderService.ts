import axios from 'axios';

export interface ProductionOrder {
  productionOrderId: number;
  finishedProductId: number;
  employeeId: number;
  productionDate?: string;
  quantityToProduce: number;
  quantityProduced: number;
  status: string; // Planned, InProgress, Completed, Cancelled
  startDate?: string;
  endDate?: string;
  priority?: string; // HIGH, MEDIUM, LOW
  materialUsages?: any[];
  assignments?: any[];
}

export interface ProductionOrderInput {
  finishedProductId: number;
  employeeId: number;
  quantityToProduce: number;
  quantityProduced?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  priority?: string;
}

export interface PaginatedProductionOrders {
  content: ProductionOrder[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Additional helpers for dropdown data
export interface DropdownItem {
  id: number;
  name: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const tokenType = localStorage.getItem('tokenType') || 'Bearer';
  return token ? { Authorization: `${tokenType} ${token}` } : {};
};

export const productionOrderService = {
  async getProductionOrders(page: number = 0, size: number = 10): Promise<PaginatedProductionOrders> {
    const response = await axios.get<any>(`/api/production-orders`, {
      headers: getAuthHeaders(),
      params: {
        page,
        size,
        sort: 'productionOrderId,desc'
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

  async getProductionOrderById(id: number): Promise<ProductionOrder> {
    const response = await axios.get<ProductionOrder>(`/api/production-orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async createProductionOrder(order: ProductionOrderInput): Promise<ProductionOrder> {
    const response = await axios.post<ProductionOrder>(`/api/production-orders`, order, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async updateProductionOrder(id: number, order: ProductionOrderInput): Promise<ProductionOrder> {
    const response = await axios.put<ProductionOrder>(`/api/production-orders/${id}`, order, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async completeProductionOrder(id: number, warehouseId: number): Promise<any> {
    const response = await axios.post<any>(`/api/production-orders/${id}/complete`, null, {
      headers: getAuthHeaders(),
      params: {
        warehouseId
      }
    });
    return response.data;
  },

  async deleteProductionOrder(id: number): Promise<void> {
    await axios.delete(`/api/production-orders/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  // Helper APIs for form selection lists
  async getFinishedProducts(): Promise<DropdownItem[]> {
    try {
      const response = await axios.get<any>(`/api/items`, {
        headers: getAuthHeaders(),
        params: { page: 0, size: 200 }
      });
      const itemsList = response.data?.content || response.data || [];
      return itemsList.map((i: any) => ({
        id: i.itemId || i.id,
        name: i.itemName || i.name || `Item #${i.itemId || i.id}`
      }));
    } catch {
      return [];
    }
  },

  async getEmployees(): Promise<DropdownItem[]> {
    try {
      const response = await axios.get<any>(`/api/employees`, {
        headers: getAuthHeaders(),
        params: { page: 0, size: 200 }
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
