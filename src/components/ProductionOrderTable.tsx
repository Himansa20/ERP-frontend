import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, IconButton, Typography, Paper } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import { ProductionOrder } from './productionOrderService';

interface ProductionOrderTableProps {
  orders: ProductionOrder[];
  loading: boolean;
  error: string | null;
  productsMap: Record<number, string>;
  employeesMap: Record<number, string>;
  onView: (order: ProductionOrder) => void;
  onEdit: (order: ProductionOrder) => void;
  onComplete: (order: ProductionOrder) => void;
  onDelete: (order: ProductionOrder) => void;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
  rowCount: number;
}

export default function ProductionOrderTable({
  orders,
  loading,
  error,
  productsMap,
  employeesMap,
  onView,
  onEdit,
  onComplete,
  onDelete,
  paginationModel,
  onPaginationModelChange,
  rowCount,
}: ProductionOrderTableProps) {
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return { color: '#DC2626', bgcolor: '#FEE2E2', border: '#FECACA' };
      case 'MEDIUM':
        return { color: '#D97706', bgcolor: '#FEF3C7', border: '#FDE68A' };
      case 'LOW':
      default:
        return { color: '#475569', bgcolor: '#F1F5F9', border: '#E2E8F0' };
    }
  };

  const getStatusChip = (statusStr: string) => {
    const status = statusStr?.toUpperCase() || 'PENDING';
    let label = 'Pending';
    let color = '#475569';
    let bgcolor = '#F1F5F9';
    let border = '#E2E8F0';

    if (status === 'COMPLETED') {
      label = 'Completed';
      color = '#16A34A';
      bgcolor = '#DCFCE7';
      border = '#BBF7D0';
    } else if (status === 'IN_PROGRESS' || status === 'RUNNING') {
      label = 'In Progress';
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
      field: 'productionOrderId',
      headerName: 'Order ID',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'finishedProductId',
      headerName: 'Product Name',
      width: 200,
      flex: 1.3,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {productsMap[Number(params.value)] || `Product #${params.value}`}
        </Typography>
      ),
    },
    {
      field: 'quantityToProduce',
      headerName: 'Planned Qty',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <span style={{ fontWeight: 600 }}>{Number(params.value).toLocaleString()}</span>
      ),
    },
    {
      field: 'quantityProduced',
      headerName: 'Produced Qty',
      width: 115,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <span style={{ fontWeight: 600, color: Number(params.value) > 0 ? '#16A34A' : '#64748B' }}>
          {Number(params.value || 0).toLocaleString()}
        </span>
      ),
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      width: 120,
      renderCell: (params) => <span>{formatDate(params.value || params.row.productionDate)}</span>,
    },
    {
      field: 'endDate',
      headerName: 'Target Completion',
      width: 140,
      renderCell: (params) => <span>{formatDate(params.value)}</span>,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'employeeId',
      headerName: 'Supervisor',
      width: 150,
      renderCell: (params) => (
        <span>{employeesMap[Number(params.value)] || `Supervisor #${params.value}`}</span>
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params) => {
        const val = params.value || 'LOW';
        const styles = getPriorityColor(val);
        return (
          <Chip
            label={val}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              color: styles.color,
              bgcolor: styles.bgcolor,
              border: `1px solid ${styles.border}`,
              height: 18,
            }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const order = params.row as ProductionOrder;
        const isCompleted = order.status?.toUpperCase() === 'COMPLETED';
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', height: '100%', alignItems: 'center' }}>
            <IconButton
              size="small"
              onClick={() => onView(order)}
              title="View Details"
              sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onEdit(order)}
              disabled={isCompleted}
              title="Edit Order"
              sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onComplete(order)}
              disabled={isCompleted}
              title="Mark Completed"
              sx={{ color: '#16A34A', '&:hover': { bgcolor: '#DCFCE7' } }}
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(order)}
              title="Delete Order"
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
          <InfoIcon /> Error Loading Production Orders
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
          rows={orders}
          columns={columns}
          getRowId={(row) => row.productionOrderId}
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
