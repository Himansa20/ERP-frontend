import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Button,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import StorageIcon from '@mui/icons-material/Storage';
import PaidIcon from '@mui/icons-material/Paid';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { ParsedItem } from './itemService';

interface ItemDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  item: ParsedItem | null;
}

export default function ItemDetailsDrawer({ open, onClose, item }: ItemDetailsDrawerProps) {
  if (!item) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const isLowStock = item.currentStock <= item.reorderLevel;
  const totalAssetValue = item.currentStock * item.standardCost;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 460 },
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
              <InventoryIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                Item Master Profile
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontFamily: 'monospace' }}>
                {item.itemCode}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#64748B' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          <Stack spacing={3.5}>
            {/* Status Warning Card */}
            {isLowStock && (
              <Card sx={{ bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 2 }}>
                <CardContent sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <WarningIcon sx={{ color: '#D97706', mt: 0.2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#92400E', fontWeight: 700 }}>
                      Low Stock Threshold Alert
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#B45309', mt: 0.5, fontSize: '0.85rem' }}>
                      Current stock ({item.currentStock} {item.unitOfMeasure}) is at or below the safety reorder limit of {item.reorderLevel} {item.unitOfMeasure}.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Section 1: Basic Info */}
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
                <CategoryIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Item Catalog Details
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Item Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {item.itemName}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Category
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {item.itemCategory}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Classification Type
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {item.itemType}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Unit of Measure
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {item.unitOfMeasure}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Item Status
                      </Typography>
                      <Chip
                        label={item.itemStatus}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.725rem',
                          color: item.itemStatus.toLowerCase() === 'active' ? '#16A34A' : '#64748B',
                          bgcolor: item.itemStatus.toLowerCase() === 'active' ? '#DCFCE7' : '#F1F5F9',
                          border: `1px solid ${item.itemStatus.toLowerCase() === 'active' ? '#BBF7D0' : '#E2E8F0'}`,
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569', whiteSpace: 'pre-line' }}>
                        {item.description || 'No description recorded.'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Section 2: Stock levels */}
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
                <StorageIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Inventory Stock Levels
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Current Stock On Hand
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: isLowStock ? '#D97706' : '#0F172A' }}>
                        {item.currentStock.toLocaleString()} {item.unitOfMeasure}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Reorder Alert Limit
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {item.reorderLevel.toLocaleString()} {item.unitOfMeasure}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Section 3: Value/Cost Ledger */}
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
                <PaidIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Asset & Cost Valuations
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Standard Unit Cost
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        ${item.standardCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Estimated Inventory Value
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#16A34A' }}>
                        ${totalAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Section 4: Lifecycle Info */}
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
                <InfoIcon sx={{ fontSize: 18, color: '#64748B' }} />
                System Audit Trail
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        System Record ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        #{item.itemId}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Entity Schema Version
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        v{item.version || 0}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        System Entry Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {formatDate(item.createdDate)}
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
            Close Profile
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
