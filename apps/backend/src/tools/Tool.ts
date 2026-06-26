export const TOOLS = Symbol('TOOLS');

export interface ToolParameters {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

export abstract class Tool<Input = any, Output = any> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly parameters: ToolParameters;
  abstract execute(input: Input): Promise<Output>;
}
