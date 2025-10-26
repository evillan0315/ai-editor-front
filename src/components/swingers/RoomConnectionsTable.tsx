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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // New import
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'; // New import
import { IConnection, IClientConnectionUserData } from '@/components/swingers/types';
import { getConnections } from '@/components/swingers/api/connections';

interface RoomConnectionsTableProps {
  roomId: string;
}

const tableContainerSx = {
  my: 1,
  maxHeight: '400px', // Limit height to make it scrollable
  overflowY: 'auto',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
};

const headerCellSx = {
  fontWeight: 'bold',
  backgroundColor: 'background.paper', // Sticky header background
  position: 'sticky',
  top: 0,
  zIndex: 1,
  whiteSpace: 'nowrap',
};

const connectionsTitleSx = {
  mb: 2,
  px: 2, // Add horizontal padding for consistency with GlobalDialog
  pt: 2, // Add top padding
  fontWeight: 'bold',
};

export const RoomConnectionsTable: React.FC<RoomConnectionsTableProps> = ({ roomId }) => {
  const [connections, setConnections] = useState<IConnection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoomConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedConnections = await getConnections(roomId);
      setConnections(fetchedConnections);
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

  return (
    <Box className="w-full p-4">
      {/*<Typography variant="h6" component="h2" sx={connectionsTitleSx}>
        Connections for Room: {roomId}
      </Typography>*/}

      {loading && (
        <Box className="flex justify-center items-center p-4">
          <CircularProgress size={40} />
        </Box>
      )}

      {error && (
        <Alert severity="error" className="m-4">
          {error}
        </Alert>
      )}

      {!loading && !error && connections.length === 0 && (
        <Alert severity="info" className="m-4">
          No active connections found for this room.
        </Alert>
      )}

      {!loading && !error && connections.length > 0 && (
        <TableContainer component={Paper} sx={tableContainerSx}>
          <Table stickyHeader size="small" aria-label="room connections table">
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>ID</TableCell>
                <TableCell sx={headerCellSx}>Status</TableCell>{/* New Status Header */}
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
                const clientData = parseClientData(connection.clientData);
                return (
                  <TableRow key={connection.id}>
                    <TableCell>
                      <Tooltip title={connection.id} placement="top">
                        <Typography variant="body2" className="font-mono text-xs truncate max-w-[100px] inline-block">
                          {connection.id.substring(0, 8)}...
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell> {/* New Status Cell */}
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
