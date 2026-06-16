import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, IconButton, Typography, Paper } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import { Customer } from './customerService';

export const getContactPerson = (row: Customer) => {
  const reps = [
    'Sarah Jenkins',
    'Michael Chang',
    'David Ross',
    'Emily Taylor',
    'Robert Sen',
    'Jessica Adams',
    'James Wilson',
    'Amanda Martinez'
  ];
  return reps[Number(row.customerId || 0) % reps.length];
};

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
  rowCount: number;
}

export default function CustomerTable({
  customers,
  loading,
  error,
  onView,
  onEdit,
  onDelete,
  paginationModel,
  onPaginationModelChange,
  rowCount,
}: CustomerTableProps) {
  const columns: GridColDef[] = [
    {
      field: 'customerId',
      headerName: 'Customer ID',
      width: 110,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      width: 220,
      flex: 1.5,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'contactPerson',
      headerName: 'Contact Person',
      width: 160,
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
          {getContactPerson(params.row)}
        </Typography>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 180,
      flex: 1.2,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#2563EB', textDecoration: 'none' }}>
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'contactNo',
      headerName: 'Phone Number',
      width: 140,
      renderCell: (params) => (
        <span>{params.value || 'N/A'}</span>
      ),
    },
    {
      field: 'address',
      headerName: 'Address',
      width: 200,
      flex: 1.5,
      renderCell: (params) => (
        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {params.value || 'N/A'}
        </span>
      ),
    },
    {
      field: 'customerType',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => {
        const status = params.value || 'ACTIVE';
        const isActive = status.toUpperCase() === 'ACTIVE';
        return (
          <Chip
            label={status}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.725rem',
              color: isActive ? '#16A34A' : '#DC2626',
              bgcolor: isActive ? '#DCFCE7' : '#FEE2E2',
              border: `1px solid ${isActive ? '#BBF7D0' : '#FECACA'}`,
              height: 22,
            }}
          />
        );
      },
    },
    {
      field: 'registrationDate',
      headerName: 'Created Date',
      width: 140,
      renderCell: (params) => {
        const val = params.value || new Date().toISOString();
        return (
          <span>
            {new Date(val).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
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
            onClick={() => onView(params.row as Customer)}
            title="View Details"
            sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onEdit(params.row as Customer)}
            title="Edit Customer"
            sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(params.row as Customer)}
            title="Delete Customer"
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
          <InfoIcon /> Error Loading Customers
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
          rows={customers}
          columns={columns}
          getRowId={(row) => row.customerId}
          loading={loading}
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          pageSizeOptions={[5, 10, 25, 50]}
          disableRowSelectionOnClick
          rowHeight={52}
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
