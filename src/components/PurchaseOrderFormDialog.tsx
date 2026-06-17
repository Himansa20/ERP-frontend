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
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { PurchaseOrder, PurchaseOrderInput, PurchaseOrderItem, DropdownItem } from './purchaseOrderService';

interface PurchaseOrderFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (orderInput: PurchaseOrderInput) => Promise<void>;
  order: PurchaseOrder | null;
  saving: boolean;
  suppliers: DropdownItem[];
  itemsOptions: any[];
}

interface FormErrors {
  supplierId?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  items?: string;
}

export default function PurchaseOrderFormDialog({
  open,
  onClose,
  onSave,
  order,
  saving,
  suppliers,
  itemsOptions,
}: PurchaseOrderFormDialogProps) {
  const isEditMode = order !== null;

  // Form states
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [orderDate, setOrderDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  
  // Items table state
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    { itemId: 0, quantity: 1, unitPrice: 0, description: '' }
  ]);

  const [errors, setErrors] = useState<FormErrors>({});

  // Reset/populate form
  useEffect(() => {
    if (open) {
      if (order) {
        setSupplierId(order.supplierId || '');
        setOrderDate(order.orderDate ? order.orderDate.substring(0, 16) : '');
        setExpectedDeliveryDate(order.expectedDeliveryDate ? order.expectedDeliveryDate.substring(0, 16) : '');
        setNotes(order.notes || '');
        setItems(
          order.purchaseOrderItems && order.purchaseOrderItems.length > 0
            ? order.purchaseOrderItems.map(i => ({
                purchaseOrderItemId: i.purchaseOrderItemId,
                itemId: i.itemId,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
                description: i.description || '',
              }))
            : [{ itemId: 0, quantity: 1, unitPrice: 0, description: '' }]
        );
      } else {
        setSupplierId('');
        const now = new Date();
        setOrderDate(now.toISOString().substring(0, 16));
        
        // Default expected date to 7 days in future
        const exp = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        setExpectedDeliveryDate(exp.toISOString().substring(0, 16));
        
        setNotes('');
        setItems([{ itemId: 0, quantity: 1, unitPrice: 0, description: '' }]);
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
    setItems([...items, { itemId: 0, quantity: 1, unitPrice: 0, description: '' }]);
  };

  const handleRemoveItemLine = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleItemFieldChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updated = [...items];
    
    if (field === 'itemId') {
      const selectedId = Number(value);
      updated[index].itemId = selectedId;
      // Auto-populate description and price from itemsOptions list if available
      const itemOpt = itemsOptions.find(i => (i.itemId || i.id) === selectedId);
      if (itemOpt) {
        updated[index].description = itemOpt.description || itemOpt.itemName || '';
        updated[index].unitPrice = Number(itemOpt.standardCost || itemOpt.price || 0);
      }
    } else if (field === 'quantity') {
      updated[index].quantity = Number(value);
    } else if (field === 'unitPrice') {
      updated[index].unitPrice = Number(value);
    } else if (field === 'description') {
      updated[index].description = value;
    }
    
    setItems(updated);
  };

  // Validations
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!supplierId) {
      newErrors.supplierId = 'Supplier selection is required';
    }
    if (!orderDate) {
      newErrors.orderDate = 'Order date is required';
    }
    if (!expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = 'Expected delivery date is required';
    } else if (orderDate && new Date(expectedDeliveryDate) < new Date(orderDate)) {
      newErrors.expectedDeliveryDate = 'Expected delivery date must be after order date';
    }

    // Items validation
    const invalidItems = items.some(
      i => !i.itemId || i.quantity <= 0 || i.unitPrice <= 0
    );
    
    if (items.length === 0) {
      newErrors.items = 'At least one purchase item is required';
    } else if (invalidItems) {
      newErrors.items = 'Please ensure all items have a selected product, quantity greater than 0, and price greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (status: string) => {
    if (!validate()) return;

    const inputPayload: PurchaseOrderInput = {
      supplierId: Number(supplierId),
      orderDate: new Date(orderDate).toISOString(),
      expectedDeliveryDate: new Date(expectedDeliveryDate).toISOString(),
      status: status,
      notes: notes,
      purchaseOrderItems: items.map(i => ({
        purchaseOrderItemId: i.purchaseOrderItemId,
        itemId: Number(i.itemId),
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        description: i.description,
      })),
      totalAmount: grandTotal,
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
          sx: {
            borderRadius: 2,
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1.5, borderBottom: '1px solid #E2E8F0' }}>
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
          {isEditMode ? `Edit Purchase Order (${order.poNumber || `PO-${String(order.purchaseOrderId || order.id).padStart(4, '0')}`})` : 'Create Purchase Order'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 3 }}>
        <Stack spacing={3.5} sx={{ mt: 1 }}>
          {/* Section 1: Purchase Order Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Purchase Order Information
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="PO Number"
                  value={isEditMode ? (order.poNumber || `PO-${String(order.purchaseOrderId || order.id).padStart(4, '0')}`) : 'PO-XXXX (Auto Generated)'}
                  disabled
                  slotProps={{ input: { readOnly: true } }}
                  helperText="Generated automatically by the ERP system"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
            </Grid>
          </Box>

          {/* Section 2: Supplier Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Supplier Information
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth required error={!!errors.supplierId}>
                  <InputLabel id="supplier-select-label">Supplier</InputLabel>
                  <Select
                    labelId="supplier-select-label"
                    value={supplierId}
                    label="Supplier"
                    onChange={(e) => setSupplierId(e.target.value as number)}
                    disabled={saving}
                  >
                    {suppliers.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name} {s.email ? `(${s.email})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.supplierId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.8 }}>
                      {errors.supplierId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Section 3: Delivery Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Delivery Information
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  type="datetime-local"
                  label="Expected Delivery Date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  error={!!errors.expectedDeliveryDate}
                  helperText={errors.expectedDeliveryDate}
                  disabled={saving}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Notes / Comments"
                  placeholder="Special instructions for the vendor..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={saving}
                  multiline
                  rows={1.5}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Section 4: Order Items */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Purchase Order Items Table
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddItemLine}
                disabled={saving}
                sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#475569' }}
              >
                Add Item
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
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', width: 220 }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 120 }}>Unit Price ($)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 120 }}>Line Total</TableCell>
                    <TableCell align="center" sx={{ width: 60 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => {
                    const lineTotal = item.quantity * item.unitPrice;
                    return (
                      <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        {/* Item Master Selector */}
                        <TableCell sx={{ py: 1.5 }}>
                          <FormControl fullWidth size="small">
                            <Select
                              value={item.itemId || ''}
                              onChange={(e) => handleItemFieldChange(index, 'itemId', e.target.value)}
                              disabled={saving}
                              displayEmpty
                            >
                              <MenuItem value="" disabled>Select an Item</MenuItem>
                              {itemsOptions.map((i) => (
                                <MenuItem key={i.itemId || i.id} value={i.itemId || i.id}>
                                  {i.itemName || i.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>

                        {/* Description */}
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={item.description || ''}
                            onChange={(e) => handleItemFieldChange(index, 'description', e.target.value)}
                            disabled={saving}
                            placeholder="Specification description"
                          />
                        </TableCell>

                        {/* Quantity */}
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)}
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
                            onChange={(e) => handleItemFieldChange(index, 'unitPrice', e.target.value)}
                            disabled={saving}
                            slotProps={{
                              htmlInput: { min: 0.01, step: '0.01', style: { textAlign: 'right' } }
                            }}
                          />
                        </TableCell>

                        {/* Line Total */}
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </TableCell>

                        {/* Remove item button */}
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

          {/* Section 5: Order Summary */}
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={() => handleFormSubmit('DRAFT')}
            disabled={saving}
            variant="outlined"
            color="secondary"
            sx={{
              borderColor: '#CBD5E1',
              color: '#334155',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#F1F5F9',
                borderColor: '#94A3B8',
              },
            }}
          >
            {saving ? 'Processing...' : 'Save Draft'}
          </Button>
          <Button
            onClick={() => handleFormSubmit('PENDING_APPROVAL')}
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
              minWidth: 140,
            }}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Submitting...' : 'Submit For Approval'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
