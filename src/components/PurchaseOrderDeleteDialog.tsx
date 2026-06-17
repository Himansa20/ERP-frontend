import React from 'react';
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
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { PurchaseOrder } from './purchaseOrderService';

interface PurchaseOrderDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: PurchaseOrder | null;
  loading: boolean;
}

export default function PurchaseOrderDeleteDialog({
  open,
  onClose,
  onConfirm,
  order,
  loading,
}: PurchaseOrderDeleteDialogProps) {
  if (!order) return null;

  const poNum = order.poNumber || `PO-${String(order.purchaseOrderId || order.id).padStart(4, '0')}`;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
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
        <Box sx={{ color: '#DC2626', bgcolor: '#FEF2F2', p: 1, borderRadius: 2, display: 'flex' }}>
          <WarningIcon />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0F172A' }}>
          Delete Purchase Order
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText sx={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Are you sure you want to delete this purchase order? This action will permanently delete purchase order{' '}
          <strong style={{ color: '#0F172A' }}>{poNum}</strong> from the manufacturing database and cannot be undone.
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
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
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          sx={{
            bgcolor: '#DC2626',
            color: '#FFFFFF',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#B91C1C',
              boxShadow: 'none',
            },
            minWidth: 90,
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
