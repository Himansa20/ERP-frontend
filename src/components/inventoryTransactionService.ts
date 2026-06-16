import axios from 'axios';

export interface InventoryTransaction {
  transactionId: number;
  itemId: number;
  itemName: string;
  warehouseId: number;
  warehouseName: string;
  employeeId?: number;
  employeeName?: string;
  transactionType: 'Stock In' | 'Stock Out'; // Backend enum mapped
  uiTransactionType: string; // UI transaction type (Goods Receipt, Goods Issue, etc.)
  quantity: number;
  referenceNumber: string;
  notes: string;
  transactionDate: string;
  remarks: string;
}

export interface InventoryTransactionInput {
  itemId: number;
  warehouseId: number;
  employeeId?: number;
  transactionType: 'Stock In' | 'Stock Out';
  uiTransactionType: string;
  quantity: number;
  referenceNumber: string;
  notes: string;
}

export interface WarehouseStock {
  itemId: number;
  itemName: string;
  warehouseId: number;
  warehouseName: string;
  quantityOnHand: number;
}

export interface PaginatedTransactions {
  content: InventoryTransaction[];
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

export const serializeRemarks = (ref: string, type: string, notes: string): string => {
  return `REF:${ref || ''} | TYPE:${type || ''} | NOTES:${notes || ''}`;
};

export const parseRemarks = (remarksStr: string | null | undefined) => {
  const str = remarksStr || '';
  let referenceNumber = '';
  let uiTransactionType = '';
  let notes = str;

  if (str.includes(' | ')) {
    const parts = str.split(' | ');
    let hasRef = false;
    let hasType = false;
    let hasNotes = false;

    parts.forEach((part: string) => {
      if (part.startsWith('REF:')) {
        referenceNumber = part.replace('REF:', '');
        hasRef = true;
      } else if (part.startsWith('TYPE:')) {
        uiTransactionType = part.replace('TYPE:', '');
        hasType = true;
      } else if (part.startsWith('NOTES:')) {
        notes = part.replace('NOTES:', '');
        hasNotes = true;
      }
    });

    // If we parsed elements successfully, we return notes as clean notes.
    // Otherwise if it's not matching the template, we return original string as notes.
    if (!hasRef && !hasType && !hasNotes) {
      notes = str;
    }
  }

  return { referenceNumber, uiTransactionType, notes };
};

export const parseTransaction = (raw: any): InventoryTransaction => {
  const { referenceNumber, uiTransactionType, notes } = parseRemarks(raw.remarks);
  
  // Fallback if transaction was created by some other means
  const finalUiType = uiTransactionType || (raw.transactionType === 'Stock In' ? 'Goods Receipt' : 'Goods Issue');

  return {
    transactionId: raw.transactionId,
    itemId: raw.itemId,
    itemName: raw.itemName || '',
    warehouseId: raw.warehouseId,
    warehouseName: raw.warehouseName || '',
    employeeId: raw.employeeId,
    employeeName: raw.employeeName || '',
    transactionType: raw.transactionType || 'Stock In',
    uiTransactionType: finalUiType,
    quantity: Number(raw.quantity || 0),
    referenceNumber: referenceNumber || `REF-TR-${raw.transactionId?.toString().padStart(4, '0') || '0000'}`,
    notes: notes,
    transactionDate: raw.transactionDate || new Date().toISOString(),
    remarks: raw.remarks || '',
  };
};

export const inventoryTransactionService = {
  async getTransactions(page: number = 0, size: number = 10): Promise<PaginatedTransactions> {
    const response = await axios.get<any>(`/api/inventory-transactions`, {
      headers: getAuthHeaders(),
      params: {
        page,
        size,
        sort: 'transactionId,desc'
      }
    });

    if (response.data && Array.isArray(response.data.content)) {
      return {
        content: response.data.content.map(parseTransaction),
        totalElements: response.data.totalElements ?? response.data.content.length,
        totalPages: response.data.totalPages ?? 1,
        size: response.data.size ?? size,
        number: response.data.number ?? page,
      };
    }

    if (Array.isArray(response.data)) {
      return {
        content: response.data.map(parseTransaction),
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

  async getTransactionById(id: number): Promise<InventoryTransaction> {
    const response = await axios.get<any>(`/api/inventory-transactions/${id}`, {
      headers: getAuthHeaders(),
    });
    return parseTransaction(response.data);
  },

  async createTransaction(input: InventoryTransactionInput): Promise<InventoryTransaction> {
    const serializedRemarks = serializeRemarks(input.referenceNumber, input.uiTransactionType, input.notes);
    const payload = {
      itemId: input.itemId,
      warehouseId: input.warehouseId,
      employeeId: input.employeeId,
      transactionType: input.transactionType, // 'Stock In' or 'Stock Out'
      quantity: input.quantity,
      remarks: serializedRemarks
    };

    const response = await axios.post<any>(`/api/inventory-transactions`, payload, {
      headers: getAuthHeaders(),
    });
    return parseTransaction(response.data);
  },

  async getStockByWarehouse(): Promise<WarehouseStock[]> {
    const response = await axios.get<any>(`/api/inventory-transactions/stock-by-warehouse`, {
      headers: getAuthHeaders(),
    });

    if (Array.isArray(response.data)) {
      return response.data.map((item: any) => ({
        itemId: item.itemId,
        itemName: item.itemName || '',
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName || '',
        quantityOnHand: Number(item.quantityOnHand || 0)
      }));
    }

    return [];
  }
};
