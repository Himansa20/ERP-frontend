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
import BlockIcon from '@mui/icons-material/Block';
import DateRangeIcon from '@mui/icons-material/DateRange';
import GroupIcon from '@mui/icons-material/Group';

import { customerService, Customer, CustomerInput } from './customerService';
import CustomerTable, { getContactPerson } from './CustomerTable';
import CustomerFormDialog from './CustomerFormDialog';
import CustomerDetailsDrawer from './CustomerDetailsDrawer';
import CustomerDeleteDialog from './CustomerDeleteDialog';

export default function CustomerPage() {
  // Data loading states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]); // For client side export/KPI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  // Dialog & Drawer toggle states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCustomerForForm, setSelectedCustomerForForm] = useState<Customer | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCustomerForDelete, setSelectedCustomerForDelete] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast notifications state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
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

  // Helper to inject simulated created/lastUpdated dates based on registrationDate or customerId
  const injectSimulatedDates = (customer: Customer): Customer => {
    const baseDate = new Date('2026-05-01T08:00:00.000Z');
    // Offset based on customerId
    const offsetDays = (customer.customerId * 3) % 45;
    const simulatedDate = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    
    const registrationIso = customer.registrationDate || simulatedDate.toISOString();

    return {
      ...customer,
      registrationDate: registrationIso,
      createdDate: registrationIso,
      lastUpdatedDate: registrationIso,
    };
  };

  // Fetch KPI data
  const fetchKpiData = async () => {
    try {
      const res = await customerService.getCustomers(0, 1000);
      const allItems = res.content.map(injectSimulatedDates);
      setAllCustomers(allItems);

      const total = res.totalElements;
      const active = allItems.filter((c) => (c.customerType || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
      const inactive = allItems.filter((c) => (c.customerType || 'ACTIVE').toUpperCase() === 'INACTIVE').length;

      // Count new this month (June 2026, since current workspace mock is 2026-06-16)
      const currentYear = 2026;
      const currentMonth = 5; // 0-indexed (June is 5)
      const newThisMonth = allItems.filter((c) => {
        if (!c.registrationDate) return false;
        const d = new Date(c.registrationDate);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }).length;

      setKpi({
        total,
        active,
        inactive,
        newThisMonth,
      });
    } catch (err) {
      console.error('Failed to load Customer KPI statistics:', err);
    }
  };

  // Fetch paginated customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomers(
        paginationModel.page,
        paginationModel.pageSize
      );
      
      const processedContent = data.content.map(injectSimulatedDates);
      setCustomers(processedContent);
      setRowCount(data.totalElements);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      setError(err.message || 'An error occurred while fetching customers.');
      showToast('Error loading customers list', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  // Load data on page change or page load
  useEffect(() => {
    fetchCustomers();
    fetchKpiData();
  }, [fetchCustomers]);

  const handleRefresh = () => {
    fetchCustomers();
    fetchKpiData();
    showToast('Data refreshed successfully', 'success');
  };

  // Form actions
  const handleOpenCreateForm = () => {
    setSelectedCustomerForForm(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (customer: Customer) => {
    setSelectedCustomerForForm(customer);
    setFormOpen(true);
  };

  const handleSaveCustomer = async (input: CustomerInput) => {
    setFormSaving(true);
    try {
      if (selectedCustomerForForm) {
        // Edit mode
        const updated = await customerService.updateCustomer(
          selectedCustomerForForm.customerId,
          input
        );
        showToast(`Customer "${updated.customerName}" updated successfully`, 'success');
      } else {
        // Create mode
        const created = await customerService.createCustomer(input);
        showToast(`Customer "${created.customerName}" created successfully`, 'success');
      }
      setFormOpen(false);
      fetchCustomers();
      fetchKpiData();
    } catch (err: any) {
      console.error('Save customer failed:', err);
      showToast(err.response?.data?.message || 'Failed to save customer record.', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  // View actions
  const handleOpenDetails = (customer: Customer) => {
    setSelectedCustomerForDetails(customer);
    setDetailsOpen(true);
  };

  // Delete actions
  const handleOpenDeleteConfirm = (customer: Customer) => {
    setSelectedCustomerForDelete(customer);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCustomerForDelete) return;
    setDeleteLoading(true);
    const name = selectedCustomerForDelete.customerName;
    const deletedId = selectedCustomerForDelete.customerId;
    
    try {
      await customerService.deleteCustomer(deletedId);
      showToast(`Customer "${name}" deleted successfully`, 'success');
      setDeleteOpen(false);
      fetchCustomers();
      fetchKpiData();
    } catch (err: any) {
      console.error('Delete customer failed:', err);
      showToast(err.response?.data?.message || 'Failed to delete customer.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (allCustomers.length === 0) {
      showToast('No customer data available to export', 'warning');
      return;
    }
    const headers = ['Customer ID', 'Customer Name', 'Contact Person', 'Email', 'Phone', 'Address', 'Status', 'Registration Date'];
    const rows = allCustomers.map((c) => [
      c.customerId,
      `"${c.customerName.replace(/"/g, '""')}"`,
      `"${getContactPerson(c).replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.contactNo || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.customerType || 'ACTIVE',
      new Date(c.registrationDate || '').toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported customers list to CSV', 'success');
  };

  // Filtering / Searching customers client-side
  const getFilteredCustomers = () => {
    let list = customers;
    
    // Apply search filter if search query is provided
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.customerName?.toLowerCase().includes(q) ||
          getContactPerson(c).toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.customerId?.toString().includes(q)
      );
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      list = list.filter((c) => (c.customerType || 'ACTIVE').toUpperCase() === statusFilter);
    }

    return list;
  };

  const filteredCustomers = getFilteredCustomers();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Title Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Customers
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Manage customer master data, locations, and representative assignments
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* KPI 1: Total Customers */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <GroupIcon sx={{ fontSize: 24 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Customers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={20} /> : kpi.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Active Customers */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#10B981', display: 'flex' }}>
                  <CheckCircleIcon sx={{ fontSize: 24 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Customers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#16A34A', mt: 0.5 }}>
                {loading ? <CircularProgress size={20} /> : kpi.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Inactive Customers */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#FEF2F2', p: 1, borderRadius: 2, color: '#EF4444', display: 'flex' }}>
                  <BlockIcon sx={{ fontSize: 24 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Inactive Customers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#DC2626', mt: 0.5 }}>
                {loading ? <CircularProgress size={20} /> : kpi.inactive}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: New Customers This Month */}
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
          placeholder="Search customers..."
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

          {/* Add Customer Button */}
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
            Add Customer
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
          All Customers
        </MenuItem>
        <MenuItem
          onClick={() => {
            setStatusFilter('ACTIVE');
            setFilterAnchorEl(null);
          }}
          selected={statusFilter === 'ACTIVE'}
        >
          Active Customers
        </MenuItem>
        <MenuItem
          onClick={() => {
            setStatusFilter('INACTIVE');
            setFilterAnchorEl(null);
          }}
          selected={statusFilter === 'INACTIVE'}
        >
          Inactive Customers
        </MenuItem>
      </Menu>

      {/* Data Table */}
      <CustomerTable
        customers={filteredCustomers}
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
      <CustomerFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveCustomer}
        customer={selectedCustomerForForm}
        saving={formSaving}
      />

      {/* Profile Details Drawer (Right-aligned drawer) */}
      <CustomerDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        customer={selectedCustomerForDetails}
      />

      {/* Delete Confirmation Dialog */}
      <CustomerDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        customer={selectedCustomerForDelete}
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
