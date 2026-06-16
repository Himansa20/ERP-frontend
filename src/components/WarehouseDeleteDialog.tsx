import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface WarehouseDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  warehouseName: string;
  loading: boolean;
}

export default function WarehouseDeleteDialog({
  open,
  onClose,
  onConfirm,
  warehouseName,
  loading,
}: WarehouseDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            padding: 1,
            maxWidth: 400,
          },
        },
      }}
    >
      <DialogTitle id="delete-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
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
          Delete Warehouse
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ py: 1.5 }}>
        <DialogContentText id="delete-dialog-description" sx={{ color: '#475569', fontSize: '0.95rem' }}>
          Are you sure you want to delete <strong style={{ color: '#0F172A' }}>{warehouseName}</strong>? This action cannot be undone and will permanently remove the warehouse master record and all associated storage configs.
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
            minWidth: 100,
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
