import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  Checkbox,
  IconButton,
  Toolbar,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import DeleteIcon from '@mui/icons-material/Delete'; // New import for delete icon
import { IConnection, IClientConnectionUserData } from '@/components/swingers/types';
import { getConnections, deleteConnection } from '@/components/swingers/api/connections';

interface RoomConnectionsTableProps {
  roomId: string;
}

const tableContainerSx = {
  my: 1,
  maxHeight: '400px',
  overflowY: 'auto',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
};

const headerCellSx = {
  fontWeight: 'bold',
  backgroundColor: 'background.paper',
  position: 'sticky',
  top: 0,
  zIndex: 1,
  whiteSpace: 'nowrap',
};

const connectionsTitleSx = {
  mb: 2,
  px: 2,
  pt: 2,
  fontWeight: 'bold',
};

export const RoomConnectionsTable: React.FC<RoomConnectionsTableProps> = ({ roomId }) => {
  const [connections, setConnections] = useState<IConnection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<readonly string[]>([]); // State for selected connection IDs
  const [isDeleting, setIsDeleting] = useState<boolean>(false); // State for delete operation

  const fetchRoomConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedConnections = await getConnections(roomId);
      setConnections(fetchedConnections);
      setSelected([]); // Clear selection on refetch
    } catch (err: any) {
      console.error(`Error fetching connections for room ${roomId}:`, err);
      setError(`Failed to load connections: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoomConnections();
  }, [fetchRoomConnections]);

  const parseClientData = (clientDataJson: string): IClientConnectionUserData | null => {
    try {
      const parsed = JSON.parse(clientDataJson);
      return parsed.clientData || parsed; // Handle cases where clientData might be directly the object or nested
    } catch {
      return null;
    }
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = connections.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleDeleteSelectedConnections = useCallback(async () => {
    if (selected.length === 0) return;

    setIsDeleting(true);
    setError(null);
    try {
      const deletePromises = selected.map(async (connectionId) => {
        const connectionToDelete = connections.find(conn => conn.id === connectionId);
        if (connectionToDelete) {
          await deleteConnection(connectionToDelete.id, connectionToDelete.sessionId);
          console.log(`Connection ${connectionToDelete.id} for session ${connectionToDelete.sessionId} deleted.`);
        } else {
          console.warn(`Connection with ID ${connectionId} not found in current list.`);
        }
      });

      const results = await Promise.allSettled(deletePromises);
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete connection ${selected[index]}:`, result.reason);
        }
      });

      await fetchRoomConnections(); // Re-fetch all connections to update the table
      setSelected([]); // Clear selection after deletion attempt
    } catch (err: any) {
      console.error('Error during bulk deletion:', err);
      setError(`Failed to delete some connections: ${err.message || String(err)}`);
    } finally {
      setIsDeleting(false);
    }
  }, [selected, connections, roomId, fetchRoomConnections]);

  const isSelected = (id: string) => selected.indexOf(id) !== -1;
  const numSelected = selected.length;
  const rowCount = connections.length;

  return (
    <Box className="w-full p-4">
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          ...(numSelected > 0 && {
            bgcolor: 'background.default',
          }),
          borderRadius: '4px',
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {numSelected > 0 && (
          <Typography
            sx={{ flex: '1 1 100%' }}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {numSelected} selected
          </Typography>
        )}

        {numSelected > 0 && (
          <Tooltip title="Delete Selected Connections">
            <IconButton color="inherit" onClick={handleDeleteSelectedConnections} disabled={isDeleting}>
              {isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>

      {loading && !isDeleting && (
        <Box className="flex justify-center items-center p-4">
          <CircularProgress size={40} />
        </Box>
      )}

      {error && (
        <Alert severity="error" className="m-4">
          {error}
        </Alert>
      )}

      {!loading && !isDeleting && !error && connections.length === 0 && (
        <Alert severity="info" className="m-4">
          No active connections found for this room.
        </Alert>
      )}

      {!loading && !error && connections.length > 0 && (
        <TableContainer component={Paper} sx={tableContainerSx}>
          <Table stickyHeader size="small" aria-label="room connections table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={headerCellSx}>
                  <Checkbox
                    color="primary"
                    indeterminate={numSelected > 0 && numSelected < rowCount}
                    checked={rowCount > 0 && numSelected === rowCount}
                    onChange={handleSelectAllClick}
                    inputProps={{ 'aria-label': 'select all connections' }}
                  />
                </TableCell>
                <TableCell sx={headerCellSx}>ID</TableCell>
                <TableCell sx={headerCellSx}>Status</TableCell>
                <TableCell sx={headerCellSx}>User/Client</TableCell>
                <TableCell sx={headerCellSx}>Role</TableCell>
                <TableCell sx={headerCellSx}>Type</TableCell>
                <TableCell sx={headerCellSx}>Platform</TableCell>
                <TableCell sx={headerCellSx}>IP Address</TableCell>
                <TableCell sx={headerCellSx}>Connected At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {connections.map((connection) => {
                const isItemSelected = isSelected(connection.id);
                const labelId = `enhanced-table-checkbox-${connection.id}`;
                const clientData = parseClientData(connection.clientData);
                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, connection.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={connection.id}
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </TableCell>
                    <TableCell component="th" id={labelId} scope="row">
                      <Tooltip title={connection.id} placement="top">
                        <Typography variant="body2" className="font-mono text-xs truncate max-w-[100px] inline-block">
                          {connection.id.substring(0, 8)}...
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {connection.status === 'active' ? (
                        <Tooltip title="Active" placement="top">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Pending / Inactive" placement="top">
                          <AccessTimeFilledIcon color="warning" fontSize="small" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      {clientData?.USERNAME ? (
                        <Tooltip title={`User ID: ${clientData.USERID || 'N/A'}`} placement="top">
                          <Typography variant="body2" className="font-semibold">
                            {clientData.USERNAME}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{connection.role}</TableCell>
                    <TableCell>{connection.type}</TableCell>
                    <TableCell>{connection.platform}</TableCell>
                    <TableCell>{connection.ip}</TableCell>
                    <TableCell>
                      {new Date(connection.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};