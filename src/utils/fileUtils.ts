import * as path from 'path-browserify';
import { FlatApiFileEntry, BackendFileTreeNode } from '@/types'; // Import new types from index
import { FileEntry } from '@/types/fileTree'; // Import UI FileEntry

export function joinPaths(...paths: string[]): string {
  // Basic join for web paths. Not as robust as node's path.join across all OS.
  // Assumes forward slashes for internal consistency.
  return paths
    .filter((p) => p !== '')
    .join('/')
    .replace(/\/\/+/g, '/');
}

export function getRelativePath(absolutePath: string, basePath: string): string {
  // Ensure paths use forward slashes for consistency
  const normalizedAbsolutePath = absolutePath.replace(/\\/g, '/');
  const normalizedBasePath = basePath.replace(/\\/g, '/');

  // If base path ends with a slash, remove it for consistent comparison
  const cleanBasePath = normalizedBasePath.endsWith('/')
    ? normalizedBasePath.slice(0, -1)
    : normalizedBasePath;
  const cleanAbsolutePath = normalizedAbsolutePath.endsWith('/')
    ? normalizedAbsolutePath.slice(0, -1)
    : normalizedAbsolutePath;

  // Check if the absolute path starts with the base path
  if (cleanAbsolutePath.startsWith(cleanBasePath)) {
    let relative = cleanAbsolutePath.substring(cleanBasePath.length);
    // Remove leading slash if it exists (e.g., '/src' becomes 'src')
    if (relative.startsWith('/')) {
      relative = relative.substring(1);
    }
    return relative === '' ? '.' : relative; // '.' for project root itself
  }
  return absolutePath; // Cannot make relative, return original or handle as an error
}

/**
 * Flattens a recursive tree of BackendFileTreeNode into a flat array of FlatApiFileEntry.
 */
export function flattenFileTreeResponse(nodes: BackendFileTreeNode[]): FlatApiFileEntry[] {
  const flatList: FlatApiFileEntry[] = [];
  const stack: BackendFileTreeNode[] = [...nodes];

  while (stack.length > 0) {
    const node = stack.shift();

    if (node) {
      // Deconstruct to omit 'children' and directly use 'path' (from BackendFileTreeNode)
      const { children, ...flatNode } = node;
      flatList.push(flatNode);

      if (children && children.length > 0) {
        stack.unshift(...children); // DFS order
      }
    }
  }
  return flatList;
}

/**
 * Transforms a flat list of FileEntry objects (from fileTree.ts) into a hierarchical tree structure for UI.
 * @param flatList The flat list of FileEntry objects to build the tree from. (Has `filePath` property)
 * @param projectRoot The root path of the project, used to make paths relative and filter.
 * @returns An array of FileEntry objects representing the top-level items of the tree.
 */
export function buildFileTree(
  flatList: FileEntry[], // Input is now FileEntry[] from fileTree.ts
  projectRoot: string,
): FileEntry[] {
  const normalizedProjectRoot = projectRoot.replace(/\\/g, '/');
  const pathToNodeMap = new Map<string, FileEntry>(); // Map uses absolute path (string) to UI FileEntry

  // 1. Create all nodes and map them by their full path.
  flatList.forEach((entry) => {
    const entryPath = entry.filePath
      ? entry.filePath.replace(/\\/g, '/')
      : `/invalid-path/${entry.name || 'unknown'}`;

    if (!entryPath || entryPath.includes('/invalid-path/')) {
      console.warn('FileTree: Skipping entry due to invalid path:', entry);
      return;
    }

    const relativePath = getRelativePath(entryPath, normalizedProjectRoot);

    const newEntry: FileEntry = {
      // Create a new object to ensure immutability and add UI state
      ...entry, // Spread existing properties
      filePath: entryPath, // Ensure filePath is normalized and consistent
      relativePath: relativePath,
      children: [], // Initialize children
      collapsed: true, // Default UI state
      depth: 0, // Default UI state
    };
    pathToNodeMap.set(entryPath, newEntry);
  });

  const topLevelNodes: FileEntry[] = [];

  // 2. Build the hierarchy and identify top-level nodes.
  // Iterate through paths in a sorted order to ensure parents are processed before children.
  // Sort by length first to process shorter paths (parents) before longer paths (children).
  const sortedFullPaths = Array.from(pathToNodeMap.keys()).sort(
    (a, b) => a.length - b.length || a.localeCompare(b),
  );

  sortedFullPaths.forEach((fullPath) => {
    const node = pathToNodeMap.get(fullPath)!; // Node is guaranteed to exist in map due to sortedFullPaths.

    // If the node itself represents the project root directory, its children will be the top-level items.
    // We don't add the project root directory node itself to `topLevelNodes` directly.
    if (node.filePath === normalizedProjectRoot && node.type === 'folder') {
      return; // This is the root folder itself, its children will be added to topLevelNodes
    }

    const parentPath = path.dirname(fullPath);

    // If the parentPath is the normalizedProjectRoot, then this node is a top-level item.
    // Special case: if projectRoot is '.', then its parentPath for top-level children is also '.'.
    if (
      parentPath === normalizedProjectRoot ||
      (normalizedProjectRoot === '.' && parentPath === '.')
    ) {
      topLevelNodes.push(node);
    } else {
      // Try to find the parent node in the map.
      const parentNode = pathToNodeMap.get(parentPath);
      if (parentNode) {
        // If the parent node exists, add the current node as a child.
        parentNode.children!.push(node);
      } else {
        // This case indicates a structural issue where a parent directory
        // for a valid file/directory in `flatList` was not itself in `flatList`, or is outside the project root.
        // For robustness, add it to topLevelNodes to ensure it's visible.
        topLevelNodes.push(node);
      }
    }
  });

  // 3. Set depths and sort children recursively.
  const setDepthsAndSortChildren = (nodes: FileEntry[], depth: number) => {
    nodes.forEach((node) => {
      node.depth = depth;

      // Filter out any potential undefined/null children before sorting to prevent errors.
      node.children = node.children?.filter(Boolean) as FileEntry[];

      node.children?.sort((a, b) => {
        // Double-check for undefined/null/malformed entries during sorting for ultimate safety.
        if (!a || !b || typeof a.name !== 'string' || typeof b.name !== 'string') {
          console.warn(
            `FileTree: Malformed entry found during children sorting. Skipping: a=${JSON.stringify(a)}, b=${JSON.stringify(b)}`,
          );
          return 0; // Maintain relative order if comparison cannot be made.
        }
        if (a.type === 'folder' && b.type !== 'folder') return -1; // Use 'folder' consistently
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });

      if (node.children && node.children.length > 0) {
        setDepthsAndSortChildren(node.children, depth + 1);
      } else {
        node.children = []; // Ensure children array is empty if no children
      }
    });
  };

  setDepthsAndSortChildren(topLevelNodes, 0);

  // 4. Sort the final top-level nodes.
  return topLevelNodes.sort((a, b) => {
    // Double-check for undefined/null/malformed entries during top-level sorting.
    if (!a || !b || typeof a.name !== 'string' || typeof b.name !== 'string') {
      console.warn(
        `FileTree: Malformed root entry found during sorting. Skipping: a=${JSON.stringify(a)}, b=${JSON.stringify(b)}`,
      );
      return 0;
    }
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });
}
