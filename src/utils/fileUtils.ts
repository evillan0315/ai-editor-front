import * as path from 'path-browserify';
import { FileTreeNode as ApiFileTreeNode } from '@/types'; // Changed import alias to ApiFileTreeNode
import { FileEntry } from '@/types/fileTree';

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
 * Transforms a flat list of FileTreeNode objects into a hierarchical tree structure of FileEntry.
 * @param flatList The flat list of FileTreeNode objects from the API.
 * @param projectRoot The root path of the project, used to make paths relative.
 * @returns An array of FileEntry objects representing the top-level items of the tree.
 */
export function buildFileTree(
  flatList: ApiFileTreeNode[], // Accepts ApiFileTreeNode[]
  projectRoot: string,
): FileEntry[] {
  const normalizedProjectRoot = projectRoot.replace(/\\/g, '/');
  const pathToNodeMap = new Map<string, FileEntry>();

  // 1. Create all nodes and map them by their full path.
  flatList.forEach((apiEntry) => {
    // Ensure `path` is a string, provide fallback for robustness. ApiFileTreeNode uses `path`.
    const entryPath = apiEntry.path
      ? apiEntry.path.replace(/\\/g, '/')
      : `/invalid-path/${apiEntry.name || 'unknown'}`;

    // Skip entries with invalid paths (e.g., empty or non-string paths)
    if (!entryPath || entryPath.includes('/invalid-path/')) {
      console.warn('FileTree: Skipping entry due to invalid path:', apiEntry);
      return;
    }

    // If apiEntry.name is falsy, derive it from the basename of the path
    const entryName = apiEntry.name || path.basename(entryPath);

    const relativePath = entryPath.startsWith(normalizedProjectRoot + '/')
      ? entryPath.substring(normalizedProjectRoot.length + 1)
      : entryPath === normalizedProjectRoot
        ? '.' // Project root itself
        : entryPath; // Fallback if path doesn't start with project root

    const newEntry: FileEntry = {
      ...apiEntry,
      name: entryName, // Ensure 'name' is always a string
      path: entryPath, // ApiFileTreeNode's 'path' maps to FileEntry's 'path'
      relativePath: relativePath,
      children: [], // Initialize children as empty FileEntry[]
      collapsed: true,
      depth: 0,
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
    if (fullPath === normalizedProjectRoot && node.type === 'folder') {
      // Corrected 'directory' to 'folder'
      return;
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
        if (a.type === 'folder' && b.type !== 'folder') return -1; // Corrected 'directory' to 'folder'
        if (a.type !== 'folder' && b.type === 'folder') return 1; // Corrected 'directory' to 'folder'
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
    if (a.type === 'folder' && b.type !== 'folder') return -1; // Corrected 'directory' to 'folder'
    if (a.type !== 'folder' && b.type === 'folder') return 1; // Corrected 'directory' to 'folder'
    return a.name.localeCompare(b.name);
  });
}
