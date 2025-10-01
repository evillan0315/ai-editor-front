import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Stack,
  IconButton,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridActionsCellItem,
  GridRowModesModel,
  GridRowModes,
  GridToolbarExport,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridPreProcessEditCellProps,
  GridToolbarProps,
  GridRowId,
} from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { schemaApi } from '@/api/schema';
import { Schema, CreateSchemaPayload, UpdateSchemaPayload, JsonSchema } from '@/types/schema';
import { getCodeMirrorLanguage } from '@/utils'; // Import getCodeMirrorLanguage

// --- Module Augmentation for custom toolbar props ---
declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    onOpenCreateDialog: () => void;
  }
}

// --- Interfaces & Types --- (Updated to reflect module augmentation)
interface EditToolbarProps extends GridToolbarProps {
  onOpenCreateDialog: () => void;
}

// --- Styles ---
const dataGridContainerSx = {
  height: '700px', // Fixed height for the DataGrid
  width: '100%',
  '& .actions': {
    color: 'text.secondary',
  },
  '& .textPrimary': {
    color: 'text.primary',
  },
};

// --- Custom Toolbar Component ---
function EditToolbar(props: EditToolbarProps) {
  const { onOpenCreateDialog, ...other } = props;

  return (
    <GridToolbarContainer className="flex justify-between items-center p-2" {...other}> {/* Pass GridToolbarProps down */}
      <Stack direction="row" spacing={1}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
      </Stack>
      <Button
        color="primary"
        startIcon={<AddIcon />}
        onClick={onOpenCreateDialog}
        variant="contained"
        size="small"
      >
        Add New Schema
      </Button>
    </GridToolbarContainer>
  );
}

