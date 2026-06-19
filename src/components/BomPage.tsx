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
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import FactoryIcon from '@mui/icons-material/Factory';
import BuildIcon from '@mui/icons-material/Build';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

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

import { bomService, BOM, BOMComponent } from './bomService';
import { formatCurrency } from '../utils/currency';
import { itemService, ParsedItem } from './itemService';
import BomTable from './BomTable';
import BomFormDialog from './BomFormDialog';
import BomDetailsDrawer from './BomDetailsDrawer';
import BomDeleteDialog from './BomDeleteDialog';
import BomProductLookup from './BomProductLookup';

export default function BomPage() {
  // Navigation Tabs: 0 = BOM Registry, 1 = Recipe Planner Lookup
  const [activeTab, setActiveTab] = useState(0);

  // Data states
  const [boms, setBoms] = useState<BOM[]>([]);
  const [allItems, setAllItems] = useState<ParsedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog & Drawer toggle states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBomForForm, setSelectedBomForForm] = useState<BOM | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBomForDetails, setSelectedBomForDetails] = useState<BOM | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBomForDelete, setSelectedBomForDelete] = useState<BOM | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // KPI states
  const [kpi, setKpi] = useState({
    totalBoms: 0,
    activeFinishedProducts: 0,
    totalComponents: 0,
    avgComponents: 0,
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Pre-fetch items and catalog details
  const fetchCatalogItems = async () => {
    try {
      const res = await itemService.getItems(0, 1000);
      setAllItems(res.content);
    } catch (err) {
      console.error('Failed to pre-fetch catalog items:', err);
    }
  };

  // Load paginated BOMs and compute stats
  const fetchBomsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bomService.getBOMs(
        paginationModel.page,
        paginationModel.pageSize
      );
      setBoms(data.content);
      setRowCount(data.totalElements);

      // Compute statistics based on the full list
      const allBomsRes = await bomService.getBOMs(0, 1000);
      const totalB = allBomsRes.totalElements;

      // Active Finished Products in system
      const finishedProducts = allItems.filter(
        (i) => i.itemCategory === 'Finished Products' || i.itemCategory === 'FinishedProduct'
      ).length;

      // Total component line items in all BOMs
      let totalCompCount = 0;
      allBomsRes.content.forEach((b) => {
        totalCompCount += b.components?.length || 0;
      });

      const avgComp = totalB > 0 ? totalCompCount / totalB : 0;

      setKpi({
        totalBoms: totalB,
        activeFinishedProducts: finishedProducts,
        totalComponents: totalCompCount,
        avgComponents: avgComp,
      });

    } catch (err: any) {
      console.error('Failed to load BOM records:', err);
      setError(err.message || 'An error occurred while loading Bill of Materials data.');
      showToast('Error loading BOM registry', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, allItems]);

  useEffect(() => {
    fetchCatalogItems();
  }, []);

  useEffect(() => {
    if (allItems.length > 0) {
      fetchBomsData();
    }
  }, [fetchBomsData, allItems.length]);

  const handleRefresh = () => {
    fetchCatalogItems();
    fetchBomsData();
    showToast('BOM records refreshed successfully', 'success');
  };

  // CRUD actions
  const handleOpenCreateForm = () => {
    setSelectedBomForForm(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (bom: BOM) => {
    setSelectedBomForForm(bom);
    setFormOpen(true);
  };

  const handleSaveBOM = async (finishedProductId: number, newComponents: BOMComponent[]) => {
    setFormSaving(true);
    try {
      if (selectedBomForForm) {
        // Edit mode
        await bomService.updateBOM(
          finishedProductId,
          newComponents,
          selectedBomForForm.components
        );
        showToast('Bill of Materials updated successfully', 'success');
      } else {
        // Create mode
        const pName = allItems.find((i) => i.itemId === finishedProductId)?.itemName || '';
        await bomService.createBOM({
          finishedProductId,
          finishedProductName: pName,
          components: newComponents,
        });
        showToast('Bill of Materials created successfully', 'success');
      }
      setFormOpen(false);
      fetchBomsData();
    } catch (err: any) {
      console.error('Save BOM failed:', err);
      showToast(err.response?.data?.message || 'Failed to save Bill of Materials recipe.', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  const handleOpenDetails = (bom: BOM) => {
    setSelectedBomForDetails(bom);
    setDetailsOpen(true);
  };

  const handleOpenDeleteConfirm = (bom: BOM) => {
    setSelectedBomForDelete(bom);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBomForDelete) return;
    setDeleteLoading(true);
    try {
      await bomService.deleteBOM(selectedBomForDelete);
      showToast(`BOM for "${selectedBomForDelete.finishedProductName}" deleted successfully`, 'success');
      setDeleteOpen(false);
      fetchBomsData();
    } catch (err: any) {
      console.error('Delete BOM failed:', err);
      showToast(err.response?.data?.message || 'Failed to delete BOM records.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const allB = await bomService.getBOMs(0, 1000);
      if (allB.content.length === 0) {
        showToast('No BOM data available to export', 'warning');
        return;
      }
      const headers = ['Finished Product ID', 'Finished Product Name', 'BOM Version', 'Total Components', 'Estimated Cost'];
      const rows = allB.content.map((b) => {
        const cost = b.components?.reduce((sum, c) => {
          const qty = Number(c.requiredQuantity || 0);
          const cCost = Number(c.standardCost || 0);
          const waste = 1 + Number(c.wastagePercentage || 0) / 100;
          return sum + qty * cCost * waste;
        }, 0) || 0;

        return [
          b.finishedProductId,
          `"${b.finishedProductName.replace(/"/g, '""')}"`,
          b.version || 1,
          b.components?.length || 0,
          cost.toFixed(2),
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
        + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `bom_records_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported BOM records to CSV', 'success');
    } catch (err) {
      console.error('CSV Export failed:', err);
      showToast('Failed to export CSV', 'error');
    }
  };

  // Client side filtering for active listing grid
  const getFilteredBoms = () => {
    let list = boms;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.finishedProductName?.toLowerCase().includes(q) ||
          b.finishedProductId?.toString().includes(q) ||
          b.finishedProductCode?.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const filteredBoms = getFilteredBoms();

  // Charts Aggregate Data
  const getComplexityChartData = () => {
    let simple = 0; // 1-2 components
    let medium = 0; // 3-5 components
    let complex = 0; // 6+ components

    boms.forEach((b) => {
      const count = b.components?.length || 0;
      if (count <= 2) simple++;
      else if (count <= 5) medium++;
      else complex++;
    });

    const data = [
      { name: 'Simple (1-2 components)', value: simple, fill: '#16A34A' },
      { name: 'Medium (3-5 components)', value: medium, fill: '#2563EB' },
      { name: 'Complex (6+ components)', value: complex, fill: '#7C3AED' },
    ];
    return data.filter((d) => d.value > 0);
  };

  const getCostChartData = () => {
    return boms.map((b) => {
      const cost = b.components?.reduce((sum, c) => {
        const qty = Number(c.requiredQuantity || 0);
        const cCost = Number(c.standardCost || 0);
        const waste = 1 + Number(c.wastagePercentage || 0) / 100;
        return sum + qty * cCost * waste;
      }, 0) || 0;

      return {
        name: b.finishedProductName.length > 15 ? b.finishedProductName.substring(0, 15) + '...' : b.finishedProductName,
        totalCost: Math.round(cost),
      };
    }).slice(0, 5); // Display top 5
  };

  const getComponentUsageChartData = () => {
    const rawMatUsage = new Map<string, number>();

    boms.forEach((b) => {
      b.components?.forEach((c) => {
        const name = c.rawMaterialName;
        rawMatUsage.set(name, (rawMatUsage.get(name) || 0) + 1);
      });
    });

    return Array.from(rawMatUsage.entries())
      .map(([name, freq]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        frequency: freq,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5); // Display top 5
  };

  const complexityChartData = getComplexityChartData();
  const costChartData = getCostChartData();
  const usageChartData = getComponentUsageChartData();

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="0.725rem" fontWeight="bold">
        {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Title Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Bill of Materials (BOM)
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Manage finished product recipes, assembly component matrices and raw material cost rolls
        </Typography>
      </Box>

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
          <Tab label="BOM Registry" />
          <Tab label="Recipe Planner Lookup" />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        <Box>
          {/* KPI Cards */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {/* KPI 1: Total BOMs */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                      <FactoryIcon sx={{ fontSize: 20 }} />
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Formulas
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                    {loading ? <CircularProgress size={16} /> : kpi.totalBoms}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* KPI 2: Active Finished Products */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                      <SettingsSuggestIcon sx={{ fontSize: 20 }} />
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Finished Products Catalog
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563EB', mt: 0.5 }}>
                    {loading ? <CircularProgress size={16} /> : kpi.activeFinishedProducts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* KPI 3: Total Components */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#16A34A', display: 'flex' }}>
                      <BuildIcon sx={{ fontSize: 20 }} />
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Component Mappings
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#16A34A', mt: 0.5 }}>
                    {loading ? <CircularProgress size={16} /> : kpi.totalComponents}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* KPI 4: Avg Components per BOM */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ bgcolor: '#F8FAFC', p: 1, borderRadius: 2, color: '#64748B', display: 'flex' }}>
                      <LeaderboardIcon sx={{ fontSize: 20 }} />
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Avg Complexity
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                    {loading ? <CircularProgress size={16} /> : `${kpi.avgComponents.toFixed(1)} items`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Analytics Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Complexity (Pie Chart) */}
            <Grid item xs={12} md={4}>
              <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                    BOM Complexity Analysis
                  </Typography>
                  {complexityChartData.length > 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <ResponsiveContainer width="100%" height={200} minWidth={0}>
                        <PieChart>
                          <Pie
                            data={complexityChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={65}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {complexityChartData.map((entry: any, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip formatter={(value) => [`${value} BOMs`, 'Count']} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>No recipe complexity data</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Material Cost Breakdown (Bar Chart) */}
            <Grid item xs={12} md={4}>
              <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                    Rolled Costs per BOM (Rs.)
                  </Typography>
                  {costChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200} minWidth={0}>
                      <BarChart data={costChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                        <ChartTooltip formatter={(value) => [formatCurrency(Number(value)), 'Rolled BOM Cost']} />
                        <Bar dataKey="totalCost" fill="#16A34A" radius={[4, 4, 0, 0]} name="Rolled Cost" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>No manufacturing costs catalogued</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Component Usage Analysis (Bar Chart) */}
            <Grid item xs={12} md={4}>
              <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                    Most Used Raw Materials (Freq)
                  </Typography>
                  {usageChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200} minWidth={0}>
                      <BarChart data={usageChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                        <ChartTooltip formatter={(value) => [`Used in ${value} formulas`, 'Frequency']} />
                        <Bar dataKey="frequency" fill="#2563EB" radius={[4, 4, 0, 0]} name="Usage Freq" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>No component frequency data</Typography>
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
              placeholder="Search BOM by finished product name or code..."
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
                {/* Refresh Button */}
                <Tooltip title="Refresh Registry">
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
                <Tooltip title="Export CSV">
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

              {/* Create BOM Button */}
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
                Create BOM
              </Button>
            </Box>
          </Box>

          {/* Data Grid Table */}
          <BomTable
            boms={filteredBoms}
            loading={loading}
            error={error}
            onView={handleOpenDetails}
            onEdit={handleOpenEditForm}
            onDelete={handleOpenDeleteConfirm}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            rowCount={rowCount}
          />
        </Box>
      ) : (
        /* Planner Lookup view */
        <BomProductLookup allItems={allItems} />
      )}

      {/* Form Dialog */}
      <BomFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveBOM}
        bom={selectedBomForForm}
        saving={formSaving}
        allItems={allItems}
      />

      {/* Recipe Details Drawer */}
      <BomDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        bom={selectedBomForDetails}
      />

      {/* Delete Confirmation Dialog */}
      <BomDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        finishedProductName={selectedBomForDelete?.finishedProductName || ''}
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
