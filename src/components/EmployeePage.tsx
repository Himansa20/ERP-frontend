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
import BadgeIcon from '@mui/icons-material/Badge';
import PeopleIcon from '@mui/icons-material/People';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

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

import { employeeService, Employee, EmployeeInput } from './employeeService';
import EmployeeTable from './EmployeeTable';
import EmployeeFormDialog from './EmployeeFormDialog';
import EmployeeDetailsDrawer from './EmployeeDetailsDrawer';
import EmployeeDeleteDialog from './EmployeeDeleteDialog';

export default function EmployeePage() {
  // Data loading states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]); // For global stats and exports
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

  // Dialog & Drawer toggle states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEmployeeForForm, setSelectedEmployeeForForm] = useState<Employee | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState<Employee | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEmployeeForDelete, setSelectedEmployeeForDelete] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // KPI Calculations
  const [kpi, setKpi] = useState({
    total: 0,
    managers: 0,
    productionStaff: 0,
    totalSalary: 0,
    avgSalary: 0,
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Fetch KPI aggregates and all employees
  const fetchKpiAndChartsData = async () => {
    try {
      const res = await employeeService.getEmployees(0, 1000);
      setAllEmployees(res.content);

      const total = res.totalElements;
      const mCount = res.content.filter((e) => (e.employeeType || '').toUpperCase() === 'MANAGER').length;
      const pCount = res.content.filter((e) => (e.employeeType || '').toUpperCase() === 'PRODUCTION').length;
      const sumSalary = res.content.reduce((sum, e) => sum + Number(e.salary || 0), 0);
      const avgSal = total > 0 ? sumSalary / total : 0;

      setKpi({
        total,
        managers: mCount,
        productionStaff: pCount,
        totalSalary: sumSalary,
        avgSalary: avgSal,
      });
    } catch (err) {
      console.error('Failed to load employee statistics:', err);
    }
  };

  // Fetch paginated employees
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeeService.getEmployees(
        paginationModel.page,
        paginationModel.pageSize
      );
      setEmployees(data.content);
      setRowCount(data.totalElements);
    } catch (err: any) {
      console.error('Failed to load employees:', err);
      setError(err.message || 'An error occurred while fetching employees.');
      showToast('Error loading employees list', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    fetchEmployees();
    fetchKpiAndChartsData();
  }, [fetchEmployees]);

  const handleRefresh = () => {
    fetchEmployees();
    fetchKpiAndChartsData();
    showToast('Data refreshed successfully', 'success');
  };

  // Form actions
  const handleOpenCreateForm = () => {
    setSelectedEmployeeForForm(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (employee: Employee) => {
    setSelectedEmployeeForForm(employee);
    setFormOpen(true);
  };

  const handleSaveEmployee = async (input: EmployeeInput) => {
    setFormSaving(true);
    try {
      if (selectedEmployeeForForm) {
        // Edit mode
        const updated = await employeeService.updateEmployee(
          selectedEmployeeForForm.employeeId,
          input
        );
        showToast(`Employee "${updated.employeeName}" updated successfully`, 'success');
      } else {
        // Create mode
        const created = await employeeService.createEmployee(input);
        showToast(`Employee "${created.employeeName}" created successfully`, 'success');
      }
      setFormOpen(false);
      fetchEmployees();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Save employee failed:', err);
      showToast(err.response?.data?.message || 'Failed to save employee record.', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  // View actions
  const handleOpenDetails = (employee: Employee) => {
    setSelectedEmployeeForDetails(employee);
    setDetailsOpen(true);
  };

  // Delete actions
  const handleOpenDeleteConfirm = (employee: Employee) => {
    setSelectedEmployeeForDelete(employee);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployeeForDelete) return;
    setDeleteLoading(true);
    const name = selectedEmployeeForDelete.employeeName;
    const id = selectedEmployeeForDelete.employeeId;

    try {
      await employeeService.deleteEmployee(id);
      showToast(`Employee "${name}" deleted successfully`, 'success');
      setDeleteOpen(false);
      fetchEmployees();
      fetchKpiAndChartsData();
    } catch (err: any) {
      console.error('Delete employee failed:', err);
      showToast(err.response?.data?.message || 'Failed to delete employee.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (allEmployees.length === 0) {
      showToast('No employee data available to export', 'warning');
      return;
    }
    const headers = ['Employee ID', 'Name', 'Email', 'Contact No', 'Type', 'Hire Date', 'Salary'];
    const rows = allEmployees.map((e) => [
      e.employeeId,
      `"${e.employeeName.replace(/"/g, '""')}"`,
      `"${(e.email || '').replace(/"/g, '""')}"`,
      `"${(e.contactNo || '').replace(/"/g, '""')}"`,
      `"${(e.employeeType || '').replace(/"/g, '""')}"`,
      new Date(e.hireDate || '').toLocaleDateString(),
      e.salary,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employees_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported employees list to CSV', 'success');
  };

  // Client-side filtering/searching matching paginated results
  const getFilteredEmployees = () => {
    let list = employees;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.employeeName?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.contactNo?.toLowerCase().includes(q) ||
          e.employeeId?.toString().includes(q)
      );
    }

    if (typeFilter !== 'ALL') {
      list = list.filter((e) => (e.employeeType || '').toUpperCase() === typeFilter.toUpperCase());
    }

    return list;
  };

  const filteredEmployees = getFilteredEmployees();

  // Charts data aggregation
  const getPieChartData = () => {
    const types = ['Manager', 'Production', 'Sales', 'Purchase', 'Inventory'];
    const colors = ['#2563EB', '#16A34A', '#4F46E5', '#D97706', '#7C3AED'];

    return types.map((type, idx) => {
      const count = allEmployees.filter((e) => (e.employeeType || '').toUpperCase() === type.toUpperCase()).length;
      return {
        name: type,
        value: count,
        fill: colors[idx],
      };
    }).filter(item => item.value > 0);
  };

  const getBarChartData = () => {
    // Average salary by department
    const types = ['Manager', 'Production', 'Sales', 'Purchase', 'Inventory'];
    return types.map((type) => {
      const deptEmps = allEmployees.filter((e) => (e.employeeType || '').toUpperCase() === type.toUpperCase());
      const sum = deptEmps.reduce((acc, e) => acc + Number(e.salary || 0), 0);
      const avg = deptEmps.length > 0 ? Math.round(sum / deptEmps.length) : 0;
      return {
        name: type,
        avgSalary: avg,
      };
    });
  };

  const pieChartData = getPieChartData();
  const barChartData = getBarChartData();

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
          Employees
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Manage employee records, roles, directory contact details and salary payroll rosters
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* KPI 1: Total Employees */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <PeopleIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Employees
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Managers */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                  <BadgeIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Managers Count
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563EB', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.managers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Production Staff */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#16A34A', display: 'flex' }}>
                  <EngineeringIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Production Staff
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#16A34A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : kpi.productionStaff}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: Monthly Payroll */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#16A34A', display: 'flex' }}>
                  <AttachMoneyIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Monthly Payroll
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : `$${kpi.totalSalary.toLocaleString()}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 5: Average Salary */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: '#F8FAFC', p: 1, borderRadius: 2, color: '#64748B', display: 'flex' }}>
                  <LeaderboardIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Average Salary
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {loading ? <CircularProgress size={16} /> : `$${Math.round(kpi.avgSalary).toLocaleString()}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Layout */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Employee Type Distribution (Pie Chart) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Role/Type Distribution
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
                      <ChartTooltip formatter={(value) => [`${value} Members`, 'Count']} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 230 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>No employee statistics records</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Avg Salary by Employee Type (Bar Chart) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Average Salary by Role ($)
              </Typography>
              {allEmployees.length > 0 ? (
                <ResponsiveContainer width="100%" height={230} minWidth={0}>
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                    <ChartTooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Average Salary']} />
                    <Bar dataKey="avgSalary" fill="#2563EB" radius={[4, 4, 0, 0]} name="Avg Salary" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 230 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>No payroll data recorded</Typography>
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
          placeholder="Search employees by name, email, or contact details..."
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
            <Tooltip title="Filter by Role Type">
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
                Filter: {typeFilter === 'ALL' ? 'All Roles' : typeFilter}
              </Button>
            </Tooltip>

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

          {/* Add Employee Button */}
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
            Add Employee
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
            setTypeFilter('ALL');
            setFilterAnchorEl(null);
          }}
          selected={typeFilter === 'ALL'}
        >
          All Roles
        </MenuItem>
        <MenuItem
          onClick={() => {
            setTypeFilter('Manager');
            setFilterAnchorEl(null);
          }}
          selected={typeFilter === 'Manager'}
        >
          Manager
        </MenuItem>
        <MenuItem
          onClick={() => {
            setTypeFilter('Production');
            setFilterAnchorEl(null);
          }}
          selected={typeFilter === 'Production'}
        >
          Production Staff
        </MenuItem>
        <MenuItem
          onClick={() => {
            setTypeFilter('Sales');
            setFilterAnchorEl(null);
          }}
          selected={typeFilter === 'Sales'}
        >
          Sales Staff
        </MenuItem>
        <MenuItem
          onClick={() => {
            setTypeFilter('Purchase');
            setFilterAnchorEl(null);
          }}
          selected={typeFilter === 'Purchase'}
        >
          Purchase Staff
        </MenuItem>
        <MenuItem
          onClick={() => {
            setTypeFilter('Inventory');
            setFilterAnchorEl(null);
          }}
          selected={typeFilter === 'Inventory'}
        >
          Inventory Staff
        </MenuItem>
      </Menu>

      {/* Data Table */}
      <EmployeeTable
        employees={filteredEmployees}
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
      <EmployeeFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveEmployee}
        employee={selectedEmployeeForForm}
        saving={formSaving}
      />

      {/* Profile Details Drawer */}
      <EmployeeDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        employee={selectedEmployeeForDetails}
      />

      {/* Delete Confirmation Dialog */}
      <EmployeeDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        employeeName={selectedEmployeeForDelete?.employeeName || ''}
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
