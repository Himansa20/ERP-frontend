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
  Autocomplete,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import { InventoryTransactionInput } from './inventoryTransactionService';
import { itemService, ParsedItem } from './itemService';
import { warehouseService, Warehouse } from './warehouseService';
import { employeeService, Employee } from './employeeService';

interface InventoryTransactionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (transactionInput: InventoryTransactionInput) => Promise<void>;
  saving: boolean;
}

interface FormErrors {
  uiTransactionType?: string;
  itemId?: string;
  warehouseId?: string;
  quantity?: string;
  referenceNumber?: string;
  notes?: string;
  employeeId?: string;
}

const UI_TRANSACTION_TYPES = [
  { value: 'Goods Receipt', label: 'Goods Receipt (Stock Addition)', direction: 'Stock In' },
  { value: 'Goods Issue', label: 'Goods Issue (Stock Deduction)', direction: 'Stock Out' },
  { value: 'Transfer', label: 'Warehouse Transfer', direction: 'Stock Out' }, // Can be Stock In or Stock Out
  { value: 'Adjustment', label: 'Stock Adjustment', direction: 'Stock In' },    // Can be Stock In or Stock Out
  { value: 'Production Consumption', label: 'Production Consumption (Deduction)', direction: 'Stock Out' },
  { value: 'Production Output', label: 'Production Output (Addition)', direction: 'Stock In' },
];

