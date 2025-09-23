import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { gitStore } from '@/stores/gitStore';
import { GitCommit, GitBranch } from '@/types/git';
import { Box, Button, TextField, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import { RunScriptMenuItem } from '@/components/RunScriptMenuItem';

interface GitStatus {
  branch: string;
  modifiedFiles: string[];
  stagedFiles: string[];
}

const SimpleGitPage = () => {
  const $git = useStore(gitStore);
  const [status, setStatus] = useState<GitStatus>({
    branch: 'main',
    modifiedFiles: [],
    stagedFiles: [],
  });
  const [commitMessage, setCommitMessage] = useState('');
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [newBranchName, setNewBranchName] = useState('');

  useEffect(() => {
    // Mock data for demonstration
    setStatus({
      branch: 'main',
      modifiedFiles: ['file1.txt', 'file2.txt'],
      stagedFiles: ['file3.txt'],
    });
    setBranches([
      { name: 'main', current: true },
      { name: 'develop', current: false },
    ]);

  }, []);

  const handleStage = (file: string) => {
    // Implement staging logic here
    console.log(`Staging ${file}`);
  };

  const handleUnstage = (file: string) => {
    // Implement unstaging logic here
    console.log(`Unstaging ${file}`);
  };

  const handleCommit = () => {
    // Implement commit logic here
    console.log(`Committing with message: ${commitMessage}`);
  };

  const handleCreateBranch = () => {
    // Implement create branch logic here
    console.log(`Creating branch: ${newBranchName}`);
  };

  const handleCheckoutBranch = (branchName: string) => {
    // Implement checkout branch logic here
    console.log(`Checking out branch: ${branchName}`);
  };

  return (
    <Box className="p-4">
      <Typography variant="h4" component="h1" className="mb-4">Simple Git</Typography>

      <Box className="mb-4">
        <Typography variant="h6">Status</Typography>
        <Typography>Current Branch: {status.branch}</Typography>

        <Box className="mt-2">
          <Typography variant="subtitle1">Modified Files:</Typography>
          <List>
            {status.modifiedFiles.map((file) => (
              <ListItem key={file}>
                <ListItemText primary={file} />
                <Button onClick={() => handleStage(file)}>Stage</Button>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box className="mt-2">
          <Typography variant="subtitle1">Staged Files:</Typography>
          <List>
            {status.stagedFiles.map((file) => (
              <ListItem key={file}>
                <ListItemText primary={file} />
                <Button onClick={() => handleUnstage(file)}>Unstage</Button>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>

      <Box className="mb-4">
        <Typography variant="h6">Commit</Typography>
        <TextField
          label="Commit Message"
          variant="outlined"
          fullWidth
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          className="mb-2"
        />
        <Button variant="contained" color="primary" onClick={handleCommit}>
          Commit
        </Button>
      </Box>

      <Box className="mb-4">
        <Typography variant="h6">Branches</Typography>
        <List>
          {branches.map((branch) => (
            <ListItem key={branch.name}>
              <ListItemText primary={branch.name} secondary={branch.current ? 'Current' : ''} />
              <Button onClick={() => handleCheckoutBranch(branch.name)}>Checkout</Button>
            </ListItem>
          ))}
        </List>

        <TextField
          label="New Branch Name"
          variant="outlined"
          fullWidth
          value={newBranchName}
          onChange={(e) => setNewBranchName(e.target.value)}
          className="mb-2"
        />
        <Button variant="contained" color="primary" onClick={handleCreateBranch}>
          Create Branch
        </Button>
      </Box>

       <Divider className="my-4" />

            <Box className="mt-4">
                <Typography variant="h6">Run Script</Typography>
                <RunScriptMenuItem/>
            </Box>

    </Box>
  );
};

export default SimpleGitPage;
