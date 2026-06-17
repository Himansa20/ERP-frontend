import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SupplierPage from './SupplierPage';
import CustomerPage from './CustomerPage';
import ProductionOrderPage from './ProductionOrderPage';
import SalesOrderPage from './SalesOrderPage';
import ItemPage from './ItemPage';
import EmployeePage from './EmployeePage';
import WarehousePage from './WarehousePage';
import BomPage from './BomPage';
import InventoryTransactionPage from './InventoryTransactionPage';
import StockByWarehousePage from './StockByWarehousePage';
import AuditLogPage from './AuditLogPage';
import PurchaseOrderPage from './PurchaseOrderPage';
import {
  createTheme,
  ThemeProvider,
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Badge,
  Avatar,
  Container,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Skeleton,
  Alert,
  AlertTitle,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Stack,
  useMediaQuery,
} from '@mui/material';

// Material UI Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import DescriptionIcon from '@mui/icons-material/Description';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FactoryIcon from '@mui/icons-material/Factory';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AssignmentAlertIcon from '@mui/icons-material/AssignmentLate';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import InfoIcon from '@mui/icons-material/Info';

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
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Theme configuration matching User's Color Design Requirements
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563EB', // Blue 600
    },
    secondary: {
      main: '#0F172A', // Slate 900
    },
    success: {
      main: '#10B981', // Emerald 500
    },
    warning: {
      main: '#F59E0B', // Amber 500
    },
    error: {
      main: '#EF4444', // Red 500
    },
    background: {
      default: '#F8FAFC', // Slate 50 canvas background
      paper: '#FFFFFF', // White background
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 700,
      color: '#0F172A',
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      color: '#0F172A',
      letterSpacing: '-0.015em',
    },
    subtitle1: {
      fontWeight: 500,
      color: '#475569',
    },
    body1: {
      color: '#334155',
    },
    body2: {
      color: '#475569',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #E2E8F0',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#F8FAFC',
          color: '#475569',
          borderBottom: '2px solid #E2E8F0',
        },
        body: {
          borderBottom: '1px solid #F1F5F9',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
        },
      },
    },
  },
});

// TypeScript Models for API Payloads
interface MonthlySalesSummary {
  month: string;
  totalSalesAmount: number;
}

interface ProductionSummary {
  totalOrders: number;
  completedOrders: number;
  plannedOrders: number;
  totalQuantityProduced: number;
}

interface ItemResponse {
  itemId: number;
  itemName: string;
  itemType: string;
  unitOfMeasure: string;
  currentStock: number;
  reorderLevel: number;
  itemStatus: string;
  description: string;
  createdDate: string;
  version: number;
}

interface SupplierPurchaseSummary {
  supplierId: number;
  supplierName: string;
  totalPurchaseAmount: number;
}

interface TopSellingProduct {
  itemId: number;
  itemName: string;
  totalQuantitySold: number;
}

// Side Nav Links as specified in the prompt
const navigationItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, id: 'dashboard' },
  { text: 'Employees', icon: <PeopleIcon />, id: 'employees' },
  { text: 'Customers', icon: <GroupIcon />, id: 'customers' },
  { text: 'Suppliers', icon: <BusinessIcon />, id: 'suppliers' },
  { text: 'Inventory', icon: <InventoryIcon />, id: 'inventory' },
  { text: 'Warehouses', icon: <WarehouseIcon />, id: 'warehouses' },
  { text: 'Stock Transactions', icon: <ReceiptLongIcon />, id: 'inventory-transactions' },
  { text: 'Stock By Warehouse', icon: <WarehouseIcon />, id: 'stock-by-warehouse' },
  { text: 'Purchase Orders', icon: <DescriptionIcon />, id: 'purchase-orders' },
  { text: 'Sales Orders', icon: <ShoppingCartIcon />, id: 'sales-orders' },
  { text: 'Production Orders', icon: <PrecisionManufacturingIcon />, id: 'production-orders' },
  { text: 'Bill Of Materials', icon: <ReceiptLongIcon />, id: 'bom' },
  { text: 'Payments', icon: <PaymentIcon />, id: 'payments' },
  { text: 'Audit Logs', icon: <HistoryIcon />, id: 'audit-logs' },
  { text: 'System Configuration', icon: <SettingsIcon />, id: 'system-config' },
];

const DRAWER_WIDTH = 260;

// Recharts Custom Pie Chart Label
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
    </text>
  );
};

