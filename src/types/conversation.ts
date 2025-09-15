// src/types/conversation.ts

/**
 * Enum representing different types of AI requests.
 * Replicated from backend's @prisma/client for frontend type safety.
 */
export enum RequestType {
  TEXT_ONLY = 'TEXT_ONLY',
  TEXT_WITH_IMAGE = 'TEXT_WITH_IMAGE',
  TEXT_WITH_FILE = 'TEXT_WITH_FILE',
  LLM_GENERATION = 'LLM_GENERATION',
  LIVE_API = 'LIVE_API',
  RESUME_GENERATION = 'RESUME_GENERATION',
  RESUME_OPTIMIZATION = 'RESUME_OPTIMIZATION',
  RESUME_ENHANCEMENT = 'RESUME_ENHANCEMENT',
  VIDEO_GENERATION = 'VIDEO_GENERATION',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  CODE_GENERATION = 'CODE_GENERATION',
  CODE_MODIFICATION = 'CODE_MODIFICATION',
  CODE_REPAIR = 'CODE_REPAIR',
  CODE_ANALYSIS = 'CODE_ANALYSIS',
}

/**
 * Defines parameters for pagination.
 */
export interface PaginationDto {
  page?: number;
  limit?: number;
  search?: string;
  requestType?: RequestType;
}

/**
 * Represents a summary of a single conversation.
 */
export interface ConversationSummaryDto {
  conversationId: string;
  lastUpdatedAt: string | Date; // Use string for ISO format from API, Date for client-side processing
  requestCount: number;
  firstPrompt: string | null;
  lastPrompt: string | null;
  firstRequestType?: RequestType | null;
}

/**
 * Generic structure for paginated API responses.
 */
export interface PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
