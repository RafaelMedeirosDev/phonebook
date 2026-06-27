import { useState } from 'react';
import { ChatHistory } from './components/ChatHistory';
import { ChatBox } from './components/ChatBox';
import { useAgentChat } from './hooks/useAgentChat';
import type { ChatMessage } from './types/ChatMessage';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { mutate, isPending } = useAgentChat();

  function handleSend(content: string) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMessage]);

    mutate(content, {
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: data.reply },
        ]);
      },
      onError: () => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Ocorreu um erro ao falar com o agente. Tente novamente.',
          },
        ]);
      },
    });
  }

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col">
      <header className="border-b p-4">
        <h1 className="text-lg font-semibold">
          Agenda de Contatos — Assistente IA
        </h1>
      </header>
      <ChatHistory messages={messages} />
      <ChatBox onSend={handleSend} disabled={isPending} />
    </div>
  );
}

export default App;
