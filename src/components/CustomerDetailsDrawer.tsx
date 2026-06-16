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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryIcon from '@mui/icons-material/History';
import GroupIcon from '@mui/icons-material/Group';
import { Customer } from './customerService';
import { getContactPerson } from './CustomerTable';

interface CustomerDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function CustomerDetailsDrawer({
  open,
  onClose,
  customer,
}: CustomerDetailsDrawerProps) {
  if (!customer) return null;

  // Format date helper
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

  const isStatusActive = (customer.customerType || 'ACTIVE').toUpperCase() === 'ACTIVE';

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
              <GroupIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                Customer Profile
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                ID: {customer.customerId}
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
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Customer Identity
                  </Typography>
                  <Chip
                    label={customer.customerType || 'ACTIVE'}
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
                <Typography variant="h5" sx={{ fontWeight: 750, color: '#0F172A', mb: 0.5 }}>
                  {customer.customerName}
                </Typography>
              </CardContent>
            </Card>

            {/* Section 1: Contact Information */}
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
                Contact Information
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5, '& .MuiGrid-container': { rowGap: 2 } }}>
                  <Grid container>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Contact Person (Representative)
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {getContactPerson(customer)}
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
                          color: customer.email ? '#2563EB' : '#0F172A',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <EmailIcon sx={{ fontSize: 16 }} />
                        {customer.email || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Phone Number
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
                        {customer.contactNo || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Section 2: Address Information */}
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
                Address Information
              </Typography>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                    Billing / Shipping Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                    {customer.address || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Section 3: System Information */}
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
                        Registration Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 16, color: '#64748B' }} />
                        {formatDate(customer.registrationDate || new Date().toISOString())}
                      </Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Last Updated Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <HistoryIcon sx={{ fontSize: 16, color: '#64748B' }} />
                        {formatDate(customer.registrationDate || new Date().toISOString())}
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