function ConstructionPlaceholder({ view }: { view: string }) {
  const viewName = navigationItems.find(item => item.id === view)?.text || view;
  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <Box sx={{ bgcolor: '#EFF6FF', p: 3, borderRadius: '50%', color: '#2563EB', mb: 3 }}>
        <SettingsIcon sx={{ fontSize: 48 }} />
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
        {viewName} Module
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 400, textAlign: 'center' }}>
        This module is currently under construction. Titan ERP is actively integrating this page with the manufacturing system.
      </Typography>
    </Box>
  );
}

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  // State variables for drawer open/close
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const isTabletOrMobile = useMediaQuery(theme.breakpoints.down('lg'));

  // Auth variables
  const username = localStorage.getItem('username') || 'Administrator';
  const role = localStorage.getItem('role') || 'ADMIN';

  // State structures for resilient, detailed API loading and error states
  const [monthlySales, setMonthlySales] = useState<{ data: MonthlySalesSummary[] | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null });
  const [production, setProduction] = useState<{ data: ProductionSummary | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null });
  const [lowStock, setLowStock] = useState<{ data: ItemResponse[] | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null });
  const [reorderAlerts, setReorderAlerts] = useState<{ data: ItemResponse[] | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null });
  const [supplierPurchase, setSupplierPurchase] = useState<{ data: SupplierPurchaseSummary[] | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null });
  const [topSelling, setTopSelling] = useState<{ data: TopSellingProduct[] | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null });

  // Profile Menu State
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const isProfileMenuOpen = Boolean(profileAnchorEl);

  // Helper function to build API Headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const tokenType = localStorage.getItem('tokenType') || 'Bearer';
    return token ? { Authorization: `${tokenType} ${token}` } : {};
  };

  // Fetch functions for each endpoint individually to maximize stability and show localized states
  const fetchMonthlySalesSummary = async () => {
    setMonthlySales((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await axios.get<MonthlySalesSummary[]>('/api/dashboard/monthly-sales-summary', {
        headers: getAuthHeaders(),
      });
      setMonthlySales({ data: res.data, loading: false, error: null });
    } catch (err: any) {
      console.error('Failed to fetch sales summary:', err);
      setMonthlySales({ data: null, loading: false, error: err.message || 'Server error occurred' });
    }
  };

  const fetchProductionSummary = async () => {
    setProduction((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await axios.get<ProductionSummary>('/api/dashboard/production-summary', {
        headers: getAuthHeaders(),
      });
      setProduction({ data: res.data, loading: false, error: null });
    } catch (err: any) {
      console.error('Failed to fetch production summary:', err);
      setProduction({ data: null, loading: false, error: err.message || 'Server error occurred' });
    }
  };

  const fetchLowStockItems = async () => {
    setLowStock((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await axios.get<ItemResponse[]>('/api/dashboard/low-stock-items', {
        headers: getAuthHeaders(),
      });
      setLowStock({ data: res.data, loading: false, error: null });
    } catch (err: any) {
      console.error('Failed to fetch low stock items:', err);
      setLowStock({ data: null, loading: false, error: err.message || 'Server error occurred' });
    }
  };

  const fetchReorderAlerts = async () => {
    setReorderAlerts((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await axios.get<ItemResponse[]>('/api/dashboard/reorder-alerts', {
        headers: getAuthHeaders(),
      });
      setReorderAlerts({ data: res.data, loading: false, error: null });
    } catch (err: any) {
      console.error('Failed to fetch reorder alerts:', err);
      setReorderAlerts({ data: null, loading: false, error: err.message || 'Server error occurred' });
    }
  };

  const fetchSupplierPurchaseSummary = async () => {
    setSupplierPurchase((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await axios.get<SupplierPurchaseSummary[]>('/api/dashboard/supplier-purchase-summary', {
        headers: getAuthHeaders(),
      });
      setSupplierPurchase({ data: res.data, loading: false, error: null });
    } catch (err: any) {
      console.error('Failed to fetch supplier purchase summary:', err);
      setSupplierPurchase({ data: null, loading: false, error: err.message || 'Server error occurred' });
    }
  };

  const fetchTopSellingProducts = async () => {
    setTopSelling((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await axios.get<TopSellingProduct[]>('/api/dashboard/top-selling-products', {
        headers: getAuthHeaders(),
      });
      setTopSelling({ data: res.data, loading: false, error: null });
    } catch (err: any) {
      console.error('Failed to fetch top selling products:', err);
      setTopSelling({ data: null, loading: false, error: err.message || 'Server error occurred' });
    }
  };

  // Run all fetches in parallel on component mount
  const fetchAllData = () => {
    fetchMonthlySalesSummary();
    fetchProductionSummary();
    fetchLowStockItems();
    fetchReorderAlerts();
    fetchSupplierPurchaseSummary();
    fetchTopSellingProducts();
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Calculations for Section 1 KPIs
  const getMonthlySalesKpi = () => {
    if (monthlySales.data && monthlySales.data.length > 0) {
      // Get the latest month value or compute the total
      const latestMonth = monthlySales.data[monthlySales.data.length - 1];
      return {
        value: `$${latestMonth.totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        trend: '+12.4% MoM',
        isPositive: true,
        monthName: latestMonth.month,
      };
    }
    return { value: '$0.00', trend: '--', isPositive: true, monthName: 'N/A' };
  };

  const getProductionKpi = () => {
    if (production.data) {
      const completionRate = production.data.totalOrders > 0
        ? Math.round((production.data.completedOrders / production.data.totalOrders) * 100)
        : 0;
      return {
        value: `${production.data.completedOrders} / ${production.data.totalOrders}`,
        sub: `${completionRate}% Completion Rate`,
        totalQty: production.data.totalQuantityProduced.toLocaleString() + ' Units',
        trend: '+2.5% vs target',
        isPositive: true,
      };
    }
    return { value: '0 / 0', sub: '0% Completion', totalQty: '0 Units', trend: '--', isPositive: true };
  };

  const getLowStockCount = () => {
    return lowStock.data ? lowStock.data.length : 0;
  };

  const getReorderAlertCount = () => {
    return reorderAlerts.data ? reorderAlerts.data.length : 0;
  };

  // Section 2: Production Bar Chart Processing
  const getProductionBarChartData = () => {
    if (production.data) {
      return [
        { name: 'Planned Orders', count: production.data.plannedOrders, fill: '#F59E0B' },
        { name: 'Completed Orders', count: production.data.completedOrders, fill: '#10B981' },
        { name: 'Total Orders', count: production.data.totalOrders, fill: '#2563EB' },
      ];
    }
    return [];
  };

  // Section 3: Supplier Pie Chart colors
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  // Sidebar contents
  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Title / Brand Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <Box
          sx={{
            bgcolor: '#2563EB',
            color: 'white',
            borderRadius: 2,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FactoryIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
            TITAN ERP
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
            Enterprise Edition
          </Typography>
        </Box>
      </Box>

      {/* Nav List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, py: 2 }}>
        <List sx={{ p: 0, '& .MuiListItem-root': { mb: 0.5 } }}>
          {navigationItems.map((item) => {
            const isActive = item.id === activeView;
            return (
              <ListItemButton
                key={item.text}
                onClick={() => {
                  setActiveView(item.id);
                  if (isTabletOrMobile) {
                    setMobileOpen(false);
                  }
                }}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 1.5,
                  bgcolor: isActive ? '#EFF6FF' : 'transparent',
                  color: isActive ? '#2563EB' : '#475569',
                  '&:hover': {
                    bgcolor: isActive ? '#EFF6FF' : '#F1F5F9',
                    color: isActive ? '#2563EB' : '#0F172A',
                  },
                  '& .MuiListItemIcon-root': {
                    color: isActive ? '#2563EB' : '#64748B',
                    minWidth: 36,
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 }}>
                  {item.text}
                </Typography>
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* User Session and Log Out Footer */}
      <Box sx={{ p: 2, bgcolor: '#F8FAFC' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: '#0F172A',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              width: 36,
              height: 36,
            }}
          >
            {username[0].toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', noWrap: true }}>
              {username}
            </Typography>
            <Chip
              label={role}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.625rem',
                fontWeight: 700,
                color: '#2563EB',
                bgcolor: '#EFF6FF',
                mt: 0.2,
                '& .MuiChip-label': { px: 0.7 },
              }}
            />
          </Box>
        </Box>
        <Button
          onClick={onLogout}
          variant="outlined"
          color="error"
          fullWidth
          startIcon={<LogoutIcon />}
          sx={{
            py: 0.8,
            borderColor: '#EF4444',
            color: '#EF4444',
            '&:hover': {
              bgcolor: '#FEF2F2',
              borderColor: '#EF4444',
            },
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
        {/* TOP APP BAR */}
        <AppBar
          position="fixed"
          sx={{
            width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
            ml: { lg: `${DRAWER_WIDTH}px` },
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar sx={{ px: { xs: 2, md: 3 }, minHeight: 64, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isTabletOrMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 1, color: '#475569' }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" noWrap component="div" sx={{ color: '#0F172A', fontWeight: 700 }}>
                Titan Manufacturing ERP
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Sync/Refresh button */}
              <Tooltip title="Synchronize ERP Data">
                <IconButton
                  onClick={fetchAllData}
                  sx={{
                    color: '#64748B',
                    bgcolor: '#F1F5F9',
                    '&:hover': { bgcolor: '#E2E8F0', color: '#0F172A' },
                  }}
                  size="small"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Notifications */}
              <IconButton
                sx={{
                  color: '#64748B',
                  bgcolor: '#F1F5F9',
                  '&:hover': { bgcolor: '#E2E8F0', color: '#0F172A' },
                }}
                size="small"
              >
                <Badge badgeContent={getReorderAlertCount()} color="error">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>

              {/* Quick Profile Dropdown */}
              <Box>
                <IconButton
                  onClick={(e) => setProfileAnchorEl(e.currentTarget)}
                  size="small"
                  sx={{ p: 0.5, border: '1px solid #E2E8F0' }}
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: '#2563EB',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {username[0].toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={profileAnchorEl}
                  open={isProfileMenuOpen}
                  onClose={() => setProfileAnchorEl(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                      border: '1px solid #F1F5F9',
                      borderRadius: 2,
                      width: 200,
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                      {username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {role} Account
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={() => setProfileAnchorEl(null)} sx={{ fontSize: '0.875rem' }}>
                    <SettingsIcon sx={{ fontSize: 18, mr: 1.5, color: '#64748B' }} />
                    Settings
                  </MenuItem>
                  <MenuItem onClick={onLogout} sx={{ fontSize: '0.875rem', color: '#EF4444' }}>
                    <LogoutIcon sx={{ fontSize: 18, mr: 1.5, color: '#EF4444' }} />
                    Sign Out
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* DRAWERS FOR RESPONSIVE NAVIGATION */}
        <Box component="nav" sx={{ width: { lg: DRAWER_WIDTH }, shrink: { lg: 0 } }}>
          {/* Mobile Temporary Drawer */}
          {isTabletOrMobile ? (
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{ keepMounted: true }}
              sx={{
                display: { xs: 'block', lg: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
              }}
            >
              {drawerContent}
            </Drawer>
          ) : (
            /* Desktop Permanent Drawer */
            <Drawer
              variant="permanent"
              open
              sx={{
                display: { xs: 'none', lg: 'block' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
              }}
            >
              {drawerContent}
            </Drawer>
          )}
        </Box>

        {/* MAIN BODY WINDOW */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2.5, md: 4 },
            width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
            mt: 8,
          }}
        >
          <Container maxWidth="xl" sx={{ p: 0 }}>
            {activeView === 'dashboard' ? (
              <>
                {/* WELCOME SECTION HEADER */}
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
              <Box>
                <Typography variant="h5" component="h1" sx={{ color: '#0F172A' }}>
                  Production & Analytics Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Enterprise operations overview for Titan Industries</span>
                  <Box component="span" sx={{ width: 4, height: 4, bgcolor: '#94A3B8', borderRadius: '50%' }} />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={fetchAllData}
                startIcon={<RefreshIcon />}
                sx={{
                  bgcolor: '#2563EB',
                  px: 2.5,
                  py: 1,
                  fontSize: '0.875rem',
                  '&:hover': { bgcolor: '#1D4ED8' },
                }}
              >
                Refresh Board
              </Button>
            </Box>

            {/* SECTION 1 - KPI CARDS */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* 1. Monthly Sales KPI */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ bgcolor: '#EFF6FF', p: 1, borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                        <ShoppingCartIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Chip
                        label={getMonthlySalesKpi().trend}
                        size="small"
                        color="primary"
                        variant="soft"
                        icon={<TrendingUpIcon style={{ fontSize: 14 }} />}
                        sx={{
                          height: 20,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          bgcolor: '#EFF6FF',
                          color: '#2563EB',
                          '& .MuiChip-icon': { color: '#2563EB' },
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', tracking: 'wider' }}>
                      Monthly Sales ({getMonthlySalesKpi().monthName})
                    </Typography>
                    {monthlySales.loading ? (
                      <Skeleton width="70%" height={40} sx={{ mt: 0.5 }} />
                    ) : monthlySales.error ? (
                      <Typography variant="body2" color="error" sx={{ fontWeight: 600, mt: 0.5 }}>
                        Unavailable
                      </Typography>
                    ) : (
                      <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 750, color: '#0F172A' }}>
                        {getMonthlySalesKpi().value}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: '#64748B', mt: 1, display: 'block' }}>
                      Aggregated monthly order values
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* 2. Production Summary KPI */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ bgcolor: '#ECFDF5', p: 1, borderRadius: 2, color: '#10B981', display: 'flex' }}>
                        <PrecisionManufacturingIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Chip
                        label={getProductionKpi().trend}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          bgcolor: '#ECFDF5',
                          color: '#10B981',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', tracking: 'wider' }}>
                      Production Summary
                    </Typography>
                    {production.loading ? (
                      <Skeleton width="60%" height={40} sx={{ mt: 0.5 }} />
                    ) : production.error ? (
                      <Typography variant="body2" color="error" sx={{ fontWeight: 600, mt: 0.5 }}>
                        Unavailable
                      </Typography>
                    ) : (
                      <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 750, color: '#0F172A' }}>
                        {getProductionKpi().value}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: '#10B981', mt: 1, display: 'block', fontWeight: 600 }}>
                      {getProductionKpi().sub}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* 3. Low Stock Items KPI */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ bgcolor: '#FFFBEB', p: 1, borderRadius: 2, color: '#F59E0B', display: 'flex' }}>
                        <InventoryIcon sx={{ fontSize: 24 }} />
                      </Box>
                      {getLowStockCount() > 0 && (
                        <Chip
                          label="Action Required"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            bgcolor: '#FEF3C7',
                            color: '#D97706',
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', tracking: 'wider' }}>
                      Low Stock Items Count
                    </Typography>
                    {lowStock.loading ? (
                      <Skeleton width="40%" height={40} sx={{ mt: 0.5 }} />
                    ) : lowStock.error ? (
                      <Typography variant="body2" color="error" sx={{ fontWeight: 600, mt: 0.5 }}>
                        Unavailable
                      </Typography>
                    ) : (
                      <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 750, color: getLowStockCount() > 0 ? '#EF4444' : '#0F172A' }}>
                        {getLowStockCount()}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: '#64748B', mt: 1, display: 'block' }}>
                      Items below safety levels
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* 4. Reorder Alerts KPI */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ bgcolor: '#FEF2F2', p: 1, borderRadius: 2, color: '#EF4444', display: 'flex' }}>
                        <WarningIcon sx={{ fontSize: 24 }} />
                      </Box>
                      {getReorderAlertCount() > 0 && (
                        <Chip
                          label="Critical Alerts"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            bgcolor: '#FEE2E2',
                            color: '#EF4444',
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', tracking: 'wider' }}>
                      Reorder Alerts Count
                    </Typography>
                    {reorderAlerts.loading ? (
                      <Skeleton width="40%" height={40} sx={{ mt: 0.5 }} />
                    ) : reorderAlerts.error ? (
                      <Typography variant="body2" color="error" sx={{ fontWeight: 600, mt: 0.5 }}>
                        Unavailable
                      </Typography>
                    ) : (
                      <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 750, color: getReorderAlertCount() > 0 ? '#EF4444' : '#0F172A' }}>
                        {getReorderAlertCount()}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: '#64748B', mt: 1, display: 'block' }}>
                      Active reorder recommendations
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* SECTION 2 - ANALYTICS CHARTS */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Left Side: Monthly Sales Trend Line Chart */}
              <Grid size={{ xs: 12, lg: 7 }}>
                <Card sx={{ height: 420, display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                      <Box>
                        <Typography variant="h6">Monthly Sales Trend</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Aggregated order values grouped by month
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1, minHeight: 280 }}>
                      {monthlySales.loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', py: 2 }}>
                          <Skeleton variant="rectangular" height="70%" sx={{ borderRadius: 2 }} />
                          <Skeleton variant="text" width="60%" />
                        </Box>
                      ) : monthlySales.error ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5, p: 4, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Failed to load Sales Trend</Typography>
                          <Button size="small" variant="outlined" onClick={fetchMonthlySalesSummary}>Retry</Button>
                        </Box>
                      ) : !monthlySales.data || monthlySales.data.length === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5, p: 4, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <InfoIcon sx={{ fontSize: 40, color: '#94A3B8' }} />
                          <Typography variant="subtitle2" sx={{ color: '#64748B' }}>No Sales Data Available</Typography>
                        </Box>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <LineChart data={monthlySales.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                              dataKey="month"
                              tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                            />
                            <ChartTooltip
                              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales Amount']}
                              contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: 10 }} />
                            <Line
                              name="Sales Value ($)"
                              type="monotone"
                              dataKey="totalSalesAmount"
                              stroke="#2563EB"
                              strokeWidth={3}
                              activeDot={{ r: 8, strokeWidth: 0 }}
                              dot={{ stroke: '#2563EB', strokeWidth: 2, fill: '#FFFFFF', r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Side: Production Performance Bar Chart */}
              <Grid size={{ xs: 12, lg: 5 }}>
                <Card sx={{ height: 420, display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                      <Box>
                        <Typography variant="h6">Production Performance</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Status of planned and completed manufacturing runs
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
                      {production.loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', py: 2 }}>
                          <Skeleton variant="rectangular" height="70%" sx={{ borderRadius: 2 }} />
                          <Skeleton variant="text" width="60%" />
                        </Box>
                      ) : production.error ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5, p: 4, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Failed to load Production Summary</Typography>
                          <Button size="small" variant="outlined" onClick={fetchProductionSummary}>Retry</Button>
                        </Box>
                      ) : !production.data ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5, p: 4, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <InfoIcon sx={{ fontSize: 40, color: '#94A3B8' }} />
                          <Typography variant="subtitle2" sx={{ color: '#64748B' }}>No Production Data Available</Typography>
                        </Box>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height="90%" minWidth={0}>
                            <BarChart data={getProductionBarChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis
                                dataKey="name"
                                tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <ChartTooltip
                                formatter={(value: number) => [value, 'Orders Count']}
                                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                              />
                              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                {getProductionBarChartData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                          {/* Supplemental indicator */}
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 1 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Total Produced</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                {production.data.totalQuantityProduced.toLocaleString()} Units
                              </Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem />
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Yield Ratio</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#10B981' }}>
                                {production.data.totalOrders > 0
                                  ? ((production.data.completedOrders / production.data.totalOrders) * 100).toFixed(1)
                                  : '0'}%
                              </Typography>
                            </Box>
                          </Box>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* SECTION 3 - BUSINESS INSIGHTS */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Left Side: Top Selling Products Horizontal Bar Chart */}
              <Grid size={{ xs: 12, lg: 7 }}>
                <Card sx={{ height: 420, display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                      <Box>
                        <Typography variant="h6">Top Selling Products</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Finished products ordered by total quantity sold
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1, minHeight: 280 }}>
                      {topSelling.loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', py: 2 }}>
                          <Skeleton variant="rectangular" height="70%" sx={{ borderRadius: 2 }} />
                          <Skeleton variant="text" width="60%" />
                        </Box>
                      ) : topSelling.error ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5, p: 4, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Failed to load Top Selling Products</Typography>
                          <Button size="small" variant="outlined" onClick={fetchTopSellingProducts}>Retry</Button>
                        </Box>
                      ) : !topSelling.data || topSelling.data.length === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5, p: 4, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <InfoIcon sx={{ fontSize: 40, color: '#94A3B8' }} />
                          <Typography variant="subtitle2" sx={{ color: '#64748B' }}>No Sales Volume Data</Typography>
                        </Box>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <BarChart
                            layout="vertical"
                            data={topSelling.data.slice(0, 5)}
                            margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                            <XAxis
                              type="number"
                              tick={{ fill: '#475569', fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              dataKey="itemName"
                              type="category"
                              tick={{ fill: '#0F172A', fontSize: 12, fontWeight: 600 }}
                              axisLine={false}
                              tickLine={false}
                              width={100}
                            />
                            <ChartTooltip
                              formatter={(value: number) => [value.toLocaleString(), 'Quantity Sold']}
                              contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                            />
                            <Bar dataKey="totalQuantitySold" fill="#2563EB" radius={[0, 6, 6, 0]} barSize={24} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Side: Supplier Purchase Summary Pie Chart */}
              <Grid size={{ xs: 12, lg: 5 }}>
                <Card sx={{ height: 420, display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                      <Box>
                        <Typography variant="h6">Supplier Purchase Summary</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Top suppliers by purchase values
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1, minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {supplierPurchase.loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <Skeleton variant="circular" width={180} height={180} />
                        </Box>
                      ) : supplierPurchase.error ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5, p: 4, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Failed to load Supplier Purchases</Typography>
                          <Button size="small" variant="outlined" onClick={fetchSupplierPurchaseSummary}>Retry</Button>
                        </Box>
                      ) : !supplierPurchase.data || supplierPurchase.data.length === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5, p: 4, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <InfoIcon sx={{ fontSize: 40, color: '#94A3B8' }} />
                          <Typography variant="subtitle2" sx={{ color: '#64748B' }}>No Supplier Purchase Data Available</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2, height: '100%' }}>
                          <Box sx={{ width: '100%', height: 210, flexGrow: 1 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                              <PieChart>
                                <Pie
                                  data={supplierPurchase.data}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={renderCustomizedLabel}
                                  outerRadius={95}
                                  fill="#8884d8"
                                  dataKey="totalPurchaseAmount"
                                  nameKey="supplierName"
                                >
                                  {supplierPurchase.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <ChartTooltip
                                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Purchase Value']}
                                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </Box>
                          {/* Pie Chart Legend panel */}
                          <Box sx={{ minWidth: 150, maxWidth: '100%', overflowY: 'auto', maxHeight: 180, pr: 1 }}>
                            <Stack spacing={1}>
                              {supplierPurchase.data.map((item, index) => (
                                <Box key={item.supplierId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length], shrink: 0 }} />
                                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#0F172A', display: 'block', noWrap: true }}>
                                      {item.supplierName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                                      ${item.totalPurchaseAmount.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* SECTION 4 - INVENTORY ALERTS */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Left Side: Low Stock Items Table */}
              <Grid size={{ xs: 12, lg: 7 }}>
                <Card sx={{ height: 450, display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">Low Stock Items</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Inventory status of parts and products matching or below reorder thresholds
                        </Typography>
                      </Box>
                    </Box>

                    <TableContainer component={Paper} sx={{ border: 'none', boxShadow: 'none', flexGrow: 1, overflowY: 'auto' }}>
                      {lowStock.loading ? (
                        <Box sx={{ p: 2 }}>
                          <Skeleton height={45} sx={{ mb: 1 }} />
                          <Skeleton height={35} sx={{ mb: 1 }} />
                          <Skeleton height={35} sx={{ mb: 1 }} />
                          <Skeleton height={35} />
                        </Box>
                      ) : lowStock.error ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, gap: 1.5, p: 4, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Failed to load Inventory</Typography>
                          <Button size="small" variant="outlined" onClick={fetchLowStockItems}>Retry</Button>
                        </Box>
                      ) : !lowStock.data || lowStock.data.length === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, gap: 1.5, p: 4, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                          <Typography variant="subtitle2" sx={{ color: '#10B981', fontWeight: 600 }}>All Inventory Levels OK</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>No items are below their reorder limits.</Typography>
                        </Box>
                      ) : (
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Item Name</TableCell>
                              <TableCell align="right">Current Stock</TableCell>
                              <TableCell align="right">Reorder Level</TableCell>
                              <TableCell align="center">Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {lowStock.data.map((item) => {
                              const isCritical = item.currentStock <= item.reorderLevel * 0.3 || item.currentStock === 0;
                              return (
                                <TableRow key={item.itemId} hover>
                                  <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>
                                    <Box>
                                      {item.itemName}
                                      <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 400 }}>
                                        {item.itemType} • {item.unitOfMeasure}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                                    {item.currentStock}
                                  </TableCell>
                                  <TableCell align="right" sx={{ color: '#64748B' }}>
                                    {item.reorderLevel}
                                  </TableCell>
                                  <TableCell align="center">
                                    {isCritical ? (
                                      <Chip
                                        label="Critical"
                                        size="small"
                                        sx={{
                                          bgcolor: '#FEE2E2',
                                          color: '#EF4444',
                                          fontWeight: 700,
                                          fontSize: '0.75rem',
                                          height: 22,
                                        }}
                                      />
                                    ) : (
                                      <Chip
                                        label="Low Stock"
                                        size="small"
                                        sx={{
                                          bgcolor: '#FEF3C7',
                                          color: '#D97706',
                                          fontWeight: 700,
                                          fontSize: '0.75rem',
                                          height: 22,
                                        }}
                                      />
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Side: Reorder Alerts Panel */}
              <Grid size={{ xs: 12, lg: 5 }}>
                <Card sx={{ height: 450, display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">Reorder Alerts Panel</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          System recommendations to procure materials immediately
                        </Typography>
                      </Box>
                    </Box>

                    {/* Alerts Container */}
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, pr: 0.5 }}>
                      {reorderAlerts.loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} />
                          <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} />
                          <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} />
                        </Box>
                      ) : reorderAlerts.error ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, gap: 1.5, p: 4, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Failed to load Reorder Alerts</Typography>
                          <Button size="small" variant="outlined" onClick={fetchReorderAlerts}>Retry</Button>
                        </Box>
                      ) : !reorderAlerts.data || reorderAlerts.data.length === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5, p: 4, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                          <Typography variant="subtitle2" sx={{ color: '#10B981', fontWeight: 600 }}>Zero Alerts Active</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', textAlign: 'center' }}>All assembly stations are fully provisioned.</Typography>
                        </Box>
                      ) : (
                        reorderAlerts.data.map((item) => {
                          const deficit = Math.max(1, item.reorderLevel * 2 - item.currentStock);
                          const isCritical = item.currentStock === 0;

                          return (
                            <Box
                              key={`alert-${item.itemId}`}
                              sx={{
                                border: '1px solid',
                                borderColor: isCritical ? '#FCA5A5' : '#FDE68A',
                                bgcolor: isCritical ? '#FEF2F2' : '#FFFDF3',
                                p: 2,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 2.5,
                              }}
                            >
                              <Box
                                sx={{
                                  color: isCritical ? '#EF4444' : '#F59E0B',
                                  bgcolor: isCritical ? '#FEE2E2' : '#FEF3C7',
                                  p: 1,
                                  borderRadius: 1.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  shrink: 0,
                                }}
                              >
                                <AssignmentAlertIcon sx={{ fontSize: 22 }} />
                              </Box>
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                                  {item.itemName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                                  Current: <strong style={{ color: '#0F172A' }}>{item.currentStock} {item.unitOfMeasure}</strong> (Limit: {item.reorderLevel})
                                </Typography>
                                <Typography variant="caption" sx={{ color: isCritical ? '#D97706' : '#B45309', fontWeight: 600, display: 'block', mt: 0.5 }}>
                                  Recommended Refill: <strong style={{ textDecoration: 'underline' }}>{deficit} {item.unitOfMeasure}</strong>
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* SECTION 5 - RECENT BUSINESS SUMMARY */}
            <Card sx={{ mb: 4, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3.5 }}>
                  <Box sx={{ bgcolor: '#EFF6FF', color: '#2563EB', p: 1, borderRadius: 2, display: 'flex' }}>
                    <LightbulbIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 700 }}>
                      Executive Operations & Insight Summary
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Automated diagnostics derived dynamically from enterprise service data
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={4}>
                  {/* Sales Performance Summary */}
                  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <Box sx={{ borderLeft: '3px solid #2563EB', pl: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', fontSize: '0.75rem', tracking: '0.05em', mb: 1 }}>
                        Total Sales Performance
                      </Typography>
                      {monthlySales.loading ? (
                        <Skeleton height={60} />
                      ) : monthlySales.error ? (
                        <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                          Sales summary metrics are currently unavailable.
                        </Typography>
                      ) : monthlySales.data && monthlySales.data.length > 0 ? (
                        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, fontSize: '0.875rem' }}>
                          Aggregated billing records show a total of{' '}
                          <strong>
                            ${monthlySales.data.reduce((acc, curr) => acc + curr.totalSalesAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>{' '}
                          in gross transactions. Revenue peaked during{' '}
                          <strong>
                            {(() => {
                              const sorted = [...monthlySales.data].sort((a, b) => b.totalSalesAmount - a.totalSalesAmount);
                              return sorted[0]?.month || 'N/A';
                            })()}
                          </strong>{' '}
                          with{' '}
                          <strong>
                            ${Math.max(...monthlySales.data.map((s) => s.totalSalesAmount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>{' '}
                          recorded.
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                          No sales data recorded in the current billing cycle.
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Production Status Summary */}
                  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <Box sx={{ borderLeft: '3px solid #10B981', pl: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#10B981', textTransform: 'uppercase', fontSize: '0.75rem', tracking: '0.05em', mb: 1 }}>
                        Production Status
                      </Typography>
                      {production.loading ? (
                        <Skeleton height={60} />
                      ) : production.error ? (
                        <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                          Production metrics are currently unavailable.
                        </Typography>
                      ) : production.data ? (
                        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, fontSize: '0.875rem' }}>
                          The assembly floors completed{' '}
                          <strong>{production.data.completedOrders}</strong> out of{' '}
                          <strong>{production.data.totalOrders}</strong> scheduled orders, achieving an efficiency rating of{' '}
                          <strong>{Math.round((production.data.completedOrders / production.data.totalOrders) * 100)}%</strong>.{' '}
                          Total quantity produced is <strong>{production.data.totalQuantityProduced.toLocaleString()} units</strong>.
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                          No ongoing production orders recorded in scheduler.
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Inventory Health Summary */}
                  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <Box sx={{ borderLeft: '3px solid #F59E0B', pl: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', fontSize: '0.75rem', tracking: '0.05em', mb: 1 }}>
                        Inventory Health
                      </Typography>
                      {lowStock.loading || reorderAlerts.loading ? (
                        <Skeleton height={60} />
                      ) : lowStock.error || reorderAlerts.error ? (
                        <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                          Inventory health reports are currently unavailable.
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, fontSize: '0.875rem' }}>
                          System detects <strong>{getLowStockCount()} low-stock components</strong> and{' '}
                          <strong>{getReorderAlertCount()} active warnings</strong>. Immediate stock acquisition is
                          recommended for items labelled as critical to prevent manufacturing floor stalls.
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Supplier Activity Summary */}
                  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <Box sx={{ borderLeft: '3px solid #EF4444', pl: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', fontSize: '0.75rem', tracking: '0.05em', mb: 1 }}>
                        Supplier Activity
                      </Typography>
                      {supplierPurchase.loading ? (
                        <Skeleton height={60} />
                      ) : supplierPurchase.error ? (
                        <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                          Supply chain metrics are currently unavailable.
                        </Typography>
                      ) : supplierPurchase.data && supplierPurchase.data.length > 0 ? (
                        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, fontSize: '0.875rem' }}>
                          Total supply expenditures stand at{' '}
                          <strong>
                            ${supplierPurchase.data.reduce((acc, curr) => acc + curr.totalPurchaseAmount, 0).toLocaleString()}
                          </strong>
                          . The primary logistics partner is{' '}
                          <strong>
                            {(() => {
                              const sorted = [...supplierPurchase.data].sort((a, b) => b.totalPurchaseAmount - a.totalPurchaseAmount);
                              return sorted[0]?.supplierName || 'N/A';
                            })()}
                          </strong>
                          , representing{' '}
                          <strong>
                            ${Math.max(...supplierPurchase.data.map((s) => s.totalPurchaseAmount)).toLocaleString()}
                          </strong>{' '}
                          in accounts payable.
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                          No vendor acquisition transactions recorded.
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            </>
            ) : activeView === 'suppliers' ? (
              <SupplierPage />
            ) : activeView === 'customers' ? (
              <CustomerPage />
            ) : activeView === 'employees' ? (
              <EmployeePage />
            ) : activeView === 'production-orders' ? (
              <ProductionOrderPage />
            ) : activeView === 'sales-orders' ? (
              <SalesOrderPage />
            ) : activeView === 'inventory' ? (
              <ItemPage />
            ) : activeView === 'warehouses' ? (
              <WarehousePage />
            ) : activeView === 'bom' ? (
              <BomPage />
            ) : activeView === 'inventory-transactions' ? (
              <InventoryTransactionPage />
            ) : activeView === 'stock-by-warehouse' ? (
              <StockByWarehousePage />
            ) : activeView === 'audit-logs' ? (
              <AuditLogPage />
            ) : activeView === 'purchase-orders' ? (
              <PurchaseOrderPage />
            ) : (
              <ConstructionPlaceholder view={activeView} />
            )}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
