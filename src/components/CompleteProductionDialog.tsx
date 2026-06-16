import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ProductionOrder, DropdownItem } from './productionOrderService';

interface CompleteProductionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (warehouseId: number) => Promise<void>;
  order: ProductionOrder | null;
  loading: boolean;
  productsMap: Record<number, string>;
  warehouses: DropdownItem[];
}

export default function CompleteProductionDialog({
  open,
  onClose,
  onConfirm,
  order,
  loading,
  productsMap,
  warehouses,
}: CompleteProductionDialogProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | ''>('');
  const [error, setError] = useState('');

  // Reset selected warehouse on open
  useEffect(() => {
    if (open) {
      setSelectedWarehouseId(warehouses[0]?.id || '');
      setError('');
    }
  }, [open, warehouses]);

  if (!order) return null;

  const handleComplete = async () => {
    if (!selectedWarehouseId) {
      setError('Please select a target warehouse');
      return;
    }
    await onConfirm(Number(selectedWarehouseId));
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            p: 1,
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            bgcolor: '#E8F5E9',
            color: '#2E7D32',
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircleIcon />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0F172A' }}>
          Complete Production Order
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <DialogContentText sx={{ color: '#475569', fontSize: '0.925rem', mb: 3.5 }}>
          Are you sure you want to mark this production order as completed? This will update warehouse stock and log completion audits.
        </DialogContentText>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              Order ID
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              #{order.productionOrderId}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              Finished Product
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {productsMap[Number(order.finishedProductId)] || `Product #${order.finishedProductId}`}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1.5 }}>
              Planned Qty
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {Number(order.quantityToProduce || 0).toLocaleString()} Units
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1.5 }}>
              Produced Qty Yield
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#16A34A' }}>
              {Number(order.quantityProduced || order.quantityToProduce || 0).toLocaleString()} Units
            </Typography>
          </Grid>

          {/* Warehouse Dropdown Selection */}
          <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
            <FormControl fullWidth error={!!error} required disabled={loading}>
              <InputLabel id="target-warehouse-select-label">Target Completion Warehouse</InputLabel>
              <Select
                labelId="target-warehouse-select-label"
                value={selectedWarehouseId}
                label="Target Completion Warehouse"
                onChange={(e) => {
                  setSelectedWarehouseId(e.target.value as number);
                  setError('');
                }}
              >
                {warehouses.map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.name}
                  </MenuItem>
                ))}
              </Select>
              {error && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.8 }}>
                  {error}
                </Typography>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
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
          onClick={handleComplete}
          disabled={loading}
          variant="contained"
          sx={{
            bgcolor: '#16A34A',
            color: '#FFFFFF',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#15803D',
              boxShadow: 'none',
            },
            minWidth: 100,
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Completing...' : 'Complete Production'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
