import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ParsedItem } from './itemService';

interface ItemDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  item: ParsedItem | null;
  deleting: boolean;
}

export default function ItemDeleteDialog({
  open,
  onClose,
  onConfirm,
  item,
  deleting,
}: ItemDeleteDialogProps) {
  if (!item) return null;

  return (
    <Dialog
      open={open}
      onClose={deleting ? undefined : onClose}
      maxWidth="xs"
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
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            bgcolor: '#FEF2F2',
            color: '#DC2626',
            borderRadius: '50%',
            p: 1,
            display: 'flex',
          }}
        >
          <WarningAmberIcon />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0F172A' }}>
          Delete Item Master
        </Typography>
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ color: '#475569', mb: 2 }}>
          Are you sure you want to delete this inventory item master? This action will permanently remove the record from the catalog database and cannot be undone.
        </DialogContentText>
        <Box
          sx={{
            p: 2,
            bgcolor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 600 }}>
            Item Code
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', mb: 1.5 }}>
            {item.itemCode}
          </Typography>

          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 600 }}>
            Item Name
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
            {item.itemName}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={deleting}
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
          disabled={deleting}
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
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
