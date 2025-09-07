import { getToken } from '@/stores/authStore';
import {
  Organization,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  PaginationOrganizationQueryDto,
  PaginationOrganizationResultDto,
} from '@/types';

const API_BASE_URL = `/api/organization`; // Base URL for organization API

interface ApiError extends Error {
  statusCode?: number;
  message: string;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  return fetch(url, { ...options, headers });
};

/**
 * Creates a new organization.
 */
export const createOrganization = async (
  dto: CreateOrganizationDto,
): Promise<Organization> => {
  try {
    const response = await fetchWithAuth(API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return handleResponse<Organization>(response);
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

/**
 * Retrieves all organization records.
 */
export const getOrganizations = async (): Promise<Organization[]> => {
  try {
    const response = await fetchWithAuth(API_BASE_URL, {
      method: 'GET',
    });
    return handleResponse<Organization[]>(response);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

/**
 * Retrieves paginated organization records.
 */
export const getPaginatedOrganizations = async (
  query: PaginationOrganizationQueryDto = {},
): Promise<PaginationOrganizationResultDto> => {
  const queryString = new URLSearchParams(
    query as Record<string, any>,
  ).toString();
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/paginated?${queryString}`,
      {
        method: 'GET',
      },
    );
    return handleResponse<PaginationOrganizationResultDto>(response);
  } catch (error) {
    console.error('Error fetching paginated organizations:', error);
    throw error;
  }
};

/**
 * Finds an organization by its ID.
 */
export const getOrganizationById = async (
  id: string,
): Promise<Organization> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/${id}`, {
      method: 'GET',
    });
    return handleResponse<Organization>(response);
  } catch (error) {
    console.error(`Error fetching organization with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an organization by its ID.
 */
export const updateOrganization = async (
  id: string,
  dto: UpdateOrganizationDto,
): Promise<Organization> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    return handleResponse<Organization>(response);
  } catch (error) {
    console.error(`Error updating organization with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes an organization by its ID.
 */
export const deleteOrganization = async (id: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    // For delete, usually no content, just status check
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error deleting organization with ID ${id}:`, error);
    throw error;
  }
};