export default function InventoryTransactionFormDialog({
  open,
  onClose,
  onSave,
  saving,
}: InventoryTransactionFormDialogProps) {
  
  // Lists for dropdown options
  const [itemList, setItemList] = useState<ParsedItem[]>([]);
  const [warehouseList, setWarehouseList] = useState<Warehouse[]>([]);
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Form Field States
  const [uiTransactionType, setUiTransactionType] = useState('Goods Receipt');
  const [apiTransactionType, setApiTransactionType] = useState<'Stock In' | 'Stock Out'>('Stock In');
  const [selectedItem, setSelectedItem] = useState<ParsedItem | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [quantity, setQuantity] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch lists on mount / when dialog opens
  useEffect(() => {
    if (open) {
      const fetchOptions = async () => {
        setLoadingOptions(true);
        try {
          const itemsRes = await itemService.getItems(0, 500);
          const warehousesRes = await warehouseService.getWarehouses(0, 200);
          const employeesRes = await employeeService.getEmployees(0, 200);

          // Only use active elements if status fields exist
          setItemList(itemsRes.content.filter(i => i.itemStatus !== 'Inactive'));
          setWarehouseList(warehousesRes.content.filter(w => w.status !== 'INACTIVE'));
          setEmployeeList(employeesRes.content);

          // Generate a random-looking but serial prefix reference number
          const rand = Math.floor(1000 + Math.random() * 9000);
          setReferenceNumber(`REF-TX-${rand}`);
        } catch (err) {
          console.error('Failed to load transaction dialog options:', err);
        } finally {
          setLoadingOptions(false);
        }
      };

      fetchOptions();
      // Reset defaults
      setUiTransactionType('Goods Receipt');
      setApiTransactionType('Stock In');
      setSelectedItem(null);
      setSelectedWarehouse(null);
      setSelectedEmployee(null);
      setQuantity('');
      setNotes('');
      setErrors({});
    }
  }, [open]);

  // Sync Direction option based on selected UI type
  useEffect(() => {
    const matched = UI_TRANSACTION_TYPES.find(t => t.value === uiTransactionType);
    if (matched) {
      if (uiTransactionType !== 'Transfer' && uiTransactionType !== 'Adjustment') {
        setApiTransactionType(matched.direction as 'Stock In' | 'Stock Out');
      }
    }
  }, [uiTransactionType]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!uiTransactionType) {
      newErrors.uiTransactionType = 'Transaction type is required';
    }

    if (!selectedItem) {
      newErrors.itemId = 'Item is required';
    }

    if (!selectedWarehouse) {
      newErrors.warehouseId = 'Warehouse is required';
    }

    if (!quantity) {
      newErrors.quantity = 'Quantity is required';
    } else {
      const qNum = Number(quantity);
      if (isNaN(qNum) || qNum <= 0) {
        newErrors.quantity = 'Quantity must be a positive number';
      }
    }

    if (referenceNumber.trim() && referenceNumber.length > 50) {
      newErrors.referenceNumber = 'Reference number cannot exceed 50 characters';
    }

    if (notes.trim() && notes.length > 150) {
      newErrors.notes = 'Notes cannot exceed 150 characters to fit remarks field';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!selectedItem || !selectedWarehouse) return;

    const payload: InventoryTransactionInput = {
      itemId: selectedItem.itemId,
      warehouseId: selectedWarehouse.warehouseId,
      employeeId: selectedEmployee?.employeeId || undefined,
      transactionType: apiTransactionType,
      uiTransactionType: uiTransactionType,
      quantity: Number(quantity),
      referenceNumber: referenceNumber.trim(),
      notes: notes.trim(),
    };

    await onSave(payload);
  };

  // Determine if we can toggle transaction type direction manually
  const isDirectionToggleable = uiTransactionType === 'Transfer' || uiTransactionType === 'Adjustment';

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
          sx: { borderRadius: 2 },
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
          <InventoryIcon />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0F172A' }}>
          Create Inventory Transaction
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2.5 }}>
        {loadingOptions ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
            <CircularProgress size={36} />
            <Typography variant="body2" color="textSecondary">
              Loading warehouse master lists and stock item registries...
            </Typography>
          </Box>
        ) : (
          <>
            {/* SECTION 1: TRANSACTION INFORMATION */}
            <Typography variant="subtitle2" sx={{ color: '#2563EB', fontWeight: 700, mb: 2.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Transaction Information
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              {/* UI Transaction Type */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={!!errors.uiTransactionType} disabled={saving}>
                  <InputLabel id="ui-tx-type-label">Transaction Type</InputLabel>
                  <Select
                    labelId="ui-tx-type-label"
                    value={uiTransactionType}
                    label="Transaction Type"
                    onChange={(e) => setUiTransactionType(e.target.value)}
                  >
                    {UI_TRANSACTION_TYPES.map(t => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                  {errors.uiTransactionType && <FormHelperText>{errors.uiTransactionType}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Reference Number */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Reference Number / Slip ID"
                  placeholder="e.g. REF-TX-1049"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  error={!!errors.referenceNumber}
                  helperText={errors.referenceNumber || 'Provide audit reference identifier'}
                  disabled={saving}
                  variant="outlined"
                  slotProps={{
                    htmlInput: { maxLength: 50 }
                  }}
                />
              </Grid>

              {/* Stock Movement Direction (API transactionType) */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 1, textTransform: 'uppercase' }}>
                    Movement Direction
                  </Typography>
                  <RadioGroup
                    row
                    value={apiTransactionType}
                    onChange={(e) => setApiTransactionType(e.target.value as 'Stock In' | 'Stock Out')}
                  >
                    <FormControlLabel 
                      value="Stock In" 
                      control={<Radio size="small" />} 
                      label={
                        <Typography variant="body2" sx={{ fontWeight: apiTransactionType === 'Stock In' ? 700 : 400, color: '#16A34A' }}>
                          Stock In (Receiving/Adding stock to warehouse inventory)
                        </Typography>
                      } 
                      disabled={!isDirectionToggleable || saving}
                    />
                    <FormControlLabel 
                      value="Stock Out" 
                      control={<Radio size="small" />} 
                      label={
                        <Typography variant="body2" sx={{ fontWeight: apiTransactionType === 'Stock Out' ? 700 : 400, color: '#DC2626' }}>
                          Stock Out (Issuing/Removing stock from warehouse inventory)
                        </Typography>
                      } 
                      disabled={!isDirectionToggleable || saving}
                    />
                  </RadioGroup>
                  {!isDirectionToggleable && (
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1, fontStyle: 'italic' }}>
                      * Automatically defined and locked based on Selected Transaction Type ({uiTransactionType}).
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* SECTION 2: INVENTORY DETAILS */}
            <Typography variant="subtitle2" sx={{ color: '#2563EB', fontWeight: 700, mb: 2.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Inventory Details
            </Typography>
            <Grid container spacing={2.5}>
              {/* Item Autocomplete Lookup */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={itemList}
                  getOptionLabel={(option) => `[${option.itemCode}] ${option.itemName}`}
                  value={selectedItem}
                  onChange={(_, newValue) => setSelectedItem(newValue)}
                  disabled={saving}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Select Item"
                      placeholder="Type item name or code..."
                      error={!!errors.itemId}
                      helperText={errors.itemId}
                    />
                  )}
                />
              </Grid>

              {/* Warehouse Lookup */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={warehouseList}
                  getOptionLabel={(option) => `[${option.warehouseCode}] ${option.warehouseName}`}
                  value={selectedWarehouse}
                  onChange={(_, newValue) => setSelectedWarehouse(newValue)}
                  disabled={saving}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Select Warehouse"
                      placeholder="Type warehouse name..."
                      error={!!errors.warehouseId}
                      helperText={errors.warehouseId}
                    />
                  )}
                />
              </Grid>

              {/* Quantity */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  label="Quantity"
                  type="number"
                  placeholder="e.g. 50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  error={!!errors.quantity}
                  helperText={errors.quantity || (selectedItem ? `Unit of Measure: ${selectedItem.unitOfMeasure}` : '')}
                  disabled={saving}
                  variant="outlined"
                />
              </Grid>

              {/* Employee Lookup */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={employeeList}
                  getOptionLabel={(option) => `${option.employeeName} (${option.employeeType})`}
                  value={selectedEmployee}
                  onChange={(_, newValue) => setSelectedEmployee(newValue)}
                  disabled={saving}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Created By / Operator"
                      placeholder="Select staff member..."
                      error={!!errors.employeeId}
                      helperText={errors.employeeId || 'Optional'}
                    />
                  )}
                />
              </Grid>

              {/* Notes */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Operation Notes / Remarks"
                  placeholder="Specify details regarding production order, shipment slip, justification for adjustment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  error={!!errors.notes}
                  helperText={errors.notes || 'Maximum 150 characters'}
                  disabled={saving}
                  variant="outlined"
                  slotProps={{
                    htmlInput: { maxLength: 150 }
                  }}
                />
              </Grid>
            </Grid>
          </>
        )}
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
          disabled={saving || loadingOptions}
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
          {saving ? 'Submitting...' : 'Save Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
