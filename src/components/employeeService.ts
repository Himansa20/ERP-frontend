import axios from 'axios';

export interface Employee {
  employeeId: number;
  employeeName: string;
  email: string;
  contactNo: string;
  hireDate: string; // ISO datetime e.g. "2026-06-16T00:00:00"
  salary: number;
  employeeType: string; // e.g. "Manager", "Production", "Sales", "Purchase", "Inventory"
}

export interface EmployeeInput {
  employeeName: string;
  email: string;
  contactNo: string;
  hireDate: string;
  salary: number;
  employeeType: string;
}

export interface PaginatedEmployees {
  content: Employee[];
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

export const employeeService = {
  async getEmployees(page: number = 0, size: number = 10): Promise<PaginatedEmployees> {
    const response = await axios.get<any>(`/api/employees`, {
      headers: getAuthHeaders(),
      params: {
        page,
        size,
        sort: 'employeeId,desc'
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

  async getEmployeeById(id: number): Promise<Employee> {
    const response = await axios.get<Employee>(`/api/employees/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async createEmployee(employee: EmployeeInput): Promise<Employee> {
    const response = await axios.post<Employee>(`/api/employees`, employee, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async updateEmployee(id: number, employee: EmployeeInput): Promise<Employee> {
    const response = await axios.put<Employee>(`/api/employees/${id}`, employee, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async deleteEmployee(id: number): Promise<void> {
    await axios.delete(`/api/employees/${id}`, {
      headers: getAuthHeaders(),
    });
  }
};
