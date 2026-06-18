import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, IconButton, Typography, Paper, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import { PurchaseOrder } from './purchaseOrderService';

interface PurchaseOrderTableProps {
  orders: PurchaseOrder[];
  loading: boolean;
  error: string | null;
  suppliersMap: Record<number, string>;
  onView: (order: PurchaseOrder) => void;
  onEdit: (order: PurchaseOrder) => void;
  onDelete: (order: PurchaseOrder) => void;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
  rowCount: number;
}

export default function PurchaseOrderTable({
  orders,
  loading,
  error,
  suppliersMap,
  onView,
  onEdit,
  onDelete,
  paginationModel,
  onPaginationModelChange,
  rowCount,
}: PurchaseOrderTableProps) {
  const getStatusChip = (statusStr?: string) => {
    const status = (statusStr || 'DRAFT').toUpperCase();
    let label = 'DRAFT';
    let color = '#475569';
    let bgcolor = '#F1F5F9';
    let border = '#E2E8F0';

    if (status === 'PENDING_APPROVAL') {
      label = 'Pending Approval';
      color = '#D97706';
      bgcolor = '#FEF3C7';
      border = '#FDE68A';
    } else if (status === 'APPROVED') {
      label = 'Approved';
      color = '#16A34A';
      bgcolor = '#DCFCE7';
      border = '#BBF7D0';
    } else if (status === 'REJECTED') {
      label = 'Rejected';
      color = '#DC2626';
      bgcolor = '#FEE2E2';
      border = '#FECACA';
    } else if (status === 'RECEIVED') {
      label = 'Received';
      color = '#2563EB';
      bgcolor = '#EFF6FF';
      border = '#BFDBFE';
    }

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.725rem',
          color,
          bgcolor,
          border: `1px solid ${border}`,
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
      field: 'poNumber',
      headerName: 'PO Number',
      width: 130,
      renderCell: (params) => {
        const id = params.row.purchaseOrderId || params.row.id;
        const val = params.value || `PO-${String(id).padStart(4, '0')}`;
        return (
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563EB' }}>
            {val}
          </Typography>
        );
      },
    },
    {
      field: 'supplierId',
      headerName: 'Supplier',
      width: 180,
      flex: 1.3,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
          {suppliersMap[Number(params.value)] || `Supplier #${params.value}`}
        </Typography>
      ),
    },
    {
      field: 'orderDate',
      headerName: 'Order Date',
      width: 120,
      renderCell: (params) => <span>{formatDate(params.value || params.row.createdDate)}</span>,
    },
    {
      field: 'expectedDate',
      headerName: 'Expected Delivery',
      width: 150,
      renderCell: (params) => {
        if (params.value) {
          return <span>{formatDate(params.value)}</span>;
        }
        return <span style={{ color: '#94A3B8' }}>Not Specified</span>;
      },
    },
    {
      field: 'totalAmount',
      headerName: 'Total Amount',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <span style={{ fontWeight: 750, color: '#0F172A' }}>
          ${Number(params.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'createdBy',
      headerName: 'Created By',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          {params.value || 'System User'}
        </Typography>
      ),
    },
    {
      field: 'createdDate',
      headerName: 'Created Date',
      width: 120,
      renderCell: (params) => <span>{formatDate(params.value || params.row.orderDate)}</span>,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const order = params.row as PurchaseOrder;
        const status = (order.status || 'DRAFT').toUpperCase();
        // Allow editing only if status is DRAFT or PENDING_APPROVAL
        const isEditable = status === 'DRAFT' || status === 'PENDING_APPROVAL';
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', height: '100%', alignItems: 'center' }}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={() => onView(order)}
                sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isEditable ? "Edit Purchase Order" : "Editing locked (only DRAFT or PENDING_APPROVAL)"}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => onEdit(order)}
                  disabled={!isEditable}
                  sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete Purchase Order">
              <IconButton
                size="small"
                onClick={() => onDelete(order)}
                sx={{ color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
          <InfoIcon /> Error Loading Purchase Orders
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
      <Box sx={{ width: '100%', height: 480 }}>
        <DataGrid
          rows={orders}
          columns={columns}
          getRowId={(row) => row.purchaseOrderId || row.id}
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
