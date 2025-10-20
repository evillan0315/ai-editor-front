/**
 * @file Nanostore for managing the active conversation ID.
 */

import { atom } from 'nanostores';
import { persistentAtom } from '@/utils/persistentAtom';

/**
 * An atom that holds the currently active conversation ID (UUID string).
 * If null, no conversation is active or one needs to be created.
 */
export const activeConversationId = persistentAtom<string | null>('activeConversationId',null);

/**
 * An atom that holds the visibility state of the video chat component.
 */
export const showVideoChat = persistentAtom<boolean>('showVideoChat', false);

/**
 * Sets the active conversation ID.
 * @param id The UUID of the conversation.
 */
export function setActiveConversationId(id: string | null) {
  activeConversationId.set(id);
}

/**
 * Clears the active conversation ID.
 */
export function clearActiveConversationId() {
  activeConversationId.set(null);
}

/**
 * Sets the visibility state of the video chat component.
 * @param value True to show video chat, false to hide.
 */
export function setShowVideoChat(value: boolean) {
  showVideoChat.set(value);
}
