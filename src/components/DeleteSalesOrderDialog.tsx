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
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { SalesOrder } from './salesOrderService';

interface DeleteSalesOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  order: SalesOrder | null;
  loading: boolean;
}

export default function DeleteSalesOrderDialog({
  open,
  onClose,
  onConfirm,
  order,
  loading,
}: DeleteSalesOrderDialogProps) {
  if (!order) return null;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            p: 1,
            maxWidth: 400,
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            bgcolor: '#FEF2F2',
            color: '#DC2626',
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <WarningAmberIcon />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0F172A' }}>
          Delete Sales Order
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <DialogContentText sx={{ color: '#475569', fontSize: '0.925rem' }}>
          Are you sure you want to delete sales order <strong>#{order.salesOrderId}</strong>?
          This action cannot be undone.
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
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
