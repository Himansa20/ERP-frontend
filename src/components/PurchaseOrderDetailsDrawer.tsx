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
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaidIcon from '@mui/icons-material/Paid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { PurchaseOrder, DropdownItem } from './purchaseOrderService';
import { formatCurrency } from '../utils/currency';

interface PurchaseOrderDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  suppliers: DropdownItem[];
  itemsMap: Record<number, string>;
}

export default function PurchaseOrderDetailsDrawer({
  open,
  onClose,
  order,
  suppliers,
  itemsMap,
}: PurchaseOrderDetailsDrawerProps) {
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

  const status = (order.status || 'DRAFT').toUpperCase();
  const poNum = order.poNumber || `PO-${String(order.purchaseOrderId || order.id).padStart(4, '0')}`;
  
  const supplierObj = suppliers.find(s => s.id === order.supplierId);

  // Financial calculations
  const items = order.purchaseOrderItems || [];
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * 0.1; // 10% standard tax
  const grandTotal = subtotal + tax;

  const getStatusChip = (statusStr: string) => {
    let label = 'DRAFT';
    let color = '#475569';
    let bgcolor = '#F1F5F9';
    let border = '#E2E8F0';

    if (statusStr === 'PENDING_APPROVAL') {
      label = 'Pending Approval';
      color = '#D97706';
      bgcolor = '#FEF3C7';
      border = '#FDE68A';
    } else if (statusStr === 'APPROVED') {
      label = 'Approved';
      color = '#16A34A';
      bgcolor = '#DCFCE7';
      border = '#BBF7D0';
    } else if (statusStr === 'REJECTED') {
      label = 'Rejected';
      color = '#DC2626';
      bgcolor = '#FEE2E2';
      border = '#FECACA';
    } else if (statusStr === 'RECEIVED') {
      label = 'Received';
      color = '#2563EB';
      bgcolor = '#EFF6FF';
      border = '#BFDBFE';
    }

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.75rem',
          color,
          bgcolor,
          border: `1px solid ${border}`,
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
                Purchase Order Details
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                PO Number: {poNum}
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
            {/* Status Card */}
            <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 600, mb: 0.5 }}>
                      ORDER STATUS
                    </Typography>
                    {getStatusChip(status)}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 600, mb: 0.5 }}>
                      TOTAL VALUE
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#2563EB' }}>
                      {formatCurrency(grandTotal)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Section 1: Purchase Order Details */}
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
                Purchase Order Details
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        PO Number
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {poNum}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Order Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {formatDate(order.orderDate || order.createdDate)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Expected Delivery Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {formatDate(order.expectedDate)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Created Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {formatDate(order.createdDate || order.orderDate)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Notes / Instructions
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', fontStyle: order.notes ? 'normal' : 'italic' }}>
                        {order.notes || 'No notes provided for this purchase order.'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Section 2: Supplier Information */}
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
                Supplier Information
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Supplier Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {supplierObj?.name || order.supplierName || `Supplier #${order.supplierId}`}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Contact Person
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {supplierObj?.phone || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Email
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {supplierObj?.email || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Supplier Address
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        {supplierObj?.address || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Section 3: Order Items Table */}
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
                Order Items
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Item</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 70 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 90 }}>Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => {
                      const qty = Number(item.quantity || 0);
                      const price = Number(item.unitPrice || 0);
                      const total = qty * price;
                      return (
                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 500, color: '#0F172A' }}>
                            {itemsMap[Number(item.rawMaterialId)] || `Item #${item.rawMaterialId}`}
                            {item.description && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#64748B' }}>
                                {item.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{qty}</TableCell>
                          <TableCell align="right">{formatCurrency(price)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatCurrency(total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Section 4: Financial Summary */}
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
                Financial Summary
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Subtotal</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {formatCurrency(subtotal)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Tax (10%)</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {formatCurrency(tax)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 600 }}>Grand Total</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#2563EB' }}>
                        {formatCurrency(grandTotal)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {/* Section 5: Approval Information */}
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
                <CheckCircleIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Approval Information
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Created By
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {order.createdBy || 'System User'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Last Updated By
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {order.createdBy || 'System User'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Last Updated Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {formatDate(order.lastUpdatedDate || order.orderDate)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Approval Authority
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        ERP Procurement Manager
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
            Close Drawer
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
