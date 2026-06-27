import { useState, type FormEvent } from 'react';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatBox({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    onSend(value);
    setValue('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
        placeholder="Digite uma mensagem..."
        className="flex-1 rounded-full border px-4 py-2 outline-none focus:border-purple-500"
      />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-full bg-purple-600 px-5 py-2 text-white disabled:opacity-50"
      >
        Enviar
      </button>
    </form>
  );
}
