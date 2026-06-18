import axios from 'axios';

export interface PurchaseOrderItem {
  purchaseOrderItemId?: number;
  rawMaterialId: number;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  description?: string;
}

export interface PurchaseOrder {
  purchaseOrderId: number;
  poNumber?: string;
  supplierId: number;
  orderDate?: string;
  expectedDate?: string;
  totalAmount: number;
  status: string; // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, RECEIVED
  createdBy?: string;
  createdDate?: string;
  lastUpdatedDate?: string;
  notes?: string;
  purchaseOrderItems: PurchaseOrderItem[];
  
  // Client calculated or mapped properties
  supplierName?: string;
  subtotal?: number;
  tax?: number;
}

export interface PurchaseOrderInput {
  supplierId: number;
  orderDate?: string;
  expectedDate?: string;
  status: string;
  notes?: string;
  purchaseOrderItems: PurchaseOrderItem[];
  totalAmount: number;
}

export interface PaginatedPurchaseOrders {
  content: PurchaseOrder[];
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

const mapFrontendStatusToBackend = (status?: string): string => {
  if (!status) return 'Pending';
  switch (status.toUpperCase()) {
    case 'DRAFT':
      return 'Pending';
    case 'PENDING_APPROVAL':
      return 'PendingApproval';
    case 'APPROVED':
      return 'Approved';
    case 'RECEIVED':
      return 'Received';
    case 'REJECTED':
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
};

const mapBackendStatusToFrontend = (status?: string): string => {
  if (!status) return 'DRAFT';
  switch (status) {
    case 'Pending':
      return 'DRAFT';
    case 'PendingApproval':
      return 'PENDING_APPROVAL';
    case 'Approved':
      return 'APPROVED';
    case 'Received':
      return 'RECEIVED';
    case 'Cancelled':
      return 'REJECTED';
    default:
      return status.toUpperCase();
  }
};

const mapPurchaseOrderFromBackend = (po: any): PurchaseOrder => {
  if (!po) return po;
  return {
    ...po,
    status: mapBackendStatusToFrontend(po.status)
  };
};

const mapPurchaseOrderInputToBackend = (po: PurchaseOrderInput): PurchaseOrderInput => {
  if (!po) return po;
  return {
    ...po,
    status: mapFrontendStatusToBackend(po.status)
  };
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const tokenType = localStorage.getItem('tokenType') || 'Bearer';
  return token ? { Authorization: `${tokenType} ${token}` } : {};
};

export const purchaseOrderService = {
  async getPurchaseOrders(page: number = 0, size: number = 10): Promise<PaginatedPurchaseOrders> {
    const response = await axios.get<any>(`/api/purchase-orders`, {
      headers: getAuthHeaders(),
      params: {
        page,
        size,
        sort: 'purchaseOrderId,desc'
      }
    });

    if (response.data && Array.isArray(response.data.content)) {
      return {
        content: response.data.content.map(mapPurchaseOrderFromBackend),
        totalElements: response.data.totalElements ?? response.data.content.length,
        totalPages: response.data.totalPages ?? 1,
        size: response.data.size ?? size,
        number: response.data.number ?? page,
      };
    }

    if (Array.isArray(response.data)) {
      return {
        content: response.data.map(mapPurchaseOrderFromBackend),
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

  async getPurchaseOrderById(id: number): Promise<PurchaseOrder> {
    const response = await axios.get<PurchaseOrder>(`/api/purchase-orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return mapPurchaseOrderFromBackend(response.data);
  },

  async createPurchaseOrder(po: PurchaseOrderInput): Promise<PurchaseOrder> {
    const response = await axios.post<PurchaseOrder>(`/api/purchase-orders`, mapPurchaseOrderInputToBackend(po), {
      headers: getAuthHeaders(),
    });
    return mapPurchaseOrderFromBackend(response.data);
  },

  async updatePurchaseOrder(id: number, po: PurchaseOrderInput): Promise<PurchaseOrder> {
    const response = await axios.put<PurchaseOrder>(`/api/purchase-orders/${id}`, mapPurchaseOrderInputToBackend(po), {
      headers: getAuthHeaders(),
    });
    return mapPurchaseOrderFromBackend(response.data);
  },

  async deletePurchaseOrder(id: number): Promise<void> {
    await axios.delete(`/api/purchase-orders/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  // Dropdown list helper APIs
  async getSuppliers(): Promise<DropdownItem[]> {
    try {
      const response = await axios.get<any>(`/api/suppliers`, {
        headers: getAuthHeaders(),
        params: { page: 0, size: 500 }
      });
      const list = response.data?.content || response.data || [];
      return list.map((s: any) => ({
        id: s.supplierId || s.id,
        name: s.supplierName || s.name || `Supplier #${s.supplierId || s.id}`,
        email: s.email,
        address: s.address,
        phone: s.contactNo
      }));
    } catch {
      return [];
    }
  },

  async getItems(): Promise<any[]> {
    try {
      const response = await axios.get<any>(`/api/items`, {
        headers: getAuthHeaders(),
        params: { page: 0, size: 500 }
      });
      return response.data?.content || response.data || [];
    } catch {
      return [];
    }
  }
};
