import React from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaidIcon from '@mui/icons-material/Paid';
import { SalesOrder, DropdownItem } from './salesOrderService';

interface SalesOrderDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  order: SalesOrder | null;
  customers: DropdownItem[];
  employeesMap: Record<number, string>;
  productsMap: Record<number, string>;
}

export default function SalesOrderDetailsDrawer({
  open,
  onClose,
  order,
  customers,
  employeesMap,
  productsMap,
}: SalesOrderDetailsDrawerProps) {
  if (!order) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const status = order.orderStatus || 'Pending';
  const isDelivered = status.toUpperCase() === 'DELIVERED';
  const isCancelled = status.toUpperCase() === 'CANCELLED';

  const customerObj = customers.find(c => c.id === order.customerId);
  const repName = employeesMap[Number(order.employeeId)] || `Agent #${order.employeeId}`;

  // Payments calculations
  const total = Number(order.totalAmount || 0);
  const paid = (order.payments || []).reduce((sum, p) => sum + Number(p.paymentAmount || 0), 0);
  const balance = Math.max(total - paid, 0);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 500 },
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
              <ShoppingCartIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                Sales Order Details
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                Order ID: #{order.salesOrderId}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#64748B' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          <Stack spacing={3.5}>
            {/* Status overview */}
            <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 600, mb: 0.5 }}>
                      ORDER STATUS
                    </Typography>
                    <Chip
                      label={status}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: isDelivered ? '#16A34A' : isCancelled ? '#DC2626' : '#D97706',
                        bgcolor: isDelivered ? '#DCFCE7' : isCancelled ? '#FEE2E2' : '#FEF3C7',
                        border: `1px solid ${isDelivered ? '#BBF7D0' : isCancelled ? '#FECACA' : '#FDE68A'}`,
                      }}
                    />
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 600, mb: 0.5 }}>
                      PAYMENT STATUS
                    </Typography>
                    <Chip
                      label={paid >= total ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: paid >= total ? '#16A34A' : paid > 0 ? '#D97706' : '#DC2626',
                        bgcolor: paid >= total ? '#DCFCE7' : paid > 0 ? '#FEF3C7' : '#FEE2E2',
                        border: `1px solid ${paid >= total ? '#BBF7D0' : paid > 0 ? '#FDE68A' : '#FECACA'}`,
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Section 1: Customer Info */}
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
                <PersonIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Customer & Agent Info
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Customer Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {customerObj?.name || `Customer #${order.customerId}`}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Email
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {customerObj?.email || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Phone
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {customerObj?.phone || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Sales Representative
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {repName}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Section 2: Order Items Table */}
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
                <ReceiptLongIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Fulfillment Items List
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Product Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 80 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(order.salesOrderItems || []).map((item, index) => {
                      const qty = Number(item.quantity || 0);
                      const price = Number(item.unitPrice || 0);
                      return (
                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 500, color: '#0F172A' }}>
                            {productsMap[Number(item.finishedProductId)] || `Product #${item.finishedProductId}`}
                          </TableCell>
                          <TableCell align="right">{qty}</TableCell>
                          <TableCell align="right">${price.toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            ${(qty * price).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Section 3: Financial Summary */}
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
                <PaidIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Financial Ledger
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Total Invoice Amount</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 750, color: '#0F172A' }}>
                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#16A34A' }}>Total Payments Collected</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 750, color: '#16A34A' }}>
                        ${paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: balance > 0 ? '#DC2626' : '#64748B' }}>Open Balance Due</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 750, color: balance > 0 ? '#DC2626' : '#475569' }}>
                        ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {/* Section 4: Scheduling / Shipping Log */}
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
                <LocalShippingIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Delivery Tracking Logs
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Booking Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {formatDate(order.orderDate)}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Fulfillment Dispatch
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDelivered ? '#16A34A' : '#64748B' }}>
                        {isDelivered ? 'Dispatched & Delivered' : 'Pending Warehouse Dispatch'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Customer Shipping Address
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', whiteSpace: 'pre-line' }}>
                        {customerObj?.address || 'N/A'}
                      </Typography>
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
            Close Profile
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
