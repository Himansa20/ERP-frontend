import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FactoryIcon from '@mui/icons-material/Factory';
import BuildIcon from '@mui/icons-material/Build';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { BOM } from './bomService';

interface BomDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  bom: BOM | null;
}

export default function BomDetailsDrawer({
  open,
  onClose,
  bom,
}: BomDetailsDrawerProps) {
  if (!bom) return null;

  // Formatting date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Calculations
  const componentCount = bom.components?.length || 0;

  // Cumulative material standard cost (excluding wastage)
  const baseCost = bom.components?.reduce(
    (sum, c) => sum + Number(c.requiredQuantity || 0) * Number(c.standardCost || 0),
    0
  ) || 0;

  // Total material cost incorporating wastage percentage
  const totalCost = bom.components?.reduce((sum, c) => {
    const qty = Number(c.requiredQuantity || 0);
    const cost = Number(c.standardCost || 0);
    const wastage = 1 + Number(c.wastagePercentage || 0) / 100;
    return sum + qty * cost * wastage;
  }, 0) || 0;

  const wastageCost = totalCost - baseCost;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 540 },
            boxShadow: '-4px 0 15px -3px rgba(0, 0, 0, 0.05)',
            borderLeft: '1px solid #E2E8F0',
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F8FAFC' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                BOM Structure Details
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                Version: v{bom.version || 1}.0
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#64748B' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          <Stack spacing={3}>
            {/* Finished Product Identity */}
            <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2, boxShadow: 'none' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                  Finished Product Item
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                  {bom.finishedProductName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#2563EB', fontWeight: 600 }}>
                  Code: {bom.finishedProductCode || 'N/A'} (ID: #PROD-{bom.finishedProductId})
                </Typography>
              </CardContent>
            </Card>

            {/* Financial Rollups / Cost Summary */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#475569',
                  fontWeight: 700,
                  mb: 1.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <AttachMoneyIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Manufacturing Cost Summary
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2, boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Base Material Cost
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        ${baseCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Est. Wastage Cost
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        ${wastageCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ borderTop: '1px dashed #E2E8F0', pt: 2, mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569' }}>
                          Total Rolled Standard Cost:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 850, color: '#16A34A' }}>
                          ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Component list table */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#475569',
                  fontWeight: 700,
                  mb: 1.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <BuildIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Component Breakdown ({componentCount})
              </Typography>
              
              {bom.components && bom.components.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>Raw Material</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }} align="right">Qty (UOM)</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }} align="right">Wastage %</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }} align="right">Total Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bom.components.map((c, index) => {
                        const qty = Number(c.requiredQuantity || 0);
                        const cost = Number(c.standardCost || 0);
                        const wasteVal = 1 + Number(c.wastagePercentage || 0) / 100;
                        const lineTotal = qty * cost * wasteVal;

                        return (
                          <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ py: 1.2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.825rem' }}>
                                {c.rawMaterialName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                ID: #RM-{c.rawMaterialId}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.825rem' }}>
                              {qty} {c.unitOfMeasure}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#D97706', fontSize: '0.825rem', fontWeight: 500 }}>
                              {c.wastagePercentage > 0 ? `+${c.wastagePercentage}%` : '0%'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.825rem' }}>
                              ${lineTotal.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderColor: '#E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
                  <WarningAmberIcon sx={{ color: '#D97706', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#64748B' }}>No component formulas defined.</Typography>
                </Paper>
              )}
            </Box>

            {/* Version & Lifecycle Info */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#475569',
                  fontWeight: 700,
                  mb: 1.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <AssignmentIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Administrative Metadata
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2, boxShadow: 'none' }}>
                <CardContent sx={{ p: 2, '& .MuiGrid-container': { rowGap: 1.5 } }}>
                  <Grid container>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        BOM Version
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        Version {bom.version || 1}.0
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        Creation Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {formatDate(bom.lastUpdated)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2.5, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={onClose}
            variant="outlined"
            fullWidth
            sx={{
              color: '#475569',
              borderColor: '#E2E8F0',
              textTransform: 'none',
              fontWeight: 600,
              py: 1,
              '&:hover': {
                bgcolor: '#F8FAFC',
                borderColor: '#CBD5E1',
              },
            }}
          >
            Close Structure Details
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
