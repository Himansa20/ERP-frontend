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
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryIcon from '@mui/icons-material/History';
import SpeedIcon from '@mui/icons-material/Speed';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import { Warehouse } from './warehouseService';

interface WarehouseDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  warehouse: Warehouse | null;
}

export default function WarehouseDetailsDrawer({
  open,
  onClose,
  warehouse,
}: WarehouseDetailsDrawerProps) {
  if (!warehouse) return null;

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

  const isStatusActive = warehouse.status === 'ACTIVE';
  
  // Color configuration for utilization
  const util = warehouse.currentUtilization || 0;
  let barColor = '#16A34A'; // Success
  if (util > 85) {
    barColor = '#DC2626'; // Danger
  } else if (util > 70) {
    barColor = '#D97706'; // Warning
  }

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
              <WarehouseIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                Warehouse Details
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                ID: {warehouse.warehouseId}
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
            {/* Status & Name Card */}
            <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={warehouse.warehouseCode}
                    size="small"
                    sx={{
                      fontWeight: 750,
                      fontSize: '0.75rem',
                      color: '#1E3A8A',
                      bgcolor: '#DBEAFE',
                      border: '1px solid #BFDBFE',
                    }}
                  />
                  <Chip
                    label={warehouse.status}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: isStatusActive ? '#16A34A' : '#DC2626',
                      bgcolor: isStatusActive ? '#DCFCE7' : '#FEE2E2',
                      border: `1px solid ${isStatusActive ? '#BBF7D0' : '#FECACA'}`,
                    }}
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 750, color: '#0F172A', mb: 1 }}>
                  {warehouse.warehouseName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
                  {warehouse.description || 'No description provided.'}
                </Typography>
              </CardContent>
            </Card>

            {/* Section 1: Warehouse Information (Capacity / Storage) */}
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
                <CorporateFareIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Warehouse & Storage Info
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Total Capacity
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {warehouse.capacity ? Number(warehouse.capacity).toLocaleString() : '0'} sq ft
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Storage Locations
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {warehouse.storageLocationsCount} Zones / Aisles
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, mt: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                          Current Space Utilization
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: barColor }}>
                          {util}% Capacity Filled
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={util}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#E2E8F0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: barColor,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Section 2: Location Information */}
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
                <HomeIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Location Information
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Street Address
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {warehouse.address || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        City
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {warehouse.city || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Province / State
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {warehouse.provinceState || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Section 3: Management Information */}
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
                <PersonIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Management Information
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Warehouse Manager
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {warehouse.managerName || 'Unassigned'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Email Address
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: warehouse.email ? '#2563EB' : '#0F172A',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <EmailIcon sx={{ fontSize: 16 }} />
                        {warehouse.email || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Contact Number
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: '#0F172A',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <PhoneIcon sx={{ fontSize: 16 }} />
                        {warehouse.contactNumber || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Section 4: Audit Trails */}
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
                <CalendarTodayIcon sx={{ fontSize: 18, color: '#64748B' }} />
                System Information
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Created Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 16, color: '#64748B' }} />
                        {formatDate(warehouse.createdDate)}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Last Updated Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <HistoryIcon sx={{ fontSize: 16, color: '#64748B' }} />
                        {formatDate(warehouse.lastUpdatedDate)}
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
            Close Details
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
