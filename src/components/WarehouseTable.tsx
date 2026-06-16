import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, IconButton, Skeleton, Typography, Paper, LinearProgress } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import { Warehouse } from './warehouseService';

interface WarehouseTableProps {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  onView: (warehouse: Warehouse) => void;
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
  rowCount: number;
}

export default function WarehouseTable({
  warehouses,
  loading,
  error,
  onView,
  onEdit,
  onDelete,
  paginationModel,
  onPaginationModelChange,
  rowCount,
}: WarehouseTableProps) {

  const columns: GridColDef[] = [
    {
      field: 'warehouseId',
      headerName: 'Warehouse ID',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'warehouseCode',
      headerName: 'Warehouse Code',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '0.75rem',
            color: '#334155',
            bgcolor: '#F1F5F9',
            border: '1px solid #E2E8F0',
            borderRadius: 1.5,
          }}
        />
      ),
    },
    {
      field: 'warehouseName',
      headerName: 'Warehouse Name',
      width: 220,
      flex: 1.2,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 220,
      flex: 1.5,
      valueGetter: (value, row) => {
        const addr = row.address || '';
        const city = row.city || '';
        const prov = row.provinceState || '';
        const parts = [addr, city, prov].filter(Boolean);
        return parts.join(', ') || 'N/A';
      },
      renderCell: (params) => (
        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {params.value}
        </span>
      ),
    },
    {
      field: 'managerName',
      headerName: 'Manager',
      width: 160,
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
          {params.value || 'Unassigned'}
        </Typography>
      ),
    },
    {
      field: 'contactNumber',
      headerName: 'Contact Number',
      width: 140,
      renderCell: (params) => (
        <span>{params.value || 'N/A'}</span>
      ),
    },
    {
      field: 'capacity',
      headerName: 'Capacity (sq ft)',
      width: 130,
      renderCell: (params) => (
        <span style={{ fontWeight: 600 }}>
          {params.value ? Number(params.value).toLocaleString() : '0'}
        </span>
      ),
    },
    {
      field: 'currentUtilization',
      headerName: 'Utilization',
      width: 160,
      renderCell: (params) => {
        const util = params.value || 0;
        let color: 'success' | 'warning' | 'error' = 'success';
        let barColor = '#16A34A'; // Success
        if (util > 85) {
          color = 'error';
          barColor = '#DC2626'; // Danger
        } else if (util > 70) {
          color = 'warning';
          barColor = '#D97706'; // Warning
        }

        return (
          <Box sx={{ width: '100%', pr: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: barColor }}>
                {util}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={util}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: '#E2E8F0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: barColor,
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => {
        const status = params.value || 'ACTIVE';
        const isActive = status === 'ACTIVE';
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
            onClick={() => onView(params.row as Warehouse)}
            title="View Details"
            sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onEdit(params.row as Warehouse)}
            title="Edit Warehouse"
            sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(params.row as Warehouse)}
            title="Delete Warehouse"
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
          <InfoIcon /> Error Loading Warehouses
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
          rows={warehouses}
          columns={columns}
          getRowId={(row) => row.warehouseId}
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
