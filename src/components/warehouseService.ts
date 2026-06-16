import axios from 'axios';

export interface Warehouse {
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  description: string;
  address: string;
  city: string;
  provinceState: string;
  managerName: string;
  contactNumber: string;
  email: string;
  capacity: number;
  currentUtilization: number; // Utilization % (e.g. 75)
  status: 'ACTIVE' | 'INACTIVE';
  storageLocationsCount: number;
  createdDate?: string;
  lastUpdatedDate?: string;
}

export interface WarehouseInput {
  warehouseName: string;
  managerName: string;
  capacity: number;
  warehouseCode: string;
  description: string;
  address: string;
  city: string;
  provinceState: string;
  contactNumber: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PaginatedWarehouses {
  content: Warehouse[];
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

export const serializeLocation = (data: {
  warehouseCode: string;
  address: string;
  city: string;
  provinceState: string;
  contactNumber: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  description: string;
}): string => {
  const parts = [
    `CODE:${data.warehouseCode || ''}`,
    `ADDR:${data.address || ''}`,
    `CITY:${data.city || ''}`,
    `PROV:${data.provinceState || ''}`,
    `TEL:${data.contactNumber || ''}`,
    `EMAIL:${data.email || ''}`,
    `STATUS:${data.status || 'ACTIVE'}`,
    `DESC:${data.description || ''}`
  ];
  return parts.join(' | ');
};

export const parseWarehouse = (raw: any): Warehouse => {
  const locStr = raw.location || '';
  let warehouseCode = `WH-${raw.warehouseId?.toString().padStart(3, '0') || '000'}`;
  let description = '';
  let address = '';
  let city = '';
  let provinceState = '';
  let contactNumber = '';
  let email = '';
  let status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';

  if (locStr.includes(' | ') || locStr.includes('CODE:')) {
    const parts = locStr.split(' | ');
    parts.forEach((part: string) => {
      if (part.startsWith('CODE:')) warehouseCode = part.replace('CODE:', '');
      else if (part.startsWith('ADDR:')) address = part.replace('ADDR:', '');
      else if (part.startsWith('CITY:')) city = part.replace('CITY:', '');
      else if (part.startsWith('PROV:')) provinceState = part.replace('PROV:', '');
      else if (part.startsWith('TEL:')) contactNumber = part.replace('TEL:', '');
      else if (part.startsWith('EMAIL:')) email = part.replace('EMAIL:', '');
      else if (part.startsWith('STATUS:')) {
        const val = part.replace('STATUS:', '').toUpperCase();
        status = val === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
      }
      else if (part.startsWith('DESC:')) description = part.replace('DESC:', '');
    });
  } else {
    address = locStr;
  }

  // Calculate simulated details deterministically based on ID
  const warehouseId = raw.warehouseId || 0;
  const currentUtilization = warehouseId ? (40 + (warehouseId * 7) % 46) : 65; // 40% to 85%
  const storageLocationsCount = warehouseId ? (4 + (warehouseId * 3) % 15) : 8; // 4 to 18 locations

  // Stable simulated dates
  const baseDate = new Date('2026-04-12T09:00:00.000Z');
  const offsetDays = (warehouseId * 5) % 45;
  const createdDate = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000).toISOString();
  const lastUpdatedDate = warehouseId % 2 === 0
    ? new Date(baseDate.getTime() + (offsetDays + 3) * 24 * 60 * 60 * 1000).toISOString()
    : createdDate;

  return {
    warehouseId,
    warehouseCode,
    warehouseName: raw.warehouseName || '',
    description,
    address,
    city,
    provinceState,
    managerName: raw.managerName || '',
    contactNumber,
    email,
    capacity: raw.capacity ? Number(raw.capacity) : 0,
    currentUtilization,
    status,
    storageLocationsCount,
    createdDate,
    lastUpdatedDate
  };
};

export const warehouseService = {
  async getWarehouses(page: number = 0, size: number = 10): Promise<PaginatedWarehouses> {
    const response = await axios.get<any>(`/api/warehouses`, {
      headers: getAuthHeaders(),
      params: {
        page,
        size,
        sort: 'warehouseId,desc'
      }
    });

    if (response.data && Array.isArray(response.data.content)) {
      return {
        content: response.data.content.map(parseWarehouse),
        totalElements: response.data.totalElements ?? response.data.content.length,
        totalPages: response.data.totalPages ?? 1,
        size: response.data.size ?? size,
        number: response.data.number ?? page,
      };
    }

    if (Array.isArray(response.data)) {
      return {
        content: response.data.map(parseWarehouse),
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

  async getWarehouseById(id: number): Promise<Warehouse> {
    const response = await axios.get<any>(`/api/warehouses/${id}`, {
      headers: getAuthHeaders(),
    });
    return parseWarehouse(response.data);
  },

  async createWarehouse(input: WarehouseInput): Promise<Warehouse> {
    const serializedLocation = serializeLocation(input);
    const payload = {
      warehouseName: input.warehouseName,
      managerName: input.managerName,
      capacity: input.capacity,
      location: serializedLocation,
    };

    const response = await axios.post<any>(`/api/warehouses`, payload, {
      headers: getAuthHeaders(),
    });
    return parseWarehouse(response.data);
  },

  async updateWarehouse(id: number, input: WarehouseInput): Promise<Warehouse> {
    const serializedLocation = serializeLocation(input);
    const payload = {
      warehouseName: input.warehouseName,
      managerName: input.managerName,
      capacity: input.capacity,
      location: serializedLocation,
    };

    const response = await axios.put<any>(`/api/warehouses/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return parseWarehouse(response.data);
  },

  async deleteWarehouse(id: number): Promise<void> {
    await axios.delete(`/api/warehouses/${id}`, {
      headers: getAuthHeaders(),
    });
  }
};
