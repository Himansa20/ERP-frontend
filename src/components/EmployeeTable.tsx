import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, IconButton, Paper, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import { Employee } from './employeeService';

import { formatCurrency } from '../utils/currency';

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
  rowCount: number;
}

export default function EmployeeTable({
  employees,
  loading,
  error,
  onView,
  onEdit,
  onDelete,
  paginationModel,
  onPaginationModelChange,
  rowCount,
}: EmployeeTableProps) {

  // Date formatter helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'employeeId',
      headerName: 'Employee ID',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'employeeName',
      headerName: 'Employee Name',
      width: 180,
      flex: 1.2,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'email',
      headerName: 'Email Address',
      width: 200,
      flex: 1.2,
      renderCell: (params) => (
        <span style={{ color: '#2563EB', fontWeight: 500 }}>
          {params.value || 'N/A'}
        </span>
      ),
    },
    {
      field: 'contactNo',
      headerName: 'Contact Number',
      width: 140,
      renderCell: (params) => (
        <span>{params.value || 'N/A'}</span>
      ),
    },
    {
      field: 'employeeType',
      headerName: 'Employee Type',
      width: 150,
      renderCell: (params) => {
        const type = params.value || 'Staff';
        let chipColors = { color: '#475569', bgcolor: '#F1F5F9', border: '#E2E8F0' }; // Default / Staff

        switch (type.toUpperCase()) {
          case 'MANAGER':
            chipColors = { color: '#2563EB', bgcolor: '#EFF6FF', border: '#BFDBFE' };
            break;
          case 'PRODUCTION':
            chipColors = { color: '#16A34A', bgcolor: '#ECFDF5', border: '#A7F3D0' };
            break;
          case 'SALES':
            chipColors = { color: '#4F46E5', bgcolor: '#EEF2FF', border: '#C7D2FE' };
            break;
          case 'PURCHASE':
            chipColors = { color: '#D97706', bgcolor: '#FFFBEB', border: '#FDE68A' };
            break;
          case 'INVENTORY':
            chipColors = { color: '#7C3AED', bgcolor: '#F5F3FF', border: '#DDD6FE' };
            break;
        }

        return (
          <Chip
            label={type}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.725rem',
              color: chipColors.color,
              bgcolor: chipColors.bgcolor,
              border: `1px solid ${chipColors.border}`,
              borderRadius: 1.5,
              height: 22,
            }}
          />
        );
      },
    },
    {
      field: 'hireDate',
      headerName: 'Hire Date',
      width: 130,
      renderCell: (params) => (
        <span>{formatDate(params.value)}</span>
      ),
    },
    {
      field: 'salary',
      headerName: 'Salary',
      width: 130,
      renderCell: (params) => {
        const salaryNum = params.value ? Number(params.value) : 0;
        return (
          <span style={{ fontWeight: 600, color: '#0F172A' }}>
            {formatCurrency(salaryNum)}
          </span>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', height: '100%', alignItems: 'center' }}>
          <IconButton
            size="small"
            onClick={() => onView(params.row as Employee)}
            title="View Details"
            sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onEdit(params.row as Employee)}
            title="Edit Employee"
            sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(params.row as Employee)}
            title="Delete Employee"
            sx={{ color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (error) {
    return (
      <Paper
        sx={{
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderColor: '#FCA5A5',
          bgcolor: '#FEF2F2',
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ color: '#B91C1C', fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon /> Error Loading Employees
        </Typography>
        <Typography variant="body2" sx={{ color: '#7F1D1D', textAlign: 'center' }}>
          {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: 2,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        bgcolor: '#FFFFFF',
      }}
    >
      <Box sx={{ width: '100%', height: 500 }}>
        <DataGrid
          rows={employees}
          columns={columns}
          getRowId={(row) => row.employeeId}
          loading={loading}
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          pageSizeOptions={[5, 10, 25, 50]}
          disableRowSelectionOnClick
          rowHeight={54}
          columnHeaderHeight={48}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#F8FAFC',
              borderBottom: '2px solid #E2E8F0',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
              color: '#475569',
              fontSize: '0.85rem',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: '#F8FAFC',
              },
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
            },
          }}
        />
      </Box>
    </Paper>
  );
}
