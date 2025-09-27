import React from 'react';
import {
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Paper,
  Tabs,
  Tab,
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
import {
  SvgIconComponent
} from '@mui/material'

export interface GlobalAction {
  label: string;
  action: () => void;
  icon?: SvgIconComponent;
}

interface PromptGeneratorSettingsProps {
  open: boolean;
  onClose: () => void;
  globalActions?: GlobalAction[];
}

const PromptGeneratorSettings: React.FC<
  PromptGeneratorSettingsProps
> = ({ open, onClose, globalActions }) => {
  const theme = useTheme();
  const { aiInstruction } = useStore(llmStore);
  const [tab, setTab] = React.useState(0); // 0 = General Instruction, 1 = JSON Schema, 2 = Example Output

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
    <Paper>
      <Box
        sx={{

          color: theme.palette.text.primary,
        }}
      >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
            centered
          >
            <Tab label="General Instruction" />
            <Tab label="Instruction Schema" />
            <Tab label="Example Output" />
          </Tabs>

        {/* ---------- General Instruction (Markdown Editor) ---------- */}
        {tab === 0 && (
        <Box
          sx={{ color: theme.palette.text.primary, mt: 1 }}
        >
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
            expectedSchema={localInstructionSchema}
            exampleOutput={localInstructionExample}
          />
        </Box>
        </Box>
        )}

        {/* ---------- Accordion: JSON Schema ---------- */}
        {tab === 1 && (
        <Box>
          <Box
            sx={{ color: theme.palette.text.primary, mt: 1 }}
          >

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

          </Box>
        </Box>
        )}

        {/* ---------- Accordion: Example Output ---------- */}
        {tab === 2 && (
         <Box>
          <Box
            sx={{ color: theme.palette.text.primary, mt: 1 }}
          >
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


          </Box>
         </Box>
        )}
      </Box>

      <Box sx={{ backgroundColor: theme.palette.background.paper, display: 'flex', gap: 1 }}>
          {globalActions &&
            globalActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.action}
                color="primary"
                variant="contained"
                startIcon={action.icon ? <action.icon /> : null}
              >
                {action.label}
              </Button>
            ))}
      </Box>
    </Paper>
  );
};

export default PromptGeneratorSettings;
