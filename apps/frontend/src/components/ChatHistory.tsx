import type { ChatMessage as ChatMessageType } from '../types/ChatMessage';
import { ChatMessage } from './ChatMessage';

interface Props {
  messages: ChatMessageType[];
}

export function ChatHistory({ messages }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
}
