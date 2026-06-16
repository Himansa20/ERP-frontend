import { useState, useEffect } from 'react';
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
  Skeleton,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShieldIcon from '@mui/icons-material/Shield';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';
import DnsIcon from '@mui/icons-material/Dns';
import { auditLogService, AuditLogDetails } from './auditLogService';

interface AuditLogDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  logId: number | null;
}

export default function AuditLogDetailsDrawer({
  open,
  onClose,
  logId,
}: AuditLogDetailsDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<AuditLogDetails | null>(null);

  useEffect(() => {
    if (!open || logId === null) {
      setDetails(null);
      setError(null);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await auditLogService.getAuditLogById(logId);
        setDetails(data);
      } catch (err: any) {
        console.error('Error fetching audit details:', err);
        setError(err.message || 'Failed to load audit log details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [open, logId]);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Get action color styling
  const getActionColor = (action?: string) => {
    const act = (action || '').toUpperCase();
    switch (act) {
      case 'CREATE':
        return { color: '#16A34A', bg: '#DCFCE7', border: '#BBF7D0' };
      case 'UPDATE':
        return { color: '#2563EB', bg: '#DBEAFE', border: '#BFDBFE' };
      case 'DELETE':
        return { color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' };
      case 'APPROVE':
        return { color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' };
      case 'LOGIN':
      case 'LOGOUT':
        return { color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' };
      default:
        return { color: '#475569', bg: '#F1F5F9', border: '#E2E8F0' };
    }
  };

  const actionStyle = getActionColor(details?.actionType);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 500 },
            boxShadow: '-4px 0 20px -3px rgba(0, 0, 0, 0.08)',
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
              <ShieldIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                Audit Log Details
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                Log ID: {logId}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#64748B' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          {loading ? (
            <Stack spacing={3}>
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Stack>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          ) : details ? (
            <Stack spacing={3}>
              {/* Activity Identity Card */}
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Security Action
                    </Typography>
                    <Chip
                      label={details.actionType}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: actionStyle.color,
                        bgcolor: actionStyle.bg,
                        border: `1px solid ${actionStyle.border}`,
                      }}
                    />
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A', mb: 1 }}>
                    {details.description}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 14 }} />
                    {formatDate(details.actionDate)}
                  </Typography>
                </CardContent>
              </Card>

              {/* Section 1: Audit Information */}
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
                  Audit Information
                </Typography>
                <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          Audit Log ID
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                          #{details.logId}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          Timestamp
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                          {formatDate(details.actionDate)}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          Operator User
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                          {details.employeeName || `Employee #${details.employeeId}`}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          User Security Role
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563EB' }}>
                          {details.userRole}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          Entity Type (Table)
                        </Typography>
                        <Chip
                          label={details.tableName}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            color: '#475569',
                            bgcolor: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          Entity ID (Record ID)
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                          {details.recordId ? `ID: ${details.recordId}` : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>

              {/* Section 2: Change Information */}
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
                  <HistoryIcon sx={{ fontSize: 18, color: '#64748B' }} />
                  Change Information
                </Typography>
                <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          Change Summary
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#0F172A', bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #F1F5F9' }}>
                          {details.changeSummary}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          Previous Value
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            p: 1.5,
                            bgcolor: '#0F172A',
                            color: '#F8FAFC',
                            borderRadius: 1.5,
                            fontSize: '0.75rem',
                            fontFamily: 'Consolas, Monaco, "Courier New", Courier, monospace',
                            overflowX: 'auto',
                            maxHeight: 150,
                          }}
                        >
                          {details.previousValue}
                        </Box>
                      </Box>

                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          New Value
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            p: 1.5,
                            bgcolor: '#0F172A',
                            color: '#10B981', // Success color for new data
                            borderRadius: 1.5,
                            fontSize: '0.75rem',
                            fontFamily: 'Consolas, Monaco, "Courier New", Courier, monospace',
                            overflowX: 'auto',
                            maxHeight: 150,
                          }}
                        >
                          {details.newValue}
                        </Box>
                      </Box>
                    </Stack>
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
                  <DnsIcon sx={{ fontSize: 18, color: '#64748B' }} />
                  System Information
                </Typography>
                <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          Module Name
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                          {details.moduleName}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          Request Source
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                          {details.source}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Additional Security Metadata
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          p: 1.5,
                          bgcolor: '#F1F5F9',
                          color: '#334155',
                          borderRadius: 1.5,
                          fontSize: '0.75rem',
                          fontFamily: 'Consolas, Monaco, "Courier New", Courier, monospace',
                          overflowX: 'auto',
                        }}
                      >
                        {details.additionalMetadata}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Stack>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <InfoIcon sx={{ fontSize: 40, color: '#94A3B8', mb: 1.5 }} />
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                No details loaded.
              </Typography>
            </Box>
          )}
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
            Close Audit Log
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
