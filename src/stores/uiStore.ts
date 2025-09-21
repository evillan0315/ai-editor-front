import { atom } from 'nanostores';
import type { ReactNode } from 'react';

// --- Right Sidebar ---

// Whether the right sidebar is visible
export const isRightSidebarVisible = atom(false);

// What content should be rendered inside the right sidebar
export const rightSidebarContent = atom<ReactNode | null>(null);

// --- Left Sidebar ---

// Whether the left sidebar is visible
export const isLeftSidebarVisible = atom(false);

// What content should be rendered inside the left sidebar
export const leftSidebarContent = atom<ReactNode | null>(null);

