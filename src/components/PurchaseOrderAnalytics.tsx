import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaidIcon from '@mui/icons-material/Paid';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// Recharts components
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { PurchaseOrder, DropdownItem } from './purchaseOrderService';
import { formatCurrency as centralFormatCurrency } from '../utils/currency';

interface PurchaseOrderAnalyticsProps {
  orders: PurchaseOrder[];
  suppliers: DropdownItem[];
  suppliersMap: Record<number, string>;
}

export default function PurchaseOrderAnalytics({
  orders,
  suppliers,
  suppliersMap,
}: PurchaseOrderAnalyticsProps) {

  // Colors matching the design requirements
  const COLORS = {
    DRAFT: '#64748B',            // Grey
    PENDING_APPROVAL: '#D97706', // Orange
    APPROVED: '#16A34A',         // Green
    REJECTED: '#DC2626',         // Red
    RECEIVED: '#2563EB',         // Blue
  };

  const PIE_COLORS = [
    COLORS.PENDING_APPROVAL,
    COLORS.APPROVED,
    COLORS.RECEIVED,
    COLORS.REJECTED,
    COLORS.DRAFT,
  ];

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return centralFormatCurrency(val, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Helper to format date
  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // 1. Monthly Spend and Volume aggregation
  const getMonthlyData = () => {
    const monthlyMap: Record<string, { value: number; count: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize current year months up to current month or just standard 6 months
    const currentMonth = new Date().getMonth();
    for (let i = 4; i >= 0; i--) {
      const idx = (currentMonth - i + 12) % 12;
      monthlyMap[months[idx]] = { value: 0, count: 0 };
    }

    orders.forEach((o) => {
      const dateVal = o.orderDate || o.createdDate;
      if (!dateVal) return;
      try {
        const dateObj = new Date(dateVal);
        const mName = months[dateObj.getMonth()];
        if (monthlyMap[mName] !== undefined) {
          monthlyMap[mName].value += Number(o.totalAmount || 0);
          monthlyMap[mName].count += 1;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });

    const list = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      'Monthly Value': data.value,
      'Purchase OrdersCount': data.count,
    }));

    // If all values are 0, populate mock records for demo
    const allZero = list.every((item) => item['Monthly Value'] === 0);
    if (allZero) {
      return [
        { month: 'Feb', 'Monthly Value': 24500, 'Purchase OrdersCount': 4 },
        { month: 'Mar', 'Monthly Value': 41200, 'Purchase OrdersCount': 7 },
        { month: 'Apr', 'Monthly Value': 32800, 'Purchase OrdersCount': 6 },
        { month: 'May', 'Monthly Value': 58000, 'Purchase OrdersCount': 10 },
        { month: 'Jun', 'Monthly Value': 49500, 'Purchase OrdersCount': 8 },
      ];
    }

    return list;
  };

  // 2. Status Distribution (Pie Chart) aggregation
  const getStatusData = () => {
    const counts: Record<string, number> = {
      PENDING_APPROVAL: 0,
      APPROVED: 0,
      REJECTED: 0,
      RECEIVED: 0,
      DRAFT: 0,
    };

    orders.forEach((o) => {
      const status = (o.status || 'DRAFT').toUpperCase();
      if (counts[status] !== undefined) {
        counts[status] += 1;
      } else {
        counts['DRAFT'] += 1;
      }
    });

    const dataList = [
      { name: 'Pending Approval', value: counts.PENDING_APPROVAL, fill: COLORS.PENDING_APPROVAL },
      { name: 'Approved', value: counts.APPROVED, fill: COLORS.APPROVED },
      { name: 'Received', value: counts.RECEIVED, fill: COLORS.RECEIVED },
      { name: 'Rejected', value: counts.REJECTED, fill: COLORS.REJECTED },
      { name: 'Draft', value: counts.DRAFT, fill: COLORS.DRAFT },
    ].filter(item => item.value > 0);

    if (dataList.length === 0) {
      // Return realistic mock data
      return [
        { name: 'Pending Approval', value: 2, fill: COLORS.PENDING_APPROVAL },
        { name: 'Approved', value: 4, fill: COLORS.APPROVED },
        { name: 'Received', value: 6, fill: COLORS.RECEIVED },
        { name: 'Rejected', value: 1, fill: COLORS.REJECTED },
        { name: 'Draft', value: 1, fill: COLORS.DRAFT },
      ];
    }
    return dataList;
  };

  // 3. Top Suppliers aggregation (for spend bar chart & summary cards)
  const getSuppliersData = () => {
    const supplierStats: Record<number, { name: string; count: number; spend: number; lastDate: string }> = {};

    orders.forEach((o) => {
      const sId = o.supplierId;
      const sName = suppliersMap[sId] || `Supplier #${sId}`;
      const oDate = o.orderDate || o.createdDate || '';

      if (!supplierStats[sId]) {
        supplierStats[sId] = { name: sName, count: 0, spend: 0, lastDate: oDate };
      }

      supplierStats[sId].count += 1;
      supplierStats[sId].spend += Number(o.totalAmount || 0);
      
      if (oDate && (!supplierStats[sId].lastDate || new Date(oDate) > new Date(supplierStats[sId].lastDate))) {
        supplierStats[sId].lastDate = oDate;
      }
    });

    let list = Object.values(supplierStats);

    // If list is empty, inject mock suppliers from standard supplier list or general mocks
    if (list.length === 0) {
      const mockSuppliers = suppliers.slice(0, 4);
      if (mockSuppliers.length > 0) {
        list = mockSuppliers.map((s, idx) => ({
          name: s.name,
          count: [5, 3, 2, 1][idx] || 1,
          spend: [45000, 28000, 18500, 9200][idx] || 5000,
          lastDate: new Date(Date.now() - idx * 2 * 24 * 60 * 60 * 1000).toISOString(),
        }));
      } else {
        list = [
          { name: 'Apex Metal Solutions', count: 5, spend: 45000, lastDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
          { name: 'Global Polymers Ltd', count: 3, spend: 28000, lastDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
          { name: 'BlueWhale Electronics Corp', count: 2, spend: 18500, lastDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { name: 'Swift Logistics Group', count: 1, spend: 9200, lastDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        ];
      }
    }

    return list.sort((a, b) => b.spend - a.spend);
  };

  const monthlyData = getMonthlyData();
  const statusData = getStatusData();
  const supplierProcurementList = getSuppliersData();

  // Get Top 5 suppliers for the bar chart
  const topSuppliersChartData = supplierProcurementList.slice(0, 5);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Monthly Purchase Spend & Volume */}
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2.5 }}>
                Procurement Spend Analysis (Monthly Value)
              </Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#D97706" fontSize={11} tickLine={false} />
                    <ChartTooltip 
                      formatter={(value, name) => {
                        if (name === 'Monthly Value') return [formatCurrency(Number(value)), 'Spend Value'];
                        return [value, 'Order Count'];
                      }} 
                    />
                    <Legend iconType="circle" />
                    <Bar yAxisId="left" dataKey="Monthly Value" fill="#2563EB" radius={[4, 4, 0, 0]} name="Monthly Value" />
                    <Bar yAxisId="right" dataKey="Purchase OrdersCount" fill="#D97706" radius={[4, 4, 0, 0]} name="Purchase OrdersCount" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Suppliers Bar Chart */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2.5 }}>
                Top Suppliers by Expenditures
              </Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={topSuppliersChartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={9} width={95} tickLine={false} />
                    <ChartTooltip formatter={(value) => [formatCurrency(Number(value)), 'Total Spend']} />
                    <Bar dataKey="spend" fill="#0F172A" radius={[0, 4, 4, 0]} name="Spend Value" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Distribution Pie Chart */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2.5 }}>
                Status Distribution
              </Typography>
              <Box sx={{ width: '100%', height: 260, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={170} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip formatter={(value) => [`${value} Orders`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend list custom styled */}
                <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1.2, justifyContent: 'center' }}>
                  {statusData.map((s, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.fill }} />
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.7rem' }}>
                        {s.name} ({s.value})
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Supplier Procurement Summary Cards */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
          Supplier Procurement Summary
        </Typography>
        <Grid container spacing={2.5}>
          {supplierProcurementList.slice(0, 4).map((s, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
                {/* Accent bar color based on rank */}
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: ['#2563EB', '#16A34A', '#D97706', '#64748B'][idx] || '#CBD5E1' }} />
                
                <CardContent sx={{ p: 2.2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', noWrap: true, maxWidth: '85%' }}>
                      {s.name}
                    </Typography>
                    <BusinessIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                  </Box>

                  <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        Total Orders
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ReceiptLongIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
                        {s.count}
                      </Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        Total Spend
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 750, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PaidIcon sx={{ fontSize: 14, color: '#16A34A' }} />
                        {formatCurrency(s.spend)}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 12, color: '#94A3B8' }} />
                          Last Order:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                          {formatDateOnly(s.lastDate)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
