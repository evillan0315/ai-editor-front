/**
 * @file Defines shared types and interfaces for the chat components.
 */

/**
 * Represents a single message in the chat.
 */
export interface Message {
  id: string;
  userId: string;
  text: string;
  timestamp: Date;
}

/**
 * Props for the MessageBubble component.
 */
export interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

/**
 * Props for the MessageList component.
 */
export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

/**
 * Props for the MessageInput component.
 */
export interface MessageInputProps {
  onSendMessage: (text: string, userId?: string) => void;
}