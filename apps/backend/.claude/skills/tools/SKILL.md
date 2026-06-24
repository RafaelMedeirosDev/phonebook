---
name: tools
description: Gera uma Tool dentro de src/tools — a porta de entrada de uma operacao para a IA (function calling da OpenAI), equivalente ao Controller mas para a IA em vez de HTTP. Use quando uma operacao existente precisar ser exposta para a IA decidir chamar.
---

# Skill: Tools (IA / function calling)

Uma Tool e a mesma ideia do Controller, so que a porta de entrada e a **IA** em vez do HTTP. Ela nao tem regra de negocio — so declara o "cartao de visita" que vai pra IA (`name`/`description`/`parameters`) e delega para um Service ja existente (`src/service/*`). A IA nunca executa nada: ela so devolve "quero chamar a tool X com esses argumentos", e quem executa de fato e essa classe.

## Contrato e registry (criados uma unica vez)

Toda Tool implementa o mesmo contrato, porque o orquestrador trata todas elas de forma generica. `src/tools/Tool.ts` tambem exporta o token `TOOLS`, usado pelo registry abaixo:

```ts
export const TOOLS = Symbol('TOOLS');

export interface ToolParameters {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

export abstract class Tool<Input = any, Output = any> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly parameters: ToolParameters;
  abstract execute(input: Input): Promise<Output>;
}
```

O registry e um **array explicito** (decisao deliberada — ver discussao sobre DiscoveryService vs array: tools sao acoes que a IA pode pedir pra executar, expor uma automaticamente so por "implementar Tool" seria uma superficie de ataque; array explicito = allowlist). Nao existe `ToolsModule` separado — o provider do `TOOLS` mora direto em `src/app.module.ts` (skill `module`):

```ts
{
  provide: TOOLS,
  useFactory: (
    createContactTool: CreateContactTool,
    listContactTool: ListContactTool,
  ): Tool[] => [createContactTool, listContactTool],
  inject: [CreateContactTool, ListContactTool],
}
```

Toda Tool nova precisa ser adicionada nesse `useFactory` (tanto no `inject` quanto no array retornado) — isso e responsabilidade da skill `module`, nao desta skill.

## Convencoes — tool concreta

- Arquivo: `src/tools/{Operation}{Entity}Tool.ts` — PascalCase, sem kebab-case, sem sufixo com ponto
- Classe: `{Operation}{Entity}Tool implements Tool<Input, Output>`
- `@Injectable()` na classe — vai ser injetada no orquestrador, igual um provider qualquer
- `name`: identificador que a IA usa para pedir essa tool — **snake_case** (convencao da OpenAI), ex.: `create_contact`, `list_contacts`
- `description`: frase clara dizendo o que a tool faz e quando usar — e o unico texto que a IA le para decidir, escreva pensando nisso
- `parameters`: JSON Schema dos campos que a IA precisa preencher. Se a operacao nao recebe entrada, `properties: {}` e sem `required`
- Construtor injeta o Service que ja existe (nunca Repository direto — a regra de negocio mora no Service, a Tool so traduz o formato da IA pro formato do Service)
- `execute(input)` so chama o Service e retorna o resultado — sem logica extra aqui
- Imports usam caminho absoluto a partir de `src` (mesmo padrao das demais skills)

## Template generico — com entrada (ex.: create)

```ts
import { Injectable } from '@nestjs/common';
import { {Entity} } from '@prisma/client';
import { Create{Entity}Service } from 'src/service/Create{Entity}Service';
import { Tool } from 'src/tools/Tool';

interface Input {
  // mesmos campos que o Service espera
}

@Injectable()
export class Create{Entity}Tool implements Tool<Input, {Entity}> {
  readonly name = 'create_{entity_snake}';
  readonly description = '{Frase clara do que a tool faz e quando a IA deve usa-la.}';
  readonly parameters = {
    type: 'object' as const,
    properties: {
      // um campo por entrada, com description proprio explicando o campo
    },
    required: [
      // campos obrigatorios
    ],
  };

  constructor(private readonly create{Entity}Service: Create{Entity}Service) {}

  execute(input: Input): Promise<{Entity}> {
    return this.create{Entity}Service.execute(input);
  }
}
```

## Template generico — sem entrada (ex.: list)

```ts
import { Injectable } from '@nestjs/common';
import { {Entity} } from '@prisma/client';
import { List{Entity}Service } from 'src/service/List{Entity}Service';
import { Tool } from 'src/tools/Tool';

@Injectable()
export class List{Entity}Tool implements Tool<void, {Entity}[]> {
  readonly name = 'list_{entities_snake}';
  readonly description = '{Frase clara do que a tool faz e quando a IA deve usa-la.}';
  readonly parameters = {
    type: 'object' as const,
    properties: {},
  };

  constructor(private readonly list{Entity}Service: List{Entity}Service) {}

  execute(): Promise<{Entity}[]> {
    return this.list{Entity}Service.execute();
  }
}
```

## Exemplo aplicado: Contact (real, ja implementado)

- `src/tools/CreateContactTool.ts` — `name: 'create_contact'`, injeta `CreateContactService`, `parameters` com `name`/`phone` obrigatorios
- `src/tools/ListContactTool.ts` — `name: 'list_contacts'`, injeta `ListContactService`, sem entrada (`properties: {}`)

## Escopo desta skill

Esta skill cuida **apenas do arquivo da Tool** (o contrato `Tool.ts` e o token `TOOLS` ja existem, criados uma unica vez). Ela assume que o Service ja existe — nao cria Service, Repository, DTO nem nada de outra camada. Tambem **nao** cuida de:

- adicionar a Tool no `useFactory` do `TOOLS` em `app.module.ts` (isso e a skill `module`)
- a integracao com o client da OpenAI em si (isso e o `OpenAIProvider`, em `src/provider/`)
- o orquestrador que de fato chama o `OpenAIProvider` com a lista de tools e despacha a resposta

## Checklist ao aplicar

1. Confirmar qual Service existente essa Tool vai expor para a IA
2. Confirmar `name` (snake_case, unico) e escrever uma `description` clara — e o que a IA usa para decidir
3. Definir `parameters` cobrindo exatamente os campos que o Service precisa (ou `properties: {}` se nao recebe entrada)
4. Criar `src/tools/{Operation}{Entity}Tool.ts` seguindo o template
5. Adicionar a Tool em `app.module.ts` — como provider e no `useFactory` do `TOOLS` (skill `module`)
6. Rodar o build **e iniciar a aplicacao** para validar
