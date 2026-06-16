import axios from 'axios';
import { ParsedItem, itemService } from './itemService';

export interface BOMComponent {
  bomId?: number;
  rawMaterialId: number;
  rawMaterialName: string;
  requiredQuantity: number;
  wastagePercentage: number;
  unitOfMeasure?: string;
  standardCost?: number;
}

export interface BOM {
  finishedProductId: number;
  finishedProductName: string;
  finishedProductCode?: string;
  components: BOMComponent[];
  version?: number;
  lastUpdated?: string;
}

export interface PaginatedBOMs {
  content: BOM[];
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

export const bomService = {
  // Helper to fetch details of items for standard cost & UOM mapping
  async fetchItemDetailsMap(): Promise<Map<number, ParsedItem>> {
    try {
      const items = await itemService.getItems(0, 1000);
      const map = new Map<number, ParsedItem>();
      items.content.forEach((item) => {
        map.set(item.itemId, item);
      });
      return map;
    } catch (err) {
      console.error('Failed to pre-fetch items map for BOM details:', err);
      return new Map();
    }
  },

  async getBOMs(page: number = 0, size: number = 10): Promise<PaginatedBOMs> {
    const response = await axios.get<any>(`/api/boms`, {
      headers: getAuthHeaders(),
      params: {
        page: 0,
        size: 1000, // Fetch all for proper grouping and mapping
        sort: 'bomId,desc'
      }
    });

    let rawList: any[] = [];
    if (response.data && Array.isArray(response.data.content)) {
      rawList = response.data.content;
    } else if (Array.isArray(response.data)) {
      rawList = response.data;
    }

    // Resolve Item UOM and Standard Costs
    const itemsMap = await this.fetchItemDetailsMap();

    // Group by finishedProductId
    const bomGroupMap = new Map<number, BOM>();

    rawList.forEach((row: any) => {
      const fId = Number(row.finishedProductId);
      const rawMat = itemsMap.get(Number(row.rawMaterialId));
      const finishedProduct = itemsMap.get(fId);

      const comp: BOMComponent = {
        bomId: row.bomId,
        rawMaterialId: Number(row.rawMaterialId),
        rawMaterialName: row.rawMaterialName || rawMat?.itemName || `Raw Material #${row.rawMaterialId}`,
        requiredQuantity: Number(row.requiredQuantity || 0),
        wastagePercentage: Number(row.wastagePercentage || 0),
        unitOfMeasure: rawMat?.unitOfMeasure || 'PCS',
        standardCost: rawMat?.standardCost || 0,
      };

      if (bomGroupMap.has(fId)) {
        bomGroupMap.get(fId)!.components.push(comp);
      } else {
        bomGroupMap.set(fId, {
          finishedProductId: fId,
          finishedProductName: row.finishedProductName || finishedProduct?.itemName || `Finished Product #${fId}`,
          finishedProductCode: finishedProduct?.itemCode || `ITM-${fId.toString().padStart(4, '0')}`,
          components: [comp],
          version: finishedProduct?.version || 1,
          lastUpdated: finishedProduct?.createdDate || new Date().toISOString(),
        });
      }
    });

    const groupedBoms = Array.from(bomGroupMap.values());
    const totalElements = groupedBoms.length;
    const paginatedBoms = groupedBoms.slice(page * size, (page + 1) * size);

    return {
      content: paginatedBoms,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      size,
      number: page,
    };
  },

  async getBOMByFinishedProductId(finishedProductId: number): Promise<BOM> {
    const response = await axios.get<any[]>(`/api/boms/product/${finishedProductId}`, {
      headers: getAuthHeaders(),
    });

    const itemsMap = await this.fetchItemDetailsMap();
    const finishedProduct = itemsMap.get(finishedProductId);

    const components = response.data.map((row: any) => {
      const rawMat = itemsMap.get(Number(row.rawMaterialId));
      return {
        bomId: row.bomId,
        rawMaterialId: Number(row.rawMaterialId),
        rawMaterialName: row.rawMaterialName || rawMat?.itemName || `Raw Material #${row.rawMaterialId}`,
        requiredQuantity: Number(row.requiredQuantity || 0),
        wastagePercentage: Number(row.wastagePercentage || 0),
        unitOfMeasure: rawMat?.unitOfMeasure || 'PCS',
        standardCost: rawMat?.standardCost || 0,
      };
    });

    return {
      finishedProductId,
      finishedProductName: finishedProduct?.itemName || `Product #${finishedProductId}`,
      finishedProductCode: finishedProduct?.itemCode || `ITM-${finishedProductId.toString().padStart(4, '0')}`,
      components,
      version: finishedProduct?.version || 1,
      lastUpdated: finishedProduct?.createdDate || new Date().toISOString(),
    };
  },

  async createBOM(bom: Omit<BOM, 'components'> & { components: Omit<BOMComponent, 'bomId'>[] }): Promise<void> {
    // Sequential creations
    for (const comp of bom.components) {
      const payload = {
        finishedProductId: bom.finishedProductId,
        rawMaterialId: comp.rawMaterialId,
        requiredQuantity: comp.requiredQuantity,
        wastagePercentage: comp.wastagePercentage || 0,
      };

      await axios.post(`/api/boms`, payload, {
        headers: getAuthHeaders(),
      });
    }
  },

  async updateBOM(
    finishedProductId: number,
    newComponents: BOMComponent[],
    existingComponents: BOMComponent[]
  ): Promise<void> {
    // 1. Identify components to delete (present in existing but not in new list)
    const newComponentIds = new Set(newComponents.map((c) => c.bomId).filter(Boolean));
    const toDelete = existingComponents.filter((c) => c.bomId && !newComponentIds.has(c.bomId));

    for (const comp of toDelete) {
      if (comp.bomId) {
        await axios.delete(`/api/boms/${comp.bomId}`, {
          headers: getAuthHeaders(),
        });
      }
    }

    // 2. Identify additions and edits
    for (const comp of newComponents) {
      const payload = {
        finishedProductId,
        rawMaterialId: comp.rawMaterialId,
        requiredQuantity: comp.requiredQuantity,
        wastagePercentage: comp.wastagePercentage || 0,
      };

      if (comp.bomId) {
        // Edit mode (PUT /api/boms/{id})
        await axios.put(`/api/boms/${comp.bomId}`, payload, {
          headers: getAuthHeaders(),
        });
      } else {
        // Add mode (POST /api/boms)
        await axios.post(`/api/boms`, payload, {
          headers: getAuthHeaders(),
        });
      }
    }
  },

  async deleteBOM(bom: BOM): Promise<void> {
    for (const comp of bom.components) {
      if (comp.bomId) {
        await axios.delete(`/api/boms/${comp.bomId}`, {
          headers: getAuthHeaders(),
        });
      }
    }
  },
};