// --- Main Component ---
const SchemaDataGrid: React.FC = () => {
  const [rows, setRows] = useState<Schema[]>([]);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Create Schema Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSchemaName, setNewSchemaName] = useState('');
  const [newSchemaContent, setNewSchemaContent] = useState<string>('{}'); // Default empty JSON object

  // State for View/Edit Schema Content Dialog
  const [schemaContentDialogOpen, setSchemaContentDialogOpen] = useState(false);
  const [currentViewSchema, setCurrentViewSchema] = useState<Schema | null>(null);
  const [isEditingSchemaContent, setIsEditingSchemaContent] = useState(false);
  const [editedSchemaContent, setEditedSchemaContent] = useState<string>('{}');
  const [contentDialogLoading, setContentDialogLoading] = useState(false);

  // --- Data Fetching ---
  const fetchSchemas = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedSchemas = await schemaApi.getAllSchemas();
      setRows(fetchedSchemas.map(s => ({ ...s, id: s.id }))); // Ensure 'id' is present and matches GridRowId
    } catch (err) {
      console.error('Failed to fetch schemas:', err);
      setError('Failed to load schemas. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  // --- Row Editing Handlers (for DataGrid name field) ---
  const handleRowEditStart = useCallback(
    (params: any, event: any) => {
      event.defaultMuiPrevented = true;
    },
    [],
  );

  const handleRowEditStop = useCallback(
    (params: any, event: any) => {
      event.defaultMuiPrevented = true;
    },
    [],
  );

  const handleEditClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel((prev) => ({
        ...prev,
        [id]: { mode: GridRowModes.Edit },
      }));
    },
    [],
  );

  const handleSaveClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel((prev) => ({
        ...prev,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      }));
    },
    [],
  );

  const handleDeleteClick = useCallback(
    (id: GridRowId) => async () => {
      if (!confirm('Are you sure you want to delete this schema?')) {
        return;
      }
      try {
        // Ensure id is treated as string for API call if necessary, or update API type
        await schemaApi.deleteSchema(id.toString());
        setRows((oldRows) => oldRows.filter((row) => row.id !== id));
      } catch (err) {
        console.error('Failed to delete schema:', err);
        setError('Failed to delete schema. Please try again.');
      }
    },
    [],
  );

  const handleCancelClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel((prev) => ({
        ...prev,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      }));

      const editedRow = rows.find((row) => row.id === id);
      if (editedRow && (editedRow as any).isNew) { // Using 'any' to check for temporary 'isNew' flag
        setRows((oldRows) => oldRows.filter((row) => row.id !== id));
      }
    },
    [rows],
  );

  const processRowUpdate = useCallback(
    async (newRow: Schema) => {
      // DataGrid often passes a new object, so ensure we get the full existing schema if needed
      const oldRow = rows.find(r => r.id === newRow.id);
      if (!oldRow) {
        throw new Error("Row not found for update.");
      }
      
      const updatedRowData = { ...oldRow, ...newRow, isNew: false };
      try {
        const payload: UpdateSchemaPayload = {
          name: updatedRowData.name,
          // schema is not editable via DataGrid's direct cell edit for simplicity
        };
        const result = await schemaApi.updateSchema(updatedRowData.id, payload);
        // Important: Update the entire row with the result from the API call
        setRows(rows.map((row) => (row.id === updatedRowData.id ? result : row)));
        return result;
      } catch (err) {
        console.error('Failed to update schema name:', err);
        setError('Failed to update schema name. Please try again.');
        throw err; // Re-throw to prevent data grid from updating row
      }
    },
    [rows],
  );

  const handleProcessRowUpdateError = useCallback((error: Error) => {
    console.error('Error during row update:', error);
    // Optionally display an message to the user
  }, []);

  // --- Create Schema Dialog Handlers ---
  const handleOpenCreateDialog = () => {
    setNewSchemaName('');
    setNewSchemaContent('{}');
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setError(null); // Clear error on close
  };

  const handleCreateSchemaSubmit = async () => {
    if (!newSchemaName.trim()) {
      setError('Schema name is required.');
      return;
    }

    try {
      let parsedSchema: JsonSchema = {};
      try {
        parsedSchema = JSON.parse(newSchemaContent);
      } catch (jsonErr) {
        setError('Invalid JSON schema content.');
        return;
      }

      setContentDialogLoading(true);
      const payload: CreateSchemaPayload = {
        name: newSchemaName,
        schema: parsedSchema,
      };
      const createdSchema = await schemaApi.createSchema(payload);
      setRows((oldRows) => [...oldRows, { ...createdSchema, id: createdSchema.id }]); // Ensure id is set
      handleCloseCreateDialog();
    } catch (err) {
      console.error('Failed to create schema:', err);
      setError('Failed to create schema. Please check your input and try again.');
    } finally {
      setContentDialogLoading(false);
    }
  };

  // --- View/Edit Schema Content Dialog Handlers ---
  const handleOpenSchemaContentDialog = useCallback(
    (schema: Schema, editing = false) => () => {
      setCurrentViewSchema(schema);
      setIsEditingSchemaContent(editing);
      setEditedSchemaContent(JSON.stringify(schema.schema, null, 2));
      setSchemaContentDialogOpen(true);
    },
    [],
  );

  const handleCloseSchemaContentDialog = () => {
    setSchemaContentDialogOpen(false);
    setCurrentViewSchema(null);
    setIsEditingSchemaContent(false);
    setEditedSchemaContent('{}');
    setError(null); // Clear error on close
  };

  const handleSaveSchemaContent = async () => {
    if (!currentViewSchema) return;

    try {
      let parsedSchema: JsonSchema = {};
      try {
        parsedSchema = JSON.parse(editedSchemaContent);
      } catch (jsonErr) {
        setError('Invalid JSON schema content.');
        return;
      }

      setContentDialogLoading(true);
      const payload: UpdateSchemaPayload = {
        schema: parsedSchema,
      };
      const updatedSchema = await schemaApi.updateSchema(currentViewSchema.id, payload);
      setRows((oldRows) =>
        oldRows.map((row) => (row.id === updatedSchema.id ? updatedSchema : row))
      );
      handleCloseSchemaContentDialog();
    } catch (err) {
      console.error('Failed to update schema content:', err);
      setError('Failed to update schema content. Please try again.');
    } finally {
      setContentDialogLoading(false);
    }
  };

  // --- Column Definitions ---
  const columns: GridColDef<Schema>[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 90,
      editable: false,
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      editable: true,
      preProcessEditCellProps: (params: GridPreProcessEditCellProps) => {
        const hasError = !params.props.value;
        return { ...params.props, error: hasError };
      },
    },
    {
      field: 'schema',
      headerName: 'Schema',
      flex: 2,
      editable: false, // Schema content is edited in a dialog
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={handleOpenSchemaContentDialog(params.row, false)} // View-only
        >
          View Schema JSON
        </Button>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      editable: false,
      valueFormatter: (value) => value ? new Date(value).toLocaleString() : '',
    },
    {
      field: 'updatedAt',
      headerName: 'Updated At',
      width: 180,
      editable: false,
      valueFormatter: (value) => value ? new Date(value).toLocaleString() : '',
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        const schema = rows.find(r => r.id === id);

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              sx={{
                color: 'primary.main',
              }}
              onClick={handleSaveClick(id)}
              key="save"
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
              key="cancel"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit Name"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
            key="edit"
          />,
          <GridActionsCellItem
            icon={<VisibilityIcon />}
            label="Edit Schema JSON"
            className="textPrimary"
            onClick={handleOpenSchemaContentDialog(schema!, true)} // Editable
            color="inherit"
            key="edit-json"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
            key="delete"
          />,
        ];
      },
    },
  ];

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-full">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading schemas...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={dataGridContainerSx}>
      <DataGrid
        rows={rows}
        columns={columns}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={setRowModesModel}
        onRowEditStart={handleRowEditStart}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { onOpenCreateDialog: handleOpenCreateDialog },
        }}
        paginationModel={{ page: 0, pageSize: 10 }} // Default pagination
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          sorting: {
            sortModel: [{ field: 'createdAt', sort: 'desc' }], // Sort by creation date descending
          },
        }}
      />

      {/* Create Schema Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} fullWidth maxWidth="md">
        <DialogTitle>Create New Schema</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          <TextField
            autoFocus
            margin="dense"
            label="Schema Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newSchemaName}
            onChange={(e) => setNewSchemaName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" sx={{ mb: 1 }}>Schema Content (JSON)</Typography>
          <CodeMirrorEditor
            value={newSchemaContent}
            extensions={getCodeMirrorLanguage('new-schema.json', false)}
            filePath="new-schema.json"
            onChange={setNewSchemaContent}
            height="300px"
            width="100%"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleCreateSchemaSubmit} color="primary" variant="contained" disabled={contentDialogLoading}>
            {contentDialogLoading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View/Edit Schema Content Dialog */}
      <Dialog
        open={schemaContentDialogOpen}
        onClose={handleCloseSchemaContentDialog}
        fullWidth         maxWidth="md"
      >
        <DialogTitle>
          {isEditingSchemaContent ? 'Edit Schema Content' : 'View Schema Content'}: {currentViewSchema?.name}
        </DialogTitle>
        <DialogContent>
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          <CodeMirrorEditor
            value={editedSchemaContent}
            extensions={getCodeMirrorLanguage(`${currentViewSchema?.name || 'schema'}.json`, false)}
            filePath={`${currentViewSchema?.name || 'schema'}.json`}
            onChange={setEditedSchemaContent}
            height="400px"
            width="100%"
            editable={isEditingSchemaContent}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSchemaContentDialog} color="secondary">
            {isEditingSchemaContent ? 'Cancel' : 'Close'}
          </Button>
          {isEditingSchemaContent && (
            <Button onClick={handleSaveSchemaContent} color="primary" variant="contained" disabled={contentDialogLoading}>
              {contentDialogLoading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SchemaDataGrid;
