import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, IconButton, Typography, Paper, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { ParsedItem } from './itemService';

interface ItemTableProps {
  items: ParsedItem[];
  loading: boolean;
  error: string | null;
  onView: (item: ParsedItem) => void;
  onEdit: (item: ParsedItem) => void;
  onDelete: (item: ParsedItem) => void;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
  rowCount: number;
}

export default function ItemTable({
  items,
  loading,
  error,
  onView,
  onEdit,
  onDelete,
  paginationModel,
  onPaginationModelChange,
  rowCount,
}: ItemTableProps) {
  const getCategoryChip = (category: string) => {
    let color = '#475569';
    let bgcolor = '#F1F5F9';
    let border = '#E2E8F0';

    if (category === 'Raw Materials' || category === 'Raw Material') {
      color = '#2563EB';
      bgcolor = '#EFF6FF';
      border = '#BFDBFE';
    } else if (category === 'Finished Products' || category === 'Finished Product') {
      color = '#16A34A';
      bgcolor = '#DCFCE7';
      border = '#BBF7D0';
    } else if (category === 'Packaging Materials' || category === 'Packaging Material') {
      color = '#4F46E5';
      bgcolor = '#EEF2FF';
      border = '#C7D2FE';
    } else if (category === 'Consumables' || category === 'Consumable') {
      color = '#D97706';
      bgcolor = '#FEF3C7';
      border = '#FDE68A';
    }

    return (
      <Chip
        label={category}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: '0.75rem',
          color,
          bgcolor,
          border: `1px solid ${border}`,
          height: 22,
        }}
      />
    );
  };

  const getStatusChip = (statusStr?: string) => {
    const status = statusStr || 'Active';
    const isActive = status.toLowerCase() === 'active';
    return (
      <Chip
        label={isActive ? 'Active' : 'Inactive'}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.725rem',
          color: isActive ? '#16A34A' : '#64748B',
          bgcolor: isActive ? '#DCFCE7' : '#F1F5F9',
          border: `1px solid ${isActive ? '#BBF7D0' : '#E2E8F0'}`,
          height: 22,
        }}
      />
    );
  };

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
      field: 'itemId',
      headerName: 'Item ID',
      width: 80,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'itemCode',
      headerName: 'Item Code',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'itemName',
      headerName: 'Item Name',
      width: 200,
      flex: 1.5,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'itemCategory',
      headerName: 'Category',
      width: 140,
      renderCell: (params) => getCategoryChip(params.value),
    },
    {
      field: 'itemType',
      headerName: 'Type',
      width: 100,
    },
    {
      field: 'unitOfMeasure',
      headerName: 'UOM',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'standardCost',
      headerName: 'Std. Cost',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <span style={{ fontWeight: 700, color: '#0F172A' }}>
          ${Number(params.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      field: 'currentStock',
      headerName: 'Stock Level',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const row = params.row as ParsedItem;
        const isLowStock = row.currentStock <= row.reorderLevel;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end', width: '100%' }}>
            {isLowStock && (
              <Tooltip title={`Reorder Alert! Stock falls below threshold level of ${row.reorderLevel}`}>
                <WarningIcon sx={{ color: '#D97706', fontSize: 16 }} />
              </Tooltip>
            )}
            <span style={{ fontWeight: 750, color: isLowStock ? '#D97706' : '#0F172A' }}>
              {Number(params.value || 0).toLocaleString()}
            </span>
          </Box>
        );
      },
    },
    {
      field: 'itemStatus',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'createdDate',
      headerName: 'Created Date',
      width: 110,
      renderCell: (params) => <span>{formatDate(params.value)}</span>,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const item = params.row as ParsedItem;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', height: '100%', alignItems: 'center' }}>
            <IconButton
              size="small"
              onClick={() => onView(item)}
              title="View Profile"
              sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onEdit(item)}
              title="Edit Item"
              sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(item)}
              title="Delete Item"
              sx={{ color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
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
          <InfoIcon /> Error Loading Item Catalog
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
          rows={items}
          columns={columns}
          getRowId={(row) => row.itemId}
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
