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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaidIcon from '@mui/icons-material/Paid';
import PeopleIcon from '@mui/icons-material/People';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { formatCurrency } from '../utils/currency';

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
} from 'recharts';

import { salesOrderService, SalesOrder, SalesOrderInput, DropdownItem } from './salesOrderService';
import SalesOrderTable from './SalesOrderTable';
import SalesOrderFormDialog from './SalesOrderFormDialog';
import SalesOrderDetailsDrawer from './SalesOrderDetailsDrawer';
import DeliverOrderDialog from './DeliverOrderDialog';
import InvoiceViewerDialog from './InvoiceViewerDialog';
import DeleteSalesOrderDialog from './DeleteSalesOrderDialog';

export default function SalesOrderPage() {
  // Loading states
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [allOrders, setAllOrders] = useState<SalesOrder[]>([]); // For client side analytics calculation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown options
  const [customers, setCustomers] = useState<DropdownItem[]>([]);
  const [employees, setEmployees] = useState<DropdownItem[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<DropdownItem[]>([]);
  const [customersMap, setCustomersMap] = useState<Record<number, string>>({});
  const [employeesMap, setEmployeesMap] = useState<Record<number, string>>({});
  const [productsMap, setProductsMap] = useState<Record<number, string>>({});

  // Pagination states
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  // Dialog and drawer toggles
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOrderForForm, setSelectedOrderForForm] = useState<SalesOrder | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<SalesOrder | null>(null);

  const [deliverOpen, setDeliverOpen] = useState(false);
  const [selectedOrderForDeliver, setSelectedOrderForDeliver] = useState<SalesOrder | null>(null);
  const [deliverLoading, setDeliverLoading] = useState(false);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<SalesOrder | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState<SalesOrder | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // KPI metrics
  const [kpi, setKpi] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Load support metadata
  const loadSupportData = async () => {
    try {
      const [custs, emps, prods, whs] = await Promise.all([
        salesOrderService.getCustomers(),
        salesOrderService.getEmployees(),
        salesOrderService.getFinishedProducts(),
        salesOrderService.getWarehouses(),
      ]);

      setCustomers(custs);
      setEmployees(emps);
      setFinishedProducts(prods);
      setWarehouses(whs);

      // Mappings
      const cMap: Record<number, string> = {};
      custs.forEach((c) => {
        cMap[c.id] = c.name;
      });
      setCustomersMap(cMap);

      const eMap: Record<number, string> = {};
      emps.forEach((e) => {
        eMap[e.id] = e.name;
      });
      setEmployeesMap(eMap);

      const pMap: Record<number, string> = {};
      prods.forEach((p) => {
        const id = p.itemId || p.id;
        const name = p.itemName || p.name;
        pMap[id] = name;
      });
      setProductsMap(pMap);
    } catch (err) {
      console.error('Failed to load dependency metadata:', err);
    }
  };

  // Fetch KPI aggregates and all orders
  const fetchKpiAndChartsData = async () => {
    try {
      const res = await salesOrderService.getSalesOrders(0, 1000);
      setAllOrders(res.content);

      const total = res.totalElements;
      const pending = res.content.filter((o) => o.orderStatus?.toUpperCase() === 'PENDING' || !o.orderStatus).length;
      const delivered = res.content.filter((o) => o.orderStatus?.toUpperCase() === 'DELIVERED').length;
      const revenue = res.content.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const avgValue = total > 0 ? revenue / total : 0;

      setKpi({
        totalOrders: total,
        pendingOrders: pending,
        deliveredOrders: delivered,
        totalRevenue: revenue,
        avgOrderValue: avgValue,
      });
    } catch (err) {
      console.error('Failed to load sales summary statistics:', err);
    }
  };

  // Fetch paginated sales orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesOrderService.getSalesOrders(
        paginationModel.page,
        paginationModel.pageSize
      );
      setOrders(data.content);
      setRowCount(data.totalElements);
    } catch (err: any) {
      console.error('Failed to load sales orders:', err);
      setError(err.message || 'An error occurred while loading sales orders.');
      showToast('Error loading sales orders list', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

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

  // Form triggers
  const handleOpenCreateForm = () => {
    setSelectedOrderForForm(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (order: SalesOrder) => {
    setSelectedOrderForForm(order);
    setFormOpen(true);
  };

  const handleSaveOrder = async (inputPayload: SalesOrderInput) => {
    setFormSaving(true);
    try {
      if (selectedOrderForForm) {
        // Edit mode
        const updated = await salesOrderService.updateSalesOrder(
          selectedOrderForForm.salesOrderId,
          inputPayload
        );
        showToast(`Sales Order #${updated.salesOrderId} updated successfully`, 'success');
      } else {
        // Create mode
        const created = await salesOrderService.createSalesOrder(inputPayload);
        showToast(`Sales Order #${created.salesOrderId} created successfully`, 'success');
      }
      setFormOpen(false);
      fetchOrders();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Save sales order failed:', err);
      showToast(err.response?.data?.message || 'Failed to save sales order.', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  const handleOpenDetails = (order: SalesOrder) => {
    setSelectedOrderForDetails(order);
    setDetailsOpen(true);
  };

  // Ship/Deliver actions
  const handleOpenDeliverConfirm = (order: SalesOrder) => {
    setSelectedOrderForDeliver(order);
    setDeliverOpen(true);
  };

  const handleConfirmDeliver = async (warehouseId: number) => {
    if (!selectedOrderForDeliver) return;
    setDeliverLoading(true);
    const orderId = selectedOrderForDeliver.salesOrderId;
    try {
      await salesOrderService.deliverSalesOrder(orderId, warehouseId);
      showToast(`Sales Order #${orderId} marked as delivered successfully`, 'success');
      setDeliverOpen(false);
      fetchOrders();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Fulfillment shipping failed:', err);
      showToast(err.response?.data?.message || 'Failed to deliver sales order.', 'error');
    } finally {
      setDeliverLoading(false);
    }
  };

  // Invoice viewer actions
  const handleOpenInvoiceViewer = (order: SalesOrder) => {
    setSelectedOrderForInvoice(order);
    setInvoiceOpen(true);
  };

  // Delete actions
  const handleOpenDeleteConfirm = (order: SalesOrder) => {
    setSelectedOrderForDelete(order);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedOrderForDelete) return;
    setDeleteLoading(true);
    const orderId = selectedOrderForDelete.salesOrderId;
    try {
      await salesOrderService.deleteSalesOrder(orderId);
      showToast(`Sales Order #${orderId} deleted successfully`, 'success');
      setDeleteOpen(false);
      fetchOrders();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Delete sales order failed:', err);
      showToast(err.response?.data?.message || 'Failed to delete sales order.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (allOrders.length === 0) {
      showToast('No sales data available to export', 'warning');
      return;
    }
    const headers = ['Order ID', 'Customer Name', 'Order Date', 'Total Amount', 'Status', 'Payments Collected'];
    const rows = allOrders.map((o) => {
      const cust = customersMap[o.customerId] || `Customer #${o.customerId}`;
      const paidAmt = (o.payments || []).reduce((acc, p) => acc + Number(p.paymentAmount || 0), 0);
      return [
        o.salesOrderId,
        `"${cust.replace(/"/g, '""')}"`,
        new Date(o.orderDate || '').toLocaleDateString(),
        o.totalAmount,
        o.orderStatus || 'Pending',
        paidAmt,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported sales orders list to CSV', 'success');
  };

  // Client side sorting / search matching
  const getFilteredOrders = () => {
    let list = orders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.salesOrderId?.toString().includes(q) ||
          (customersMap[o.customerId] || '').toLowerCase().includes(q) ||
          o.orderStatus?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((o) => {
        const status = o.orderStatus?.toUpperCase() || 'PENDING';
        return status === statusFilter;
      });
    }

    return list;
  };

  const filteredOrders = getFilteredOrders();

  // Charts processing
  const getPieChartData = () => {
    return [
      { name: 'Pending', value: kpi.pendingOrders, fill: '#D97706' },
      { name: 'Delivered', value: kpi.deliveredOrders, fill: '#16A34A' },
      { name: 'Cancelled', value: allOrders.filter(o => o.orderStatus?.toUpperCase() === 'CANCELLED').length, fill: '#DC2626' }
    ].filter(item => item.value > 0);
  };

  const getBarChartData = () => {
    // Group revenue generated by top customers
    const custStats: Record<number, { name: string; revenue: number }> = {};
    allOrders.forEach((o) => {
      const name = customersMap[o.customerId] || `Customer #${o.customerId}`;
      if (!custStats[o.customerId]) {
        custStats[o.customerId] = { name, revenue: 0 };
      }
      custStats[o.customerId].revenue += Number(o.totalAmount || 0);
    });

    return Object.values(custStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // top 5 customers
  };

  const getTopCustomersTableData = () => {
    const custStats: Record<number, { name: string; count: number; revenue: number }> = {};
    allOrders.forEach((o) => {
      const name = customersMap[o.customerId] || `Customer #${o.customerId}`;
      if (!custStats[o.customerId]) {
        custStats[o.customerId] = { name, count: 0, revenue: 0 };
      }
      custStats[o.customerId].count += 1;
      custStats[o.customerId].revenue += Number(o.totalAmount || 0);
    });

    return Object.values(custStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4); // top 4 customers for compact dashboard layout
  };

  const pieChartData = getPieChartData();
  const barChartData = getBarChartData();
  const topCustomersTable = getTopCustomersTableData();

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
          Sales Orders
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Manage sales, deliveries, and customer order fulfillment logs
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Total Sales Orders */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <ShoppingCartIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Orders
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.totalOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Orders */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#FFFBEB', p: 1, borderRadius: 2, color: '#D97706', display: 'flex' }}>
                  <HourglassEmptyIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pending Orders
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.pendingOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Delivered Orders */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#10B981', display: 'flex' }}>
                  <LocalShippingIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Delivered
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#16A34A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.deliveredOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Revenue */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <PaidIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Revenue
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : formatCurrency(kpi.totalRevenue, { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Average Order Value */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#F8FAFC', p: 1, borderRadius: 2, color: '#64748B', display: 'flex' }}>
                  <LeaderboardIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Average Order Value
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : formatCurrency(kpi.avgOrderValue, { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Layout */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Status Distribution (Pie Chart) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Sales Status Distribution
              </Typography>
              {pieChartData.length > 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={230} minWidth={0}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 230 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>No sales distribution record available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Analysis by Customer (Bar Chart) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Revenue Analysis by Customer
              </Typography>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230} minWidth={0}>
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                    <ChartTooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                    <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 230 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>No customer revenue record available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Customers (Table) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ fontSize: 20, color: '#2563EB' }} />
                Top Customer Channels
              </Typography>
              {topCustomersTable.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1 }}>Customer</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', py: 1 }}>Orders</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', py: 1 }}>Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topCustomersTable.map((row, index) => (
                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 600, py: 1 }}>{row.name}</TableCell>
                          <TableCell align="right" sx={{ py: 1 }}>{row.count}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#16A34A', py: 1 }}>
                            {formatCurrency(row.revenue, { maximumFractionDigits: 0 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>No customer activity records</Typography>
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
          placeholder="Search sales orders..."
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
                Filter: {statusFilter === 'ALL' ? 'All' : statusFilter}
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

          {/* Create Sales Order Button */}
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
            Create Sales Order
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
            setStatusFilter('DELIVERED');
            setFilterAnchorEl(null);
          }}
          selected={statusFilter === 'DELIVERED'}
        >
          Delivered
        </MenuItem>
        <MenuItem
          onClick={() => {
            setStatusFilter('CANCELLED');
            setFilterAnchorEl(null);
          }}
          selected={statusFilter === 'CANCELLED'}
        >
          Cancelled
        </MenuItem>
      </Menu>

      {/* Sales Orders Data Table */}
      <SalesOrderTable
        orders={filteredOrders}
        loading={loading}
        error={error}
        customersMap={customersMap}
        onView={handleOpenDetails}
        onEdit={handleOpenEditForm}
        onDeliver={handleOpenDeliverConfirm}
        onInvoice={handleOpenInvoiceViewer}
        onDelete={handleOpenDeleteConfirm}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowCount={rowCount}
      />

      {/* Create / Edit Dialog */}
      <SalesOrderFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveOrder}
        order={selectedOrderForForm}
        saving={formSaving}
        customers={customers}
        employees={employees}
        finishedProducts={finishedProducts}
      />

      {/* Details Side Profile Drawer */}
      <SalesOrderDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        order={selectedOrderForDetails}
        customers={customers}
        employeesMap={employeesMap}
        productsMap={productsMap}
      />

      {/* Delivery Process Dialog */}
      <DeliverOrderDialog
        open={deliverOpen}
        onClose={() => setDeliverOpen(false)}
        onConfirm={handleConfirmDeliver}
        order={selectedOrderForDeliver}
        loading={deliverLoading}
        customersMap={customersMap}
        warehouses={warehouses}
      />

      {/* Invoice Viewer Dialog */}
      <InvoiceViewerDialog
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        order={selectedOrderForInvoice}
        customers={customers}
        productsMap={productsMap}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteSalesOrderDialog
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
