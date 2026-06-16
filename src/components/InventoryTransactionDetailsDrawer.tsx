import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Button,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotesIcon from '@mui/icons-material/Notes';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MoveUpIcon from '@mui/icons-material/MoveUp';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TuneIcon from '@mui/icons-material/Tune';
import FactoryIcon from '@mui/icons-material/Factory';
import { InventoryTransaction } from './inventoryTransactionService';

interface InventoryTransactionDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  transaction: InventoryTransaction | null;
}

export default function InventoryTransactionDetailsDrawer({
  open,
  onClose,
  transaction,
}: InventoryTransactionDetailsDrawerProps) {
  if (!transaction) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getTransactionTypeChip = (type: string) => {
    let color = '#2563EB'; // Primary Blue
    let bgcolor = '#DBEAFE';
    let borderColor = '#BFDBFE';
    let icon = <SwapHorizIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />;

    if (type === 'Goods Receipt' || type === 'Production Output' || type === 'Stock In') {
      color = '#16A34A'; // Success Green
      bgcolor = '#DCFCE7';
      borderColor = '#BBF7D0';
      icon = type === 'Production Output' 
        ? <FactoryIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: '#16A34A' }} /> 
        : <MoveDownIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: '#16A34A' }} />;
    } else if (type === 'Goods Issue' || type === 'Production Consumption' || type === 'Stock Out') {
      color = '#DC2626'; // Danger Red
      bgcolor = '#FEE2E2';
      borderColor = '#FECACA';
      icon = type === 'Production Consumption'
        ? <FactoryIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: '#DC2626' }} />
        : <MoveUpIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: '#DC2626' }} />;
    } else if (type === 'Adjustment') {
      color = '#D97706'; // Warning Orange
      bgcolor = '#FEF3C7';
      borderColor = '#FDE68A';
      icon = <TuneIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: '#D97706' }} />;
    } else if (type === 'Transfer') {
      color = '#2563EB';
      bgcolor = '#DBEAFE';
      borderColor = '#BFDBFE';
      icon = <SwapHorizIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: '#2563EB' }} />;
    }

    return (
      <Chip
        icon={icon}
        label={type}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.75rem',
          color: color,
          bgcolor: bgcolor,
          border: `1px solid ${borderColor}`,
          height: 26,
          '& .MuiChip-icon': {
            marginLeft: '4px',
            color: 'inherit',
          }
        }}
      />
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 460 },
            boxShadow: '-4px 0 15px -3px rgba(0, 0, 0, 0.05)',
            borderLeft: '1px solid #E2E8F0',
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F8FAFC' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                bgcolor: '#EFF6FF',
                color: '#2563EB',
                borderRadius: 2,
                p: 1,
                display: 'flex',
              }}
            >
              <InventoryIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                Transaction Details
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                ID: #TRN-{transaction.transactionId?.toString().padStart(5, '0')}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#64748B' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          <Stack spacing={3}>
            {/* Status & Name Card */}
            <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={`REF: ${transaction.referenceNumber}`}
                    size="small"
                    sx={{
                      fontWeight: 750,
                      fontSize: '0.75rem',
                      color: '#475569',
                      bgcolor: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      fontFamily: 'monospace',
                    }}
                  />
                  {getTransactionTypeChip(transaction.uiTransactionType)}
                </Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5, fontWeight: 600 }}>
                  STOCK ITEM
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 850, color: '#0F172A', mb: 1 }}>
                  {transaction.itemName}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Item DB Record ID: #{transaction.itemId}
                </Typography>
              </CardContent>
            </Card>

            {/* Section 1: Transaction Information */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#475569',
                  fontWeight: 700,
                  mb: 1.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <AssignmentIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Transaction Properties
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Quantity
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 800, 
                          color: transaction.transactionType === 'Stock In' ? '#16A34A' : '#DC2626' 
                        }}
                      >
                        {transaction.transactionType === 'Stock In' ? '+' : '-'}{transaction.quantity} Units
                      </Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Core Operations
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {transaction.transactionType === 'Stock In' ? 'Stock In (Addition)' : 'Stock Out (Deduction)'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Divider />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Warehouse Location
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarehouseIcon sx={{ fontSize: 18, color: '#2563EB' }} />
                        {transaction.warehouseName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 3.2, display: 'block' }}>
                        Warehouse DB Record ID: #{transaction.warehouseId}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Section 2: Notes / Description */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#475569',
                  fontWeight: 700,
                  mb: 1.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <NotesIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Transaction Notes
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="body2" sx={{ color: '#334155', fontStyle: transaction.notes ? 'normal' : 'italic', whiteSpace: 'pre-wrap' }}>
                    {transaction.notes || 'No operator comments or notes provided for this transaction.'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Section 3: System / Audit Trail */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#475569',
                  fontWeight: 700,
                  mb: 1.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 18, color: '#64748B' }} />
                System Audit Details
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Created Date & Time
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon sx={{ fontSize: 16, color: '#64748B' }} />
                        {formatDate(transaction.transactionDate)}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Divider />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Operator / Created By
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: '#64748B' }} />
                        {transaction.employeeName || 'System Automated Entry'}
                      </Typography>
                      {transaction.employeeId && (
                        <Typography variant="caption" color="textSecondary" sx={{ ml: 2.8, display: 'block' }}>
                          Employee DB Record ID: #{transaction.employeeId}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2.5, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={onClose}
            variant="outlined"
            fullWidth
            sx={{
              color: '#475569',
              borderColor: '#E2E8F0',
              textTransform: 'none',
              fontWeight: 600,
              py: 1,
              '&:hover': {
                bgcolor: '#F8FAFC',
                borderColor: '#CBD5E1',
              },
            }}
          >
            Close Details
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
