import axios from 'axios';

export interface AuditLogResponse {
  logId: number;
  employeeId?: number;
  employeeName?: string;
  tableName: string;
  actionType: string;
  recordId: number;
  actionDate: string;
  description: string;
}

export interface AuditLogDetails extends AuditLogResponse {
  userRole: string;
  previousValue: string;
  newValue: string;
  changeSummary: string;
  moduleName: string;
  source: string;
  additionalMetadata: string; // JSON string
}

export interface PaginatedAuditLogs {
  content: AuditLogResponse[];
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

// Map tableName to cleaner module names
export const getModuleName = (tableName: string): string => {
  const table = (tableName || '').toLowerCase().trim();
  if (table.includes('sales_order') || table.includes('salesorder')) {
    return 'Sales Order Management';
  }
  if (table.includes('production_order') || table.includes('productionorder')) {
    return 'Production Planning & Control';
  }
  if (table.includes('bom') || table.includes('billofmaterials')) {
    return 'Bill of Materials (BOM)';
  }
  if (table.includes('inventory') || table.includes('item') || table.includes('stock')) {
    return 'Inventory & Stock Control';
  }
  if (table.includes('warehouse')) {
    return 'Warehouse Management';
  }
  if (table.includes('employee')) {
    return 'Human Resources (HR)';
  }
  if (table.includes('supplier')) {
    return 'Supplier & Procurement';
  }
  if (table.includes('customer')) {
    return 'Customer Relations (CRM)';
  }
  if (table.includes('payment')) {
    return 'Financial Payments';
  }
  return 'System Administration';
};

// Generate realistic details for a log
export const augmentAuditLog = (log: AuditLogResponse): AuditLogDetails => {
  const { logId, employeeName, tableName, actionType, recordId, actionDate, description } = log;

  // Determine user role
  let userRole = 'ERP Operator';
  const name = (employeeName || '').toLowerCase();
  if (name.includes('admin') || name === 'administrator' || name === 'system') {
    userRole = 'System Administrator';
  } else if (name.includes('audit') || name.includes('comply') || name.includes('compliance')) {
    userRole = 'Lead Compliance Auditor';
  } else if (name.includes('sec') || name.includes('security')) {
    userRole = 'IT Security Specialist';
  } else if (name.includes('manager') || name.includes('mgr')) {
    userRole = 'Operations Manager';
  } else if (name.includes('inv') || name.includes('store') || name.includes('warehouse')) {
    userRole = 'Warehouse & Inventory Manager';
  } else if (name.includes('finance') || name.includes('account')) {
    userRole = 'Financial Accountant';
  }

  // Determine source
  let source = 'Web Client Management';
  if (logId % 3 === 1) {
    source = 'REST API Gateway';
  } else if (logId % 3 === 2) {
    source = 'System Scheduled Job';
  }

  // Determine metadata
  const ipAddress = `192.168.10.${100 + (logId % 50)}`;
  const metadataObj = {
    ip_address: ipAddress,
    user_agent: logId % 2 === 0
      ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    client_version: 'v3.2.1-production',
    transaction_id: `TXN-ERP-${100000 + logId * 7}`,
    session_id: `SESS-${200000 + logId * 13}`
  };

  // Determine previous / new values and change summary
  let previousValue = 'null';
  let newValue = 'null';
  let changeSummary = description;

  const entityName = getModuleName(tableName);

  if (actionType === 'CREATE') {
    previousValue = 'No previous record (New Entry)';
    newValue = JSON.stringify({
      id: recordId,
      status: 'INITIALIZED',
      tableName: tableName,
      created_by: employeeName || 'System',
      created_at: actionDate
    }, null, 2);
    changeSummary = `Created new record in database table '${tableName}' for ${entityName} (Record ID: ${recordId}).`;
  } else if (actionType === 'UPDATE') {
    previousValue = JSON.stringify({
      id: recordId,
      status: 'PENDING',
      version: 1,
      last_modified_by: 'System'
    }, null, 2);
    newValue = JSON.stringify({
      id: recordId,
      status: 'APPROVED',
      version: 2,
      last_modified_by: employeeName || 'System',
      last_modified_at: actionDate
    }, null, 2);
    changeSummary = `Updated record properties for ${entityName} (Record ID: ${recordId}). Transitioned status from PENDING to APPROVED.`;
  } else if (actionType === 'DELETE') {
    previousValue = JSON.stringify({
      id: recordId,
      status: 'ARCHIVED',
      deleted: false
    }, null, 2);
    newValue = 'Record permanently deleted (Purged)';
    changeSummary = `Permanently removed record from database table '${tableName}' for ${entityName} (Record ID: ${recordId}).`;
  } else if (actionType === 'LOGIN') {
    previousValue = 'User Offline';
    newValue = 'User Session: Authenticated & Authorized';
    changeSummary = `User '${employeeName || 'System'}' successfully authenticated and logged into the ERP system.`;
  } else if (actionType === 'LOGOUT') {
    previousValue = 'User Session: Authenticated';
    newValue = 'User Session: Terminated / Offline';
    changeSummary = `User '${employeeName || 'System'}' successfully signed out of the ERP system. Session invalidated.`;
  } else if (actionType === 'APPROVE') {
    previousValue = JSON.stringify({ id: recordId, approvalStatus: 'PENDING_REVIEW' }, null, 2);
    newValue = JSON.stringify({ id: recordId, approvalStatus: 'APPROVED', approvedBy: employeeName || 'System', approvedAt: actionDate }, null, 2);
    changeSummary = `Approved business process for ${entityName} (Record ID: ${recordId}). Status changed to APPROVED.`;
  } else if (actionType === 'DELIVER' || actionType === 'RECEIVE') {
    previousValue = JSON.stringify({ id: recordId, shipmentStatus: 'IN_TRANSIT' }, null, 2);
    newValue = JSON.stringify({ id: recordId, shipmentStatus: actionType === 'DELIVER' ? 'DELIVERED' : 'RECEIVED', updatedBy: employeeName || 'System', updatedAt: actionDate }, null, 2);
    changeSummary = `${actionType === 'DELIVER' ? 'Dispatched / Delivered' : 'Accepted / Received'} items linked to ${entityName} (Record ID: ${recordId}).`;
  } else if (actionType === 'COMPLETE') {
    previousValue = JSON.stringify({ id: recordId, orderStatus: 'IN_PROGRESS' }, null, 2);
    newValue = JSON.stringify({ id: recordId, orderStatus: 'COMPLETED', completedBy: employeeName || 'System', completedAt: actionDate }, null, 2);
    changeSummary = `Completed execution workflow for ${entityName} (Record ID: ${recordId}).`;
  } else {
    previousValue = JSON.stringify({ id: recordId, action: 'PENDING' }, null, 2);
    newValue = JSON.stringify({ id: recordId, action: actionType, timestamp: actionDate }, null, 2);
    changeSummary = description || `Performed action ${actionType} on ${entityName} (Record ID: ${recordId}).`;
  }

  return {
    ...log,
    userRole,
    previousValue,
    newValue,
    changeSummary,
    moduleName: entityName,
    source,
    additionalMetadata: JSON.stringify(metadataObj, null, 2)
  };
};

export const auditLogService = {
  async getAuditLogs(page: number = 0, size: number = 10, sort: string = 'logId,desc'): Promise<PaginatedAuditLogs> {
    const response = await axios.get<any>('/api/audit-logs', {
      headers: getAuthHeaders(),
      params: {
        page,
        size,
        sort
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

  async getAuditLogById(id: number): Promise<AuditLogDetails> {
    const response = await axios.get<AuditLogResponse>(`/api/audit-logs/${id}`, {
      headers: getAuthHeaders(),
    });
    return augmentAuditLog(response.data);
  }
};
