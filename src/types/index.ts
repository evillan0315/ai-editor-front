// /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/project-board-front/src/types/index.ts
// =========================================================================
// Core Type Exports from Refactored Modules
// =========================================================================
export * from './main';
export * from './refactored/fileTree';
export * from './refactored/media';
export * from './refactored/spotify';
export * from './terminal';
export * from './auth';
export * from './resume';
export * from './project';
export * from './recording';
//export * from './conversation';


export interface BaseReponseDto {
  message?: string;
  statusCode?: number;
  error?: string;
  timestamp?: string;
  path?: string;
}
