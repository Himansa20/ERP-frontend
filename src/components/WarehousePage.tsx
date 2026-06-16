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
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import SpeedIcon from '@mui/icons-material/Speed';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';

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

import { warehouseService, Warehouse, WarehouseInput } from './warehouseService';
import WarehouseTable from './WarehouseTable';
import WarehouseFormDialog from './WarehouseFormDialog';
import WarehouseDetailsDrawer from './WarehouseDetailsDrawer';
import WarehouseDeleteDialog from './WarehouseDeleteDialog';

export default function WarehousePage() {
  // Loading and database list states
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allWarehouses, setAllWarehouses] = useState<Warehouse[]>([]); // For global KPI & chart calculations
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  // Dialog and drawer triggers
  const [formOpen, setFormOpen] = useState(false);
  const [selectedWarehouseForForm, setSelectedWarehouseForForm] = useState<Warehouse | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedWarehouseForDetails, setSelectedWarehouseForDetails] = useState<Warehouse | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedWarehouseForDelete, setSelectedWarehouseForDelete] = useState<Warehouse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // KPI summaries
  const [kpi, setKpi] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalLocations: 0,
    averageUtilization: 0,
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Fetch KPI statistics and full list for charts
  const fetchKpiAndChartsData = async () => {
    try {
      const res = await warehouseService.getWarehouses(0, 1000);
      setAllWarehouses(res.content);

      const total = res.totalElements;
      const active = res.content.filter((w) => w.status === 'ACTIVE').length;
      const inactive = res.content.filter((w) => w.status === 'INACTIVE').length;
      const totalLocations = res.content.reduce((sum, w) => sum + (w.storageLocationsCount || 0), 0);
      
      const averageUtilization = res.content.length > 0
        ? Math.round(res.content.reduce((sum, w) => sum + (w.currentUtilization || 0), 0) / res.content.length)
        : 0;

      setKpi({
        total,
        active,
        inactive,
        totalLocations,
        averageUtilization,
      });
    } catch (err) {
      console.error('Failed to load global warehouse statistics:', err);
    }
  };

  // Fetch paginated warehouse list
  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await warehouseService.getWarehouses(
        paginationModel.page,
        paginationModel.pageSize
      );
      setWarehouses(data.content);
      setRowCount(data.totalElements);
    } catch (err: any) {
      console.error('Failed to load warehouses list:', err);
      setError(err.message || 'An error occurred while loading warehouses catalog.');
      showToast('Error loading warehouse master list', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    fetchWarehouses();
    fetchKpiAndChartsData();
  }, [fetchWarehouses]);

  const handleRefresh = () => {
    fetchWarehouses();
    fetchKpiAndChartsData();
    showToast('Data refreshed successfully', 'success');
  };

  // Dialog/Form triggers
  const handleOpenCreateForm = () => {
    setSelectedWarehouseForForm(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (warehouse: Warehouse) => {
    setSelectedWarehouseForForm(warehouse);
    setFormOpen(true);
  };

  const handleSaveWarehouse = async (payload: WarehouseInput) => {
    setFormSaving(true);
    try {
      if (selectedWarehouseForForm) {
        // Edit mode
        const updated = await warehouseService.updateWarehouse(
          selectedWarehouseForForm.warehouseId,
          payload
        );
        showToast(`Warehouse "${updated.warehouseName}" updated successfully`, 'success');
      } else {
        // Create mode
        const created = await warehouseService.createWarehouse(payload);
        showToast(`Warehouse "${created.warehouseName}" created successfully`, 'success');
      }
      setFormOpen(false);
      fetchWarehouses();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Save warehouse failed:', err);
      showToast(err.response?.data?.message || 'Failed to save warehouse details.', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  const handleOpenDetails = (warehouse: Warehouse) => {
    setSelectedWarehouseForDetails(warehouse);
    setDetailsOpen(true);
  };

  // Delete handlers
  const handleOpenDeleteConfirm = (warehouse: Warehouse) => {
    setSelectedWarehouseForDelete(warehouse);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedWarehouseForDelete) return;
    setDeleteLoading(true);
    const id = selectedWarehouseForDelete.warehouseId;
    const name = selectedWarehouseForDelete.warehouseName;

    try {
      await warehouseService.deleteWarehouse(id);
      showToast(`Warehouse "${name}" deleted successfully`, 'success');
      setDeleteOpen(false);
      fetchWarehouses();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Delete warehouse failed:', err);
      showToast(err.response?.data?.message || 'Failed to delete warehouse.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // CSV Data Export
  const handleExportCSV = () => {
    if (allWarehouses.length === 0) {
      showToast('No warehouse data available to export', 'warning');
      return;
    }
    const headers = ['Warehouse ID', 'Warehouse Code', 'Warehouse Name', 'Capacity (sq ft)', 'Utilization %', 'Manager', 'Contact No', 'Email', 'Address', 'City', 'Province / State', 'Status', 'Created Date'];
    const rows = allWarehouses.map((w) => [
      w.warehouseId,
      `"${w.warehouseCode.replace(/"/g, '""')}"`,
      `"${w.warehouseName.replace(/"/g, '""')}"`,
      w.capacity,
      w.currentUtilization,
      `"${(w.managerName || '').replace(/"/g, '""')}"`,
      `"${(w.contactNumber || '').replace(/"/g, '""')}"`,
      `"${(w.email || '').replace(/"/g, '""')}"`,
      `"${(w.address || '').replace(/"/g, '""')}"`,
      `"${(w.city || '').replace(/"/g, '""')}"`,
      `"${(w.provinceState || '').replace(/"/g, '""')}"`,
      w.status,
      new Date(w.createdDate || '').toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `warehouse_locations_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported warehouse catalog to CSV', 'success');
  };

  // Local/client side searching and filtering
  const getFilteredWarehouses = () => {
    let list = warehouses;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (w) =>
          w.warehouseName?.toLowerCase().includes(q) ||
          w.warehouseCode?.toLowerCase().includes(q) ||
          w.warehouseId?.toString().includes(q) ||
          w.managerName?.toLowerCase().includes(q) ||
          w.address?.toLowerCase().includes(q) ||
          w.city?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((w) => w.status === statusFilter);
    }

    return list;
  };

  const filteredWarehouses = getFilteredWarehouses();

  // Charts processing
  const getPieChartData = () => {
    const activeVal = allWarehouses.filter((w) => w.status === 'ACTIVE').length;
    const inactiveVal = allWarehouses.filter((w) => w.status === 'INACTIVE').length;
    
    return [
      { name: 'Active', value: activeVal, fill: '#16A34A' },
      { name: 'Inactive', value: inactiveVal, fill: '#DC2626' }
    ].filter(item => item.value > 0);
  };

  const getBarChartData = () => {
    // Show top 5 warehouses by capacity and compare Total Capacity with Utilized space
    return allWarehouses
      .slice(0, 5)
      .map((w) => {
        const totalCap = w.capacity || 0;
        const utilizedCap = Math.round(totalCap * ((w.currentUtilization || 0) / 100));
        return {
          name: w.warehouseCode || `WH-${w.warehouseId}`,
          'Total Capacity': totalCap,
          'Current Utilization': utilizedCap,
        };
      });
  };

  const pieChartData = getPieChartData();
  const barChartData = getBarChartData();

  // Custom label renderer for Pie Chart
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
          Warehouses
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Manage warehouse locations, storage capacities, managers, and zone distributions
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* KPI 1: Total Warehouses */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <WarehouseIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Warehouses
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Active Warehouses */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#16A34A', display: 'flex' }}>
                  <CheckCircleIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Warehouses
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#16A34A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Inactive Warehouses */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#FEF2F2', p: 1, borderRadius: 2, color: '#DC2626', display: 'flex' }}>
                  <BlockIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Inactive Warehouses
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#DC2626', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.inactive}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: Storage Locations */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#FFFBEB', p: 1, borderRadius: 2, color: '#D97706', display: 'flex' }}>
                  <CorporateFareIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Storage Locations
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.totalLocations}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 5: Warehouse Utilization % */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <SpeedIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Warehouse Utilization %
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563EB', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : `${kpi.averageUtilization}%`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Charts Layout */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Warehouse Capacity Overview (Bar Chart) */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Warehouse Capacity Overview (sq ft)
              </Typography>
              {allWarehouses.length > 0 ? (
                <ResponsiveContainer width="100%" height={230} minWidth={0}>
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                    <ChartTooltip formatter={(value) => [`${Number(value).toLocaleString()} sq ft`]} />
                    <Legend />
                    <Bar dataKey="Total Capacity" fill="#334155" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Current Utilization" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 230 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>No capacity metrics available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Warehouse Distribution (Pie Chart) */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Warehouse Status Distribution
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
                      <ChartTooltip formatter={(value) => [`${value} Warehouses`]} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 230 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>No status summary available</Typography>
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
          placeholder="Search warehouses by name, code, city or manager..."
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
                Filter: {statusFilter === 'ALL' ? 'All Statuses' : statusFilter === 'ACTIVE' ? 'Active' : 'Inactive'}
              </Button>
            </Tooltip>

            {/* Refresh Button */}
            <Tooltip title="Refresh Warehouse List">
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

          {/* Add Warehouse Button */}
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
            Create Warehouse
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
          All Statuses
        </MenuItem>
        <MenuItem
          onClick={() => {
            setStatusFilter('ACTIVE');
            setFilterAnchorEl(null);
          }}
          selected={statusFilter === 'ACTIVE'}
        >
          Active Only
        </MenuItem>
        <MenuItem
          onClick={() => {
            setStatusFilter('INACTIVE');
            setFilterAnchorEl(null);
          }}
          selected={statusFilter === 'INACTIVE'}
        >
          Inactive Only
        </MenuItem>
      </Menu>

      {/* Data Table */}
      <WarehouseTable
        warehouses={filteredWarehouses}
        loading={loading}
        error={error}
        onView={handleOpenDetails}
        onEdit={handleOpenEditForm}
        onDelete={handleOpenDeleteConfirm}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowCount={rowCount}
      />

      {/* Form Dialog */}
      <WarehouseFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveWarehouse}
        warehouse={selectedWarehouseForForm}
        saving={formSaving}
      />

      {/* Details Side Drawer */}
      <WarehouseDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        warehouse={selectedWarehouseForDetails}
      />

      {/* Delete Confirmation Dialog */}
      <WarehouseDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        warehouseName={selectedWarehouseForDelete ? selectedWarehouseForDelete.warehouseName : ''}
        loading={deleteLoading}
      />

      {/* Toast Alert Notifications */}
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
