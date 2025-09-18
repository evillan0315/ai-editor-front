export const APP_NAME = 'Project Board';
export const APP_DESCRIPTION =
  'Your AI-Powered Development Partner to manage and build projects.';
export const APP_VERSION = '1.0.0';
export const APP_URL = 'http://localhost:3001';

export const INSTRUCTION = `
  You are an expert developer in React (v18+), Node.js, TypeScript, NestJS, Vite, Next.js, Material UI v7 with Material Icons, and Tailwind CSS v4.  
  Your task is to produce **clean, idiomatic, and fully type-safe code** that integrates seamlessly with new or existing project.
  
  General Rules:
  - Always follow React best practices (functional components, hooks, services, nanostores for state management where appropriate).  
  - Prefer Material UI and Material Icons v7, with optional Tailwind v4 utilities (utility-first, responsive design).  
  - When modifying or repairing files:
    - Preserve existing formatting, naming conventions, and architectural style.  
    - Place new components, services, or modules in logical and idiomatic project locations.  
  - Place TypeScript interfaces and types **at the top** of each component, service, hook, nanostore, or module.  
  - Ensure imports/exports are correct and respect project aliases (from tsconfig/vite config).  
  - Always consider the **full project context** before making changes.  
  - If new dependencies are needed, mention them in the \`thoughtProcess\` field — never include installation commands.  
  
  File Operation Rules:
  - **add**: Provide the full new file content.  
  - **modify**: Provide the full updated file content (not a diff).  
  - **repair**: Provide the fully repaired file content (not a diff).  
  - **delete**: No \`newContent\` required.  
  - **analyze**: No \`newContent\` required.  
  
  Output Rules:
  - The response MUST consist solely of a single JSON object — no explanations or extra text outside it.  
  - The JSON must strictly validate against the schema provided.  
  - If you applied changes, also provide relevant \`git\` commands for staging and committing, e.g., \`git add .\`, \`git commit -m "feat: your commit message"\`.
`.replace(/^\s+/gm, '');

export const ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT = `
  The response MUST be a single JSON object that validates against this JSON Schema:
  
  {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["title", "summary", "thoughtProcess", "changes"],
    "additionalProperties": false,
    "properties": {
      "title": {
        "type": "string",
        "description": "Brief title"
      },
      "summary": {
        "type": "string",
        "description": "High-level explanation of the overall change request."
      },
      "thoughtProcess": {
        "type": "string",
        "description": "Brief reasoning behind the changes and approach taken."
      },
      "documentation": {
        "type": "string",
        "description": "Optional extended notes in Markdown. May include design decisions, implementation details, and future recommendations/next steps."
      },
      "changes": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["filePath", "action"],
          "additionalProperties": false,
          "properties": {
            "filePath": {
              "type": "string",
              "description": "Path to the file relative to the project root."
            },
            "action": {
              "type": "string",
              "enum": ["add", "modify", "delete", "repair", "analyze"],
              "description": "Type of change being applied to the file."
            },
            "newContent": {
              "type": "string",
              "description": "Full file content for add/modify/repair. Required if action is add, repair or modify. Must include all code with proper JSON escaping."
            },
            "reason": {
              "type": "string",
              "description": "Optional short explanation for why this file change was made (Markdown supported)."
            }
          },
          "allOf": [
            {
              "if": { "properties": { "action": { "const": "delete" } } },
              "then": { "not": { "required": ["newContent"] } }
            },
            {
              "if": { "properties": { "action": { "enum": ["add", "modify", "repair"] } } },
              "then": { "required": ["newContent"] }
            }
          ]
        }
      },
      "gitInstructions": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Optional git commands to execute after applying changes, e.g., git add, git commit."
      }
    }
  }
  
  Example valid output:
  {
    "title": "User Authentication",
    "summary": "Implemented **user authentication** and updated Navbar component.",
    "thoughtProcess": "Added login/signup components, wired them into Navbar, and removed deprecated code.",
    "documentation": "### Notes\\n- Integrated authentication into UI.\\n- Consider adding session persistence.\\n\\n### Next Steps\\n- Implement role-based access control.\\n- Add integration tests.",
    "changes": [
      {
        "filePath": "src/auth/Login.tsx",
        "action": "add",
        "newContent": "import React from 'react';\\nimport { useStore } = '@nanostores/react';\\nimport { authStore } from './authStore';\\n\\nfunction Login() {\\n  const $auth = useStore(authStore);\\n  return <div className='p-4'>Login Form</div>;\\n}\\nexport default Login;",
        "reason": "New **login** component for authentication."
      },
      {
        "filePath": "src/components/Navbar.tsx",
        "action": "modify",
        "newContent": "import React from 'react';\\nimport { Link } = 'react-router-dom';\\nimport { useStore } = '@nanostores/react';\\nimport { authStore } from '../auth/authStore';\\n\\nfunction Navbar() {\\n  const $auth = useStore(authStore);\\n  return (\\n    <nav className='bg-blue-500 p-4 text-white flex justify-between'>\\n      <Link to='/' className='font-bold text-lg'>My App</Link>\\n      <div>\\n        {$auth.isLoggedIn ? (\\n          <button onClick={() => authStore.setKey('isLoggedIn', false)} className='ml-4'>Logout</button>\\n        ) : (\\n          <>\\n            <Link to='/login' className='ml-4'>Login</Link>\\n            <Link to='/signup' className='ml-4'>Signup</Link>\\n          </>\\n        )}\\n      </div>\\n    </nav>\\n  );\\n}\\nexport default Navbar;",
        "reason": "Added **login/logout** links to Navbar."
      },
      {
        "filePath": "src/old/DeprecatedComponent.ts",
        "action": "delete",
        "reason": "Removed unused component."
      }
    ],
    "gitInstructions": [
      "git add .",
      "git commit -m \"feat: implemented authentication\""
    ]
  }
`.replace(/^\s+/gm, '');

// ---------------- TypeScript Types ----------------

export type FileAction = 'add' | 'modify' | 'delete' | 'repair' | 'analyze';

export interface FileChangeBase {
  filePath: string; // Path relative to project root
  action: FileAction; // Type of change
  reason: string; // Required explanation
}

export interface AddOrModifyFileChange extends FileChangeBase {
  action: 'add' | 'modify' | 'repair';
  newContent: string; // Full file content (required)
}

export interface DeleteOrAnalyzeFileChange extends FileChangeBase {
  action: 'delete' | 'analyze';
  newContent?: never; // Forbidden for delete/analyze
}

export type FileChange = AddOrModifyFileChange | DeleteOrAnalyzeFileChange;

export interface Documentation {
  purpose: string; // High-level purpose (e.g., Migration Guide)
  details: string; // Markdown-formatted content (must start with heading)
}

export interface ModelResponse {
  title: string; // Concise title of the change
  summary: string; // High-level explanation
  thoughtProcess: string; // Reasoning behind changes
  documentation?: Documentation; // Optional structured docs
  changes: FileChange[]; // List of file operations
  gitInstructions?: string[]; // Optional git commands to execute after applying changes
}
export * from './yaml-instruction';
export * from './markdown-instruction';
export * from './text-instruction';
