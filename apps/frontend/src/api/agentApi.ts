import { apiClient } from './client';

interface AskAgentResponse {
  reply: string;
}

export function askAgent(message: string): Promise<AskAgentResponse> {
  return apiClient<AskAgentResponse>('/agent', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
