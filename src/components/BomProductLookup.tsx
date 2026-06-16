import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Divider,
  Stack,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FactoryIcon from '@mui/icons-material/Factory';
import BuildIcon from '@mui/icons-material/Build';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { bomService, BOM } from './bomService';
import { ParsedItem } from './itemService';

interface BomProductLookupProps {
  allItems: ParsedItem[];
}

export default function BomProductLookup({ allItems }: BomProductLookupProps) {
  const finishedProductsList = allItems.filter(
    (i) => i.itemCategory === 'Finished Products' || i.itemCategory === 'FinishedProduct'
  );

  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [bom, setBom] = useState<BOM | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleProductChange = async (productId: number) => {
    setSelectedProductId(productId);
    setLoading(true);
    setSearched(true);
    try {
      const data = await bomService.getBOMByFinishedProductId(productId);
      setBom(data);
    } catch (err) {
      console.error('Failed to look up BOM for product:', err);
      setBom(null);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = finishedProductsList.find((p) => p.itemId === selectedProductId);

  // Cost calculations
  const componentCount = bom?.components?.length || 0;
  const baseCost = bom?.components?.reduce(
    (sum, c) => sum + Number(c.requiredQuantity || 0) * Number(c.standardCost || 0),
    0
  ) || 0;

  const totalCost = bom?.components?.reduce((sum, c) => {
    const qty = Number(c.requiredQuantity || 0);
    const cost = Number(c.standardCost || 0);
    const wastage = 1 + Number(c.wastagePercentage || 0) / 100;
    return sum + qty * cost * wastage;
  }, 0) || 0;

  const wastageCost = totalCost - baseCost;

  return (
    <Box>
      <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', mb: 4, bgcolor: '#FFFFFF' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
            Search Recipe / Formula
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={8}>
              <FormControl fullWidth>
                <InputLabel id="lookup-product-select-label">Select Finished Product</InputLabel>
                <Select
                  labelId="lookup-product-select-label"
                  value={selectedProductId}
                  label="Select Finished Product"
                  onChange={(e) => handleProductChange(Number(e.target.value))}
                >
                  {finishedProductsList.map((item) => (
                    <MenuItem key={item.itemId} value={item.itemId}>
                      {item.itemName} ({item.itemCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Quickly lookup raw material usage and cost rolls for any manufactured asset in the Titan catalog.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Compiling BOM tree structures and loading standard ledger costs...
          </Typography>
        </Box>
      ) : searched && (!bom || bom.components.length === 0) ? (
        <Paper
          variant="outlined"
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
            borderColor: '#E2E8F0',
            bgcolor: '#FFFFFF',
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 48, color: '#D97706', mb: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
            No Recipe Defined
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 400, mx: 'auto' }}>
            There are no raw material mappings configured for{' '}
            <strong>{selectedProduct?.itemName || 'this finished product'}</strong> yet. Click the "BOM Registry" tab to define its manufacturing formula.
          </Typography>
        </Paper>
      ) : bom ? (
        <Grid container spacing={3}>
          {/* Main List */}
          <Grid item xs={12} md={8}>
            <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FFFFFF' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ bgcolor: '#EFF6FF', color: '#2563EB', p: 1, borderRadius: 2, display: 'flex' }}>
                    <BuildIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      Material Formula Breakdown
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Required raw material units for producing 1 finished unit
                    </Typography>
                  </Box>
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Raw Material</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="right">Qty Required</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569' }}>UOM</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="right">Wastage %</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="right">Unit Cost</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="right">Cost Contribution</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bom.components.map((c, index) => {
                        const qty = Number(c.requiredQuantity || 0);
                        const cost = Number(c.standardCost || 0);
                        const wastage = 1 + Number(c.wastagePercentage || 0) / 100;
                        const lineCost = qty * cost * wastage;

                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                {c.rawMaterialName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                ID: #RM-{c.rawMaterialId}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>
                              {qty}
                            </TableCell>
                            <TableCell sx={{ color: '#64748B', fontWeight: 500 }}>
                              {c.unitOfMeasure}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#D97706', fontWeight: 500 }}>
                              {c.wastagePercentage > 0 ? `+${c.wastagePercentage}%` : '0%'}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#475569', fontWeight: 500 }}>
                              ${cost.toFixed(2)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>
                              ${lineCost.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Cost rolls side info */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Product Info Card */}
              <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FFFFFF' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Asset Identity
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mt: 1 }}>
                    {bom.finishedProductName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#2563EB', fontWeight: 600, mt: 0.5 }}>
                    {bom.finishedProductCode || 'N/A'} (ID: {bom.finishedProductId})
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                    BOM Parameters
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>Total Components</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{componentCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>BOM Version</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>v{bom.version || 1}.0</Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Cost Summary Card */}
              <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FFFFFF' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AttachMoneyIcon sx={{ color: '#16A34A' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      Material Cost Rollup
                    </Typography>
                  </Box>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Base Materials</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        ${baseCost.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Est. Wastage</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#D97706' }}>
                        ${wastageCost.toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569' }}>Total BOM Cost</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 850, color: '#16A34A' }}>
                        ${totalCost.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
            borderColor: '#E2E8F0',
            bgcolor: '#FFFFFF',
          }}
        >
          <SearchIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
            Select a Finished Product
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Choose a manufactured asset from the dropdown filter search selection above to load and display its recipe tree structure.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
