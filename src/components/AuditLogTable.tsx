import { DataGrid, GridColDef, GridSortModel } from '@mui/x-data-grid';
import { Box, Chip, IconButton, Typography, Paper, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { AuditLogResponse } from './auditLogService';

interface AuditLogTableProps {
  logs: AuditLogResponse[];
  loading: boolean;
  error: string | null;
  onViewDetails: (id: number) => void;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
  rowCount: number;
  onSortModelChange?: (model: GridSortModel) => void;
}

export default function AuditLogTable({
  logs,
  loading,
  error,
  onViewDetails,
  paginationModel,
  onPaginationModelChange,
  rowCount,
  onSortModelChange,
}: AuditLogTableProps) {

  // Action Badge styling helper
  const getActionChip = (actionType: string) => {
    const action = (actionType || '').toUpperCase();
    let color = '#475569';
    let bg = '#F1F5F9';
    let border = '#E2E8F0';

    switch (action) {
      case 'CREATE':
        color = '#16A34A'; // Success Color
        bg = '#DCFCE7';
        border = '#BBF7D0';
        break;
      case 'UPDATE':
        color = '#2563EB'; // Primary Color
        bg = '#DBEAFE';
        border = '#BFDBFE';
        break;
      case 'DELETE':
        color = '#DC2626'; // Danger Color
        bg = '#FEE2E2';
        border = '#FECACA';
        break;
      case 'APPROVE':
        color = '#D97706'; // Warning Color
        bg = '#FEF3C7';
        border = '#FDE68A';
        break;
      case 'LOGIN':
      case 'LOGOUT':
        color = '#0284C7'; // Info Color
        bg = '#E0F2FE';
        border = '#BAE6FD';
        break;
      case 'RECEIVE':
      case 'DELIVER':
      case 'COMPLETE':
        color = '#7C3AED'; // Secondary Purple
        bg = '#F5F3FF';
        border = '#DDD6FE';
        break;
    }

    return (
      <Chip
        label={action}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.7rem',
          color: color,
          bgcolor: bg,
          border: `1px solid ${border}`,
          height: 22,
          letterSpacing: '0.025em',
        }}
      />
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'logId',
      headerName: 'Audit ID',
      width: 90,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'employeeName',
      headerName: 'User / Operator',
      width: 160,
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
          <Typography variant="body2" sx={{ fontWeight: 650, color: '#0F172A' }}>
            {params.value || `Employee #${params.row.employeeId || 'System'}`}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actionType',
      headerName: 'Action Type',
      width: 120,
      renderCell: (params) => getActionChip(params.value || 'OTHER'),
    },
    {
      field: 'tableName',
      headerName: 'Entity Type',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#475569', fontSize: '0.8rem' }}>
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'recordId',
      headerName: 'Entity ID',
      width: 90,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
          {params.value ? `ID: ${params.value}` : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 250,
      flex: 2.5,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            color: '#334155',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={params.value}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'actionDate',
      headerName: 'Timestamp',
      width: 180,
      renderCell: (params) => {
        const val = params.value || new Date().toISOString();
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
            <AccessTimeIcon sx={{ fontSize: 14 }} />
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              {new Date(val).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
          <Tooltip title="View Detailed Audit Record">
            <IconButton
              size="small"
              onClick={() => onViewDetails(params.row.logId)}
              sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (error) {
    return (
      <Paper
        sx={{
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderColor: '#FCA5A5',
          bgcolor: '#FEF2F2',
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ color: '#B91C1C', fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon /> Error Loading Compliance Audit Logs
        </Typography>
        <Typography variant="body2" sx={{ color: '#7F1D1D', textAlign: 'center' }}>
          {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: 2,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        bgcolor: '#FFFFFF',
      }}
    >
      <Box sx={{ width: '100%', height: 500 }}>
        <DataGrid
          rows={logs}
          columns={columns}
          getRowId={(row) => row.logId}
          loading={loading}
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          onSortModelChange={onSortModelChange}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          rowHeight={52}
          columnHeaderHeight={48}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#F8FAFC',
              borderBottom: '2px solid #E2E8F0',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
              color: '#475569',
              fontSize: '0.85rem',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: '#F8FAFC',
              },
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
            },
          }}
        />
      </Box>
    </Paper>
  );
}
