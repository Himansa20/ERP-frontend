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
  Stack,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import { ParsedItem } from './itemService';

interface ItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<ParsedItem, 'itemId'>) => Promise<void>;
  item: ParsedItem | null;
  saving: boolean;
  allItems: ParsedItem[]; // For checking unique code validation
}

interface FormErrors {
  itemCode?: string;
  itemName?: string;
  itemCategory?: string;
  itemType?: string;
  unitOfMeasure?: string;
  standardCost?: string;
  currentStock?: string;
  reorderLevel?: string;
}

export default function ItemFormDialog({
  open,
  onClose,
  onSave,
  item,
  saving,
  allItems,
}: ItemFormDialogProps) {
  const isEditMode = item !== null;

  // Form fields states
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [itemCategory, setItemCategory] = useState('Raw Materials');
  const [itemType, setItemType] = useState('Standard');
  const [unitOfMeasure, setUnitOfMeasure] = useState('PCS');
  const [currentStock, setCurrentStock] = useState<number | ''>('');
  const [reorderLevel, setReorderLevel] = useState<number | ''>('');
  const [standardCost, setStandardCost] = useState<number | ''>('');
  const [status, setStatus] = useState('Active');

  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form when opened or item changes
  useEffect(() => {
    if (open) {
      if (item) {
        setItemCode(item.itemCode || '');
        setItemName(item.itemName || '');
        setDescription(item.description || '');
        setItemCategory(item.itemCategory || 'Raw Materials');
        setItemType(item.itemType || 'Standard');
        setUnitOfMeasure(item.unitOfMeasure || 'PCS');
        setCurrentStock(item.currentStock ?? 0);
        setReorderLevel(item.reorderLevel ?? 0);
        setStandardCost(item.standardCost ?? 0);
        setStatus(item.itemStatus || 'Active');
      } else {
        // Find the maximum numeric suffix from existing item codes
        let maxNum = 0;
        allItems.forEach((i) => {
          const match = i.itemCode.match(/\d+/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (num > maxNum) {
              maxNum = num;
            }
          }
        });
        const nextNum = maxNum + 1;
        setItemCode(`ITM-${nextNum.toString().padStart(4, '0')}`);
        setItemName('');
        setDescription('');
        setItemCategory('Raw Materials');
        setItemType('Standard');
        setUnitOfMeasure('PCS');
        setCurrentStock(0);
        setReorderLevel(10);
        setStandardCost(1.5);
        setStatus('Active');
      }
      setErrors({});
    }
  }, [open, item, allItems]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!itemCode.trim()) {
      newErrors.itemCode = 'Item Code is required';
    } else {
      // Check unique item code validation
      const codeExists = allItems.some(
        (i) => i.itemCode.trim().toLowerCase() === itemCode.trim().toLowerCase() && (!isEditMode || i.itemId !== item?.itemId)
      );
      if (codeExists) {
        newErrors.itemCode = 'This Item Code is already assigned to another catalog product';
      }
    }

    if (!itemName.trim()) {
      newErrors.itemName = 'Item Name is required';
    }
    if (!itemCategory) {
      newErrors.itemCategory = 'Category selection is required';
    }
    if (!itemType) {
      newErrors.itemType = 'Classification Type is required';
    }
    if (!unitOfMeasure) {
      newErrors.unitOfMeasure = 'UOM is required';
    }

    // Cost and inventory validations
    if (standardCost === '' || Number(standardCost) < 0) {
      newErrors.standardCost = 'Cost must be a positive number or zero';
    }
    if (currentStock === '' || Number(currentStock) < 0) {
      newErrors.currentStock = 'Stock level must be a positive number or zero';
    }
    if (reorderLevel === '' || Number(reorderLevel) < 0) {
      newErrors.reorderLevel = 'Reorder threshold level must be a positive number or zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Omit<ParsedItem, 'itemId'> = {
      itemCode: itemCode.trim().toUpperCase(),
      itemName: itemName.trim(),
      description: description.trim(),
      itemCategory,
      itemType,
      unitOfMeasure,
      currentStock: Number(currentStock || 0),
      reorderLevel: Number(reorderLevel || 0),
      standardCost: Number(standardCost || 0),
      itemStatus: status,
      version: item?.version
    };

    await onSave(payload);
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
          <InventoryIcon />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {isEditMode ? 'Edit Item Master' : 'Create Item Master'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 3 }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Section 1: Basic Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Basic Catalog Information
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  required
                  fullWidth
                  label="Item Code"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  error={!!errors.itemCode}
                  helperText={errors.itemCode || 'Format: ITM-XXXX (Must be unique)'}
                  disabled={saving}
                  placeholder="e.g. ITM-0021"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  required
                  fullWidth
                  label="Item Name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  error={!!errors.itemName}
                  helperText={errors.itemName}
                  disabled={saving}
                  placeholder="e.g. Copper Wire Reel 10m"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.itemCategory}>
                  <InputLabel id="category-select-label">Item Category</InputLabel>
                  <Select
                    labelId="category-select-label"
                    value={itemCategory}
                    label="Item Category"
                    onChange={(e) => setItemCategory(e.target.value)}
                    disabled={saving}
                  >
                    <MenuItem value="Raw Materials">Raw Materials</MenuItem>
                    <MenuItem value="Finished Products">Finished Products</MenuItem>
                    <MenuItem value="Packaging Materials">Packaging Materials</MenuItem>
                    <MenuItem value="Consumables">Consumables</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.itemType}>
                  <InputLabel id="type-select-label">Classification Type</InputLabel>
                  <Select
                    labelId="type-select-label"
                    value={itemType}
                    label="Classification Type"
                    onChange={(e) => setItemType(e.target.value)}
                    disabled={saving}
                  >
                    <MenuItem value="Standard">Standard</MenuItem>
                    <MenuItem value="Custom">Custom</MenuItem>
                    <MenuItem value="Bulk">Bulk</MenuItem>
                    <MenuItem value="Assembly">Assembly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.unitOfMeasure}>
                  <InputLabel id="uom-select-label">Unit of Measure (UOM)</InputLabel>
                  <Select
                    labelId="uom-select-label"
                    value={unitOfMeasure}
                    label="Unit of Measure (UOM)"
                    onChange={(e) => setUnitOfMeasure(e.target.value)}
                    disabled={saving}
                  >
                    <MenuItem value="PCS">PCS (Pieces)</MenuItem>
                    <MenuItem value="KG">KG (Kilograms)</MenuItem>
                    <MenuItem value="LTR">LTR (Liters)</MenuItem>
                    <MenuItem value="BOX">BOX (Boxes)</MenuItem>
                    <MenuItem value="METER">METER (Meters)</MenuItem>
                    <MenuItem value="PACK">PACK (Packages)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={saving}
                  placeholder="Enter specifications, warehouse location tags, or vendor details..."
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Section 2: Inventory & Cost Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Inventory Levels & Cost Ledger
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Current Stock"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
                  error={!!errors.currentStock}
                  helperText={errors.currentStock}
                  disabled={saving}
                  slotProps={{
                    htmlInput: { min: 0 }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Reorder Alert Threshold"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value === '' ? '' : Number(e.target.value))}
                  error={!!errors.reorderLevel}
                  helperText={errors.reorderLevel}
                  disabled={saving}
                  slotProps={{
                    htmlInput: { min: 0 }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Standard Cost (Rs.)"
                  value={standardCost}
                  onChange={(e) => setStandardCost(e.target.value === '' ? '' : Number(e.target.value))}
                  error={!!errors.standardCost}
                  helperText={errors.standardCost}
                  disabled={saving}
                  slotProps={{
                    htmlInput: { min: 0, step: '0.01' }
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Section 3: Status Details */}
          <Box>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">Lifecycle Status</InputLabel>
                  <Select
                    labelId="status-select-label"
                    value={status}
                    label="Lifecycle Status"
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={saving}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Stack>
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
