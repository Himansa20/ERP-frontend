import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  CircularProgress,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FactoryIcon from '@mui/icons-material/Factory';
import BuildIcon from '@mui/icons-material/Build';
import { BOM, BOMComponent } from './bomService';
import { ParsedItem } from './itemService';

interface BomFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (finishedProductId: number, newComponents: BOMComponent[]) => Promise<void>;
  bom: BOM | null; // Null means create mode
  saving: boolean;
  allItems: ParsedItem[];
}

export default function BomFormDialog({
  open,
  onClose,
  onSave,
  bom,
  saving,
  allItems,
}: BomFormDialogProps) {
  const isEditMode = bom !== null;

  // Filter items into Finished Products and Raw Materials
  const finishedProductsList = allItems.filter(
    (i) => i.itemCategory === 'Finished Products' || i.itemCategory === 'FinishedProduct'
  );
  const rawMaterialsList = allItems.filter(
    (i) => i.itemCategory === 'Raw Materials' || i.itemCategory === 'RawMaterial'
  );

  // States
  const [finishedProductId, setFinishedProductId] = useState<number | ''>('');
  const [components, setComponents] = useState<BOMComponent[]>([]);
  const [errors, setErrors] = useState<{ finishedProductId?: string; components?: string }>({});

  // Populate or reset form
  useEffect(() => {
    if (open) {
      if (bom) {
        setFinishedProductId(bom.finishedProductId);
        // Deep clone components to prevent mutating original state directly
        setComponents(
          bom.components.map((c) => ({
            ...c,
          }))
        );
      } else {
        setFinishedProductId('');
        setComponents([]);
      }
      setErrors({});
    }
  }, [open, bom]);

  // Compute stats
  const totalCost = components.reduce((sum, c) => {
    const qty = Number(c.requiredQuantity || 0);
    const cost = Number(c.standardCost || 0);
    const wasteMultiplier = 1 + Number(c.wastagePercentage || 0) / 100;
    return sum + qty * cost * wasteMultiplier;
  }, 0);

  // Actions
  const handleFinishedProductChange = (val: number) => {
    setFinishedProductId(val);
    if (errors.finishedProductId) {
      setErrors((prev) => ({ ...prev, finishedProductId: undefined }));
    }
  };

  const handleAddComponent = () => {
    // Find the first raw material not already added (to help user)
    const existingIds = new Set(components.map((c) => c.rawMaterialId));
    const nextRawMat = rawMaterialsList.find((r) => !existingIds.has(r.itemId)) || rawMaterialsList[0];

    if (!nextRawMat) {
      alert('No raw materials catalogued in the system to add.');
      return;
    }

    const newComponent: BOMComponent = {
      rawMaterialId: nextRawMat.itemId,
      rawMaterialName: nextRawMat.itemName,
      requiredQuantity: 1,
      wastagePercentage: 0,
      unitOfMeasure: nextRawMat.unitOfMeasure || 'PCS',
      standardCost: nextRawMat.standardCost || 0,
    };

    setComponents((prev) => [...prev, newComponent]);
    setErrors((prev) => ({ ...prev, components: undefined }));
  };

  const handleRemoveComponent = (index: number) => {
    setComponents((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleComponentChange = (index: number, field: keyof BOMComponent, val: any) => {
    setComponents((prev) =>
      prev.map((comp, idx) => {
        if (idx !== index) return comp;

        const updated = { ...comp, [field]: val };

        // If rawMaterialId changes, reload UOM and StandardCost
        if (field === 'rawMaterialId') {
          const matchedMat = rawMaterialsList.find((r) => r.itemId === Number(val));
          if (matchedMat) {
            updated.rawMaterialName = matchedMat.itemName;
            updated.unitOfMeasure = matchedMat.unitOfMeasure || 'PCS';
            updated.standardCost = matchedMat.standardCost || 0;
          }
        }

        return updated;
      })
    );
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!finishedProductId) {
      newErrors.finishedProductId = 'Finished product is required';
    }

    if (components.length === 0) {
      newErrors.components = 'At least one raw material component is required in a Bill of Materials';
    } else {
      const hasInvalidQty = components.some((c) => Number(c.requiredQuantity || 0) <= 0);
      if (hasInvalidQty) {
        newErrors.components = 'All component quantities must be positive values greater than 0';
      }
      
      const hasInvalidWastage = components.some((c) => Number(c.wastagePercentage || 0) < 0);
      if (hasInvalidWastage) {
        newErrors.components = 'Wastage percentage cannot be a negative value';
      }

      // Check duplicate raw materials
      const ids = components.map((c) => c.rawMaterialId);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        newErrors.components = 'Duplicate components detected. Please merge duplicate raw materials into a single row.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || finishedProductId === '') return;

    await onSave(finishedProductId, components);
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
          <FactoryIcon />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {isEditMode ? 'Edit Bill of Materials' : 'Create Bill of Materials'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 3 }}>
        {/* Section 1: Finished Product Information */}
        <Typography variant="subtitle2" sx={{ color: '#2563EB', fontWeight: 700, mb: 2.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Finished Product Information
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={8}>
            <FormControl fullWidth required error={!!errors.finishedProductId}>
              <InputLabel id="finished-product-select-label">Finished Product</InputLabel>
              <Select
                labelId="finished-product-select-label"
                value={finishedProductId}
                label="Finished Product"
                onChange={(e) => handleFinishedProductChange(Number(e.target.value))}
                disabled={saving || isEditMode}
              >
                {finishedProductsList.map((item) => (
                  <MenuItem key={item.itemId} value={item.itemId}>
                    {item.itemName} ({item.itemCode})
                  </MenuItem>
                ))}
              </Select>
              {errors.finishedProductId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {errors.finishedProductId}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Standard UOM"
              value={
                finishedProductId
                  ? finishedProductsList.find((i) => i.itemId === finishedProductId)?.unitOfMeasure || 'N/A'
                  : ''
              }
              variant="outlined"
              slotProps={{
                htmlInput: { readOnly: true }
              }}
              sx={{ bgcolor: '#F8FAFC' }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Section 2: BOM Components */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#2563EB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            BOM Components / Raw Materials
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddComponent}
            disabled={saving}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#BFDBFE',
              color: '#2563EB',
              '&:hover': { bgcolor: '#EFF6FF', borderColor: '#2563EB' },
            }}
          >
            Add Component
          </Button>
        </Box>

        {errors.components && (
          <Typography variant="body2" color="error" sx={{ mb: 2, fontWeight: 500 }}>
            {errors.components}
          </Typography>
        )}

        {components.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
              borderColor: '#E2E8F0',
              bgcolor: '#F8FAFC',
            }}
          >
            <BuildIcon sx={{ fontSize: 32, color: '#94A3B8', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
              No components added to this recipe structure yet. Click "Add Component" to build the bill of materials.
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#E2E8F0', overflow: 'hidden' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', width: '35%' }}>Raw Material</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', width: '15%' }} align="right">Qty Required</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', width: '10%' }}>UOM</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', width: '15%' }} align="right">Wastage %</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', width: '15%' }} align="right">Unit Cost</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', width: '10%' }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {components.map((comp, idx) => (
                  <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    {/* Raw Material Selector */}
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={comp.rawMaterialId}
                          onChange={(e) => handleComponentChange(idx, 'rawMaterialId', Number(e.target.value))}
                          disabled={saving}
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {rawMaterialsList.map((r) => (
                            <MenuItem key={r.itemId} value={r.itemId} sx={{ fontSize: '0.875rem' }}>
                              {r.itemName} ({r.itemCode})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>

                    {/* Quantity Required */}
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={comp.requiredQuantity}
                        onChange={(e) => handleComponentChange(idx, 'requiredQuantity', Number(e.target.value))}
                        disabled={saving}
                        slotProps={{
                          htmlInput: { min: 0.01, step: 'any', style: { textAlign: 'right' } }
                        }}
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.875rem', py: 1 },
                        }}
                      />
                    </TableCell>

                    {/* UOM */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                        {comp.unitOfMeasure}
                      </Typography>
                    </TableCell>

                    {/* Wastage Percentage */}
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={comp.wastagePercentage}
                        onChange={(e) => handleComponentChange(idx, 'wastagePercentage', Number(e.target.value))}
                        disabled={saving}
                        slotProps={{
                          htmlInput: { min: 0, step: 'any', style: { textAlign: 'right' } }
                        }}
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.875rem', py: 1 },
                        }}
                      />
                    </TableCell>

                    {/* Unit Cost */}
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        ${Number(comp.standardCost || 0).toFixed(2)}
                      </Typography>
                    </TableCell>

                    {/* Delete Action */}
                    <TableCell align="center">
                      <Tooltip title="Remove Material">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveComponent(idx)}
                          disabled={saving}
                          sx={{ '&:hover': { bgcolor: '#FEF2F2' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Cost summary bar */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                TOTAL RAW MATERIALS
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {components.length} Items
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
              ROLLED-UP MATERIAL COST
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 850, color: '#16A34A' }}>
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>
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
            minWidth: 120,
          }}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? 'Saving...' : isEditMode ? 'Update BOM' : 'Save BOM'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
