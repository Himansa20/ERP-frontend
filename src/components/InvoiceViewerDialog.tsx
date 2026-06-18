import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Grid,
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
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { salesOrderService, SalesOrder, SalesInvoice, DropdownItem } from './salesOrderService';

interface InvoiceViewerDialogProps {
  open: boolean;
  onClose: () => void;
  order: SalesOrder | null;
  customers: DropdownItem[];
  productsMap: Record<number, string>;
}

export default function InvoiceViewerDialog({
  open,
  onClose,
  order,
  customers,
  productsMap,
}: InvoiceViewerDialogProps) {
  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!open || !order) return;
      setLoading(true);
      setError(null);
      try {
        const data = await salesOrderService.generateInvoice(order.salesOrderId);
        setInvoice(data);
      } catch (err: any) {
        console.error('Invoice retrieval failed:', err);
        setError('Failed to fetch invoice. Please ensure this order is valid and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [open, order]);

  if (!order) return null;

  const customerObj = customers.find(c => c.id === order.customerId);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Simulate PDF generation/download
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(invoice, null, 2)], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `invoice_${invoice?.invoiceNumber || 'draft'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getInvoiceStatusColor = (statusStr?: string) => {
    const status = statusStr || 'Unpaid';
    switch (status.toUpperCase()) {
      case 'PAID':
        return { color: '#16A34A', bgcolor: '#DCFCE7', border: '#BBF7D0' };
      case 'PARTIAL':
        return { color: '#D97706', bgcolor: '#FEF3C7', border: '#FDE68A' };
      case 'UNPAID':
      default:
        return { color: '#DC2626', bgcolor: '#FEE2E2', border: '#FECACA' };
    }
  };

  const statusStyles = getInvoiceStatusColor(invoice?.status);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            p: 1.5,
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: '#EEF2FF', color: '#6366F1', p: 1, borderRadius: 2, display: 'flex' }}>
            <ReceiptIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
            Customer Tax Invoice
          </Typography>
        </Box>
        <Button onClick={onClose} size="small" sx={{ color: '#64748B' }} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogTitle>

      <DialogContent sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
            <CircularProgress size={36} />
            <Typography variant="body2" sx={{ color: '#64748B' }}>Generating invoice layout...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1 }}>
            <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>{error}</Typography>
            <Button variant="outlined" size="small" onClick={onClose} sx={{ mt: 1 }}>Dismiss</Button>
          </Box>
        ) : invoice ? (
          <Box sx={{ p: 1 }}>
            {/* Top row: Company Details & Invoice Number */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563EB', mb: 0.5 }}>
                  BLUEWHALE MFG CORP
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  100 Industrial Parkway, Suite A
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  Detroit, MI 48201
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  Support: billing@bluewhale.com
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                  INVOICE: #{invoice.invoiceNumber}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mb: 1 }}>
                  Date: {invoice.orderDate ? new Date(invoice.orderDate).toLocaleDateString() : new Date().toLocaleDateString()}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                  <Box
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: statusStyles.color,
                      bgcolor: statusStyles.bgcolor,
                      border: `1px solid ${statusStyles.border}`,
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.4,
                      display: 'inline-block',
                    }}
                  >
                    {invoice.status?.toUpperCase() || 'UNPAID'}
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Bill To & Order Info */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#475569', mb: 1, textTransform: 'uppercase' }}>
                  Bill To
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                  {customerObj?.name || `Customer #${invoice.customerId}`}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  Email: {customerObj?.email || 'N/A'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  Phone: {customerObj?.phone || 'N/A'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5, whiteSpace: 'pre-line' }}>
                  Address: {customerObj?.address || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#475569', mb: 1, textTransform: 'uppercase' }}>
                  Sales Reference
                </Typography>
                <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 600 }}>
                  Sales Order Ref: #{invoice.salesOrderId}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  Fulfillment Status: {order.orderStatus}
                </Typography>
              </Grid>
            </Grid>

            {/* Items Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#E2E8F0', overflow: 'hidden', mb: 4 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Item Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 130 }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 130 }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(order.salesOrderItems || []).map((item, index) => {
                    const qty = Number(item.quantity || 0);
                    const price = Number(item.unitPrice || 0);
                    return (
                      <TableRow key={index}>
                        <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>
                          {productsMap[Number(item.finishedProductId)] || `Finished Product #${item.finishedProductId}`}
                        </TableCell>
                        <TableCell align="right">{qty.toLocaleString()}</TableCell>
                        <TableCell align="right">${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          ${(qty * price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals Summary */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ width: 280 }}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>Invoice Total</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      ${Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#16A34A' }}>Amount Collected</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                      -${Number(invoice.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>Balance Due</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#DC2626' }}>
                      ${Number(invoice.balanceAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0', gap: 1 }}>
        <Button
          onClick={handlePrint}
          variant="outlined"
          startIcon={<PrintIcon />}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#475569', borderColor: '#CBD5E1' }}
        >
          Print Invoice
        </Button>
        <Button
          onClick={handleDownloadPDF}
          variant="outlined"
          startIcon={<DownloadIcon />}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#475569', borderColor: '#CBD5E1' }}
        >
          Download PDF
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ bgcolor: '#2563EB', textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { bgcolor: '#1D4ED8', boxShadow: 'none' } }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
