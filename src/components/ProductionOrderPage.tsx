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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FactoryIcon from '@mui/icons-material/Factory';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PercentIcon from '@mui/icons-material/Percent';

// Recharts components for analytics section
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
} from 'recharts';

import { productionOrderService, ProductionOrder, ProductionOrderInput, DropdownItem } from './productionOrderService';
import ProductionOrderTable from './ProductionOrderTable';
import ProductionOrderFormDialog from './ProductionOrderFormDialog';
import ProductionOrderDetailsDrawer from './ProductionOrderDetailsDrawer';
import CompleteProductionDialog from './CompleteProductionDialog';
import DeleteProductionOrderDialog from './DeleteProductionOrderDialog';

export default function ProductionOrderPage() {
  // Data loading states
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [allOrders, setAllOrders] = useState<ProductionOrder[]>([]); // For client side export, KPI and charts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown list states
  const [finishedProducts, setFinishedProducts] = useState<DropdownItem[]>([]);
  const [employees, setEmployees] = useState<DropdownItem[]>([]);
  const [warehouses, setWarehouses] = useState<DropdownItem[]>([]);
  const [productsMap, setProductsMap] = useState<Record<number, string>>({});
  const [employeesMap, setEmployeesMap] = useState<Record<number, string>>({});

  // Pagination states
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  // Dialog & Drawer toggle states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOrderForForm, setSelectedOrderForForm] = useState<ProductionOrder | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<ProductionOrder | null>(null);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [selectedOrderForComplete, setSelectedOrderForComplete] = useState<ProductionOrder | null>(null);
  const [completeLoading, setCompleteLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState<ProductionOrder | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast notifications state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // KPI states
  const [kpi, setKpi] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    completionRate: 0,
  });

  // Show Toast helper
  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({
      open: true,
      message,
      severity,
    });
  };

  // Load supporting dropdown metadata
  const loadSupportData = async () => {
    try {
      const [prods, emps, whs] = await Promise.all([
        productionOrderService.getFinishedProducts(),
        productionOrderService.getEmployees(),
        productionOrderService.getWarehouses(),
      ]);

      setFinishedProducts(prods);
      setEmployees(emps);
      setWarehouses(whs);

      // Build key-value lookups
      const pMap: Record<number, string> = {};
      prods.forEach((p) => {
        pMap[p.id] = p.name;
      });
      setProductsMap(pMap);

      const eMap: Record<number, string> = {};
      emps.forEach((e) => {
        eMap[e.id] = e.name;
      });
      setEmployeesMap(eMap);
    } catch (err) {
      console.error('Failed to load dependency data lists:', err);
    }
  };

  // Fetch KPI aggregates and all orders
  const fetchKpiAndChartsData = async () => {
    try {
      const res = await productionOrderService.getProductionOrders(0, 1000);
      setAllOrders(res.content);

      const total = res.totalElements;
      const completed = res.content.filter((o) => o.status?.toUpperCase() === 'COMPLETED').length;
      const inProgress = res.content.filter((o) => o.status?.toUpperCase() === 'IN_PROGRESS' || o.status?.toUpperCase() === 'RUNNING').length;
      const pending = res.content.filter((o) => o.status?.toUpperCase() === 'PENDING' || !o.status).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      setKpi({
        total,
        completed,
        inProgress,
        pending,
        completionRate: rate,
      });
    } catch (err) {
      console.error('Failed to load production orders summary analytics:', err);
    }
  };

  // Fetch paginated production orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productionOrderService.getProductionOrders(
        paginationModel.page,
        paginationModel.pageSize
      );
      setOrders(data.content);
      setRowCount(data.totalElements);
    } catch (err: any) {
      console.error('Failed to load production orders list:', err);
      setError(err.message || 'An error occurred while fetching production orders.');
      showToast('Error loading production orders list', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  // Initial load and on change of pagination parameters
  useEffect(() => {
    loadSupportData();
    fetchOrders();
    fetchKpiAndChartsData();
  }, [fetchOrders]);

  const handleRefresh = () => {
    fetchOrders();
    fetchKpiAndChartsData();
    showToast('Data refreshed successfully', 'success');
  };

  // CRUD actions triggers
  const handleOpenCreateForm = () => {
    setSelectedOrderForForm(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (order: ProductionOrder) => {
    setSelectedOrderForForm(order);
    setFormOpen(true);
  };

  const handleSaveOrder = async (input: ProductionOrderInput) => {
    setFormSaving(true);
    try {
      if (selectedOrderForForm) {
        // Edit mode
        const updated = await productionOrderService.updateProductionOrder(
          selectedOrderForForm.productionOrderId,
          input
        );
        showToast(`Production Order #${updated.productionOrderId} updated successfully`, 'success');
      } else {
        // Create mode
        const created = await productionOrderService.createProductionOrder(input);
        showToast(`Production Order #${created.productionOrderId} created successfully`, 'success');
      }
      setFormOpen(false);
      fetchOrders();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Save production order failed:', err);
      showToast(err.response?.data?.message || 'Failed to save production order record.', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  const handleOpenDetails = (order: ProductionOrder) => {
    setSelectedOrderForDetails(order);
    setDetailsOpen(true);
  };

  // Complete actions
  const handleOpenCompleteConfirm = (order: ProductionOrder) => {
    setSelectedOrderForComplete(order);
    setCompleteOpen(true);
  };

  const handleConfirmComplete = async (warehouseId: number) => {
    if (!selectedOrderForComplete) return;
    setCompleteLoading(true);
    const orderId = selectedOrderForComplete.productionOrderId;
    try {
      await productionOrderService.completeProductionOrder(orderId, warehouseId);
      showToast(`Production Order #${orderId} completed successfully into stock`, 'success');
      setCompleteOpen(false);
      fetchOrders();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Order completion failed:', err);
      showToast(err.response?.data?.message || 'Failed to complete production order.', 'error');
    } finally {
      setCompleteLoading(false);
    }
  };

  // Delete actions
  const handleOpenDeleteConfirm = (order: ProductionOrder) => {
    setSelectedOrderForDelete(order);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedOrderForDelete) return;
    setDeleteLoading(true);
    const orderId = selectedOrderForDelete.productionOrderId;
    try {
      await productionOrderService.deleteProductionOrder(orderId);
      showToast(`Production Order #${orderId} deleted successfully`, 'success');
      setDeleteOpen(false);
      fetchOrders();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Delete production order failed:', err);
      showToast(err.response?.data?.message || 'Failed to delete production order.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (allOrders.length === 0) {
      showToast('No production data available to export', 'warning');
      return;
    }
    const headers = ['Order ID', 'Product ID', 'Product Name', 'Planned Qty', 'Produced Qty', 'Start Date', 'Target Completion', 'Status', 'Supervisor', 'Priority'];
    const rows = allOrders.map((o) => [
      o.productionOrderId,
      o.finishedProductId,
      `"${(productsMap[Number(o.finishedProductId)] || `Product #${o.finishedProductId}`).replace(/"/g, '""')}"`,
      o.quantityToProduce,
      o.quantityProduced || 0,
      new Date(o.startDate || o.productionDate || '').toLocaleString(),
      new Date(o.endDate || '').toLocaleString(),
      o.status || 'PENDING',
      `"${(employeesMap[Number(o.employeeId)] || `Supervisor #${o.employeeId}`).replace(/"/g, '""')}"`,
      o.priority || 'LOW',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `production_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported production orders list to CSV', 'success');
  };

  // Local Client Filtering / Searching
  const getFilteredOrders = () => {
    let list = orders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.productionOrderId?.toString().includes(q) ||
          (productsMap[Number(o.finishedProductId)] || '').toLowerCase().includes(q) ||
          (employeesMap[Number(o.employeeId)] || '').toLowerCase().includes(q) ||
          o.priority?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((o) => {
        const orderStatus = o.status?.toUpperCase() || 'PENDING';
        if (statusFilter === 'IN_PROGRESS') {
          return orderStatus === 'IN_PROGRESS' || orderStatus === 'RUNNING';
        }
        return orderStatus === statusFilter;
      });
    }

    return list;
  };

  const filteredOrders = getFilteredOrders();

  // Charts processing
  const getPieChartData = () => {
    return [
      { name: 'Completed', value: kpi.completed, fill: '#16A34A' },
      { name: 'In Progress', value: kpi.inProgress, fill: '#2563EB' },
      { name: 'Pending', value: kpi.pending, fill: '#64748B' },
    ].filter(item => item.value > 0);
  };

  const getBarChartData = () => {
    // Top 5 orders comparisons
    return allOrders.slice(0, 5).map((o) => ({
      name: `Order #${o.productionOrderId}`,
      Planned: Number(o.quantityToProduce || 0),
      Produced: Number(o.quantityProduced || 0),
    }));
  };

  const pieChartData = getPieChartData();
  const barChartData = getBarChartData();

  // Pie chart customized label renderer
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="0.725rem" fontWeight="bold">
        {percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
      </text>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Title Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Production Orders
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Manage manufacturing production workflows, yield completions, and warehouse storage updates
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Total Orders */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <FactoryIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Orders
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Orders */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#10B981', display: 'flex' }}>
                  <CheckCircleIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Completed
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#16A34A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* In Progress Orders */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <AutorenewIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                In Progress
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563EB', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.inProgress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Orders */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#F8FAFC', p: 1, borderRadius: 2, color: '#64748B', display: 'flex' }}>
                  <PendingActionsIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pending
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#64748B', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Completion Rate */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#FFFBEB', p: 1, borderRadius: 2, color: '#D97706', display: 'flex' }}>
                  <PercentIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Completion Rate
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : `${kpi.completionRate}%`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Production Analytics Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Status Distribution (Pie Chart) */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Production Status Distribution
              </Typography>
              {pieChartData.length > 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={240} minWidth={0}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value) => [`${value} Orders`, 'Count']} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>No orders record available for distribution analysis</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance planned vs actual (Bar Chart) */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Yield Performance (Planned vs Produced Qty)
              </Typography>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240} minWidth={0}>
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <ChartTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                    <Bar dataKey="Planned" fill="#2563EB" radius={[4, 4, 0, 0]} name="Planned Quantity" />
                    <Bar dataKey="Produced" fill="#16A34A" radius={[4, 4, 0, 0]} name="Produced Quantity" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>No orders record available for performance analysis</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Toolbar */}
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
          placeholder="Search production orders..."
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

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Filter Button */}
            <Tooltip title="Filter by Status">
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
                Filter: {statusFilter === 'ALL' ? 'All' : statusFilter === 'COMPLETED' ? 'Completed' : statusFilter === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
              </Button>
            </Tooltip>

            {/* Refresh Button */}
            <Tooltip title="Refresh Data">
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
            <Tooltip title="Export to CSV">
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

          {/* Create Production Order Button */}
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
            Create Production Order
          </Button>
        </Box>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setStatusFilter('ALL');
            setFilterAnchorEl(null);
          }}
          selected={statusFilter === 'ALL'}
        >
          All Orders
        </MenuItem>
        <MenuItem
          onClick={() => {
            setStatusFilter('PENDING');
            setFilterAnchorEl(null);
          }}
          selected={statusFilter === 'PENDING'}
        >
          Pending
        </MenuItem>
        <MenuItem
          onClick={() => {
            setStatusFilter('IN_PROGRESS');
            setFilterAnchorEl(null);
          }}
          selected={statusFilter === 'IN_PROGRESS'}
        >
          In Progress
        </MenuItem>
        <MenuItem
          onClick={() => {
            setStatusFilter('COMPLETED');
            setFilterAnchorEl(null);
          }}
          selected={statusFilter === 'COMPLETED'}
        >
          Completed
        </MenuItem>
      </Menu>

      {/* Production Orders Data Table */}
      <ProductionOrderTable
        orders={filteredOrders}
        loading={loading}
        error={error}
        productsMap={productsMap}
        employeesMap={employeesMap}
        onView={handleOpenDetails}
        onEdit={handleOpenEditForm}
        onComplete={handleOpenCompleteConfirm}
        onDelete={handleOpenDeleteConfirm}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowCount={rowCount}
      />

      {/* Create / Edit Dialog */}
      <ProductionOrderFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveOrder}
        order={selectedOrderForForm}
        saving={formSaving}
        finishedProducts={finishedProducts}
        employees={employees}
      />

      {/* Details Profile Drawer */}
      <ProductionOrderDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        order={selectedOrderForDetails}
        productsMap={productsMap}
        employeesMap={employeesMap}
      />

      {/* Complete Workflow Dialog */}
      <CompleteProductionDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={handleConfirmComplete}
        order={selectedOrderForComplete}
        loading={completeLoading}
        productsMap={productsMap}
        warehouses={warehouses}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProductionOrderDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        order={selectedOrderForDelete}
        loading={deleteLoading}
      />

      {/* Toast Notifications */}
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
