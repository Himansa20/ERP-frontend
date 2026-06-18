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
  Divider,
} from '@mui/material';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { Warehouse, WarehouseInput } from './warehouseService';

interface WarehouseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (warehouseInput: WarehouseInput) => Promise<void>;
  warehouse: Warehouse | null;
  saving: boolean;
}

interface FormErrors {
  warehouseCode?: string;
  warehouseName?: string;
  capacity?: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  city?: string;
  provinceState?: string;
  managerName?: string;
  description?: string;
}

export default function WarehouseFormDialog({
  open,
  onClose,
  onSave,
  warehouse,
  saving,
}: WarehouseFormDialogProps) {
  const isEditMode = warehouse !== null;

  // Form states
  const [warehouseCode, setWarehouseCode] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [provinceState, setProvinceState] = useState('');
  const [managerName, setManagerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset/populate form when dialog opens or warehouse changes
  useEffect(() => {
    if (open) {
      if (warehouse) {
        setWarehouseCode(warehouse.warehouseCode || '');
        setWarehouseName(warehouse.warehouseName || '');
        setDescription(warehouse.description || '');
        setAddress(warehouse.address || '');
        setCity(warehouse.city || '');
        setProvinceState(warehouse.provinceState || '');
        setManagerName(warehouse.managerName || '');
        setContactNumber(warehouse.contactNumber || '');
        setEmail(warehouse.email || '');
        setCapacity(warehouse.capacity ? warehouse.capacity.toString() : '');
        setStatus(warehouse.status || 'ACTIVE');
      } else {
        setWarehouseCode('');
        setWarehouseName('');
        setDescription('');
        setAddress('');
        setCity('');
        setProvinceState('');
        setManagerName('');
        setContactNumber('');
        setEmail('');
        setCapacity('');
        setStatus('ACTIVE');
      }
      setErrors({});
    }
  }, [open, warehouse]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Warehouse Code validation
    if (!warehouseCode.trim()) {
      newErrors.warehouseCode = 'Warehouse code is required';
    } else if (warehouseCode.length > 10) {
      newErrors.warehouseCode = 'Warehouse code cannot exceed 10 characters';
    }

    // 2. Warehouse Name validation
    if (!warehouseName.trim()) {
      newErrors.warehouseName = 'Warehouse name is required';
    } else if (warehouseName.length > 100) {
      newErrors.warehouseName = 'Warehouse name cannot exceed 100 characters';
    }

    // 3. Capacity validation
    if (!capacity) {
      newErrors.capacity = 'Capacity is required';
    } else {
      const capNum = Number(capacity);
      if (isNaN(capNum) || capNum <= 0) {
        newErrors.capacity = 'Capacity must be a positive number';
      }
    }

    // 4. Email validation
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      } else if (email.length > 30) {
        newErrors.email = 'Email cannot exceed 30 characters';
      }
    }

    // 5. Contact Number validation
    if (contactNumber.trim()) {
      const phoneRegex = /^\+?[0-9\- ]{7,18}$/;
      if (!phoneRegex.test(contactNumber.trim())) {
        newErrors.contactNumber = 'Please enter a valid phone number (7-18 digits, spaces, hyphens allowed)';
      }
    }

    // Length restrictions for serialization
    if (address.length > 45) {
      newErrors.address = 'Address cannot exceed 45 characters';
    }
    if (city.length > 20) {
      newErrors.city = 'City cannot exceed 20 characters';
    }
    if (provinceState.length > 20) {
      newErrors.provinceState = 'Province / State cannot exceed 20 characters';
    }
    if (description.length > 45) {
      newErrors.description = 'Description cannot exceed 45 characters';
    }
    if (managerName.length > 100) {
      newErrors.managerName = 'Manager name cannot exceed 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const inputPayload: WarehouseInput = {
      warehouseCode: warehouseCode.trim().toUpperCase(),
      warehouseName: warehouseName.trim(),
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      provinceState: provinceState.trim(),
      managerName: managerName.trim(),
      contactNumber: contactNumber.trim(),
      email: email.trim(),
      capacity: Number(capacity),
      status: status,
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
          <WarehouseIcon />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {isEditMode ? 'Edit Warehouse' : 'Create New Warehouse'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2.5 }}>
        {/* SECTION 1: WAREHOUSE INFORMATION */}
        <Typography variant="subtitle2" sx={{ color: '#2563EB', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Warehouse Information
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              required
              fullWidth
              label="Warehouse Code"
              placeholder="e.g. WH-001"
              value={warehouseCode}
              onChange={(e) => setWarehouseCode(e.target.value)}
              error={!!errors.warehouseCode}
              helperText={errors.warehouseCode}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 10 }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              required
              fullWidth
              label="Warehouse Name"
              placeholder="e.g. Chicago Central Hub"
              value={warehouseName}
              onChange={(e) => setWarehouseName(e.target.value)}
              error={!!errors.warehouseName}
              helperText={errors.warehouseName}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 100 }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Capacity (sq ft)"
              placeholder="e.g. 50000"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              error={!!errors.capacity}
              helperText={errors.capacity}
              disabled={saving}
              variant="outlined"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth disabled={saving}>
              <InputLabel id="warehouse-status-label">Status</InputLabel>
              <Select
                labelId="warehouse-status-label"
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Description"
              placeholder="Brief description of storage types, capabilities, or purposes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={!!errors.description}
              helperText={errors.description}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 45 }
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* SECTION 2: LOCATION DETAILS */}
        <Typography variant="subtitle2" sx={{ color: '#2563EB', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Location Details
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Street Address"
              placeholder="e.g. 100 Industrial Parkway"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={!!errors.address}
              helperText={errors.address}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 45 }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="City"
              placeholder="e.g. Chicago"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              error={!!errors.city}
              helperText={errors.city}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 20 }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Province / State"
              placeholder="e.g. IL"
              value={provinceState}
              onChange={(e) => setProvinceState(e.target.value)}
              error={!!errors.provinceState}
              helperText={errors.provinceState}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 20 }
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* SECTION 3: MANAGEMENT DETAILS */}
        <Typography variant="subtitle2" sx={{ color: '#2563EB', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Management Details
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Manager Name"
              placeholder="e.g. John Doe"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              error={!!errors.managerName}
              helperText={errors.managerName}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 100 }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Contact Number"
              placeholder="e.g. +1-312-555-0143"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              error={!!errors.contactNumber}
              helperText={errors.contactNumber}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 18 }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Email Address"
              placeholder="e.g. j.doe@bluewhale.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 30 }
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
