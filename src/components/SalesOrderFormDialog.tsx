import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  CircularProgress,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { SalesOrder, SalesOrderInput, SalesOrderItem, DropdownItem } from './salesOrderService';

interface SalesOrderFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (orderInput: SalesOrderInput) => Promise<void>;
  order: SalesOrder | null;
  saving: boolean;
  customers: DropdownItem[];
  employees: DropdownItem[];
  finishedProducts: any[];
}

interface FormErrors {
  customerId?: string;
  employeeId?: string;
  orderDate?: string;
  items?: string;
}

export default function SalesOrderFormDialog({
  open,
  onClose,
  onSave,
  order,
  saving,
  customers,
  employees,
  finishedProducts,
}: SalesOrderFormDialogProps) {
  const isEditMode = order !== null;

  // Form states
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [orderDate, setOrderDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');
  
  // Sales order items list state
  const [items, setItems] = useState<SalesOrderItem[]>([
    { finishedProductId: 0, quantity: 1, unitPrice: 0 }
  ]);

  const [errors, setErrors] = useState<FormErrors>({});

  // Reset/populate form
  useEffect(() => {
    if (open) {
      if (order) {
        setCustomerId(order.customerId || '');
        setEmployeeId(order.employeeId || '');
        setOrderDate(order.orderDate ? order.orderDate.substring(0, 16) : '');
        setDeliveryDate(
          order.orderStatus?.toUpperCase() === 'DELIVERED'
            ? new Date().toISOString().substring(0, 16)
            : ''
        );
        setStatus(order.orderStatus || 'Pending');
        setNotes('');
        setItems(
          order.salesOrderItems && order.salesOrderItems.length > 0
            ? order.salesOrderItems.map(i => ({
                salesOrderItemId: i.salesOrderItemId,
                finishedProductId: i.finishedProductId,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
              }))
            : [{ finishedProductId: 0, quantity: 1, unitPrice: 0 }]
        );
      } else {
        setCustomerId('');
        setEmployeeId('');
        const now = new Date();
        setOrderDate(now.toISOString().substring(0, 16));
        setDeliveryDate('');
        setStatus('Pending');
        setNotes('');
        setItems([{ finishedProductId: 0, quantity: 1, unitPrice: 0 }]);
      }
      setErrors({});
    }
  }, [open, order]);

  // Financial calculations
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.1; // 10% standard tax
  const grandTotal = subtotal + tax;

  // Items grid actions
  const handleAddItemLine = () => {
    setItems([...items, { finishedProductId: 0, quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItemLine = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleItemFieldChange = (index: number, field: keyof SalesOrderItem, value: number) => {
    const updated = [...items];
    
    if (field === 'finishedProductId') {
      updated[index].finishedProductId = value;
      // Auto-populate unit price from finishedProducts list if available
      const prod = finishedProducts.find(p => (p.itemId || p.id) === value);
      if (prod) {
        updated[index].unitPrice = Number(prod.price || prod.unitPrice || 0);
      }
    } else {
      updated[index][field] = value;
    }
    setItems(updated);
  };

  // Validations
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!customerId) {
      newErrors.customerId = 'Customer selection is required';
    }
    if (!employeeId) {
      newErrors.employeeId = 'Sales representative is required';
    }
    if (!orderDate) {
      newErrors.orderDate = 'Order date is required';
    }

    // Items validation
    const invalidItems = items.some(
      i => !i.finishedProductId || i.quantity <= 0 || i.unitPrice < 0
    );
    if (items.length === 0) {
      newErrors.items = 'At least one order item is required';
    } else if (invalidItems) {
      newErrors.items = 'Please ensure all items have a selected product, positive quantity, and non-negative price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const inputPayload: SalesOrderInput = {
      customerId: Number(customerId),
      employeeId: Number(employeeId),
      orderDate: new Date(orderDate).toISOString(),
      orderStatus: status,
      salesOrderItems: items.map(i => ({
        salesOrderItemId: i.salesOrderItemId,
        finishedProductId: Number(i.finishedProductId),
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      })),
      // Automatically record initial downpayment for demonstration if not provided
      payments: order?.payments || [],
    };

    await onSave(inputPayload);
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          sx: {
            borderRadius: 2,
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, borderBottom: '1px solid #E2E8F0' }}>
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
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {isEditMode ? 'Edit Sales Order' : 'Create Sales Order'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 3 }}>
        <Stack spacing={3.5} sx={{ mt: 1 }}>
          {/* Section 1: Customer Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Customer & Agent Details
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required error={!!errors.customerId}>
                  <InputLabel id="cust-select-label">Customer</InputLabel>
                  <Select
                    labelId="cust-select-label"
                    value={customerId}
                    label="Customer"
                    onChange={(e) => setCustomerId(e.target.value as number)}
                    disabled={saving}
                  >
                    {customers.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.customerId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.8 }}>
                      {errors.customerId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required error={!!errors.employeeId}>
                  <InputLabel id="agent-select-label">Sales Representative</InputLabel>
                  <Select
                    labelId="agent-select-label"
                    value={employeeId}
                    label="Sales Representative"
                    onChange={(e) => setEmployeeId(e.target.value as number)}
                    disabled={saving}
                  >
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.employeeId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.8 }}>
                      {errors.employeeId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Section 2: Order Details */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Order Scheduling & Status
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  required
                  fullWidth
                  type="datetime-local"
                  label="Order Date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  error={!!errors.orderDate}
                  helperText={errors.orderDate}
                  disabled={saving}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel id="order-status-select-label">Order Status</InputLabel>
                  <Select
                    labelId="order-status-select-label"
                    value={status}
                    label="Order Status"
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={saving}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Delivered">Delivered</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Delivery Date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  disabled={saving || status !== 'Delivered'}
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Only for Shipped Orders"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Section 3: Line Items */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Order Line Items
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddItemLine}
                disabled={saving}
                sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#475569' }}
              >
                Add Product Line
              </Button>
            </Box>

            {errors.items && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {errors.items}
              </Alert>
            )}

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#E2E8F0', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Product Name</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 120 }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 140 }}>Unit Price ($)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 140 }}>Subtotal</TableCell>
                    <TableCell align="center" sx={{ width: 60 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => {
                    const prodSub = item.quantity * item.unitPrice;
                    return (
                      <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        {/* Finished Product Selector */}
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={item.finishedProductId || ''}
                              onChange={(e) => handleItemFieldChange(index, 'finishedProductId', Number(e.target.value))}
                              disabled={saving}
                              displayEmpty
                            >
                              <MenuItem value="" disabled>Select a finished product</MenuItem>
                              {finishedProducts.map((p) => (
                                <MenuItem key={p.itemId || p.id} value={p.itemId || p.id}>
                                  {p.itemName || p.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>

                        {/* Quantity */}
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemFieldChange(index, 'quantity', Number(e.target.value))}
                            disabled={saving}
                            slotProps={{
                              htmlInput: { min: 1, style: { textAlign: 'right' } }
                            }}
                          />
                        </TableCell>

                        {/* Unit Price */}
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemFieldChange(index, 'unitPrice', Number(e.target.value))}
                            disabled={saving}
                            slotProps={{
                              htmlInput: { min: 0, step: '0.01', style: { textAlign: 'right' } }
                            }}
                          />
                        </TableCell>

                        {/* Subtotal */}
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            ${prodSub.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </TableCell>

                        {/* Remove button */}
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveItemLine(index)}
                            disabled={saving || items.length === 1}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Divider />

          {/* Section 4: Summary Totals */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Paper variant="outlined" sx={{ p: 2.5, width: 320, borderRadius: 2, bgcolor: '#F8FAFC', borderColor: '#E2E8F0' }}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Subtotal</Typography>
                </Grid>
                <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 600 }}>
                    ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Estimated Tax (10%)</Typography>
                </Grid>
                <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 600 }}>
                    ${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 0.5 }} />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" sx={{ color: '#0F172A', fontWeight: 750 }}>Grand Total</Typography>
                </Grid>
                <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" sx={{ color: '#2563EB', fontWeight: 800 }}>
                    ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid #E2E8F0', gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={saving}
          variant="outlined"
          sx={{
            color: '#64748B',
            borderColor: '#E2E8F0',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              bgcolor: '#F8FAFC',
              borderColor: '#CBD5E1',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving}
          variant="contained"
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
            minWidth: 100,
          }}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
