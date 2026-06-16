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
  FormHelperText,
  Box,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import { Supplier, SupplierInput } from './supplierService';

interface SupplierFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (supplierInput: SupplierInput) => Promise<void>;
  supplier: Supplier | null; // Null means Create mode, non-null means Edit mode
  saving: boolean;
}

interface FormErrors {
  supplierName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function SupplierFormDialog({
  open,
  onClose,
  onSave,
  supplier,
  saving,
}: SupplierFormDialogProps) {
  const isEditMode = supplier !== null;

  // Form states
  const [supplierName, setSupplierName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [supplierStatus, setSupplierStatus] = useState('ACTIVE');
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset/populate form when dialog opens or supplier changes
  useEffect(() => {
    if (open) {
      if (supplier) {
        setSupplierName(supplier.supplierName || '');
        setContactPerson(supplier.contactPerson || '');
        setEmail(supplier.email || '');
        setPhone(supplier.phone || supplier.contactNo || '');
        setAddress(supplier.address || '');
        setSupplierStatus(supplier.supplierStatus || 'ACTIVE');
      } else {
        // Reset to default empty fields
        setSupplierName('');
        setContactPerson('');
        setEmail('');
        setPhone('');
        setAddress('');
        setSupplierStatus('ACTIVE');
      }
      setErrors({});
    }
  }, [open, supplier]);

  // Validations
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Supplier Name validation
    if (!supplierName.trim()) {
      newErrors.supplierName = 'Supplier name is required';
    } else if (supplierName.length > 100) {
      newErrors.supplierName = 'Supplier name cannot exceed 100 characters';
    }

    // 2. Contact Person validation
    if (contactPerson && contactPerson.length > 100) {
      newErrors.contactPerson = 'Contact person cannot exceed 100 characters';
    }

    // 3. Email validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      } else if (email.length > 100) {
        newErrors.email = 'Email cannot exceed 100 characters';
      }
    }

    // 4. Phone validation
    if (phone) {
      const phoneRegex = /^\+?[0-9\- ]{7,20}$/;
      if (!phoneRegex.test(phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number (7-20 digits, spaces, hyphens allowed)';
      }
    }

    // 5. Address validation
    if (address && address.length > 255) {
      newErrors.address = 'Address cannot exceed 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const inputPayload: SupplierInput = {
      supplierName: supplierName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      address: address.trim(),
      supplierStatus: supplierStatus,
      phone: phone.trim(),
      contactNo: phone.trim(), // Keep both in sync for backend compatibility
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
          <BusinessIcon />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {isEditMode ? 'Edit Supplier' : 'Create New Supplier'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 3 }}>
        <Grid container spacing={2.5} sx={{ mt: 0.1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Supplier Name"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              error={!!errors.supplierName}
              helperText={errors.supplierName}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 100 }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth disabled={saving}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={supplierStatus}
                label="Status"
                onChange={(e) => setSupplierStatus(e.target.value)}
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Contact Person"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              error={!!errors.contactPerson}
              helperText={errors.contactPerson}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 100 }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 100 }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
              disabled={saving}
              variant="outlined"
              placeholder="+1-234-567-8900"
              slotProps={{
                htmlInput: { maxLength: 20 }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={!!errors.address}
              helperText={errors.address}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 255 }
              }}
            />
          </Grid>
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
