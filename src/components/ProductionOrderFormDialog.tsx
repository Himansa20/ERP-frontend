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
} from '@mui/material';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import { ProductionOrder, ProductionOrderInput, DropdownItem } from './productionOrderService';

interface ProductionOrderFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (orderInput: ProductionOrderInput) => Promise<void>;
  order: ProductionOrder | null; // Null means Create, non-null means Edit
  saving: boolean;
  finishedProducts: DropdownItem[];
  employees: DropdownItem[];
}

interface FormErrors {
  finishedProductId?: string;
  employeeId?: string;
  quantityToProduce?: string;
  startDate?: string;
  endDate?: string;
  priority?: string;
}

export default function ProductionOrderFormDialog({
  open,
  onClose,
  onSave,
  order,
  saving,
  finishedProducts,
  employees,
}: ProductionOrderFormDialogProps) {
  const isEditMode = order !== null;

  // Form states
  const [finishedProductId, setFinishedProductId] = useState<number | ''>('');
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [quantityToProduce, setQuantityToProduce] = useState<number | ''>('');
  const [quantityProduced, setQuantityProduced] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [status, setStatus] = useState('PENDING');
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset/populate form
  useEffect(() => {
    if (open) {
      if (order) {
        setFinishedProductId(order.finishedProductId || '');
        setEmployeeId(order.employeeId || '');
        setQuantityToProduce(order.quantityToProduce || '');
        setQuantityProduced(order.quantityProduced || 0);
        setStartDate(order.startDate ? order.startDate.substring(0, 16) : '');
        setEndDate(order.endDate ? order.endDate.substring(0, 16) : '');
        setPriority(order.priority || 'LOW');
        setStatus(order.status || 'PENDING');
      } else {
        // Reset defaults
        setFinishedProductId('');
        setEmployeeId('');
        setQuantityToProduce('');
        setQuantityProduced(0);
        // Default start date is today, target completion is tomorrow
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        setStartDate(now.toISOString().substring(0, 16));
        setEndDate(tomorrow.toISOString().substring(0, 16));
        setPriority('LOW');
        setStatus('PENDING');
      }
      setErrors({});
    }
  }, [open, order]);

  // Validations
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!finishedProductId) {
      newErrors.finishedProductId = 'Product selection is required';
    }
    if (!employeeId) {
      newErrors.employeeId = 'Supervisor assignment is required';
    }
    if (!quantityToProduce || Number(quantityToProduce) <= 0) {
      newErrors.quantityToProduce = 'Planned quantity must be a positive number';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!endDate) {
      newErrors.endDate = 'Target completion date is required';
    } else if (startDate && new Date(endDate) <= new Date(startDate)) {
      newErrors.endDate = 'Completion date must be after the start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const inputPayload: ProductionOrderInput = {
      finishedProductId: Number(finishedProductId),
      employeeId: Number(employeeId),
      quantityToProduce: Number(quantityToProduce),
      quantityProduced: quantityProduced,
      status: status,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      priority: priority,
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
          <PrecisionManufacturingIcon />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {isEditMode ? 'Edit Production Order' : 'Create Production Order'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 3 }}>
        <Grid container spacing={2.5} sx={{ mt: 0.1 }}>
          {/* Finished Product */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required error={!!errors.finishedProductId}>
              <InputLabel id="product-select-label">Finished Product</InputLabel>
              <Select
                labelId="product-select-label"
                value={finishedProductId}
                label="Finished Product"
                onChange={(e) => setFinishedProductId(e.target.value as number)}
                disabled={saving || isEditMode}
              >
                {finishedProducts.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.finishedProductId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.8 }}>
                  {errors.finishedProductId}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Supervisor/Employee */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required error={!!errors.employeeId}>
              <InputLabel id="employee-select-label">Assigned Supervisor</InputLabel>
              <Select
                labelId="employee-select-label"
                value={employeeId}
                label="Assigned Supervisor"
                onChange={(e) => setEmployeeId(e.target.value as number)}
                disabled={saving}
              >
                {employees.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.name}
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

          {/* Planned Quantity */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              type="number"
              label="Planned Quantity"
              value={quantityToProduce}
              onChange={(e) => setQuantityToProduce(e.target.value === '' ? '' : Number(e.target.value))}
              error={!!errors.quantityToProduce}
              helperText={errors.quantityToProduce}
              disabled={saving}
              variant="outlined"
            />
          </Grid>

          {/* Priority */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel id="priority-select-label">Priority</InputLabel>
              <Select
                labelId="priority-select-label"
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value)}
                disabled={saving}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Start Date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              type="datetime-local"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              error={!!errors.startDate}
              helperText={errors.startDate}
              disabled={saving}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Grid>

          {/* Target Completion Date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              type="datetime-local"
              label="Target Completion Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              error={!!errors.endDate}
              helperText={errors.endDate}
              disabled={saving}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Grid>

          {/* Produced Quantity (Only visible/editable during Edit mode) */}
          {isEditMode && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Produced Quantity"
                value={quantityProduced}
                onChange={(e) => setQuantityProduced(Number(e.target.value))}
                disabled={saving}
                variant="outlined"
              />
            </Grid>
          )}

          {/* Status (Only visible/editable during Edit mode) */}
          {isEditMode && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={saving}
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
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
