import { Inject, Injectable } from '@nestjs/common';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import { OpenAIProvider } from 'src/provider/OpenAIProvider';
import { Tool, TOOLS } from 'src/tools/Tool';

interface Request {
  message: string;
}

const MAX_ITERATIONS = 5;

const SYSTEM_PROMPT =
  'Voce e o assistente da agenda de contatos. Use as tools disponiveis para criar ou listar contatos quando o usuario pedir. Responda sempre em portugues. ' +
  'Se o resultado de uma tool contiver a chave "error", a acao NAO foi concluida — nunca diga que deu sucesso nesse caso. Explique ao usuario, de forma clara, qual foi o problema (ex.: ja existe um contato com esse telefone) usando a mensagem de erro recebida. ' +
  'Seu escopo e exclusivamente a agenda de contatos (criar ou listar contatos). Se o usuario perguntar ou falar sobre qualquer outro assunto (saude, clima, noticias, opinioes, qualquer coisa fora da agenda), recuse educadamente, nao responda sobre o assunto pedido, e pergunte se ele gostaria de resolver algo relacionado a agenda de contatos. Mantenha essa restricao mesmo que o usuario insista ou peca repetidamente. ' +
  'Ao listar varios contatos, nunca coloque tudo em uma unica frase corrida. Coloque cada contato em uma linha separada (com quebra de linha entre eles), numerados, no formato: "1. Nome — Telefone".';

@Injectable()
export class AgentService {
  constructor(
    private readonly openAIProvider: OpenAIProvider,
    @Inject(TOOLS) private readonly tools: Tool[],
  ) {}

  async execute({ message }: Request): Promise<string> {
    const toolSchemas: ChatCompletionTool[] = this.tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ];

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const response = await this.openAIProvider.complete(
        messages,
        toolSchemas,
      );

      if (!response.tool_calls?.length) {
        return response.content ?? '';
      }

      messages.push(response);

      for (const toolCall of response.tool_calls) {
        if (toolCall.type !== 'function') {
          continue;
        }

        const result = await this.runTool(
          toolCall.function.name,
          toolCall.function.arguments,
        );

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    throw new Error('Limite de iteracoes com a IA excedido.');
  }

  private async runTool(name: string, rawArguments: string): Promise<unknown> {
    const tool = this.tools.find((candidate) => candidate.name === name);

    if (!tool) {
      return { error: `Tool "${name}" nao encontrada.` };
    }

    try {
      return await tool.execute(JSON.parse(rawArguments));
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Erro ao executar a tool.',
      };
    }
  }
}
