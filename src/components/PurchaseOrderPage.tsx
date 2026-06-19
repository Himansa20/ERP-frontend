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
  Tabs,
  Tab,
  Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PaidIcon from '@mui/icons-material/Paid';

import { purchaseOrderService, PurchaseOrder, PurchaseOrderInput, DropdownItem } from './purchaseOrderService';
import { formatCurrency } from '../utils/currency';
import PurchaseOrderTable from './PurchaseOrderTable';
import PurchaseOrderFormDialog from './PurchaseOrderFormDialog';
import PurchaseOrderDetailsDrawer from './PurchaseOrderDetailsDrawer';
import PurchaseOrderDeleteDialog from './PurchaseOrderDeleteDialog';
import PurchaseOrderAnalytics from './PurchaseOrderAnalytics';

export default function PurchaseOrderPage() {
  // Tabs: 0 = Purchase Orders, 1 = Procurement Analytics
  const [activeTab, setActiveTab] = useState(0);

  // Data states
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [allOrders, setAllOrders] = useState<PurchaseOrder[]>([]); // For client side analytics calculation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown list options
  const [suppliers, setSuppliers] = useState<DropdownItem[]>([]);
  const [itemsOptions, setItemsOptions] = useState<any[]>([]);
  const [suppliersMap, setSuppliersMap] = useState<Record<number, string>>({});
  const [itemsMap, setItemsMap] = useState<Record<number, string>>({});

  // Pagination states
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  // Dialog and drawer toggles
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOrderForForm, setSelectedOrderForForm] = useState<PurchaseOrder | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<PurchaseOrder | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState<PurchaseOrder | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast notifications state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // KPI Metrics
  const [kpi, setKpi] = useState({
    totalOrders: 0,
    pendingApproval: 0,
    approvedOrders: 0,
    totalSpend: 0,
    thisMonthOrders: 0,
    suppliersUsed: 0,
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Load support metadata
  const loadSupportData = async () => {
    try {
      const [sups, items] = await Promise.all([
        purchaseOrderService.getSuppliers(),
        purchaseOrderService.getItems(),
      ]);

      setSuppliers(sups);
      setItemsOptions(items);

      // Mappings
      const sMap: Record<number, string> = {};
      sups.forEach((s) => {
        sMap[s.id] = s.name;
      });
      setSuppliersMap(sMap);

      const iMap: Record<number, string> = {};
      items.forEach((item) => {
        const id = item.itemId || item.id;
        const name = item.itemName || item.name;
        iMap[id] = name;
      });
      setItemsMap(iMap);
    } catch (err) {
      console.error('Failed to load support metadata for dropdowns:', err);
    }
  };

  // Fetch KPI aggregates and all orders
  const fetchKpiAndChartsData = async () => {
    try {
      const res = await purchaseOrderService.getPurchaseOrders(0, 1000);
      setAllOrders(res.content);

      const total = res.totalElements;
      const pending = res.content.filter((o) => (o.status || '').toUpperCase() === 'PENDING_APPROVAL').length;
      const approved = res.content.filter((o) => (o.status || '').toUpperCase() === 'APPROVED').length;
      const spend = res.content.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      
      // Compute This Month Purchase Orders
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = res.content.filter((o) => {
        const dateVal = o.orderDate || o.createdDate;
        if (!dateVal) return false;
        try {
          const d = new Date(dateVal);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        } catch {
          return false;
        }
      }).length;

      // Compute unique suppliers
      const uniqueSuppliers = new Set(res.content.map(o => o.supplierId)).size;

      setKpi({
        totalOrders: total,
        pendingApproval: pending,
        approvedOrders: approved,
        totalSpend: spend,
        thisMonthOrders: thisMonth,
        suppliersUsed: uniqueSuppliers,
      });
    } catch (err) {
      console.error('Failed to load purchase statistics:', err);
    }
  };

  // Fetch paginated purchase orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await purchaseOrderService.getPurchaseOrders(
        paginationModel.page,
        paginationModel.pageSize
      );
      setOrders(data.content);
      setRowCount(data.totalElements);
    } catch (err: any) {
      console.error('Failed to load purchase orders:', err);
      setError(err.message || 'An error occurred while loading purchase orders.');
      showToast('Error loading purchase orders list', 'error');
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

  // Save triggers (Create & Edit)
  const handleOpenCreateForm = () => {
    setSelectedOrderForForm(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (order: PurchaseOrder) => {
    setSelectedOrderForForm(order);
    setFormOpen(true);
  };

  const handleSaveOrder = async (inputPayload: PurchaseOrderInput) => {
    setFormSaving(true);
    try {
      if (selectedOrderForForm) {
        // Edit mode
        const id = selectedOrderForForm.purchaseOrderId || selectedOrderForForm.id;
        const updated = await purchaseOrderService.updatePurchaseOrder(id, inputPayload);
        const poNum = updated.poNumber || `PO-${String(updated.purchaseOrderId || updated.id).padStart(4, '0')}`;
        showToast(`Purchase Order ${poNum} updated successfully`, 'success');
      } else {
        // Create mode
        const created = await purchaseOrderService.createPurchaseOrder(inputPayload);
        const poNum = created.poNumber || `PO-${String(created.purchaseOrderId || created.id).padStart(4, '0')}`;
        showToast(`Purchase Order ${poNum} created successfully`, 'success');
      }
      setFormOpen(false);
      fetchOrders();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Save purchase order failed:', err);
      showToast(err.response?.data?.message || 'Failed to save purchase order.', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  // View details triggers
  const handleOpenDetails = (order: PurchaseOrder) => {
    setSelectedOrderForDetails(order);
    setDetailsOpen(true);
  };

  // Delete triggers
  const handleOpenDeleteConfirm = (order: PurchaseOrder) => {
    setSelectedOrderForDelete(order);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedOrderForDelete) return;
    setDeleteLoading(true);
    const id = selectedOrderForDelete.purchaseOrderId || selectedOrderForDelete.id;
    const poNum = selectedOrderForDelete.poNumber || `PO-${String(id).padStart(4, '0')}`;
    try {
      await purchaseOrderService.deletePurchaseOrder(id);
      showToast(`Purchase Order ${poNum} deleted successfully`, 'success');
      setDeleteOpen(false);
      fetchOrders();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Delete purchase order failed:', err);
      showToast(err.response?.data?.message || 'Failed to delete purchase order.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (allOrders.length === 0) {
      showToast('No purchase data available to export', 'warning');
      return;
    }
    const headers = ['PO Number', 'Supplier', 'Order Date', 'Expected Delivery Date', 'Total Amount', 'Status', 'Created By', 'Created Date'];
    const rows = allOrders.map((o) => {
      const id = o.purchaseOrderId || o.id;
      const poNumVal = o.poNumber || `PO-${String(id).padStart(4, '0')}`;
      const supplierNameVal = suppliersMap[o.supplierId] || `Supplier #${o.supplierId}`;
      return [
        poNumVal,
        `"${supplierNameVal.replace(/"/g, '""')}"`,
        new Date(o.orderDate || '').toLocaleDateString(),
        o.expectedDate ? new Date(o.expectedDate).toLocaleDateString() : 'N/A',
        o.totalAmount,
        o.status || 'DRAFT',
        o.createdBy || 'System User',
        new Date(o.createdDate || o.orderDate || '').toLocaleDateString(),
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `purchase_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported purchase orders list to CSV', 'success');
  };

  // Client side matching and filtering for page table
  const getFilteredOrders = () => {
    let list = orders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) => {
          const id = o.purchaseOrderId || o.id;
          const poNumVal = o.poNumber || `PO-${String(id).padStart(4, '0')}`;
          const supplierNameVal = suppliersMap[o.supplierId] || `Supplier #${o.supplierId}`;
          return (
            poNumVal.toLowerCase().includes(q) ||
            supplierNameVal.toLowerCase().includes(q) ||
            (o.status || '').toLowerCase().includes(q)
          );
        }
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((o) => (o.status || 'DRAFT').toUpperCase() === statusFilter);
    }

    return list;
  };

  const filteredOrders = getFilteredOrders();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Title Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Purchase Orders
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Manage procurement requests, supplier purchases and approvals
        </Typography>
      </Box>

      {/* KPI Cards Row */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Card 1: Total Purchase Orders */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <ShoppingCartIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total POs
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <Skeleton width={40} /> : kpi.totalOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 2: Pending Approval */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#FFFBEB', p: 1, borderRadius: 2, color: '#D97706', display: 'flex' }}>
                  <PendingIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pending Approval
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706', mt: 0.5 }}>
                {loading ? <Skeleton width={40} /> : kpi.pendingApproval}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 3: Approved Orders */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#16A34A', display: 'flex' }}>
                  <CheckCircleIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Approved Orders
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#16A34A', mt: 0.5 }}>
                {loading ? <Skeleton width={40} /> : kpi.approvedOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 4: Total Procurement Value */}
        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <PaidIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Procurement Value
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5, fontSize: '1.35rem' }}>
                {loading ? <Skeleton width={90} /> : formatCurrency(kpi.totalSpend, { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 5: This Month Purchase Orders */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#F8FAFC', p: 1, borderRadius: 2, color: '#64748B', display: 'flex' }}>
                  <CalendarTodayIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                This Month POs
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <Skeleton width={40} /> : kpi.thisMonthOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 6: Suppliers Used */}
        <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <BusinessIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Vendors Used
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <Skeleton width={40} /> : kpi.suppliersUsed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.9rem' },
            '& .Mui-selected': { color: '#2563EB' },
            '& .MuiTabs-indicator': { bgcolor: '#2563EB' },
          }}
        >
          <Tab label="PO Registry" />
          <Tab label="Procurement Analytics" />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        <Box>
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
              placeholder="Search purchase orders..."
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
                    Filter: {statusFilter === 'ALL' ? 'All' : statusFilter.replace('_', ' ')}
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

              {/* Create Purchase Order Button */}
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
                Create Purchase Order
              </Button>
            </Box>
          </Box>

          {/* Filter dropdown menu */}
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
                setStatusFilter('DRAFT');
                setFilterAnchorEl(null);
              }}
              selected={statusFilter === 'DRAFT'}
            >
              Draft
            </MenuItem>
            <MenuItem
              onClick={() => {
                setStatusFilter('PENDING_APPROVAL');
                setFilterAnchorEl(null);
              }}
              selected={statusFilter === 'PENDING_APPROVAL'}
            >
              Pending Approval
            </MenuItem>
            <MenuItem
              onClick={() => {
                setStatusFilter('APPROVED');
                setFilterAnchorEl(null);
              }}
              selected={statusFilter === 'APPROVED'}
            >
              Approved
            </MenuItem>
            <MenuItem
              onClick={() => {
                setStatusFilter('REJECTED');
                setFilterAnchorEl(null);
              }}
              selected={statusFilter === 'REJECTED'}
            >
              Rejected
            </MenuItem>
            <MenuItem
              onClick={() => {
                setStatusFilter('RECEIVED');
                setFilterAnchorEl(null);
              }}
              selected={statusFilter === 'RECEIVED'}
            >
              Received
            </MenuItem>
          </Menu>

          {/* Grid Table */}
          <PurchaseOrderTable
            orders={filteredOrders}
            loading={loading}
            error={error}
            suppliersMap={suppliersMap}
            onView={handleOpenDetails}
            onEdit={handleOpenEditForm}
            onDelete={handleOpenDeleteConfirm}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            rowCount={rowCount}
          />
        </Box>
      ) : (
        /* Procurement Analytics Tab */
        <PurchaseOrderAnalytics
          orders={allOrders}
          suppliers={suppliers}
          suppliersMap={suppliersMap}
        />
      )}

      {/* Form Dialog (Create & Edit) */}
      <PurchaseOrderFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveOrder}
        order={selectedOrderForForm}
        saving={formSaving}
        suppliers={suppliers}
        itemsOptions={itemsOptions}
      />

      {/* Details Drawer */}
      <PurchaseOrderDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        order={selectedOrderForDetails}
        suppliers={suppliers}
        itemsMap={itemsMap}
      />

      {/* Delete Confirmation Dialog */}
      <PurchaseOrderDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        order={selectedOrderForDelete}
        loading={deleteLoading}
      />

      {/* Snackbar Alerts */}
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
