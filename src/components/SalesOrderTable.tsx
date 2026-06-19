import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, IconButton, Typography, Paper } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InfoIcon from '@mui/icons-material/Info';
import { SalesOrder } from './salesOrderService';
import { formatCurrency } from '../utils/currency';

interface SalesOrderTableProps {
  orders: SalesOrder[];
  loading: boolean;
  error: string | null;
  customersMap: Record<number, string>;
  onView: (order: SalesOrder) => void;
  onEdit: (order: SalesOrder) => void;
  onDeliver: (order: SalesOrder) => void;
  onInvoice: (order: SalesOrder) => void;
  onDelete: (order: SalesOrder) => void;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
  rowCount: number;
}

export default function SalesOrderTable({
  orders,
  loading,
  error,
  customersMap,
  onView,
  onEdit,
  onDeliver,
  onInvoice,
  onDelete,
  paginationModel,
  onPaginationModelChange,
  rowCount,
}: SalesOrderTableProps) {
  const getStatusChip = (statusStr?: string) => {
    const status = statusStr || 'Pending';
    let label = 'Pending';
    let color = '#D97706';
    let bgcolor = '#FEF3C7';
    let border = '#FDE68A';

    if (status.toUpperCase() === 'DELIVERED') {
      label = 'Delivered';
      color = '#16A34A';
      bgcolor = '#DCFCE7';
      border = '#BBF7D0';
    } else if (status.toUpperCase() === 'CANCELLED') {
      label = 'Cancelled';
      color = '#DC2626';
      bgcolor = '#FEE2E2';
      border = '#FECACA';
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

  const getPaymentStatus = (row: SalesOrder) => {
    const total = Number(row.totalAmount || 0);
    const paid = (row.payments || []).reduce((acc, p) => acc + Number(p.paymentAmount || 0), 0);

    if (paid >= total && total > 0) {
      return (
        <Chip
          label="Paid"
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '0.725rem',
            color: '#16A34A',
            bgcolor: '#DCFCE7',
            border: '1px solid #BBF7D0',
            height: 22,
          }}
        />
      );
    }
    if (paid > 0) {
      return (
        <Chip
          label="Partial"
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '0.725rem',
            color: '#D97706',
            bgcolor: '#FEF3C7',
            border: '1px solid #FDE68A',
            height: 22,
          }}
        />
      );
    }
    return (
      <Chip
        label="Unpaid"
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.725rem',
          color: '#DC2626',
          bgcolor: '#FEE2E2',
          border: '1px solid #FECACA',
          height: 22,
        }}
      />
    );
  };

  const getDeliveryStatus = (statusStr?: string) => {
    const isDelivered = statusStr?.toUpperCase() === 'DELIVERED';
    return (
      <Chip
        label={isDelivered ? 'Shipped' : 'Pending'}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.725rem',
          color: isDelivered ? '#16A34A' : '#64748B',
          bgcolor: isDelivered ? '#DCFCE7' : '#F1F5F9',
          border: `1px solid ${isDelivered ? '#BBF7D0' : '#E2E8F0'}`,
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
      field: 'salesOrderId',
      headerName: 'Order ID',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'customerId',
      headerName: 'Customer Name',
      width: 200,
      flex: 1.3,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {customersMap[Number(params.value)] || `Customer #${params.value}`}
        </Typography>
      ),
    },
    {
      field: 'orderDate',
      headerName: 'Order Date',
      width: 120,
      renderCell: (params) => <span>{formatDate(params.value)}</span>,
    },
    {
      field: 'deliveryDate',
      headerName: 'Delivery Date',
      width: 130,
      renderCell: (params) => {
        // If delivered, show the delivery date or order date offset as mock
        const isDelivered = params.row.orderStatus?.toUpperCase() === 'DELIVERED';
        if (isDelivered) {
          const date = params.value || new Date(new Date(params.row.orderDate).getTime() + 24 * 60 * 60 * 1000).toISOString();
          return <span>{formatDate(date)}</span>;
        }
        return <span style={{ color: '#94A3B8' }}>Pending Delivery</span>;
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
          {formatCurrency(Number(params.value || 0))}
        </span>
      ),
    },
    {
      field: 'orderStatus',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'paymentStatus',
      headerName: 'Payment',
      width: 110,
      renderCell: (params) => getPaymentStatus(params.row as SalesOrder),
    },
    {
      field: 'deliveryStatus',
      headerName: 'Delivery',
      width: 110,
      renderCell: (params) => getDeliveryStatus(params.row.orderStatus),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 190,
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const order = params.row as SalesOrder;
        const isDelivered = order.orderStatus?.toUpperCase() === 'DELIVERED';
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
              disabled={isDelivered}
              title="Edit Order"
              sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDeliver(order)}
              disabled={isDelivered}
              title="Ship / Deliver"
              sx={{ color: '#16A34A', '&:hover': { bgcolor: '#DCFCE7' } }}
            >
              <LocalShippingIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onInvoice(order)}
              title="Generate Invoice"
              sx={{ color: '#6366F1', '&:hover': { bgcolor: '#EEF2FF' } }}
            >
              <ReceiptIcon fontSize="small" />
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
          <InfoIcon /> Error Loading Sales Orders
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
          getRowId={(row) => row.salesOrderId}
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
