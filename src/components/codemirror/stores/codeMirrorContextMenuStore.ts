import { map } from 'nanostores';
import { ICodeMirrorContextMenuItem, ICodeMirrorContextMenuState } from '@/components/codemirror/types';

/**
 * @const codeMirrorContextMenuStore
 * @description A Nanostore to manage the state of the CodeMirror editor's custom context menu.
 */
export const codeMirrorContextMenuStore = map<ICodeMirrorContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  items: [],
});

/**
 * @function showCodeMirrorContextMenu
 * @description Displays the CodeMirror context menu at the specified coordinates with given items.
 * @param {number} x - The x-coordinate for the menu.
 * @param {number} y - The y-coordinate for the menu.
 * @param {ICodeMirrorContextMenuItem[]} items - An array of menu items to display.
 */
export const showCodeMirrorContextMenu = (
  x: number,
  y: number,
  items: ICodeMirrorContextMenuItem[],
) => {
  codeMirrorContextMenuStore.set({
    visible: true,
    x,
    y,
    items,
  });
};

/**
 * @function hideCodeMirrorContextMenu
 * @description Hides the CodeMirror context menu.
 */
export const hideCodeMirrorContextMenu = () => {
  codeMirrorContextMenuStore.set({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });
};
