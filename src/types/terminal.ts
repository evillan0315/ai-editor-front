 // src/types/terminal.ts
export interface SystemInfo {
  platform: string;
  type: string;
  release: string;
  arch: string;
  uptime: number;
  hostname: string;
  cwd: string;
}

export interface ExecDto {
  command?: string;
  newCwd?: string;
}

export interface SSHConnectPayload {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface ResizePayload {
  cols: number;
  rows: number;
}

export interface PromptData {
  cwd: string;
  command: string;
}