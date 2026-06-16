import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, IconButton, Paper, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import BuildIcon from '@mui/icons-material/Build';
import { BOM } from './bomService';

interface BomTableProps {
  boms: BOM[];
  loading: boolean;
  error: string | null;
  onView: (bom: BOM) => void;
  onEdit: (bom: BOM) => void;
  onDelete: (bom: BOM) => void;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
  rowCount: number;
}

export default function BomTable({
  boms,
  loading,
  error,
  onView,
  onEdit,
  onDelete,
  paginationModel,
  onPaginationModelChange,
  rowCount,
}: BomTableProps) {

  // Helper date formatter
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'finishedProductId',
      headerName: 'Finished Product ID',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          #PROD-{params.value}
        </Typography>
      ),
    },
    {
      field: 'finishedProductName',
      headerName: 'Finished Product Name',
      width: 250,
      flex: 1.5,
      renderCell: (params) => {
        const code = params.row.finishedProductCode || '';
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
              {params.value}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
              {code}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'totalComponents',
      headerName: 'Total Components',
      width: 160,
      renderCell: (params) => {
        const count = params.row.components?.length || 0;
        return (
          <Chip
            icon={<BuildIcon style={{ fontSize: 13, color: '#2563EB' }} />}
            label={`${count} Items`}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              color: '#2563EB',
              bgcolor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 1.5,
            }}
          />
        );
      },
    },
    {
      field: 'version',
      headerName: 'BOM Version',
      width: 130,
      renderCell: (params) => {
        const ver = params.value || 1;
        return (
          <span style={{ fontWeight: 600, color: '#334155' }}>
            v{ver}.0
          </span>
        );
      },
    },
    {
      field: 'lastUpdated',
      headerName: 'Last Updated',
      width: 160,
      renderCell: (params) => (
        <span>{formatDate(params.value)}</span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', height: '100%', alignItems: 'center' }}>
          <IconButton
            size="small"
            onClick={() => onView(params.row as BOM)}
            title="View Recipe Details"
            sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onEdit(params.row as BOM)}
            title="Edit Structure"
            sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(params.row as BOM)}
            title="Delete BOM"
            sx={{ color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
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
          <InfoIcon /> Error Loading BOMs
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
      <Box sx={{ width: '100%', height: 480 }}>
        <DataGrid
          rows={boms}
          columns={columns}
          getRowId={(row) => row.finishedProductId}
          loading={loading}
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          pageSizeOptions={[5, 10, 25, 50]}
          disableRowSelectionOnClick
          rowHeight={58}
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
