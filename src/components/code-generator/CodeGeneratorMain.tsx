import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Section icons
import PsychologyIcon from '@mui/icons-material/Psychology';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import GitHubIcon from '@mui/icons-material/GitHub';
import DescriptionIcon from '@mui/icons-material/Description';

import { ThoughtProcess } from './ThoughtProcess';
import { ChangesList } from './ChangesList';
import { GitInstructions } from './GitInstructions';
import { DocumentationViewer } from './DocumentationViewer';
import { FileChange } from '@/types/llm';

export interface CodeGeneratorData {
  title: string;
  summary: string;
  thoughtProcess: string;
  documentation: string;
  gitInstructions: string[]; // ← change from string to string[]
  changes: FileChange[];
}

interface Props {
  /** Data payload for the entire code-generator page */
  data: CodeGeneratorData | null;
}

/**
 * Main container component for the code-generator view.
 * Renders the summary, thought process, proposed changes,
 * git instructions and documentation in collapsible sections.
 */
export const CodeGeneratorMain: React.FC<Props> = ({ data }) => {
  if (!data) {
    return (
      <Typography variant="h6" gutterBottom>
        What's on your mind?
      </Typography>
    );
  }
  return (
    <Box className="overflow-auto h-full">
      <Card variant="outlined">
        <CardContent>
          {/* Title and Summary */}
          <Typography variant="h6" gutterBottom>
            {data.title}
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            {data.summary}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Collapsible Sections with Icons */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <PsychologyIcon color="primary" />
                <Typography variant="body1">Thought Process</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <ThoughtProcess text={data.thoughtProcess} />
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <ChangeCircleIcon color="secondary" />
                <Typography variant="body1">Proposed Changes</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <ChangesList changes={data.changes} />
            </AccordionDetails>
          </Accordion>
          {data.gitInstructions?.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <GitHubIcon color="action" />
                  <Typography variant="body1">Git Instructions</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <GitInstructions instructions={data.gitInstructions} />
              </AccordionDetails>
            </Accordion>
          )}

          {data.documentation && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <DescriptionIcon color="info" />
                  <Typography variant="body1">Documentation</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <DocumentationViewer documentation={data.documentation} />
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
