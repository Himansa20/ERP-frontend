import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Tooltip,
  InputAdornment,
  Paper,
  CircularProgress,
  Chip,
  LinearProgress,
  Divider,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import ErrorOutlineIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import SpeedIcon from '@mui/icons-material/Speed';
import CategoryIcon from '@mui/icons-material/Category';

import { inventoryTransactionService, WarehouseStock } from './inventoryTransactionService';
import { warehouseService, Warehouse } from './warehouseService';
import { itemService, ParsedItem } from './itemService';

interface StockTableRow extends WarehouseStock {
  id: string; // unique combination of warehouseId + itemId
  reorderLevel: number;
  unitOfMeasure: string;
  reorderStatus: 'Normal' | 'Low Stock' | 'Critical';
}

export default function StockByWarehousePage() {
  const [stockData, setStockData] = useState<WarehouseStock[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Normal' | 'Low Stock' | 'Critical'>('ALL');

  // Load All Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch stock by warehouse
      const stockRes = await inventoryTransactionService.getStockByWarehouse();
      
      // Fetch warehouses to map utilization details
      const warehousesRes = await warehouseService.getWarehouses(0, 1000);
      
      // Fetch items to map reorder levels & unit of measure
      const itemsRes = await itemService.getItems(0, 1000);

      setStockData(stockRes);
      setWarehouses(warehousesRes.content);
      setItems(itemsRes.content);
    } catch (err: any) {
      console.error('Failed to load stock-by-warehouse data:', err);
      setError(err.message || 'An error occurred while loading warehouse stock allocations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
  };

  // Maps for faster lookup
  const itemMap = React.useMemo(() => {
    return new Map(items.map(i => [i.itemId, i]));
  }, [items]);

  // Warehouse summaries calculations for Cards
  const warehouseSummaries = React.useMemo(() => {
    const summaryMap = new Map<number, {
      warehouseId: number;
      warehouseName: string;
      totalItems: number;
      totalStock: number;
      capacity: number;
      utilization: number;
    }>();

    // Initialize with all known warehouses
    warehouses.forEach(w => {
      summaryMap.set(w.warehouseId, {
        warehouseId: w.warehouseId,
        warehouseName: w.warehouseName,
        totalItems: 0,
        totalStock: 0,
        capacity: w.capacity || 10000,
        utilization: w.currentUtilization || 50
      });
    });

    // Aggregate stock data
    stockData.forEach(item => {
      const summary = summaryMap.get(item.warehouseId);
      if (summary) {
        summary.totalItems += 1;
        summary.totalStock += item.quantityOnHand;
      }
    });

    return Array.from(summaryMap.values());
  }, [stockData, warehouses]);

  // Correlate and filter Stock Table rows
  const tableRows = React.useMemo((): StockTableRow[] => {
    return stockData.map(stock => {
      const dbItem = itemMap.get(stock.itemId);
      const reorderLevel = dbItem?.reorderLevel || 0;
      const unitOfMeasure = dbItem?.unitOfMeasure || 'units';
      
      let reorderStatus: 'Normal' | 'Low Stock' | 'Critical' = 'Normal';
      if (stock.quantityOnHand === 0) {
        reorderStatus = 'Critical';
      } else if (stock.quantityOnHand <= reorderLevel) {
        reorderStatus = 'Low Stock';
      }

      return {
        ...stock,
        id: `${stock.warehouseId}-${stock.itemId}`,
        reorderLevel,
        unitOfMeasure,
        reorderStatus
      };
    });
  }, [stockData, itemMap]);

  // Apply filters
  const filteredRows = React.useMemo(() => {
    return tableRows.filter(row => {
      // 1. Search Query (Item name or Warehouse name)
      const matchesSearch = 
        row.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.warehouseName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Warehouse Filter
      const matchesWarehouse = 
        selectedWarehouseFilter === 'ALL' || 
        row.warehouseId === selectedWarehouseFilter;
      
      // 3. Status Filter
      const matchesStatus = 
        statusFilter === 'ALL' || 
        row.reorderStatus === statusFilter;

      return matchesSearch && matchesWarehouse && matchesStatus;
    });
  }, [tableRows, searchQuery, selectedWarehouseFilter, statusFilter]);

  // Table columns definition
  const columns: GridColDef[] = [
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
      field: 'itemName',
      headerName: 'Item Name',
      width: 240,
      flex: 1.5,
      renderCell: (params) => {
        const row = params.row as StockTableRow;
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', lineHeight: 1.2 }}>
              {params.value}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, lineHeight: 1.2 }}>
              Item ID: #{row.itemId}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'quantityOnHand',
      headerName: 'Available Stock',
      width: 160,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const row = params.row as StockTableRow;
        return (
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
            {Number(params.value).toLocaleString()} {row.unitOfMeasure}
          </Typography>
        );
      },
    },
    {
      field: 'reorderLevel',
      headerName: 'Safety Reorder Level',
      width: 180,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const row = params.row as StockTableRow;
        return (
          <Typography variant="body2" sx={{ color: '#475569' }}>
            {Number(params.value).toLocaleString()} {row.unitOfMeasure}
          </Typography>
        );
      },
    },
    {
      field: 'reorderStatus',
      headerName: 'Reorder Status',
      width: 160,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const status = params.value as 'Normal' | 'Low Stock' | 'Critical';
        let chipColor = '#16A34A';
        let chipBg = '#DCFCE7';
        let chipBorder = '#BBF7D0';
        let icon = <CheckCircleIcon sx={{ fontSize: '0.85rem', mr: 0.5, color: '#16A34A' }} />;

        if (status === 'Critical') {
          chipColor = '#DC2626';
          chipBg = '#FEE2E2';
          chipBorder = '#FECACA';
          icon = <ErrorOutlineIcon sx={{ fontSize: '0.85rem', mr: 0.5, color: '#DC2626' }} />;
        } else if (status === 'Low Stock') {
          chipColor = '#D97706';
          chipBg = '#FEF3C7';
          chipBorder = '#FDE68A';
          icon = <WarningIcon sx={{ fontSize: '0.85rem', mr: 0.5, color: '#D97706' }} />;
        }

        return (
          <Chip
            icon={icon}
            label={status === 'Normal' ? 'Stock OK' : status}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.725rem',
              color: chipColor,
              bgcolor: chipBg,
              border: `1px solid ${chipBorder}`,
              height: 24,
              '& .MuiChip-icon': {
                marginLeft: '4px',
                color: 'inherit',
              }
            }}
          />
        );
      },
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12, gap: 2 }}>
        <CircularProgress size={45} />
        <Typography variant="body2" color="textSecondary">
          Loading stock balances and utilization charts...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 4, bgcolor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 2, textAlign: 'center' }}>
        <ErrorOutlineIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h6" color="error" sx={{ fontWeight: 700, mb: 1 }}>
          Failed to Load Stock Data
        </Typography>
        <Typography variant="body2" sx={{ color: '#7F1D1D', mb: 3 }}>
          {error}
        </Typography>
        <Button variant="outlined" color="error" onClick={loadData}>
          Retry Connection
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Title Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Warehouse Stock Levels
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Real-time tracking of item quantities on hand per warehouse and safety limits
        </Typography>
      </Box>

      {/* Warehouse Summary Cards */}
      <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Active Locations Overview
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 5 }}>
        {warehouseSummaries.map((w) => {
          let utilColor = '#16A34A';
          if (w.utilization > 85) utilColor = '#DC2626';
          else if (w.utilization > 70) utilColor = '#D97706';

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={w.warehouseId}>
              <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FFFFFF' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                      <WarehouseIcon sx={{ fontSize: 22 }} />
                    </Box>
                    <Chip
                      label={`ID: #${w.warehouseId}`}
                      size="small"
                      sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: '#F1F5F9' }}
                    />
                  </Box>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 750, color: '#0F172A', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {w.warehouseName}
                  </Typography>

                  <Grid container spacing={1} sx={{ mt: 2, mb: 2 }}>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CategoryIcon sx={{ fontSize: 16, color: '#64748B' }} />
                        <Typography variant="caption" color="textSecondary">Unique Items</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 750, ml: 2.5, color: '#1E293B' }}>
                        {w.totalItems}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SpeedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                        <Typography variant="caption" color="textSecondary">Total Qty</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 750, ml: 2.5, color: '#1E293B' }}>
                        {w.totalStock.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Utilization Progress */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="textSecondary">Warehouse Space Utilization</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: utilColor }}>{w.utilization}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={w.utilization}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#F1F5F9',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: utilColor,
                          borderRadius: 3,
                        }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Filter and Table Toolbar */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, justifyContent: 'space-between', mb: 3 }}>
        {/* Search */}
        <TextField
          placeholder="Search by item name or warehouse..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', md: 320 }, bgcolor: '#FFFFFF' }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Warehouse dropdown */}
          <TextField
            select
            label="Filter Warehouse"
            value={selectedWarehouseFilter}
            onChange={(e) => setSelectedWarehouseFilter(e.target.value as number | 'ALL')}
            size="small"
            sx={{ minWidth: 180, bgcolor: '#FFFFFF' }}
          >
            <MenuItem value="ALL">All Warehouses</MenuItem>
            {warehouses.map(w => (
              <MenuItem key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</MenuItem>
            ))}
          </TextField>

          {/* Status dropdown */}
          <TextField
            select
            label="Filter Stock Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            size="small"
            sx={{ minWidth: 160, bgcolor: '#FFFFFF' }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="Normal">Stock OK</MenuItem>
            <MenuItem value="Low Stock">Low Stock Alert</MenuItem>
            <MenuItem value="Critical">Critical (Out of Stock)</MenuItem>
          </TextField>

          {/* Refresh */}
          <Tooltip title="Refresh stock details">
            <IconButton
              onClick={handleRefresh}
              sx={{
                border: '1px solid #E2E8F0',
                borderRadius: 1.5,
                bgcolor: '#FFFFFF',
                color: '#475569',
                height: 40,
                width: 40,
                '&:hover': { bgcolor: '#F8FAFC' },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Inventory Summary Table */}
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
            rows={filteredRows}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 10 } }
            }}
            disableRowSelectionOnClick
            rowHeight={64}
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
    </Box>
  );
}
