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
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CategoryIcon from '@mui/icons-material/Category';

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

import { itemService, ParsedItem } from './itemService';
import ItemTable from './ItemTable';
import ItemFormDialog from './ItemFormDialog';
import ItemDetailsDrawer from './ItemDetailsDrawer';
import ItemDeleteDialog from './ItemDeleteDialog';

export default function ItemPage() {
  // Loading and database list states
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [allItems, setAllItems] = useState<ParsedItem[]>([]); // For global KPI & chart calculations
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
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  // Dialog and drawer triggers
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItemForForm, setSelectedItemForForm] = useState<ParsedItem | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<ParsedItem | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<ParsedItem | null>(null);
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
    rawMaterials: 0,
    finishedProducts: 0,
    active: 0,
    inactive: 0,
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Fetch KPI statistics and full list for charts
  const fetchKpiAndChartsData = async () => {
    try {
      const res = await itemService.getItems(0, 1000);
      setAllItems(res.content);

      const total = res.totalElements;
      const raw = res.content.filter((i) => i.itemCategory === 'Raw Materials' || i.itemCategory === 'Raw Material').length;
      const finished = res.content.filter((i) => i.itemCategory === 'Finished Products' || i.itemCategory === 'Finished Product').length;
      const active = res.content.filter((i) => i.itemStatus.toLowerCase() === 'active').length;
      const inactive = res.content.filter((i) => i.itemStatus.toLowerCase() === 'inactive').length;

      setKpi({
        total,
        rawMaterials: raw,
        finishedProducts: finished,
        active,
        inactive,
      });
    } catch (err) {
      console.error('Failed to load global item statistics:', err);
    }
  };

  // Fetch paginated inventory list
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await itemService.getItems(
        paginationModel.page,
        paginationModel.pageSize
      );
      setItems(data.content);
      setRowCount(data.totalElements);
    } catch (err: any) {
      console.error('Failed to load items list:', err);
      setError(err.message || 'An error occurred while loading items catalog.');
      showToast('Error loading item master list', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    fetchItems();
    fetchKpiAndChartsData();
  }, [fetchItems]);

  const handleRefresh = () => {
    fetchItems();
    fetchKpiAndChartsData();
    showToast('Data refreshed successfully', 'success');
  };

  // Dialog/Form triggers
  const handleOpenCreateForm = () => {
    setSelectedItemForForm(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (item: ParsedItem) => {
    setSelectedItemForForm(item);
    setFormOpen(true);
  };

  const handleSaveItem = async (payload: Omit<ParsedItem, 'itemId'>) => {
    setFormSaving(true);
    try {
      if (selectedItemForForm) {
        // Edit mode
        const updated = await itemService.updateItem(
          selectedItemForForm.itemId,
          payload
        );
        showToast(`Item "${updated.itemName}" updated successfully`, 'success');
      } else {
        // Create mode
        const created = await itemService.createItem(payload);
        showToast(`Item "${created.itemName}" created successfully`, 'success');
      }
      setFormOpen(false);
      fetchItems();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Save item master failed:', err);
      showToast(err.response?.data?.message || 'Failed to save item master details.', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  const handleOpenDetails = (item: ParsedItem) => {
    setSelectedItemForDetails(item);
    setDetailsOpen(true);
  };

  // Delete handlers
  const handleOpenDeleteConfirm = (item: ParsedItem) => {
    setSelectedItemForDelete(item);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItemForDelete) return;
    setDeleteLoading(true);
    const id = selectedItemForDelete.itemId;
    const name = selectedItemForDelete.itemName;

    try {
      await itemService.deleteItem(id);
      showToast(`Item "${name}" deleted successfully`, 'success');
      setDeleteOpen(false);
      fetchItems();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Delete item master failed:', err);
      showToast(err.response?.data?.message || 'Failed to delete item from inventory catalog.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // CSV Data Export
  const handleExportCSV = () => {
    if (allItems.length === 0) {
      showToast('No item data available to export', 'warning');
      return;
    }
    const headers = ['Item ID', 'Item Code', 'Item Name', 'Category', 'Type', 'UOM', 'Std Cost', 'Stock Level', 'Reorder Level', 'Status', 'Created Date'];
    const rows = allItems.map((i) => [
      i.itemId,
      `"${i.itemCode.replace(/"/g, '""')}"`,
      `"${i.itemName.replace(/"/g, '""')}"`,
      `"${i.itemCategory.replace(/"/g, '""')}"`,
      `"${i.itemType.replace(/"/g, '""')}"`,
      `"${i.unitOfMeasure.replace(/"/g, '""')}"`,
      i.standardCost,
      i.currentStock,
      i.reorderLevel,
      i.itemStatus,
      new Date(i.createdDate || '').toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_items_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported item master catalog to CSV', 'success');
  };

  // Local/client side searching and filtering
  const getFilteredItems = () => {
    let list = items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.itemName?.toLowerCase().includes(q) ||
          i.itemCode?.toLowerCase().includes(q) ||
          i.itemId?.toString().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'ALL') {
      list = list.filter((i) => i.itemCategory === categoryFilter);
    }

    return list;
  };

  const filteredItems = getFilteredItems();

  // Charts processing
  const getPieChartData = () => {
    const categories = ['Raw Materials', 'Finished Products', 'Packaging Materials', 'Consumables'];
    const colors = ['#2563EB', '#16A34A', '#4F46E5', '#D97706'];

    return categories.map((cat, idx) => {
      const val = allItems.filter((i) => i.itemCategory === cat || (cat === 'Raw Materials' && i.itemCategory === 'Raw Material') || (cat === 'Finished Products' && i.itemCategory === 'Finished Product')).length;
      return {
        name: cat,
        value: val,
        fill: colors[idx],
      };
    }).filter(item => item.value > 0);
  };

  const getBarChartData = () => {
    const types = ['Standard', 'Custom', 'Bulk', 'Assembly'];
    return types.map((type) => {
      const val = allItems.filter((i) => i.itemType === type).length;
      return {
        name: type,
        count: val,
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
          Items
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Manage raw materials, finished products, and inventory item master data
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* KPI 1: Total Items */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <InventoryIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Items
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Raw Materials */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <EngineeringIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Raw Materials
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563EB', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.rawMaterials}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Finished Products */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#16A34A', display: 'flex' }}>
                  <CategoryIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Finished Products
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#16A34A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.finishedProducts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: Active Items */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#16A34A', display: 'flex' }}>
                  <CheckCircleIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Items
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 5: Inactive Items */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#F1F5F9', p: 1, borderRadius: 2, color: '#64748B', display: 'flex' }}>
                  <BlockIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Inactive Items
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#64748B', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.inactive}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Charts Layout */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Item Category Distribution (Pie Chart) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Item Category Distribution
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
                      <ChartTooltip formatter={(value) => [`${value} Items`, 'Volume']} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 230 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>No category summary record available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Item Type Summary (Bar Chart) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Item Type Summary
              </Typography>
              {allItems.length > 0 ? (
                <ResponsiveContainer width="100%" height={230} minWidth={0}>
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                    <ChartTooltip formatter={(value) => [`${value} Items`, 'Count']} />
                    <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 230 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>No item type summary record available</Typography>
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
          placeholder="Search items by name, code or specifications..."
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
            <Tooltip title="Filter by Category">
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
                Filter: {categoryFilter === 'ALL' ? 'All Categories' : categoryFilter}
              </Button>
            </Tooltip>

            {/* Refresh Button */}
            <Tooltip title="Refresh Catalog">
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

          {/* Add Item Button */}
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
            Create Item
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
            setCategoryFilter('ALL');
            setFilterAnchorEl(null);
          }}
          selected={categoryFilter === 'ALL'}
        >
          All Categories
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCategoryFilter('Raw Materials');
            setFilterAnchorEl(null);
          }}
          selected={categoryFilter === 'Raw Materials'}
        >
          Raw Materials
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCategoryFilter('Finished Products');
            setFilterAnchorEl(null);
          }}
          selected={categoryFilter === 'Finished Products'}
        >
          Finished Products
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCategoryFilter('Packaging Materials');
            setFilterAnchorEl(null);
          }}
          selected={categoryFilter === 'Packaging Materials'}
        >
          Packaging Materials
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCategoryFilter('Consumables');
            setFilterAnchorEl(null);
          }}
          selected={categoryFilter === 'Consumables'}
        >
          Consumables
        </MenuItem>
      </Menu>

      {/* Data Table */}
      <ItemTable
        items={filteredItems}
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
      <ItemFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveItem}
        item={selectedItemForForm}
        saving={formSaving}
        allItems={allItems}
      />

      {/* Details Side Drawer */}
      <ItemDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        item={selectedItemForDetails}
      />

      {/* Delete Confirmation Dialog */}
      <ItemDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        item={selectedItemForDelete}
        deleting={deleteLoading}
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
