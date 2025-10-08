import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { gitStore } from '@/stores/gitStore';
import { GitBranch, GitCommit, GitStatusResult } from '@/types/git';
import {
  Box,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import RunScriptMenuItem from '@/components/RunScriptMenuItem';
import {
  gitGetBranches,
  gitGetStatus,
  gitCommit,
  gitCreateBranch,
  gitCheckoutBranch,
  gitDeleteBranch,
  gitRevertCommit,
  gitUndoFileChanges,
  gitStageFiles,
  gitUnstageFiles,
  gitResetStagedChanges,
  gitCreateSnapshot,
  gitRestoreSnapshot,
  gitListSnapshots,
  gitDeleteSnapshot,
  gitGetCommitLog,
} from '@/api/git';
import { useUiStore } from '@/stores/uiStore';
import { useFileStore } from '@/stores/fileStore';

interface StatusState {
  branch: string;
  modifiedFiles: string[];
  stagedFiles: string[];
}

const SimpleGitPage = () => {
  const { showSnackbar } = useUiStore();
  const { currentProject } = useFileStore();
  const currentProjectRoot = currentProject?.projectPath;

  const [status, setStatus] = useState<StatusState>({
    branch: 'main',
    modifiedFiles: [],
    stagedFiles: [],
  });
  const [commitMessage, setCommitMessage] = useState('');
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [checkoutBranchName, setCheckoutBranchName] = useState('');
  const [isRemoteCheckout, setIsRemoteCheckout] = useState(false);
  const [deleteBranchName, setDeleteBranchName] = useState('');
  const [forceDeleteBranch, setForceDeleteBranch] = useState(false);
  const [revertCommitHash, setRevertCommitHash] = useState('HEAD');
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotMessage, setNewSnapshotMessage] = useState('');
  const [restoreSnapshotName, setRestoreSnapshotName] = useState('');
  const [deleteSnapshotName, setDeleteSnapshotName] = useState('');
  const [commitLog, setCommitLog] = useState<GitCommit[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusResult, branchesResult, snapshotsResult, commitLogResult] = await Promise.all([
        gitGetStatus(currentProjectRoot),
        gitGetBranches(currentProjectRoot),
        gitListSnapshots(currentProjectRoot),
        gitGetCommitLog(currentProjectRoot),
      ]);

      setStatus({
        branch: statusResult.current || 'main',
        modifiedFiles: statusResult.modified,
        stagedFiles: statusResult.staged,
      });
      setBranches(branchesResult);
      setCheckoutBranchName(branchesResult.find(b => b.current)?.name || '');
      setDeleteBranchName(branchesResult.find(b => b.current)?.name || '');
      setSnapshots(snapshotsResult.tags);
      setRestoreSnapshotName(snapshotsResult.tags[0] || '');
      setDeleteSnapshotName(snapshotsResult.tags[0] || '');
      setCommitLog(commitLogResult);
    } catch (err: any) {
      console.error('Failed to fetch Git data:', err);
      setError(err.message || 'Failed to fetch Git data.');
      showSnackbar('error', err.message || 'Failed to fetch Git data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentProjectRoot) {
      fetchData();
    } else {
        setError('No project root specified. Please open a project to enable Git functionality.');
    }
  }, [currentProjectRoot]);

  const handleAction = async (action: () => Promise<any>, successMessage: string) => {
    setLoading(true);
    setError(null);
    try {
      await action();
      showSnackbar('success', successMessage);
      await fetchData(); // Refresh all data after action
    } catch (err: any) {
      console.error('Git action failed:', err);
      setError(err.message || 'Git action failed.');
      showSnackbar('error', err.message || 'Git action failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleStage = (file: string) => handleAction(
    () => gitStageFiles([file], currentProjectRoot),
    `Staged ${file}`,
  );

  const handleUnstage = (file: string) => handleAction(
    () => gitUnstageFiles([file], currentProjectRoot),
    `Unstaged ${file}`,
  );

  const handleResetStagedChanges = () => handleAction(
    () => gitResetStagedChanges(undefined, currentProjectRoot),
    'All staged changes have been reset.',
  );

  const handleResetFileStagedChanges = (file: string) => handleAction(
    () => gitResetStagedChanges(file, currentProjectRoot),
    `Staged changes for ${file} reset.`,
  );

  const handleCommit = () => handleAction(
    () => gitCommit(commitMessage, currentProjectRoot),
    `Committed with message: ${commitMessage}`,
  );

  const handleCreateBranch = () => handleAction(
    () => gitCreateBranch(newBranchName, currentProjectRoot),
    `Created branch: ${newBranchName}`,
  );

  const handleCheckoutBranch = () => handleAction(
    () => gitCheckoutBranch(checkoutBranchName, isRemoteCheckout, currentProjectRoot),
    `Checked out branch: ${checkoutBranchName}`,
  );

  const handleDeleteBranch = () => handleAction(
    () => gitDeleteBranch(deleteBranchName, forceDeleteBranch, currentProjectRoot),
    `Deleted branch: ${deleteBranchName}`,
  );

  const handleRevertCommit = () => handleAction(
    () => gitRevertCommit(revertCommitHash, currentProjectRoot),
    `Reverted commit: ${revertCommitHash}`,
  );

  const handleUndoFileChanges = (file: string) => handleAction(
    () => gitUndoFileChanges(file, currentProjectRoot),
    `Changes undone for ${file}`,
  );

  const handleCreateSnapshot = () => handleAction(
    () => gitCreateSnapshot(newSnapshotName, newSnapshotMessage, currentProjectRoot),
    `Snapshot '${newSnapshotName}' created.`,
  );

  const handleRestoreSnapshot = () => handleAction(
    () => gitRestoreSnapshot(restoreSnapshotName, currentProjectRoot),
    `Restored to snapshot '${restoreSnapshotName}'.`,
  );

  const handleDeleteSnapshot = () => handleAction(
    () => gitDeleteSnapshot(deleteSnapshotName, currentProjectRoot),
    `Snapshot '${deleteSnapshotName}' deleted.`,
  );

  return (
    <Box className="p-4 max-w-full overflow-x-auto">
      <Typography variant="h4" component="h1" className="mb-4">
        Simple Git Management
      </Typography>

      {loading && (
        <Box className="flex items-center justify-center p-4">
          <CircularProgress />
          <Typography className="ml-2">Loading Git data...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!currentProjectRoot && !loading && !error && (
        <Alert severity="info" className="mb-4">
          Please open a project to enable Git functionality.
        </Alert>
      )}

      {currentProjectRoot && !loading && !error && (
        <>
          <Typography variant="h6" className="mt-4">Project Root:</Typography>
          <Typography className="mb-4 font-mono break-all">{currentProjectRoot}</Typography>

          <Box className="mb-4 p-4 border rounded-md shadow-sm">
            <Typography variant="h6">Status</Typography>
            <Typography>Current Branch: {status.branch}</Typography>

            <Box className="mt-2">
              <Typography variant="subtitle1">Modified Files:</Typography>
              <List dense>
                {status.modifiedFiles.length === 0 ? (
                  <ListItem><ListItemText secondary="No modified files" /></ListItem>
                ) : (
                  status.modifiedFiles.map((file) => (
                    <ListItem key={file}>
                      <ListItemText primary={file} />
                      <Button size="small" onClick={() => handleStage(file)}>Stage</Button>
                      <Button size="small" color="warning" onClick={() => handleUndoFileChanges(file)}>Undo Changes</Button>
                    </ListItem>
                  ))
                )}
              </List>
            </Box>

            <Box className="mt-2">
              <Typography variant="subtitle1">Staged Files:</Typography>
              <List dense>
                {status.stagedFiles.length === 0 ? (
                  <ListItem><ListItemText secondary="No staged files" /></ListItem>
                ) : (
                  status.stagedFiles.map((file) => (
                    <ListItem key={file}>
                      <ListItemText primary={file} />
                      <Button size="small" onClick={() => handleUnstage(file)}>Unstage</Button>
                      <Button size="small" color="warning" onClick={() => handleResetFileStagedChanges(file)}>Reset File</Button>
                    </ListItem>
                  ))
                )}
              </List>
              {status.stagedFiles.length > 0 && (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  onClick={handleResetStagedChanges}
                  className="mt-2"
                >
                  Reset All Staged
                </Button>
              )}
            </Box>
          </Box>

          <Box className="mb-4 p-4 border rounded-md shadow-sm">
            <Typography variant="h6">Commit Changes</Typography>
            <TextField
              label="Commit Message"
              variant="outlined"
              fullWidth
              multiline
              rows={2}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="mb-2"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleCommit}
              disabled={!commitMessage || status.stagedFiles.length === 0 || loading}
            >
              Commit
            </Button>
          </Box>

          <Box className="mb-4 p-4 border rounded-md shadow-sm">
            <Typography variant="h6">Revert Commit</Typography>
            <FormControl fullWidth className="mb-2">
              <InputLabel id="revert-commit-label">Select Commit</InputLabel>
              <Select
                labelId="revert-commit-label"
                value={revertCommitHash}
                label="Select Commit"
                onChange={(e) => setRevertCommitHash(e.target.value)}
              >
                <MenuItem value="HEAD">Last Commit (HEAD)</MenuItem>
                {commitLog.map((commit) => (
                  <MenuItem key={commit.hash} value={commit.hash}>
                    {commit.hash.substring(0, 7)} - {commit.message} ({commit.author_name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleRevertCommit}
              disabled={!revertCommitHash || loading}
            >
              Revert Selected Commit
            </Button>
          </Box>

          <Box className="mb-4 p-4 border rounded-md shadow-sm">
            <Typography variant="h6">Branches</Typography>
            <List dense>
              {branches.length === 0 ? (
                <ListItem><ListItemText secondary="No branches found" /></ListItem>
              ) : (
                branches.map((branch) => (
                  <ListItem key={branch.name}>
                    <ListItemText
                      primary={branch.name}
                      secondary={branch.current ? 'Current' : ''}
                    />
                    <Button size="small" onClick={() => setCheckoutBranchName(branch.name)}>
                      Select to Checkout
                    </Button>
                    {!branch.current && (
                       <Button size="small" color="error" onClick={() => {setDeleteBranchName(branch.name); setForceDeleteBranch(false)}}>Delete</Button>
                    )}
                  </ListItem>
                ))
              )}
            </List>

            <FormControl fullWidth className="mb-2">
              <InputLabel id="checkout-branch-label">Checkout Branch</InputLabel>
              <Select
                labelId="checkout-branch-label"
                value={checkoutBranchName}
                label="Checkout Branch"
                onChange={(e) => setCheckoutBranchName(e.target.value)}
                className="mb-2"
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.name} value={branch.name}>
                    {branch.name} {branch.current && '(Current)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Checkbox checked={isRemoteCheckout} onChange={(e) => setIsRemoteCheckout(e.target.checked)} />}
              label="Checkout remote branch"
              className="mb-2"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleCheckoutBranch}
              disabled={!checkoutBranchName || loading}
              className="mb-4"
            >
              Checkout
            </Button>

            <TextField
              label="New Branch Name"
              variant="outlined"
              fullWidth
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="mb-2"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateBranch}
              disabled={!newBranchName || loading}
            >
              Create Branch
            </Button>

            <FormControl fullWidth className="mt-4 mb-2">
              <InputLabel id="delete-branch-label">Delete Branch</InputLabel>
              <Select
                labelId="delete-branch-label"
                value={deleteBranchName}
                label="Delete Branch"
                onChange={(e) => setDeleteBranchName(e.target.value)}
              >
                {branches.filter(b => !b.current).map((branch) => (
                  <MenuItem key={branch.name} value={branch.name}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Checkbox checked={forceDeleteBranch} onChange={(e) => setForceDeleteBranch(e.target.checked)} />}
              label="Force delete (even if not merged)"
              className="mb-2"
            />
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteBranch}
              disabled={!deleteBranchName || loading}
            >
              Delete Branch
            </Button>
          </Box>

          <Box className="mb-4 p-4 border rounded-md shadow-sm">
            <Typography variant="h6">Snapshots (Tags)</Typography>
            <List dense>
              {snapshots.length === 0 ? (
                <ListItem><ListItemText secondary="No snapshots (tags) found" /></ListItem>
              ) : (
                snapshots.map((snapshot) => (
                  <ListItem key={snapshot}>
                    <ListItemText primary={snapshot} />
                    <Button size="small" onClick={() => setRestoreSnapshotName(snapshot)}>Select to Restore</Button>
                    <Button size="small" color="error" onClick={() => setDeleteSnapshotName(snapshot)}>Delete</Button>
                  </ListItem>
                ))
              )}
            </List>

            <TextField
              label="New Snapshot Name"
              variant="outlined"
              fullWidth
              value={newSnapshotName}
              onChange={(e) => setNewSnapshotName(e.target.value)}
              className="mb-2"
            />
            <TextField
              label="Snapshot Message (Optional)"
              variant="outlined"
              fullWidth
              value={newSnapshotMessage}
              onChange={(e) => setNewSnapshotMessage(e.target.value)}
              className="mb-2"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateSnapshot}
              disabled={!newSnapshotName || loading}
              className="mb-4"
            >
              Create Snapshot
            </Button>

            <FormControl fullWidth className="mb-2">
              <InputLabel id="restore-snapshot-label">Restore Snapshot</InputLabel>
              <Select
                labelId="restore-snapshot-label"
                value={restoreSnapshotName}
                label="Restore Snapshot"
                onChange={(e) => setRestoreSnapshotName(e.target.value)}
              >
                {snapshots.map((snapshot) => (
                  <MenuItem key={snapshot} value={snapshot}>
                    {snapshot}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleRestoreSnapshot}
              disabled={!restoreSnapshotName || loading}
            >
              Restore Snapshot
            </Button>

            <FormControl fullWidth className="mt-4 mb-2">
              <InputLabel id="delete-snapshot-label">Delete Snapshot</InputLabel>
              <Select
                labelId="delete-snapshot-label"
                value={deleteSnapshotName}
                label="Delete Snapshot"
                onChange={(e) => setDeleteSnapshotName(e.target.value)}
              >
                {snapshots.map((snapshot) => (
                  <MenuItem key={snapshot} value={snapshot}>
                    {snapshot}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteSnapshot}
              disabled={!deleteSnapshotName || loading}
            >
              Delete Snapshot
            </Button>
          </Box>

          <Box className="mt-4">
            <Typography variant="h6">Run Script</Typography>
            <RunScriptMenuItem />
          </Box>
        </>
      )}
    </Box>
  );
};

export default SimpleGitPage;
