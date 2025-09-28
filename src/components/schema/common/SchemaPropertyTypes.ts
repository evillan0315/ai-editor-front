/**
 * @module SchemaPropertyTypes
 * @description Defines the interface for a SchemaProperty, which represents a single property within a JSON schema.
 */

/**
 * Interface for a SchemaProperty to support nested structures in the UI.
 * Each property can have various JSON schema attributes and UI-specific flags.
 */
export interface SchemaProperty {
  id: string; // Unique ID for React keying and manipulation
  name: string; // Property name
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
  required: boolean;
  description?: string;
  format?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  items?: SchemaProperty; // For array type, defines the schema for elements within the array (a single SchemaProperty)
  properties?: SchemaProperty[]; // For object type, defines the properties of the object (an array of SchemaProperty)
  showOptions?: boolean; // Controls visibility of advanced options for THIS property
  showChildren?: boolean; // Controls visibility of nested properties (for array/object types)
}
