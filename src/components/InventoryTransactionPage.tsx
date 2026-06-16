import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import InventoryIcon from '@mui/icons-material/Inventory';
import MoveUpIcon from '@mui/icons-material/MoveUp';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TuneIcon from '@mui/icons-material/Tune';

// Recharts components
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

import { 
  inventoryTransactionService, 
  InventoryTransaction, 
  InventoryTransactionInput,
  WarehouseStock
} from './inventoryTransactionService';
import InventoryTransactionTable from './InventoryTransactionTable';
import InventoryTransactionFormDialog from './InventoryTransactionFormDialog';
import InventoryTransactionDetailsDrawer from './InventoryTransactionDetailsDrawer';

const COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#8B5CF6', '#EC4899'];

export default function InventoryTransactionPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<InventoryTransaction[]>([]); // For KPIs & charts
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([]); // For warehouse stock analysis
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  // Dialog and drawer triggers
  const [formOpen, setFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTransactionForDetails, setSelectedTransactionForDetails] = useState<InventoryTransaction | null>(null);

  // Toast notification state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // KPI states
  const [kpis, setKpis] = useState({
    total: 0,
    received: 0,
    issued: 0,
    transfers: 0,
    adjustments: 0,
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Fetch KPI data & aggregated lists
  const fetchKpiAndChartsData = async () => {
    try {
      // Fetch up to 1000 transactions for client-side stats
      const res = await inventoryTransactionService.getTransactions(0, 1000);
      setAllTransactions(res.content);

      // Fetch warehouse stocks for warehouse stock comparison
      const stockRes = await inventoryTransactionService.getStockByWarehouse();
      setWarehouseStocks(stockRes);

      // Count operations
      const total = res.totalElements;
      const received = res.content.filter(t => t.uiTransactionType === 'Goods Receipt' || t.uiTransactionType === 'Production Output' || t.transactionType === 'Stock In').length;
      const issued = res.content.filter(t => t.uiTransactionType === 'Goods Issue' || t.uiTransactionType === 'Production Consumption' || t.transactionType === 'Stock Out').length;
      const transfers = res.content.filter(t => t.uiTransactionType === 'Transfer').length;
      const adjustments = res.content.filter(t => t.uiTransactionType === 'Adjustment').length;

      setKpis({
        total,
        received,
        issued,
        transfers,
        adjustments
      });
    } catch (err) {
      console.error('Failed to load global transaction statistics:', err);
    }
  };

  // Fetch paginated transactions list
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryTransactionService.getTransactions(
        paginationModel.page,
        paginationModel.pageSize
      );
      setTransactions(data.content);
      setRowCount(data.totalElements);
    } catch (err: any) {
      console.error('Failed to load transactions list:', err);
      setError(err.message || 'An error occurred while loading inventory transactions.');
      showToast('Error loading transaction registry', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    fetchTransactions();
    fetchKpiAndChartsData();
  }, [fetchTransactions]);

  const handleRefresh = () => {
    fetchTransactions();
    fetchKpiAndChartsData();
    showToast('Registry synchronized successfully', 'success');
  };

  // Dialog triggers
  const handleOpenCreateForm = () => {
    setFormOpen(true);
  };

  const handleSaveTransaction = async (payload: InventoryTransactionInput) => {
    setFormSaving(true);
    try {
      const created = await inventoryTransactionService.createTransaction(payload);
      showToast(`Transaction ${created.referenceNumber} recorded successfully`, 'success');
      setFormOpen(false);
      fetchTransactions();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Record transaction failed:', err);
      showToast(err.response?.data?.message || 'Failed to save inventory transaction.', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  const handleOpenDetails = (transaction: InventoryTransaction) => {
    setSelectedTransactionForDetails(transaction);
    setDetailsOpen(true);
  };

  // Export CSV data
  const handleExportCSV = () => {
    if (allTransactions.length === 0) {
      showToast('No transaction records available to export', 'warning');
      return;
    }
    const headers = ['Transaction ID', 'Item ID', 'Item Name', 'Warehouse ID', 'Warehouse Name', 'Employee ID', 'Employee Name', 'Operation Type', 'Detailed Type', 'Quantity', 'Reference No', 'Date Time', 'Notes'];
    const rows = allTransactions.map((t) => [
      t.transactionId,
      t.itemId,
      `"${(t.itemName || '').replace(/"/g, '""')}"`,
      t.warehouseId,
      `"${(t.warehouseName || '').replace(/"/g, '""')}"`,
      t.employeeId || '',
      `"${(t.employeeName || '').replace(/"/g, '""')}"`,
      t.transactionType,
      t.uiTransactionType,
      t.quantity,
      `"${(t.referenceNumber || '').replace(/"/g, '""')}"`,
      new Date(t.transactionDate).toISOString(),
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_transaction_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported transaction log to CSV', 'success');
  };

  // Filter & Search
  const getFilteredTransactions = () => {
    let list = transactions;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.itemName?.toLowerCase().includes(q) ||
          t.warehouseName?.toLowerCase().includes(q) ||
          t.referenceNumber?.toLowerCase().includes(q) ||
          t.uiTransactionType?.toLowerCase().includes(q) ||
          t.employeeName?.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'ALL') {
      list = list.filter((t) => t.uiTransactionType === typeFilter);
    }

    return list;
  };

  const filteredTransactions = getFilteredTransactions();

  // Recharts Pie Chart Data: Transaction Type Distribution
  const getPieChartData = () => {
    const counts: { [key: string]: number } = {};
    allTransactions.forEach(t => {
      const type = t.uiTransactionType;
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  };

  // Recharts Bar Chart Data: Warehouse Stock Analysis
  const getBarChartData = () => {
    const warehouseStockSums: { [key: string]: number } = {};
    warehouseStocks.forEach(s => {
      warehouseStockSums[s.warehouseName] = (warehouseStockSums[s.warehouseName] || 0) + s.quantityOnHand;
    });

    return Object.keys(warehouseStockSums).map(key => ({
      name: key,
      'Current Stock': warehouseStockSums[key]
    })).slice(0, 8); // Top 8 warehouses
  };

  // Recharts Line Chart Data: Movement Trend (Daily counts in the last 15 days)
  const getLineChartData = () => {
    const dateCounts: { [key: string]: number } = {};
    // Sort transactions by date ascending
    const sortedTx = [...allTransactions].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
    
    sortedTx.forEach(t => {
      const date = new Date(t.transactionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    return Object.keys(dateCounts).map(key => ({
      date: key,
      'Transactions': dateCounts[key]
    })).slice(-10); // Last 10 days
  };

  const pieChartData = getPieChartData();
  const barChartData = getBarChartData();
  const lineChartData = getLineChartData();

  // Custom label renderer for Pie Chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="0.75rem" fontWeight="bold">
        {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
      </text>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Title Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Inventory Transactions
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Track inventory movements and warehouse stock operations
        </Typography>
      </Box>

      {/* KPI Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* KPI 1: Total Transactions */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <InventoryIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Transactions
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpis.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Goods Received */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#16A34A', display: 'flex' }}>
                  <MoveDownIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Goods Received
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#16A34A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpis.received}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Goods Issued */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#FEF2F2', p: 1, borderRadius: 2, color: '#DC2626', display: 'flex' }}>
                  <MoveUpIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Goods Issued
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#DC2626', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpis.issued}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: Transfers */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <SwapHorizIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Warehouse Transfers
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpis.transfers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 5: Adjustments */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#FFFBEB', p: 1, borderRadius: 2, color: '#D97706', display: 'flex' }}>
                  <TuneIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Stock Adjustments
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpis.adjustments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Chart 1: Transaction Type Distribution (Pie Chart) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Transaction Type Distribution
              </Typography>
              {pieChartData.length > 0 ? (
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={75}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value) => [`${value} Logs`]} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                  <Typography variant="body2" color="textSecondary">No transaction distributions registered</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 2: Warehouse Stock Analysis (Bar Chart) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Warehouse Stock Analysis
              </Typography>
              {barChartData.length > 0 ? (
                <Box sx={{ flexGrow: 1, minHeight: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                      <ChartTooltip formatter={(value) => [`${Number(value).toLocaleString()} Units`]} />
                      <Bar dataKey="Current Stock" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                  <Typography variant="body2" color="textSecondary">No warehouse balances logged</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 3: Inventory Movement Trend (Line Chart) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Inventory Movement Trend (Daily logs)
              </Typography>
              {lineChartData.length > 0 ? (
                <Box sx={{ flexGrow: 1, minHeight: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                      <ChartTooltip formatter={(value) => [`${value} Transactions`]} />
                      <Line type="monotone" dataKey="Transactions" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                  <Typography variant="body2" color="textSecondary">No transaction timeline trend data</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Action Bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          mb: 3,
        }}
      >
        {/* Search Field */}
        <TextField
          placeholder="Search by item, warehouse, reference, type..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', md: 360 }, bgcolor: '#FFFFFF' }}
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

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Filter Button */}
            <Tooltip title="Filter by Transaction Type">
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                sx={{
                  color: '#475569',
                  borderColor: '#E2E8F0',
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#FFFFFF',
                  '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' },
                }}
              >
                Filter: {typeFilter === 'ALL' ? 'All Types' : typeFilter}
              </Button>
            </Tooltip>

            {/* Refresh Button */}
            <Tooltip title="Refresh Transaction Registry">
              <IconButton
                onClick={handleRefresh}
                sx={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 1.5,
                  bgcolor: '#FFFFFF',
                  color: '#475569',
                  '&:hover': { bgcolor: '#F8FAFC' },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Export Button */}
            <Tooltip title="Export log to CSV">
              <IconButton
                onClick={handleExportCSV}
                sx={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 1.5,
                  bgcolor: '#FFFFFF',
                  color: '#475569',
                  '&:hover': { bgcolor: '#F8FAFC' },
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Create Transaction Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateForm}
            sx={{
              bgcolor: '#2563EB',
              color: '#FFFFFF',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#1D4ED8',
                boxShadow: 'none',
              },
            }}
          >
            Create Transaction
          </Button>
        </Box>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem onClick={() => { setTypeFilter('ALL'); setFilterAnchorEl(null); }} selected={typeFilter === 'ALL'}>
          All Types
        </MenuItem>
        <MenuItem onClick={() => { setTypeFilter('Goods Receipt'); setFilterAnchorEl(null); }} selected={typeFilter === 'Goods Receipt'}>
          Goods Receipt
        </MenuItem>
        <MenuItem onClick={() => { setTypeFilter('Goods Issue'); setFilterAnchorEl(null); }} selected={typeFilter === 'Goods Issue'}>
          Goods Issue
        </MenuItem>
        <MenuItem onClick={() => { setTypeFilter('Transfer'); setFilterAnchorEl(null); }} selected={typeFilter === 'Transfer'}>
          Transfer
        </MenuItem>
        <MenuItem onClick={() => { setTypeFilter('Adjustment'); setFilterAnchorEl(null); }} selected={typeFilter === 'Adjustment'}>
          Adjustment
        </MenuItem>
        <MenuItem onClick={() => { setTypeFilter('Production Consumption'); setFilterAnchorEl(null); }} selected={typeFilter === 'Production Consumption'}>
          Production Consumption
        </MenuItem>
        <MenuItem onClick={() => { setTypeFilter('Production Output'); setFilterAnchorEl(null); }} selected={typeFilter === 'Production Output'}>
          Production Output
        </MenuItem>
      </Menu>

      {/* Table grid */}
      <InventoryTransactionTable
        transactions={filteredTransactions}
        loading={loading}
        error={error}
        onView={handleOpenDetails}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowCount={rowCount}
      />

      {/* Form Dialog */}
      <InventoryTransactionFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveTransaction}
        saving={formSaving}
      />

      {/* Details Side Drawer */}
      <InventoryTransactionDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        transaction={selectedTransactionForDetails}
      />

      {/* Toast Alert Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
