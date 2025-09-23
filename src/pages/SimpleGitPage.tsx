import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { gitStore } from '@/stores/gitStore';
import { GitCommit, GitBranch } from '@/types/git';
import { Box, Button, TextField, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import RunScriptMenuItem  from '@/components/RunScriptMenuItem';
import simpleGit from 'simple-git';

interface GitStatus {
  branch: string;
  modifiedFiles: string[];
  stagedFiles: string[];
}

const git = simpleGit();

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
  const [selectedFileToUndo, setSelectedFileToUndo] = useState<string | null>(null);

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

  const handleStage = async (file: string) => {
        try {
            await git.add(file);
            console.log(`Staged ${file}`);
        } catch (error) {
            console.error(`Failed to stage ${file}:`, error);
        }
    };

  const handleUnstage = async (file: string) => {
        try {
            await git.reset(['--', file]);
            console.log(`Unstaged ${file}`);
        } catch (error) {
            console.error(`Failed to unstage ${file}:`, error);
        }
    };

  const handleCommit = async () => {
        try {
            await git.commit(commitMessage);
            console.log(`Committed with message: ${commitMessage}`);
            setCommitMessage('');
        } catch (error) {
            console.error('Failed to commit:', error);
        }
    };

  const handleCreateBranch = async () => {
        try {
            await git.checkoutLocalBranch(newBranchName);
            console.log(`Created branch: ${newBranchName}`);
            setNewBranchName('');
        } catch (error) {
            console.error('Failed to create branch:', error);
        }
    };

  const handleCheckoutBranch = async (branchName: string) => {
        try {
            await git.checkout(branchName);
            console.log(`Checked out branch: ${branchName}`);
        } catch (error) {
            console.error('Failed to checkout branch:', error);
        }
    };

    const handleRevertCommit = async () => {
        try {
            // Get the latest commit hash
            const log = await git.log({ maxCount: 1 });
            const latestCommitHash = log.latest?.hash;

            if (latestCommitHash) {
                // Revert the latest commit
                await git.revert([latestCommitHash]);
                console.log(`Reverted commit: ${latestCommitHash}`);
            } else {
                console.log('No commits to revert.');
            }
        } catch (error) {
            console.error('Failed to revert commit:', error);
        }
    };


  const handleUndoFileChanges = async (file: string) => {
        try {
            await git.checkout(['--', file]);
            console.log(`Changes undone for ${file}`);
        } catch (error) {
            console.error(`Failed to undo changes for ${file}:`, error);
        }
    };

  const handleResetStagedChanges = async () => {
        try {
            await git.reset();
            console.log('Staged changes have been reset.');
        } catch (error) {
            console.error('Failed to reset staged changes:', error);
        }
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
                <Button onClick={() => handleUndoFileChanges(file)}>Undo</Button>
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
                <Typography variant="h6">Reset Staged Changes</Typography>
                <Button variant="contained" color="secondary" onClick={handleResetStagedChanges}>
                    Reset Staged
                </Button>
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
                <Typography variant="h6">Revert Commit</Typography>
                <Button variant="contained" color="secondary" onClick={handleRevertCommit}>
                    Revert Last Commit
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
