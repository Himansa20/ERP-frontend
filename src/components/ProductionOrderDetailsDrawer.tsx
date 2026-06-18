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
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { ProductionOrder } from './productionOrderService';

interface ProductionOrderDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  order: ProductionOrder | null;
  productsMap: Record<number, string>;
  employeesMap: Record<number, string>;
}

export default function ProductionOrderDetailsDrawer({
  open,
  onClose,
  order,
  productsMap,
  employeesMap,
}: ProductionOrderDetailsDrawerProps) {
  if (!order) return null;

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

  const status = order.status || 'Planned';
  const isCompleted = status === 'Completed';
  const isInProgress = status === 'InProgress';
  const isCancelled = status === 'Cancelled';

  const planned = Number(order.quantityToProduce || 0);
  const produced = Number(order.quantityProduced || 0);
  const progressPercent = planned > 0 ? Math.min(Math.round((produced / planned) * 100), 100) : 0;

  const getPriorityStyles = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return { color: '#DC2626', bgcolor: '#FEE2E2', border: '#FECACA' };
      case 'MEDIUM':
        return { color: '#D97706', bgcolor: '#FEF3C7', border: '#FDE68A' };
      case 'LOW':
      default:
        return { color: '#475569', bgcolor: '#F1F5F9', border: '#E2E8F0' };
    }
  };

  const priorityStyle = getPriorityStyles(order.priority);

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
              <PrecisionManufacturingIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                Production Order
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                Order Ref: #{order.productionOrderId}
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
            {/* Status & Priority Card */}
            <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 600, mb: 0.5 }}>
                      ORDER STATUS
                    </Typography>
                    <Chip
                      label={isCompleted ? 'Completed' : isInProgress ? 'In Progress' : isCancelled ? 'Cancelled' : 'Planned'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: isCompleted ? '#16A34A' : isInProgress ? '#2563EB' : isCancelled ? '#DC2626' : '#475569',
                        bgcolor: isCompleted ? '#DCFCE7' : isInProgress ? '#EFF6FF' : isCancelled ? '#FEF2F2' : '#F1F5F9',
                        border: `1px solid ${isCompleted ? '#BBF7D0' : isInProgress ? '#BFDBFE' : isCancelled ? '#FECACA' : '#E2E8F0'}`,
                      }}
                    />
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 600, mb: 0.5 }}>
                      PRIORITY LEVEL
                    </Typography>
                    <Chip
                      label={order.priority || 'LOW'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: priorityStyle.color,
                        bgcolor: priorityStyle.bgcolor,
                        border: `1px solid ${priorityStyle.border}`,
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Section 1: Product Information */}
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
                <InventoryIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Product Information
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Finished Product Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {productsMap[Number(order.finishedProductId)] || `Product #${order.finishedProductId}`}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Product ID / Code
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        #{order.finishedProductId}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Section 2: Progress & Yield */}
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
                <TrendingUpIcon sx={{ fontSize: 18, color: '#64748B' }} />
                Production Progress
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        Planned Quantity
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 750, color: '#0F172A' }}>
                        {planned.toLocaleString()} Units
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        Produced Quantity
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 750, color: '#16A34A' }}>
                        {produced.toLocaleString()} Units
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                        Yield Completion
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 700 }}>
                        {progressPercent}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercent}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#F1F5F9',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: isCompleted ? '#16A34A' : '#2563EB',
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Section 3: Scheduling Information */}
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
                Scheduling & Assignment
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2.5 } }}>
                  <Grid container>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Start Date / Time
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {formatDate(order.startDate || order.productionDate)}
                      </Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Target Completion
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {formatDate(order.endDate)}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Assigned Supervisor
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <PersonIcon sx={{ fontSize: 16, color: '#64748B' }} />
                        {employeesMap[Number(order.employeeId)] || `Supervisor #${order.employeeId}`}
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
