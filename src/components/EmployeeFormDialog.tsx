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
import BadgeIcon from '@mui/icons-material/Badge';
import { Employee, EmployeeInput } from './employeeService';

interface EmployeeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (employeeInput: EmployeeInput) => Promise<void>;
  employee: Employee | null;
  saving: boolean;
}

interface FormErrors {
  employeeName?: string;
  email?: string;
  contactNo?: string;
  salary?: string;
  employeeType?: string;
  hireDate?: string;
}

export default function EmployeeFormDialog({
  open,
  onClose,
  onSave,
  employee,
  saving,
}: EmployeeFormDialogProps) {
  const isEditMode = employee !== null;

  // Form states
  const [employeeName, setEmployeeName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [employeeType, setEmployeeType] = useState('Production');
  const [hireDate, setHireDate] = useState('');
  const [salary, setSalary] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});

  // Reset/populate form when dialog opens
  useEffect(() => {
    if (open) {
      if (employee) {
        setEmployeeName(employee.employeeName || '');
        setEmail(employee.email || '');
        setContactNo(employee.contactNo || '');
        setEmployeeType(employee.employeeType || 'Production');
        setHireDate(employee.hireDate ? employee.hireDate.substring(0, 10) : '');
        setSalary(employee.salary ? employee.salary.toString() : '');
      } else {
        setEmployeeName('');
        setEmail('');
        setContactNo('');
        setEmployeeType('Production');
        setHireDate(new Date().toISOString().substring(0, 10));
        setSalary('');
      }
      setErrors({});
    }
  }, [open, employee]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Employee Name
    if (!employeeName.trim()) {
      newErrors.employeeName = 'Employee name is required';
    } else if (employeeName.length > 100) {
      newErrors.employeeName = 'Employee name cannot exceed 100 characters';
    }

    // 2. Email validation
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      } else if (email.length > 100) {
        newErrors.email = 'Email cannot exceed 100 characters';
      }
    }

    // 3. Contact Number validation
    if (contactNo.trim()) {
      const phoneRegex = /^\+?[0-9\- ]{7,20}$/;
      if (!phoneRegex.test(contactNo.trim())) {
        newErrors.contactNo = 'Please enter a valid phone number (7-20 digits, spaces, hyphens allowed)';
      }
    }

    // 4. Salary validation
    if (!salary) {
      newErrors.salary = 'Salary is required';
    } else {
      const salaryNum = Number(salary);
      if (isNaN(salaryNum) || salaryNum < 0) {
        newErrors.salary = 'Salary must be a non-negative number';
      }
    }

    // 5. Hire Date validation
    if (!hireDate) {
      newErrors.hireDate = 'Hire date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Convert date string back into ISO LocalDateTime format
    const formattedHireDate = hireDate ? `${hireDate}T00:00:00` : new Date().toISOString().substring(0, 19);

    const inputPayload: EmployeeInput = {
      employeeName: employeeName.trim(),
      email: email.trim(),
      contactNo: contactNo.trim(),
      employeeType: employeeType,
      hireDate: formattedHireDate,
      salary: Number(salary),
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
          <BadgeIcon />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {isEditMode ? 'Edit Employee Record' : 'Create New Employee'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2.5 }}>
        {/* SECTION 1: PERSONAL INFORMATION */}
        <Typography variant="subtitle2" sx={{ color: '#2563EB', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Personal Information
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Employee Name"
              placeholder="e.g. Alice Smith"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              error={!!errors.employeeName}
              helperText={errors.employeeName}
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
              label="Email Address"
              placeholder="e.g. alice.smith@bluewhale.com"
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
              label="Contact Number"
              placeholder="e.g. +1-555-0199"
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
              error={!!errors.contactNo}
              helperText={errors.contactNo}
              disabled={saving}
              variant="outlined"
              slotProps={{
                htmlInput: { maxLength: 20 }
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* SECTION 2: EMPLOYMENT INFORMATION */}
        <Typography variant="subtitle2" sx={{ color: '#2563EB', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Employment Information
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth disabled={saving}>
              <InputLabel id="employee-type-label">Employee Type</InputLabel>
              <Select
                labelId="employee-type-label"
                value={employeeType}
                label="Employee Type"
                onChange={(e) => setEmployeeType(e.target.value)}
              >
                <MenuItem value="Manager">Manager</MenuItem>
                <MenuItem value="Production">Production Staff</MenuItem>
                <MenuItem value="Sales">Sales Staff</MenuItem>
                <MenuItem value="Purchase">Purchase Staff</MenuItem>
                <MenuItem value="Inventory">Inventory Staff</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              required
              fullWidth
              type="date"
              label="Hire Date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              error={!!errors.hireDate}
              helperText={errors.hireDate}
              disabled={saving}
              slotProps={{
                inputLabel: { shrink: true }
              }}
              variant="outlined"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              required
              fullWidth
              type="number"
              label="Salary (Rs.)"
              placeholder="e.g. 5000"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              error={!!errors.salary}
              helperText={errors.salary}
              disabled={saving}
              variant="outlined"
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
