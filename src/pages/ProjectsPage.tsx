import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import {
  organizationStore,
  setCurrentOrganization,
} from '@/stores/organizationStore';
import {
  projectStore,
  setLoading,
  setError,
  setProjects,
  addProject,
  updateProjectInStore,
  deleteProjectFromStore,
} from '@/stores/projectStore';
import { authStore } from '@/stores/authStore';
import {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} from '@/api/project';
import { Project, CreateProjectDto, UpdateProjectDto } from '@/types';

import {
  Box,
  Typography,
  Container,
  Paper,
  useTheme,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WorkIcon from '@mui/icons-material/Work';

// Interfaces for dialog forms
interface ProjectFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (dto: CreateProjectDto) => Promise<void>;
  onUpdate?: (id: string, dto: UpdateProjectDto) => Promise<void>;
  initialData?: Project | null;
  isEditMode: boolean;
  loading: boolean;
  organizationId: string; // New: Pass organizationId to the dialog
}

const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({
  open,
  onClose,
  onCreate, // New prop
  onUpdate, // New prop
  initialData,
  isEditMode,
  loading,
  organizationId, // Destructure new prop
}) => {
  const theme = useTheme();
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(
    initialData?.description || '',
  );
  const [path, setPath] = useState(initialData?.path || '');
  const [technologies, setTechnologies] = useState(
    initialData?.technologies.join(', ') || '',
  );
  const [repositoryUrl, setRepositoryUrl] = useState(
    initialData?.repositoryUrl || '',
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialData?.name || '');
    setDescription(initialData?.description || '');
    setPath(initialData?.path || '');
    setTechnologies(initialData?.technologies.join(', ') || '');
    setRepositoryUrl(initialData?.repositoryUrl || '');
    setFormError(null);
  }, [initialData, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !path.trim()) {
      setFormError('Project Name and Path are required.');
      return;
    }
    setFormError(null);

    const dto: CreateProjectDto = { // Ensure type is CreateProjectDto
      name,
      description,
      path,
      technologies: technologies
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      repositoryUrl,
      organizationId, // Pass organizationId directly from props
      // ownerId and metadata are optional and can be omitted if not directly managed by this form
    };

    try {
      if (isEditMode) {
        if (onUpdate && initialData?.id) {
          await onUpdate(initialData.id, dto);
        }
      } else {
        if (onCreate) {
          await onCreate(dto);
        }
      }
      onClose(); // Close dialog on successful submission
    } catch (error) {
      setFormError(`Submission failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle sx={{ color: theme.palette.text.primary }}>
        {isEditMode ? 'Edit Project' : 'Create New Project'}
      </DialogTitle>
      <DialogContent>
        {formError && <Alert severity="error">{formError}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Project Name"
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          sx={{ mt: 2 }}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
        />
        <TextField
          margin="dense"
          id="description"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
        />
        <TextField
          margin="dense"
          id="path"
          label="Project Path"
          type="text"
          fullWidth
          variant="outlined"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          disabled={loading}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
        />
        <TextField
          margin="dense"
          id="technologies"
          label="Technologies (comma-separated)"
          type="text"
          fullWidth
          variant="outlined"
          value={technologies}
          onChange={(e) => setTechnologies(e.target.value)}
          disabled={loading}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
        />
        <TextField
          margin="dense"
          id="repositoryUrl"
          label="Repository URL"
          type="text"
          fullWidth
          variant="outlined"
          value={repositoryUrl}
          onChange={(e) => setRepositoryUrl(e.target.value)}
          disabled={loading}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading || !name.trim() || !path.trim()}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {isEditMode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { organizationId } = useParams<{ organizationId: string }>();
  const theme = useTheme();
  const { isLoggedIn } = useStore(authStore);
  const { currentOrganization } = useStore(organizationStore);
  const { projects, loading, error } = useStore(projectStore);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProjectToEdit, setCurrentProjectToEdit] =
    useState<Project | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (organizationId) {
      fetchProjects(organizationId);
    } else {
      setError('No organization selected. Please go back to organizations.');
    }
  }, [isLoggedIn, navigate, organizationId]);

  // If organizationId changes, but currentOrganization in store doesn't match, update it
  useEffect(() => {
    if (organizationId && currentOrganization?.id !== organizationId) {
      // This is a simple fallback, in a real app you might fetch the organization details here
      setCurrentOrganization({
        id: organizationId,
        name: `Organization ${organizationId}`, // Fallback name
        createdAt: '',
        updatedAt: '',
      });
    }
  }, [organizationId, currentOrganization]);

  const fetchProjects = async (orgId: string) => {
    setLoading(true);
    setError(null);
    try {
      const projs = await getProjects(orgId);
      setProjects(projs);
    } catch (err) {
      setError(
        `Failed to fetch projects: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewProject = async (dto: CreateProjectDto) => {
    // organizationId is now included in dto from the dialog itself.
    // No need to spread it here.
    setLoading(true);
    setError(null);
    try {
      const newProj = await createProject(dto);
      addProject(newProj);
      if (organizationId) { // Ensure organizationId is not null before fetching
        fetchProjects(organizationId); // Re-fetch to ensure list is accurate
      }
    } catch (err) {
      setError(
        `Failed to create project: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err; // Re-throw to allow dialog to catch
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (id: string, dto: UpdateProjectDto) => {
    // organizationId is now included in dto from the dialog itself,
    // it's optional in UpdateProjectDto so passing it is fine.
    setLoading(true);
    setError(null);
    try {
      const updatedProj = await updateProject(id, dto);
      updateProjectInStore(updatedProj);
    } catch (err) {
      setError(
        `Failed to update project: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err; // Re-throw to allow dialog to catch
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this project? This action cannot be undone.',
      )
    ) {
      setLoading(true);
      setError(null);
      try {
        await deleteProject(id);
        deleteProjectFromStore(id);
        if (organizationId) {
          fetchProjects(organizationId); // Re-fetch to ensure list is accurate
        }
      } catch (err) {
        setError(
          `Failed to delete project with ID ${id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setCurrentProjectToEdit(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (proj: Project) => {
    setIsEditMode(true);
    setCurrentProjectToEdit(proj);
    setIsFormDialogOpen(true);
  };

  if (!isLoggedIn) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="warning">Please log in to manage projects.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          minHeight: 'calc(100vh - 120px)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => navigate('/organizations')}
              disabled={loading}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              <WorkIcon sx={{ fontSize: 40, mr: 1 }} /> Projects for{' '}
              {currentOrganization?.name || 'Loading...'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            disabled={loading || !organizationId}
          >
            Create New Project
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Manage all projects within this organization.
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box className="flex justify-center items-center flex-grow">
            <CircularProgress size={40} />
            <Typography
              variant="h6"
              sx={{ ml: 2, color: theme.palette.text.secondary }}
            >
              Loading projects...
            </Typography>
          </Box>
        ) : projects.length === 0 ? (
          <Alert severity="info">
            No projects found for this organization. Click 'Create New Project'
            to add one.
          </Alert>
        ) : (
          <TableContainer
            component={Paper}
            sx={{ border: `1px solid ${theme.palette.divider}` }}
          >
            <Table>
              <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      color: theme.palette.text.primary,
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      color: theme.palette.text.primary,
                    }}
                  >
                    Description
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      color: theme.palette.text.primary,
                    }}
                  >
                    Path
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      color: theme.palette.text.primary,
                    }}
                  >
                    Technologies
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 'bold',
                      color: theme.palette.text.primary,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((proj) => (
                  <TableRow key={proj.id} hover>
                    <TableCell sx={{ color: theme.palette.text.primary }}>
                      {proj.name}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>
                      {proj.description}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>
                      {proj.path}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>
                      {proj.technologies?.join(', ') || 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Project">
                        <IconButton
                          color="info"
                          onClick={() => handleOpenEditDialog(proj)}
                          disabled={loading}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Project">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteProject(proj.id)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <ProjectFormDialog
        open={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onCreate={!isEditMode ? handleCreateNewProject : undefined}
        onUpdate={isEditMode ? handleUpdateProject : undefined}
        initialData={currentProjectToEdit}
        isEditMode={isEditMode}
        loading={loading}
        organizationId={organizationId || ''} // Pass organizationId, default to empty string if not available (though it should be)
      />
    </Container>
  );
};

export default ProjectsPage;
