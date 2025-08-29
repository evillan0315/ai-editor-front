import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  setLoading,
  setError,
  setInstruction,
  setScanPathsInput,
  clearState,
  setLastLlmResponse,
  toggleSelectedChange,
  selectAllChanges,
  deselectAllChanges,
  setCurrentDiff,
  clearDiff,
  setApplyingChanges,
  setAppliedMessages,
  updateProposedChangeContent,
  setOpenedFile,
  setOpenedFileContent,
  setIsFetchingFileContent,
  setFetchFileContentError,
} from '@/stores/aiEditorStore';
import { authStore } from '@/stores/authStore';
import {
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  useTheme,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { generateCode, applyProposedChanges, getGitDiff } from '@/api/llm';
import { readFileContent } from '@/api/file'; // Import readFileContent
import {
  LlmGeneratePayload,
  LlmResponse,
  ProposedFileChange,
  FileAction,
} from '@/types/llm';
import {
  INSTRUCTION,
  ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
} from '@/constants';
import CodeMirrorEditor from '@/components/code-editor/CodeMirrorEditor';
import * as path from 'path-browserify'; // Using a browser-compatible path module
import { FileTree } from '@/components/file-tree'; // Import FileTree
import { getRelativePath } from '@/utils/fileUtils'; // Import getRelativePath

// Determine CodeMirror language based on file extension
const getCodeMirrorLanguage = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.js':
    case '.jsx':
      return 'javascript';
    case '.ts':
    case '.tsx':
      return 'typescript';
    case '.json':
      return 'json';
    case '.md':
    case '.markdown':
      return 'markdown';
    case '.html':
    case '.htm':
      return 'html';
    case '.css':
      return 'css';
    case '.xml':
      return 'xml';
    case '.py':
      return 'python';
    case '.java':
      return 'java';
    case '.go':
      return 'go';
    case '.rb':
      return 'ruby';
    case '.php':
      return 'php';
    case '.c':
    case '.cpp':
    case '.h':
      return 'cpp';
    case '.sh':
      return 'shell';
    case '.yaml':
    case '.yml':
      return 'yaml';
    default:
      return 'text';
  }
};

// Basic Diff Viewer Component (can be replaced with a more advanced library)
const DiffViewer: React.FC<{ diffContent: string; filePath: string }> = ({
  diffContent,
  filePath,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        bgcolor: isDarkMode ? '#2d2d2d' : '#f0f0f0',
        borderRadius: 1,
        overflowX: 'auto',
        border: '1px solid ' + (isDarkMode ? '#444' : '#ccc'),
      }}
    >
      <Typography
        variant="subtitle2"
        gutterBottom
        sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}
      >
        Diff for: {filePath}
      </Typography>
      <pre
        style={{
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          color: isDarkMode ? '#e0e0e0' : '#333',
        }}
      >
        {diffContent}
      </pre>
    </Box>
  );
};

