import React from 'react';
import { Typography, Box, Paper, Tabs, Tab, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchemaIcon from '@mui/icons-material/Schema';
import ExampleIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
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
import { GlobalAction } from '@/types';
import AiSchemaGenerator from '@/components/schema/AiSchemaGenerator';

interface PromptGeneratorSettingsProps {
  open: boolean;
  onClose: () => void;
  globalActions?: GlobalAction[];
}

const PromptGeneratorSettings: React.FC<PromptGeneratorSettingsProps> = ({
  open,
  onClose,
  globalActions,
}) => {
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

                <Box className="flex flex-col h-full">
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
          centered
        >
          <Tab label="General Instruction" />
          <Tab
            label={
              <span>
                Instruction Schema <SchemaIcon />
              </span>
            }
          />
          <Tab
            label={
              <span>
                Example Output <ExampleIcon />
              </span>
            }
          />
          <Tab
            label={
              <span>
                AI Schema Generator <AutoAwesomeIcon />
              </span>
            }
          />
        </Tabs>

   
        {tab === 0 && (
              <Box
      sx={{

      }}
      className='flex-grow min-h-0'
    >
              <MarkdownEditor
                value={localAiInstruction}
                initialValue={localAiInstruction}
                onChange={setLocalAiInstruction}
                expectedSchema={localInstructionSchema}
                exampleOutput={localInstructionExample}
                filePath={`instruction.md`}
              />
            </Box>

        )}


        {tab === 1 && (

    <Box
      sx={{

      }}
      className='flex-grow min-h-0'
    >
                <CodeMirrorEditor
                  value={localInstructionSchema}
                  onChange={setLocalInstructionSchema}
                  filePath="schema.json"
                  height='100%'
                />
              </Box>
        

        )}

  
        {tab === 2 && (
          <Box
      sx={{

      }}
      className='flex-grow min-h-0'
    >
                <CodeMirrorEditor
                  value={localInstructionExample}
                  onChange={setLocalInstructionExample}
                  filePath="example.json"
                />
              </Box>

        )}

        {tab === 3 && (
                   <Box
      sx={{

      }}
      className='flex-grow min-h-0'
    >
            <AiSchemaGenerator />
          </Box>
        )}
      </Box>

  );
};

export default PromptGeneratorSettings;
