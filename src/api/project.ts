import { API_BASE_URL, ResponseError, handleResponse, fetchWithAuth } from '@/api';

import {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  PaginationProjectQueryDto,
  PaginationProjectResultDto,
} from '@/types';

const PROJECT_API_BASE = `${API_BASE_URL}/project`;

/**
 * Creates a new project.
 */
export const createProject = async (
  dto: CreateProjectDto,
): Promise<Project> => {
  try {
    const response = await fetchWithAuth(PROJECT_API_BASE, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return handleResponse<Project>(response);
  } catch (error: unknown) {
    console.error('Error creating project:', error);
    throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Retrieves all project records, optionally filtered by organization.
 */
export const getProjects = async (
  organizationId?: string,
): Promise<Project[]> => {
  const queryString = organizationId ? `?organizationId=${organizationId}` : '';
  try {
    const response = await fetchWithAuth(`${PROJECT_API_BASE}${queryString}`, {
      method: 'GET',
    });
    return handleResponse<Project[]>(response);
  } catch (error: unknown) {
    console.error('Error fetching projects:', error);
    throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Retrieves paginated project records, optionally filtered by organization.
 */
export const getPaginatedProjects = async (
  query: PaginationProjectQueryDto = {},
): Promise<PaginationProjectResultDto> => {
  const queryString = new URLSearchParams(
    query as Record<string, any>,
  ).toString();
  try {
    const response = await fetchWithAuth(
      `${PROJECT_API_BASE}/paginated?${queryString}`,
      {
        method: 'GET',
      },
    );
    return handleResponse<PaginationProjectResultDto>(response);
  } catch (error: unknown) {
    console.error('Error fetching paginated projects:', error);
    throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Finds a project by its ID.
 */
export const getProjectById = async (id: string): Promise<Project> => {
  try {
    const response = await fetchWithAuth(`${PROJECT_API_BASE}/${id}`, {
      method: 'GET',
    });
    return handleResponse<Project>(response);
  } catch (error: unknown) {
    console.error(`Error fetching project with ID ${id}:`, error);
    throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Updates a project by its ID.
 */
export const updateProject = async (
  id: string,
  dto: UpdateProjectDto,
): Promise<Project> => {
  try {
    const response = await fetchWithAuth(`${PROJECT_API_BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    return handleResponse<Project>(response);
  } catch (error: unknown) {
    console.error(`Error updating project with ID ${id}:`, error);
    throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Deletes a project by its ID.
 */
export const deleteProject = async (id: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${PROJECT_API_BASE}/${id}`, {
      method: 'DELETE',
    });
    // For delete, usually no content, just status check
    await handleResponse<void>(response);
  } catch (error: unknown) {
    console.error(`Error deleting project with ID ${id}:`, error);
    throw (error instanceof ResponseError) ? error : new Error(error instanceof Error ? error.message : String(error));
  }
};
