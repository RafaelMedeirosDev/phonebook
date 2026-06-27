import { useMutation } from '@tanstack/react-query';
import { askAgent } from '../api/agentApi';

export function useAgentChat() {
  return useMutation({
    mutationFn: askAgent,
  });
}
