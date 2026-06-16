import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  Skeleton,
  Stack,
  InputAdornment,
  Paper,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShieldIcon from '@mui/icons-material/Shield';
import FilterListIcon from '@mui/icons-material/FilterList';

// Recharts components
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { auditLogService, AuditLogResponse } from './auditLogService';
import AuditLogTable from './AuditLogTable';
import AuditLogDetailsDrawer from './AuditLogDetailsDrawer';

// Standard action types from prompt
const ACTION_TYPES = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'APPROVE',
  'RECEIVE',
  'DELIVER',
  'COMPLETE'
];

export default function AuditLogPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allLogs, setAllLogs] = useState<AuditLogResponse[]>([]);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Table Pagination State
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  
  // Detail Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  // Snackbar Alert State
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch data
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch a large page size to enable client-side analytics & rich interactive filtering
      const result = await auditLogService.getAuditLogs(0, 2000);
      setAllLogs(result.content);
      showToast('Audit logs synchronized successfully.', 'success');
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      setError(err.message || 'An error occurred while loading audit logs.');
      showToast('Failed to load audit logs. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Toast notifier helper
  const showToast = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Get distinct values for filters
  const distinctUsers = useMemo(() => {
    const users = allLogs.map(log => log.employeeName || `Employee #${log.employeeId || 'System'}`);
    return Array.from(new Set(users)).filter(Boolean).sort();
  }, [allLogs]);

  const distinctEntities = useMemo(() => {
    const entities = allLogs.map(log => log.tableName);
    return Array.from(new Set(entities)).filter(Boolean).sort();
  }, [allLogs]);

  // Apply filters & search query
  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      // Global Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          String(log.logId).toLowerCase().includes(query) ||
          (log.employeeName || '').toLowerCase().includes(query) ||
          (log.description || '').toLowerCase().includes(query) ||
          (log.tableName || '').toLowerCase().includes(query) ||
          (log.actionType || '').toLowerCase().includes(query) ||
          String(log.recordId).toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // User Filter
      if (selectedUser !== 'ALL') {
        const name = log.employeeName || `Employee #${log.employeeId || 'System'}`;
        if (name !== selectedUser) return false;
      }

      // Action Filter
      if (selectedAction !== 'ALL' && log.actionType !== selectedAction) return false;

      // Entity Filter
      if (selectedEntity !== 'ALL' && log.tableName !== selectedEntity) return false;

      // Date Range Filter
      if (startDate) {
        const logDate = new Date(log.actionDate);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (logDate < start) return false;
      }
      if (endDate) {
        const logDate = new Date(log.actionDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }

      return true;
    });
  }, [allLogs, searchQuery, selectedUser, selectedAction, selectedEntity, startDate, endDate]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedUser('ALL');
    setSelectedAction('ALL');
    setSelectedEntity('ALL');
    setStartDate('');
    setEndDate('');
    showToast('Filters cleared.', 'info');
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('No records available to export.', 'warning');
      return;
    }

    try {
      const headers = ['Audit ID', 'Timestamp', 'User', 'Action Type', 'Entity Type', 'Entity ID', 'Description'];
      const rows = filteredLogs.map(log => [
        log.logId,
        log.actionDate,
        log.employeeName || `Employee #${log.employeeId || 'System'}`,
        log.actionType,
        log.tableName,
        log.recordId || 'N/A',
        // Escape quotes in description
        `"${(log.description || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `audit_logs_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${filteredLogs.length} audit logs to CSV successfully.`, 'success');
    } catch (err) {
      console.error('CSV export failed:', err);
      showToast('Export failed. Please contact your system administrator.', 'error');
    }
  };

  // Open Drawer Details
  const handleViewDetails = (id: number) => {
    setSelectedLogId(id);
    setDrawerOpen(true);
  };

  // ----------------------------------------------------
  // COMPUTED KPI METRICS (derived from filtered or all)
  // ----------------------------------------------------
  const kpis = useMemo(() => {
    const total = allLogs.length;

    // Today's Date boundary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = allLogs.filter(log => {
      const d = new Date(log.actionDate);
      return d >= today;
    }).length;

    // Action counts
    const createCount = allLogs.filter(log => log.actionType === 'CREATE').length;
    const updateCount = allLogs.filter(log => log.actionType === 'UPDATE').length;
    const deleteCount = allLogs.filter(log => log.actionType === 'DELETE').length;

    return {
      total,
      today: todayCount,
      create: createCount,
      update: updateCount,
      delete: deleteCount,
    };
  }, [allLogs]);

  // ----------------------------------------------------
  // ANALYTICS DATA GENERATION
  // ----------------------------------------------------
  
  // 1. Activity Trend (Line Chart) - Daily Activities
  const activityTrendData = useMemo(() => {
    const countsByDate: { [key: string]: number } = {};
    
    // Sort logs by date to populate trend line chronologically
    const sorted = [...allLogs].sort((a, b) => new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime());
    
    sorted.forEach(log => {
      try {
        const dateStr = new Date(log.actionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
      } catch (e) {
        // Fallback for date errors
      }
    });

    // Convert to recharts format, limiting to the last 15 active days for viewability
    const chartData = Object.keys(countsByDate).map(date => ({
      date,
      Activities: countsByDate[date],
    }));

    return chartData.slice(-15);
  }, [allLogs]);

  // 2. Action Distribution (Pie Chart)
  const actionDistributionData = useMemo(() => {
    let creates = 0;
    let updates = 0;
    let deletes = 0;
    let others = 0;

    allLogs.forEach(log => {
      const act = log.actionType?.toUpperCase();
      if (act === 'CREATE') creates++;
      else if (act === 'UPDATE') updates++;
      else if (act === 'DELETE') deletes++;
      else others++;
    });

    return [
      { name: 'Create', value: creates, fill: '#16A34A' },   // Success Color
      { name: 'Update', value: updates, fill: '#2563EB' },   // Primary Color
      { name: 'Delete', value: deletes, fill: '#DC2626' },   // Danger Color
      { name: 'Other Actions', value: others, fill: '#0284C7' }, // Info Color
    ].filter(item => item.value > 0);
  }, [allLogs]);

  // 3. Top Active Users (Bar Chart)
  const topActiveUsersData = useMemo(() => {
    const userCounts: { [key: string]: number } = {};

    allLogs.forEach(log => {
      const user = log.employeeName || `Employee #${log.employeeId || 'System'}`;
      userCounts[user] = (userCounts[user] || 0) + 1;
    });

    return Object.keys(userCounts)
      .map(username => ({
        name: username,
        Activities: userCounts[username],
      }))
      .sort((a, b) => b.Activities - a.Activities)
      .slice(0, 5); // Show top 5 users
  }, [allLogs]);

  return (
    <Box>
      {/* HEADER TITLE SECTION */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon sx={{ color: '#2563EB', fontSize: 30 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Audit Logs
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Track system activities, user actions, and business changes for regulatory compliance and enterprise security
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={fetchLogs}
            startIcon={<RefreshIcon />}
            sx={{
              color: '#334155',
              borderColor: '#E2E8F0',
              bgcolor: '#FFFFFF',
              fontWeight: 600,
              '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' }
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={handleExportCSV}
            startIcon={<DownloadIcon />}
            sx={{
              bgcolor: '#2563EB',
              fontWeight: 600,
              '&:hover': { bgcolor: '#1D4ED8' }
            }}
          >
            Export CSV
          </Button>
        </Stack>
      </Box>

      {/* KPI DASHBOARD CARDS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: 'Total Audit Events', value: kpis.total, icon: <HistoryIcon sx={{ fontSize: 24 }} />, color: '#2563EB', bg: '#EFF6FF' },
          { title: "Today's Activities", value: kpis.today, icon: <AccessTimeIcon sx={{ fontSize: 24 }} />, color: '#0284C7', bg: '#F0F9FF' },
          { title: 'Create Actions', value: kpis.create, icon: <ShieldIcon sx={{ fontSize: 24 }} />, color: '#16A34A', bg: '#F0FDF4' },
          { title: 'Update Actions', value: kpis.update, icon: <ShieldIcon sx={{ fontSize: 24 }} />, color: '#2563EB', bg: '#EFF6FF' },
          { title: 'Delete Actions', value: kpis.delete, icon: <ShieldIcon sx={{ fontSize: 24 }} />, color: '#DC2626', bg: '#FEF2F2' },
        ].map((kpi, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={idx}>
            <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: kpi.color }} />
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.825rem' }}>
                    {kpi.title}
                  </Typography>
                  <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: kpi.bg, color: kpi.color, display: 'flex' }}>
                    {kpi.icon}
                  </Box>
                </Box>
                {loading ? (
                  <Skeleton variant="text" width="60%" height={36} />
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {kpi.value}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* COMPLIANCE ANALYTICS SECTION */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Line Chart: Activity Trend */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', mb: 2.5 }}>
                Activity Trend
              </Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                {loading ? (
                  <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
                ) : activityTrendData.length === 0 ? (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                    No activity records found
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: 'none',
                          borderRadius: 8,
                          color: '#FFFFFF',
                          fontSize: '0.8rem',
                        }}
                      />
                      <Line type="monotone" dataKey="Activities" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, stroke: '#FFFFFF', strokeWidth: 2, fill: '#2563EB' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie Chart: Action Distribution */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', mb: 2.5 }}>
                Action Distribution
              </Typography>
              <Box sx={{ width: '100%', height: 260, display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>
                {loading ? (
                  <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
                ) : actionDistributionData.length === 0 ? (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                    No distribution data
                  </Box>
                ) : (
                  <>
                    <Box sx={{ width: '100%', height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={actionDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {actionDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip
                            contentStyle={{
                              backgroundColor: '#0F172A',
                              border: 'none',
                              borderRadius: 8,
                              color: '#FFFFFF',
                              fontSize: '0.8rem',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    {/* Compact custom legend layout */}
                    <Grid container spacing={0.5} sx={{ mt: 1, justifyContent: 'center' }}>
                      {actionDistributionData.map((entry, index) => (
                        <Grid size={{ xs: 6 }} key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.fill }} />
                          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 650, fontSize: '0.675rem', whiteSpace: 'nowrap' }}>
                            {entry.name} ({entry.value})
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bar Chart: Top Active Users */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', mb: 2.5 }}>
                Top Active Users
              </Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                {loading ? (
                  <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
                ) : topActiveUsersData.length === 0 ? (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                    No user records found
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topActiveUsersData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                      <XAxis type="number" stroke="#64748B" fontSize={10} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={10} width={60} tickLine={false} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: 'none',
                          borderRadius: 8,
                          color: '#FFFFFF',
                          fontSize: '0.8rem',
                        }}
                      />
                      <Bar dataKey="Activities" fill="#334155" radius={[0, 4, 4, 0]} barSize={16}>
                        {topActiveUsersData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#2563EB' : '#334155'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* SEARCH & FILTER CONTROLS */}
      <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterListIcon sx={{ color: '#64748B', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Search Filters
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {/* Search query */}
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Search logs"
                placeholder="ID, user, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* User Filter */}
            <Grid size={{ xs: 12, sm: 4, md: 2.25 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="User"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <MenuItem value="ALL">All Users</MenuItem>
                {distinctUsers.map((user, idx) => (
                  <MenuItem key={idx} value={user}>
                    {user}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Action Type Filter */}
            <Grid size={{ xs: 12, sm: 4, md: 2.25 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Action Type"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
              >
                <MenuItem value="ALL">All Action Types</MenuItem>
                {ACTION_TYPES.map((action, idx) => (
                  <MenuItem key={idx} value={action}>
                    {action}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Entity Type Filter */}
            <Grid size={{ xs: 12, sm: 4, md: 2.25 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Entity Type"
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
              >
                <MenuItem value="ALL">All Entity Types</MenuItem>
                {distinctEntities.map((entity, idx) => (
                  <MenuItem key={idx} value={entity}>
                    {entity}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Date Range Start */}
            <Grid size={{ xs: 6, sm: 2, md: 1.125 }}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Grid>

            {/* Date Range End */}
            <Grid size={{ xs: 6, sm: 2, md: 1.125 }}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Grid>
          </Grid>

          {/* Reset Filters Option */}
          {(searchQuery || selectedUser !== 'ALL' || selectedAction !== 'ALL' || selectedEntity !== 'ALL' || startDate || endDate) && (
            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                color="secondary"
                onClick={handleResetFilters}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Reset Filters
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* AUDIT LOG TABLE */}
      {filteredLogs.length === 0 && !loading ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed #E2E8F0',
            borderRadius: 3,
            bgcolor: '#FFFFFF',
          }}
        >
          <HistoryIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
            No Audit Logs Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', textAlign: 'center', maxWidth: 400 }}>
            {allLogs.length === 0
              ? 'There are currently no security or data audit entries logged in the system.'
              : 'No log entries match the search criteria or active filters. Try adjustments or reset filters.'}
          </Typography>
          {(searchQuery || selectedUser !== 'ALL' || selectedAction !== 'ALL' || selectedEntity !== 'ALL' || startDate || endDate) && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleResetFilters}
              sx={{ mt: 2.5, textTransform: 'none', fontWeight: 600 }}
            >
              Reset Filters
            </Button>
          )}
        </Paper>
      ) : (
        <AuditLogTable
          logs={filteredLogs}
          loading={loading}
          error={error}
          onViewDetails={handleViewDetails}
          rowCount={filteredLogs.length}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
        />
      )}

      {/* COMPLIANCE DRAWER VIEW */}
      <AuditLogDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        logId={selectedLogId}
      />

      {/* TOAST SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2, fontWeight: 500 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
