import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, IconButton, Typography, Paper, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoIcon from '@mui/icons-material/Info';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MoveUpIcon from '@mui/icons-material/MoveUp';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import TuneIcon from '@mui/icons-material/Tune';
import FactoryIcon from '@mui/icons-material/Factory';
import { InventoryTransaction } from './inventoryTransactionService';

interface InventoryTransactionTableProps {
  transactions: InventoryTransaction[];
  loading: boolean;
  error: string | null;
  onView: (transaction: InventoryTransaction) => void;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
  rowCount: number;
}

export default function InventoryTransactionTable({
  transactions,
  loading,
  error,
  onView,
  paginationModel,
  onPaginationModelChange,
  rowCount,
}: InventoryTransactionTableProps) {

  const getTransactionTypeChip = (type: string) => {
    let color = '#2563EB'; // Primary Blue
    let bgcolor = '#DBEAFE';
    let borderColor = '#BFDBFE';
    let icon = <SwapHorizIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />;

    if (type === 'Goods Receipt' || type === 'Production Output' || type === 'Stock In') {
      color = '#16A34A'; // Success Green
      bgcolor = '#DCFCE7';
      borderColor = '#BBF7D0';
      icon = type === 'Production Output' 
        ? <FactoryIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: '#16A34A' }} /> 
        : <MoveDownIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: '#16A34A' }} />;
    } else if (type === 'Goods Issue' || type === 'Production Consumption' || type === 'Stock Out') {
      color = '#DC2626'; // Danger Red
      bgcolor = '#FEE2E2';
      borderColor = '#FECACA';
      icon = type === 'Production Consumption'
        ? <FactoryIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: '#DC2626' }} />
        : <MoveUpIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: '#DC2626' }} />;
    } else if (type === 'Adjustment') {
      color = '#D97706'; // Warning Orange
      bgcolor = '#FEF3C7';
      borderColor = '#FDE68A';
      icon = <TuneIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: '#D97706' }} />;
    } else if (type === 'Transfer') {
      color = '#2563EB'; // Secondary/Primary Blue
      bgcolor = '#DBEAFE';
      borderColor = '#BFDBFE';
      icon = <SwapHorizIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: '#2563EB' }} />;
    }

    return (
      <Chip
        icon={icon}
        label={type}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.725rem',
          color: color,
          bgcolor: bgcolor,
          border: `1px solid ${borderColor}`,
          height: 24,
          '& .MuiChip-icon': {
            marginLeft: '4px',
            color: 'inherit',
          }
        }}
      />
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'transactionId',
      headerName: 'Transaction ID',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          #TRN-{params.value?.toString().padStart(5, '0')}
        </Typography>
      ),
    },
    {
      field: 'itemName',
      headerName: 'Item Name',
      width: 200,
      flex: 1.2,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'warehouseName',
      headerName: 'Warehouse',
      width: 180,
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'uiTransactionType',
      headerName: 'Transaction Type',
      width: 180,
      renderCell: (params) => getTransactionTypeChip(params.value),
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const row = params.row as InventoryTransaction;
        const isStockIn = row.transactionType === 'Stock In';
        const prefix = isStockIn ? '+' : '-';
        const color = isStockIn ? '#16A34A' : '#DC2626';

        return (
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 700, 
              color: color,
            }}
          >
            {prefix}{Number(params.value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </Typography>
        );
      },
    },
    {
      field: 'referenceNumber',
      headerName: 'Reference Number',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#475569' }}>
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'transactionDate',
      headerName: 'Transaction Date',
      width: 170,
      renderCell: (params) => {
        if (!params.value) return <span>N/A</span>;
        const date = new Date(params.value);
        return (
          <Typography variant="body2" sx={{ color: '#475569' }}>
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        );
      },
    },
    {
      field: 'employeeName',
      headerName: 'Created By',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
          {params.value || 'System'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
          <Tooltip title="View Transaction Details">
            <IconButton
              size="small"
              onClick={() => onView(params.row as InventoryTransaction)}
              sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
          <InfoIcon /> Error Loading Transactions
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
          rows={transactions}
          columns={columns}
          getRowId={(row) => row.transactionId}
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
