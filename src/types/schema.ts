/**
 * Interface representing a Schema record.
 */
export interface Schema {
  id: string;
  name: string;
  schema: object;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
}

/**
 * Payload for creating a new schema.
 */
export interface CreateSchemaPayload {
  name: string;
  schema: object;
}

/**
 * Payload for updating an existing schema.
 */
export interface UpdateSchemaPayload {
  name?: string;
  schema?: object;
}

/**
 * Query parameters for paginated schema retrieval.
 */
export interface PaginationSchemaQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  schema?: object; // Note: Filtering by object directly might not be supported by NestJS query parsing depending on implementation.
}

/**
 * Result structure for paginated schema retrieval.
 */
export interface PaginationSchemaResult {
  items: Schema[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
