import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

@Injectable()
export class OpenAIProvider {
  private readonly client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async complete(
    messages: ChatCompletionMessageParam[],
    tools: ChatCompletionTool[],
  ) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
    });

    return response.choices[0].message;
  }
}