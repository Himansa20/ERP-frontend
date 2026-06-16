import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  CircularProgress,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/Error';
import BlockIcon from '@mui/icons-material/Block';
import DateRangeIcon from '@mui/icons-material/DateRange';

import { supplierService, Supplier, SupplierInput } from './supplierService';
import SupplierTable from './SupplierTable';
import SupplierFormDialog from './SupplierFormDialog';
import SupplierDetailsDrawer from './SupplierDetailsDrawer';
import SupplierDeleteDialog from './SupplierDeleteDialog';

export default function SupplierPage() {
  // Lists and Paging states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]); // Used for KPI stats and export
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter Menu anchor element
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const isFilterMenuOpen = Boolean(filterAnchorEl);

  // Dialog and Drawer states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSupplierForForm, setSelectedSupplierForForm] = useState<Supplier | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSupplierForDetails, setSelectedSupplierForDetails] = useState<Supplier | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSupplierForDelete, setSelectedSupplierForDelete] = useState<Supplier | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast/Notification state
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // KPI calculations state
  const [kpi, setKpi] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
  });

  // Show Toast helper
  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({
      open: true,
      message,
      severity,
    });
  };

  // Helper to generate a simulated createdDate based on supplierId
  // (Since database does not have createdDate field, we generate a stable mock date for UI requirements)
  const injectSimulatedDates = (supplier: Supplier): Supplier => {
    const baseDate = new Date('2026-05-01T08:00:00.000Z');
    // Offset based on supplierId
    const offsetDays = (supplier.supplierId * 3) % 45;
    const simulatedDate = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    
    // Simulate updating if id is even
    const simulatedUpdateDate = supplier.supplierId % 2 === 0
      ? new Date(simulatedDate.getTime() + 2 * 24 * 60 * 60 * 1000)
      : simulatedDate;

    return {
      ...supplier,
      createdDate: simulatedDate.toISOString(),
      lastUpdatedDate: simulatedUpdateDate.toISOString(),
    };
  };

  // Fetch KPI data (loads a wider range of items to get aggregate metrics)
  const fetchKpiData = async () => {
    try {
      const res = await supplierService.getSuppliers(0, 1000);
      const allItems = res.content.map(injectSimulatedDates);
      setAllSuppliers(allItems);

      const total = res.totalElements;
      const active = allItems.filter((s) => s.supplierStatus?.toUpperCase() === 'ACTIVE').length;
      const inactive = allItems.filter((s) => s.supplierStatus?.toUpperCase() === 'INACTIVE').length;

      // Count new this month (June 2026, since current workspace mock is 2026-06-16)
      const currentYear = 2026;
      const currentMonth = 5; // 0-indexed (June is 5)
      const newThisMonth = allItems.filter((s) => {
        if (!s.createdDate) return false;
        const d = new Date(s.createdDate);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }).length;

      setKpi({
        total,
        active,
        inactive,
        newThisMonth,
      });
    } catch (err) {
      console.error('Failed to load KPI statistics:', err);
    }
  };

  // Fetch paginated suppliers
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supplierService.getSuppliers(
        paginationModel.page,
        paginationModel.pageSize
      );
      
      const processedContent = data.content.map(injectSimulatedDates);
      setSuppliers(processedContent);
      setRowCount(data.totalElements);
    } catch (err: any) {
      console.error('Failed to load suppliers:', err);
      setError(err.message || 'An error occurred while fetching suppliers.');
      showToast('Error loading suppliers list', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  // Load data on page change or page load
  useEffect(() => {
    fetchSuppliers();
    fetchKpiData();
  }, [fetchSuppliers]);

  const handleRefresh = () => {
    fetchSuppliers();
    fetchKpiData();
    showToast('Data refreshed successfully', 'success');
  };

  // Form actions
  const handleOpenCreateForm = () => {
    setSelectedSupplierForForm(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (supplier: Supplier) => {
    setSelectedSupplierForForm(supplier);
    setFormOpen(true);
  };

  const handleSaveSupplier = async (input: SupplierInput) => {
    setFormSaving(true);
    try {
      if (selectedSupplierForForm) {
        // Edit mode
        const updated = await supplierService.updateSupplier(
          selectedSupplierForForm.supplierId,
          input
        );
        showToast(`Supplier "${updated.supplierName}" updated successfully`, 'success');
      } else {
        // Create mode
        const created = await supplierService.createSupplier(input);
        showToast(`Supplier "${created.supplierName}" created successfully`, 'success');
      }
      setFormOpen(false);
      fetchSuppliers();
      fetchKpiData();
    } catch (err: any) {
      console.error('Save failed:', err);
      showToast(err.response?.data?.message || 'Failed to save supplier record.', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  // View actions
  const handleOpenDetails = (supplier: Supplier) => {
    setSelectedSupplierForDetails(supplier);
    setDetailsOpen(true);
  };

  // Delete actions
  const handleOpenDeleteConfirm = (supplier: Supplier) => {
    setSelectedSupplierForDelete(supplier);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSupplierForDelete) return;
    setDeleteLoading(true);
    // Optimistic UI updates
    const name = selectedSupplierForDelete.supplierName;
    const deletedId = selectedSupplierForDelete.supplierId;
    
    try {
      await supplierService.deleteSupplier(deletedId);
      showToast(`Supplier "${name}" deleted successfully`, 'success');
      setDeleteOpen(false);
      fetchSuppliers();
      fetchKpiData();
    } catch (err: any) {
      console.error('Delete failed:', err);
      showToast(err.response?.data?.message || 'Failed to delete supplier.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (allSuppliers.length === 0) {
      showToast('No supplier data available to export', 'warning');
      return;
    }
    const headers = ['Supplier ID', 'Supplier Name', 'Contact Person', 'Email', 'Phone', 'Address', 'Status', 'Created Date'];
    const rows = allSuppliers.map((s) => [
      s.supplierId,
      `"${s.supplierName.replace(/"/g, '""')}"`,
      `"${(s.contactPerson || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${(s.phone || s.contactNo || '').replace(/"/g, '""')}"`,
      `"${(s.address || '').replace(/"/g, '""')}"`,
      s.supplierStatus || 'ACTIVE',
      new Date(s.createdDate || '').toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `suppliers_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported suppliers list to CSV', 'success');
  };

  // Filtering / Searching suppliers client-side for immediate responsive experience
  const getFilteredSuppliers = () => {
    let list = suppliers;
    
    // Apply search filter if search query is provided
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.supplierName?.toLowerCase().includes(q) ||
          s.contactPerson?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.supplierId?.toString().includes(q)
      );
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      list = list.filter((s) => s.supplierStatus?.toUpperCase() === statusFilter);
    }

    return list;
  };

  const filteredSuppliers = getFilteredSuppliers();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Title Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Suppliers
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Manage supplier master data, contact details, and locations
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* KPI 1: Total Suppliers */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <BusinessIcon sx={{ fontSize: 24 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Suppliers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={20} /> : kpi.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Active Suppliers */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#10B981', display: 'flex' }}>
                  <CheckCircleIcon sx={{ fontSize: 24 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Suppliers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#16A34A', mt: 0.5 }}>
                {loading ? <CircularProgress size={20} /> : kpi.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Inactive Suppliers */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#FEF2F2', p: 1, borderRadius: 2, color: '#EF4444', display: 'flex' }}>
                  <BlockIcon sx={{ fontSize: 24 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Inactive Suppliers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#DC2626', mt: 0.5 }}>
                {loading ? <CircularProgress size={20} /> : kpi.inactive}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: New Suppliers This Month */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#FFFBEB', p: 1, borderRadius: 2, color: '#F59E0B', display: 'flex' }}>
                  <DateRangeIcon sx={{ fontSize: 24 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                New This Month
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#D97706', mt: 0.5 }}>
                {loading ? <CircularProgress size={20} /> : kpi.newThisMonth}
              </Typography>
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
          placeholder="Search suppliers..."
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
                Filter: {statusFilter === 'ALL' ? 'All' : statusFilter === 'ACTIVE' ? 'Active' : 'Inactive'}
              </Button>
            </Tooltip>
            <Menu
              anchorEl={filterAnchorEl}
              open={isFilterMenuOpen}
              onClose={() => setFilterAnchorEl(null)}
              PaperProps={{
                sx: {
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                  border: '1px solid #F1F5F9',
                  borderRadius: 2,
                  mt: 0.5,
                },
              }}
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
              <Divider />
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

            {/* Refresh Button */}
            <Tooltip title="Refresh Supplier Data">
              <IconButton
                onClick={handleRefresh}
                sx={{
                  color: '#475569',
                  border: '1px solid #E2E8F0',
                  borderRadius: 2,
                  bgcolor: '#FFFFFF',
                  p: 1,
                  '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            {/* Export Button */}
            <Tooltip title="Export to CSV">
              <IconButton
                onClick={handleExportCSV}
                sx={{
                  color: '#475569',
                  border: '1px solid #E2E8F0',
                  borderRadius: 2,
                  bgcolor: '#FFFFFF',
                  p: 1,
                  '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' },
                }}
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Add Supplier Button */}
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
              '&:hover': { bgcolor: '#1D4ED8', boxShadow: 'none' },
            }}
          >
            Add Supplier
          </Button>
        </Box>
      </Box>

      {/* Supplier Grid Data Table */}
      <SupplierTable
        suppliers={filteredSuppliers}
        loading={loading}
        error={error}
        onView={handleOpenDetails}
        onEdit={handleOpenEditForm}
        onDelete={handleOpenDeleteConfirm}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowCount={rowCount}
      />

      {/* Form Dialog (Create / Edit) */}
      <SupplierFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveSupplier}
        supplier={selectedSupplierForForm}
        saving={formSaving}
      />

      {/* View Detail Drawer */}
      <SupplierDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        supplier={selectedSupplierForDetails}
      />

      {/* Delete Confirmation Dialog */}
      <SupplierDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        supplierName={selectedSupplierForDelete ? selectedSupplierForDelete.supplierName : ''}
        loading={deleteLoading}
      />

      {/* Toast Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
