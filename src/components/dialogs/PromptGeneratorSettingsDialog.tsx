import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useStore } from '@nanostores/react';
import {
  INSTRUCTION_SCHEMA_OUTPUT,
  INSTRUCTION_EXAMPLE_OUTPUT,
} from '@/constants/instruction';
import {
  llmStore,
  setAiInstruction,
  setExpectedOutputInstruction,
} from '@/stores/llmStore';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import MarkdownEditor from '@/components/MarkdownEditor'; // ✅ New rich editor

interface PromptGeneratorSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const PromptGeneratorSettingsDialog: React.FC<
  PromptGeneratorSettingsDialogProps
> = ({ open, onClose }) => {
  const theme = useTheme();
  const { aiInstruction } = useStore(llmStore);

  /** Local editable states */
  const [localAiInstruction, setLocalAiInstruction] =
    React.useState(aiInstruction);
  const [localInstructionSchema, setLocalInstructionSchema] = React.useState(
    INSTRUCTION_SCHEMA_OUTPUT,
  );
  const [localInstructionExample, setLocalInstructionExample] = React.useState(
    INSTRUCTION_EXAMPLE_OUTPUT,
  );

  React.useEffect(() => {
    setLocalAiInstruction(aiInstruction);
  }, [aiInstruction]);

  /** Merge into ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT */
  const handleSave = () => {
    setAiInstruction(localAiInstruction);

    const mergedAdditionalInstruction = `
The response MUST be a single JSON object that validates against the schema:

${localInstructionSchema}

Example valid output:

${localInstructionExample}
`;

    setExpectedOutputInstruction(mergedAdditionalInstruction);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        Prompt Generator Settings
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        {/* ---------- General Instruction (Markdown Editor) ---------- */}
        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{ color: theme.palette.text.primary, mt: 1 }}
        >
          General Instruction
        </Typography>
        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            overflow: 'hidden',
            mb: 2,
          }}
        >
          <MarkdownEditor
            value={localAiInstruction}
            initialValue={localAiInstruction}
            onChange={setLocalAiInstruction}
          />
        </Box>

        {/* ---------- Accordion: JSON Schema ---------- */}
        <Accordion
          sx={{
            mt: 2,
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon sx={{ color: theme.palette.text.primary }} />
            }
          >
            <Typography sx={{ color: theme.palette.text.primary }}>
              Instruction Schema Output (JSON Schema)
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Box
              sx={{
                borderTop: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
              }}
            >
              <CodeMirrorEditor
                value={localInstructionSchema}
                onChange={setLocalInstructionSchema}
                language="json"
                filePath="schema.json"
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* ---------- Accordion: Example Output ---------- */}
        <Accordion
          sx={{
            mt: 2,
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon sx={{ color: theme.palette.text.primary }} />
            }
          >
            <Typography sx={{ color: theme.palette.text.primary }}>
              Instruction Example Output (Valid JSON)
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Box
              sx={{
                borderTop: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
              }}
            >
              <CodeMirrorEditor
                value={localInstructionExample}
                onChange={setLocalInstructionExample}
                language="json"
                filePath="example.json"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions sx={{ backgroundColor: theme.palette.background.paper }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromptGeneratorSettingsDialog;
