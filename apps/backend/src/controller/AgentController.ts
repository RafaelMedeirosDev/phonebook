import { Body, Controller, Post } from '@nestjs/common';
import { AgentService } from 'src/service/AgentService';
import { AskAgentDTO } from 'src/shared/dtos/AskAgentDTO';

@Controller('/agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  async ask(@Body() { message }: AskAgentDTO): Promise<{ reply: string }> {
    const reply = await this.agentService.execute({ message });
    return { reply };
  }
}
