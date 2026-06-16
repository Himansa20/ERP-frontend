import axios from 'axios';

export interface ParsedItem {
  itemId: number;
  itemName: string;
  itemCode: string;
  itemCategory: string; // Raw Materials, Finished Products, Packaging Materials, Consumables
  itemType: string;     // Standard, Custom, Bulk, Assembly
  unitOfMeasure: string;
  currentStock: number;
  reorderLevel: number;
  standardCost: number;
  itemStatus: string;   // Active, Inactive
  description: string;
  createdDate?: string;
  version?: number;
}

export interface PaginatedItems {
  content: ParsedItem[];
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

// Serializer for the persistent storage block within the description field
export const serializeDescription = (code: string, cat: string, type: string, cost: number, desc: string): string => {
  return `CODE:${code || ''} | CAT:${cat || ''} | TYPE:${type || ''} | COST:${cost || 0} | DESC:${desc || ''}`;
};

// Parser
export const parseItem = (raw: any): ParsedItem => {
  const descStr = raw.description || '';
  let itemCode = `ITM-${raw.itemId?.toString().padStart(4, '0') || '0000'}`;
  let itemCategory = raw.itemType || 'Raw Materials';
  let itemType = 'Standard';
  let standardCost = 0;
  let cleanDesc = descStr;

  if (descStr.includes(' | ')) {
    const parts = descStr.split(' | ');
    parts.forEach((part: string) => {
      if (part.startsWith('CODE:')) itemCode = part.replace('CODE:', '');
      else if (part.startsWith('CAT:')) itemCategory = part.replace('CAT:', '');
      else if (part.startsWith('TYPE:')) itemType = part.replace('TYPE:', '');
      else if (part.startsWith('COST:')) standardCost = Number(part.replace('COST:', '')) || 0;
      else if (part.startsWith('DESC:')) cleanDesc = part.replace('DESC:', '');
    });
  }

  return {
    itemId: raw.itemId,
    itemName: raw.itemName,
    itemCode,
    itemCategory,
    itemType,
    unitOfMeasure: raw.unitOfMeasure,
    currentStock: Number(raw.currentStock || 0),
    reorderLevel: Number(raw.reorderLevel || 0),
    standardCost,
    itemStatus: raw.itemStatus || 'Active',
    description: cleanDesc,
    createdDate: raw.createdDate,
    version: raw.version
  };
};

export const itemService = {
  async getItems(page: number = 0, size: number = 10): Promise<PaginatedItems> {
    const response = await axios.get<any>(`/api/items`, {
      headers: getAuthHeaders(),
      params: {
        page,
        size,
        sort: 'itemId,desc'
      }
    });

    if (response.data && Array.isArray(response.data.content)) {
      return {
        content: response.data.content.map(parseItem),
        totalElements: response.data.totalElements ?? response.data.content.length,
        totalPages: response.data.totalPages ?? 1,
        size: response.data.size ?? size,
        number: response.data.number ?? page,
      };
    }

    if (Array.isArray(response.data)) {
      return {
        content: response.data.map(parseItem),
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

  async getItemById(id: number): Promise<ParsedItem> {
    const response = await axios.get<any>(`/api/items/${id}`, {
      headers: getAuthHeaders(),
    });
    return parseItem(response.data);
  },

  async createItem(item: Omit<ParsedItem, 'itemId'>): Promise<ParsedItem> {
    const serializedDesc = serializeDescription(
      item.itemCode,
      item.itemCategory,
      item.itemType,
      item.standardCost,
      item.description
    );

    const payload = {
      itemName: item.itemName,
      itemType: item.itemCategory, // Store category in itemType database field
      unitOfMeasure: item.unitOfMeasure,
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      itemStatus: item.itemStatus,
      description: serializedDesc
    };

    const response = await axios.post<any>(`/api/items`, payload, {
      headers: getAuthHeaders(),
    });
    return parseItem(response.data);
  },

  async updateItem(id: number, item: Omit<ParsedItem, 'itemId'>): Promise<ParsedItem> {
    const serializedDesc = serializeDescription(
      item.itemCode,
      item.itemCategory,
      item.itemType,
      item.standardCost,
      item.description
    );

    const payload = {
      itemName: item.itemName,
      itemType: item.itemCategory, // Store category in itemType database field
      unitOfMeasure: item.unitOfMeasure,
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      itemStatus: item.itemStatus,
      description: serializedDesc
    };

    const response = await axios.put<any>(`/api/items/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return parseItem(response.data);
  },

  async deleteItem(id: number): Promise<void> {
    await axios.delete(`/api/items/${id}`, {
      headers: getAuthHeaders(),
    });
  }
};