const AiEditorPage: React.FC = () => {
  const {
    instruction,
    loading,
    error,
    currentProjectPath,
    scanPathsInput,
    lastLlmResponse,
    selectedChanges,
    currentDiff,
    diffFilePath,
    applyingChanges,
    appliedMessages,
    openedFile,
    openedFileContent,
    isFetchingFileContent,
    fetchFileContentError,
  } = useStore(aiEditorStore);
  const { isLoggedIn } = useStore(authStore);
  const [projectInput, setProjectInput] = useState<string>(
    currentProjectPath || import.meta.env.VITE_BASE_DIR || '',
  );
  const theme = useTheme();

  useEffect(() => {
    if (currentProjectPath && projectInput !== currentProjectPath) {
      setProjectInput(currentProjectPath);
    }
    if (!projectInput && import.meta.env.VITE_BASE_DIR) {
      setProjectInput(import.meta.env.VITE_BASE_DIR);
      aiEditorStore.setKey('currentProjectPath', import.meta.env.VITE_BASE_DIR);
    }
  }, [currentProjectPath, projectInput]);

  useEffect(() => {
    // Clear diff when project or response changes
    clearDiff();
  }, [lastLlmResponse, currentProjectPath]);

  useEffect(() => {
    const fetchContent = async () => {
      if (!openedFile) {
        setOpenedFileContent(null);
        setFetchFileContentError(null);
        return;
      }

      setIsFetchingFileContent(true);
      setFetchFileContentError(null);

      try {
        // BUG FIX: openedFile already contains the full absolute path. Do not path.join with currentProjectPath.
        const content = await readFileContent(openedFile);
        setOpenedFileContent(content);
      } catch (err) {
        console.error(`Error reading file ${openedFile}:`, err);
        setFetchFileContentError(
          `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
        );
        setOpenedFileContent(null);
      } finally {
        setIsFetchingFileContent(false);
      }
    };

    fetchContent();
  }, [openedFile]); // Removed currentProjectPath from dependency array as openedFile is already absolute

  const handleInstructionChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setInstruction(event.target.value);
  };

  const handleScanPathsInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setScanPathsInput(event.target.value);
  };

  const handleProjectInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setProjectInput(event.target.value);
  };

  const handleLoadProject = () => {
    if (!projectInput) return;
    aiEditorStore.setKey('currentProjectPath', projectInput);
    setError(null);
    setLastLlmResponse(null); // Clear previous response when loading new project
    setAppliedMessages([]);
    setCurrentDiff(null, null);
    setOpenedFile(null); // Clear opened file when loading new project
  };

  const handleGenerateCode = async () => {
    if (!instruction) {
      setError('Please provide instructions for the AI.');
      return;
    }
    if (!isLoggedIn) {
      setError('You must be logged in to use the AI Editor.');
      return;
    }
    if (!currentProjectPath) {
      setError('Please load a project first by entering a path above.');
      return;
    }

    setLoading(true);
    setError(null);
    setLastLlmResponse(null); // Clear previous response
    setCurrentDiff(null, null); // Clear any previous diff
    setAppliedMessages([]);
    setOpenedFile(null); // Close opened file when new generation starts

    try {
      const parsedScanPaths = scanPathsInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '');

      const payload: LlmGeneratePayload = {
        userPrompt: instruction,
        projectRoot: currentProjectPath,
        projectStructure: '',
        relevantFiles: [],
        additionalInstructions: INSTRUCTION,
        expectedOutputFormat: ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
        scanPaths: parsedScanPaths,
      };

      const aiResponse: LlmResponse = await generateCode(payload);
      console.log(aiResponse, 'aiResponse');
      setLastLlmResponse(aiResponse); // Store the full structured response
    } catch (err) {
      setError(
        `Failed to generate code: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = (change: ProposedFileChange) => {
    toggleSelectedChange(change);
  };

  const handleShowDiff = async (change: ProposedFileChange) => {
    if (!currentProjectPath) {
      setError('Project root is not set.');
      return;
    }
    setLoading(true);
    setError(null);
    clearDiff(); // Clear previous diff before showing a new one

    try {
      let diffContent: string;
      // Ensure the filePath sent to the backend is always relative to the projectRoot.
      // The LLM is instructed to provide relative paths, but this adds robustness
      // against potential absolute paths or backend strictness.
      const filePathToSend = getRelativePath(
        change.filePath,
        currentProjectPath,
      );

      if (change.action === FileAction.ADD) {
        // Simulate diff for a new file: show its content as added
        diffContent = `--- /dev/null\n+++ a/${change.filePath}\n@@ -0,0 +1,${change.newContent?.split('\n').length || 1} @@\n${change.newContent
          ?.split('\n')
          .map((line) => `+${line}`)
          .join('\n')}`;
      } else {
        // Pass the potentially converted relative path to the backend for git diff
        diffContent = await getGitDiff(filePathToSend, currentProjectPath);
      }

      setCurrentDiff(change.filePath, diffContent);
    } catch (err) {
      setError(
        `Failed to get diff for ${change.filePath}: ${err instanceof Error ? err.message : String(err)}`,
      );
      setCurrentDiff(
        change.filePath,
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApplySelectedChanges = async () => {
    if (Object.keys(selectedChanges).length === 0) {
      setError('No changes selected to apply.');
      return;
    }
    if (!currentProjectPath) {
      setError('Project root is not set.');
      return;
    }

    setApplyingChanges(true);
    setError(null);
    setAppliedMessages([]);

    try {
      const changesToApply = Object.values(selectedChanges);
      const result = await applyProposedChanges(
        changesToApply,
        currentProjectPath,
      );
      setAppliedMessages(result.messages);
      if (!result.success) {
        setError('Some changes failed to apply. Check messages above.');
      }
      // Clear the response and selected changes after applying
      setLastLlmResponse(null);
      deselectAllChanges();
      clearDiff();
    } catch (err) {
      setError(
        `Failed to apply changes: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setApplyingChanges(false);
    }
  };

  const getFileActionChipColor = (action: FileAction) => {
    switch (action) {
      case FileAction.ADD:
        return 'success';
      case FileAction.MODIFY:
        return 'info';
      case FileAction.DELETE:
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    // Added min-h-0 and overflow-auto to the main Container for proper scrolling within the layout
    // Adjusted padding from py-8 to p-6 sm:p-8 for more consistent spacing with Layout.tsx changes.
    <Container
      maxWidth="xl"
      className="p-6 sm:p-8 flex flex-col flex-grow min-h-full overflow-auto h-[100vh-120px]"
    >
      {/* Removed p-6 from Paper as Container now provides main page padding. Added min-h-0. */}
      <Paper
        elevation={3}
        className="mb-8 flex-grow flex flex-col min-h-0 p-6"
        sx={{ bgcolor: theme.palette.background.paper }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          className="!font-bold"
          sx={{ color: theme.palette.text.primary }}
        >
          AI Code Editor
        </Typography>
        <Typography variant="body1" color="text.secondary" className="mb-4">
          Provide instructions to the AI to generate or modify code in your
          project. Start by loading your project, and optionally browse files
          from the tree.
        </Typography>

        {!isLoggedIn && (
          <Alert severity="warning" className="mb-4">
            You need to be logged in to use the AI Editor functionality.
          </Alert>
        )}

        <Box className="mb-6 flex gap-4 items-center flex-wrap">
          <TextField
            label="Project Root Path"
            value={projectInput}
            onChange={handleProjectInputChange}
            placeholder="e.g., /home/user/my-project"
            disabled={loading || applyingChanges || isFetchingFileContent}
            sx={{ flexGrow: 1 }}
            size="small"
            InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
            InputProps={{ style: { color: theme.palette.text.primary } }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleLoadProject}
            disabled={
              loading ||
              !projectInput ||
              applyingChanges ||
              isFetchingFileContent
            }
            sx={{ flexShrink: 0 }}
          >
            Load Project
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={clearState}
            disabled={loading || applyingChanges || isFetchingFileContent}
            sx={{ flexShrink: 0 }}
          >
            Clear All
          </Button>
        </Box>

        {currentProjectPath && (
          <Box
            className="mb-6 p-4 border rounded-md"
            sx={{
              borderColor: theme.palette.divider,
              bgcolor: theme.palette.background.default,
            }}
          >
            <Typography
              variant="h6"
              className="!font-semibold"
              sx={{ color: theme.palette.text.primary }}
            >
              Current Project Root:
              <span style={{ color: theme.palette.primary.main }}>
                {' '}
                {currentProjectPath}
              </span>
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
              className="mt-2"
            >
              AI will scan paths specified below within this project root.
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {/* Added min-h-0 to this flex container to ensure children with flex-grow can properly shrink */}
        <Box className="flex gap-4 mt-6 flex-grow min-h-0">
          {/* File Tree Column */}
          <FileTree projectRoot={currentProjectPath || ''} />

          {/* AI Editor & File Content Column - Added min-h-0 */}
          <Box className="flex-grow flex flex-col gap-4 min-h-0 max-h-[100vh-120px] overflow-auto">
            {/* Opened File Content Editor (conditionally rendered) */}
            {openedFile && !lastLlmResponse && (
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',

                  bgcolor: theme.palette.background.paper,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    className="!font-semibold"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    Viewing File: {openedFile}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setOpenedFile(null)}
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Close File
                  </Button>
                </Box>
                {isFetchingFileContent ? (
                  <Box className="flex justify-center items-center flex-grow">
                    <CircularProgress size={24} />
                    <Typography
                      variant="body2"
                      sx={{ ml: 2, color: theme.palette.text.secondary }}
                    >
                      Loading file content...
                    </Typography>
                  </Box>
                ) : fetchFileContentError ? (
                  <Alert severity="error" sx={{ mt: 2, flexGrow: 1 }}>
                    {fetchFileContentError}
                  </Alert>
                ) : (
                  <CodeMirrorEditor
                    value={openedFileContent || ''}
                    onChange={() => {}}
                    language={getCodeMirrorLanguage(openedFile)}
                    editable={false} // Read-only for viewed files
                    height="100%" // Explicitly set height to ensure it fills the parent
                  />
                )}
              </Paper>
            )}

            {/* AI Instruction and Generation Controls */}
            {!lastLlmResponse && (
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  ...(openedFile ? {} : { flexGrow: 1 }),
                  bgcolor: theme.palette.background.paper,
                }}
              >
                <TextField
                  label="Scan Paths (comma-separated relative paths)"
                  value={scanPathsInput}
                  onChange={handleScanPathsInputChange}
                  placeholder="e.g., src/components,package.json,README.md"
                  disabled={
                    loading ||
                    !isLoggedIn ||
                    !currentProjectPath ||
                    applyingChanges ||
                    isFetchingFileContent
                  }
                  fullWidth
                  margin="normal"
                  helperText="Paths where the AI should focus its analysis for project structure and relevant files (relative to project root)."
                  InputLabelProps={{
                    style: { color: theme.palette.text.secondary },
                  }}
                  InputProps={{ style: { color: theme.palette.text.primary } }}
                />

                <TextField
                  label="AI Instructions (User Prompt)"
                  multiline
                  rows={6}
                  value={instruction}
                  onChange={handleInstructionChange}
                  placeholder="e.g., Implement a new user authentication module with JWT. Include login and register endpoints."
                  disabled={
                    loading ||
                    !isLoggedIn ||
                    !currentProjectPath ||
                    applyingChanges ||
                    isFetchingFileContent
                  }
                  fullWidth
                  margin="normal"
                  InputLabelProps={{
                    style: { color: theme.palette.text.secondary },
                  }}
                  InputProps={{ style: { color: theme.palette.text.primary } }}
                />

                <Button
                  variant="contained"
                  color="success"
                  onClick={handleGenerateCode}
                  disabled={
                    loading ||
                    !instruction ||
                    !isLoggedIn ||
                    !currentProjectPath ||
                    applyingChanges ||
                    isFetchingFileContent
                  }
                  sx={{ mt: 3, py: 1.5, px: 4, fontSize: '1.05rem' }}
                >
                  {loading ? (
                    <CircularProgress
                      size={20}
                      color="inherit"
                      sx={{ mr: 1 }}
                    />
                  ) : null}
                  Generate/Modify Code
                </Button>
              </Paper>
            )}

            {applyingChanges && ( // Show applying changes indicator
              <Alert severity="info" sx={{ mt: 3 }}>
                Applying selected changes...
                <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />
              </Alert>
            )}

            {appliedMessages &&
              appliedMessages.length > 0 && ( // Show messages after applying changes
                <Paper
                  elevation={1}
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography
                    variant="h6"
                    className="!font-semibold"
                    sx={{ color: theme.palette.text.primary }}
                    gutterBottom
                  >
                    Application Summary:
                  </Typography>
                  <Box
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      p: 1,
                      bgcolor: theme.palette.background.default,
                      borderRadius: 1,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {appliedMessages.map((msg, index) => (
                      <Typography
                        key={index}
                        component="div"
                        sx={{ mb: 0.5, color: theme.palette.text.primary }}
                      >
                        {msg}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              )}

            {lastLlmResponse && (
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  bgcolor: theme.palette.background.paper,
                  flexGrow: 1,
                }}
              >
                <Typography
                  variant="h5"
                  className="!font-bold"
                  sx={{ color: theme.palette.text.primary }}
                  gutterBottom
                >
                  AI Proposed Changes:
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {lastLlmResponse.summary}
                </Typography>
                {lastLlmResponse.thoughtProcess && (
                  <Accordion sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography
                        variant="subtitle1"
                        className="!font-semibold"
                        sx={{ color: theme.palette.text.primary }}
                      >
                        AI Thought Process
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography
                        sx={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          bgcolor: theme.palette.background.default,
                          p: 2,
                          borderRadius: 1,
                          overflowX: 'auto',
                          color: theme.palette.text.primary,
                        }}
                      >
                        {lastLlmResponse.thoughtProcess}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={selectAllChanges}
                    disabled={loading || applyingChanges}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={deselectAllChanges}
                    disabled={loading || applyingChanges}
                  >
                    Deselect All
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleApplySelectedChanges}
                    disabled={
                      loading ||
                      applyingChanges ||
                      Object.keys(selectedChanges).length === 0
                    }
                    startIcon={
                      applyingChanges ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : null
                    }
                  >
                    {applyingChanges ? 'Applying...' : 'Apply Selected Changes'}
                  </Button>
                </Box>

                <Typography
                  variant="h6"
                  className="!font-semibold"
                  sx={{ mt: 3, mb: 2, color: theme.palette.text.primary }}
                >
                  Detailed Changes:
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    flexGrow: 1,
                    overflowY: 'auto',
                  }}
                >
                  {lastLlmResponse.changes.map((change, index) => (
                    <Paper
                      key={index}
                      elevation={2}
                      sx={{ p: 2, bgcolor: theme.palette.background.paper }}
                    >
                      <Accordion expanded={!!selectedChanges[change.filePath]}>
                        <AccordionSummary
                          component="div" // 👈 prevents <button> nesting
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            '& .MuiAccordionSummary-content': {
                              alignItems: 'center',
                            },
                          }}
                        >
                          <Checkbox
                            checked={!!selectedChanges[change.filePath]}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleChange(change);
                            }}
                            disabled={loading || applyingChanges}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Chip
                            label={change.action.toUpperCase()}
                            color={getFileActionChipColor(change.action)}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Typography
                            variant="body1"
                            sx={{
                              fontFamily: 'monospace',
                              flexGrow: 1,
                              color: theme.palette.text.primary,
                            }}
                          >
                            {currentProjectPath
                              ? path.join(currentProjectPath, change.filePath)
                              : change.filePath}
                          </Typography>
                          {(change.action === FileAction.MODIFY ||
                            change.action === FileAction.DELETE) && (
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowDiff(change);
                              }}
                              disabled={loading || applyingChanges}
                              sx={{ ml: 1, whiteSpace: 'nowrap' }}
                            >
                              View Git Diff
                            </Button>
                          )}
                        </AccordionSummary>
                        <AccordionDetails
                          sx={{
                            flexDirection: 'column',
                            display: 'flex',
                            gap: 2,
                          }}
                        >
                          {' '}
                          {change.reason && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ pl: 0, mb: 0 }}
                            >
                              Reason: {change.reason}
                            </Typography>
                          )}
                          {(change.action === FileAction.ADD ||
                            change.action === FileAction.MODIFY) && (
                            <Box sx={{ mt: 1 }}>
                              <Typography
                                variant="subtitle2"
                                gutterBottom
                                sx={{ color: theme.palette.text.primary }}
                              >
                                Proposed Content:
                              </Typography>
                              <CodeMirrorEditor
                                value={change.newContent || ''}
                                onChange={(value) =>
                                  updateProposedChangeContent(
                                    change.filePath,
                                    value,
                                  )
                                }
                                language={getCodeMirrorLanguage(
                                  change.filePath,
                                )}
                                editable={!loading && !applyingChanges}
                                minHeight="150px" // Provide a reasonable minimum height
                                maxHeight="400px" // Limit maximum height to prevent one editor from taking too much space
                              />
                            </Box>
                          )}
                          {diffFilePath === change.filePath && currentDiff && (
                            <DiffViewer
                              diffContent={currentDiff}
                              filePath={diffFilePath} // Displaying the relative path directly
                            />
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </Paper>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AiEditorPage;
