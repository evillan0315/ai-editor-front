// =========================================================================
// Terminal & Build Related Types
// =========================================================================

export interface TerminalCommandResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | null;

export interface PackageScript {
  name: string;
  script: string; // The raw script command from package.json, e.g., "vite --port 3001"
}

export interface ProjectScriptsResponse {
  scripts: PackageScript[];
  packageManager: PackageManager;
}

export enum ScriptStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface SystemInfo {
  os: string;
  arch: string;
  platform: string;
  nodeVersion: string;
  cpu: string;
  memory: string;
}

export interface PromptData {
  cwd: string;
}

export interface CreateCommandHistoryDto {
  command: string;
  workingDirectory?: string;
  status?: string;
  exitCode?: number;
  output?: string;
  errorOutput?: string;
  durationMs?: number;
  shellType?: string;
}

export interface CreateTerminalSessionDto {
  name?: string;
  ipAddress?: string;
  userAgent?: string;
  clientInfo?: object;
}

export interface ExecDto {
  command?: string;
  newCwd?: string;
}

export interface GetPackageScriptsDto {
  projectRoot: string;
}

export interface SshCommandDto {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKeyPath?: string;
  command: string;
}

export interface TerminalCommandDto {
  command: string;
  cwd: string;
}

export interface ResizePayload {
  cols: number;
  rows: number;
}

export interface SSHConnectPayload {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKeyPath?: string;
}
