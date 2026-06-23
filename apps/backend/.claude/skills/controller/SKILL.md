---
name: controller
description: Gera um Controller NestJS para uma entidade, seguindo o padrao em camadas do backend (Controller -> Service -> Domain/DTO). Use ao criar ou adicionar endpoints REST dentro de apps/backend.
---

# Skill: Controller (NestJS)

Gera a camada HTTP de uma entidade seguindo a convencao do projeto. O Controller e fino: nunca contem regra de negocio, apenas valida a forma da requisicao e delega para um Service (`src/service/*`).

## Convencoes

- Arquivo: `src/controller/{Entity}Controller.ts` — PascalCase, sem kebab-case, sem sufixo com ponto
- Classe: `{Entity}Controller`
- Imports usam caminho absoluto a partir de `src` (ex.: `'src/domain/{Entity}Repository'`), nao relativo — mesmo padrao das demais skills (`domain`, `external`, `dto`, `service`, `module`). Confirmado que o `nest build` reescreve corretamente para `require` relativo no `dist`
- Rota base: `@Controller('/{entities-kebab}')` — plural, kebab-case, com `/` inicial (isso e URL HTTP, nao nome de arquivo — fica em minusculas mesmo)
- Cada operacao HTTP e resolvida por **um Service dedicado** (um por caso de uso), injetado via construtor:
  - `create` -> `Create{Entity}Service`
  - `list` -> `List{Entity}Service`
  - `findById` -> `Find{Entity}Service`
  - `update` -> `Update{Entity}Service`
  - `delete` -> `Delete{Entity}Service`
- Body de entrada sempre tipado por um DTO de `src/shared/dtos/Create{Entity}DTO.ts` (ou `Update{Entity}DTO.ts`), passado direto como parametro
- Tipo de retorno depende da operacao (ver "Convencao de retorno" abaixo) — nunca retorna o DTO
- So gere os endpoints que foram pedidos — nao adicione `update`/`delete`/`findById` especulativamente so porque "completa o CRUD"

## Convencao de retorno

- `create`/`update` retornam o model puro do Prisma: `{Entity}` importado de `@prisma/client`
- `list`/`findById` retornam o tipo hidratado (com relations) definido em `domain/{Entity}Repository`: `{Entity}s`
- `delete` retorna `Promise<void>`

## Mapeamento HTTP

| Operacao   | Decorator        | Parametro                            | Retorno                      |
|------------|-------------------|----------------------------------------|--------------------------------|
| create     | `@Post()`         | `@Body() dto: Create{Entity}DTO`       | `Promise<{Entity}>`            |
| list       | `@Get()`          | —                                       | `Promise<{Entity}s[]>`         |
| findById   | `@Get(':id')`     | `@Param('id') id: string`              | `Promise<{Entity}s \| null>`   |
| update     | `@Patch(':id')`   | `@Param('id') id`, `@Body() dto`       | `Promise<{Entity}>`            |
| delete     | `@Delete(':id')`  | `@Param('id') id: string`              | `Promise<void>`                |

## Template generico

```ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import { {Entity} } from '@prisma/client';
import { {Entity}s } from 'src/domain/{Entity}Repository';
import { Create{Entity}Service } from 'src/service/Create{Entity}Service';
import { List{Entity}Service } from 'src/service/List{Entity}Service';
import { Create{Entity}DTO } from 'src/shared/dtos/Create{Entity}DTO';

@Controller('/{entities-kebab}')
export class {Entity}Controller {
  constructor(
    private readonly create{Entity}Service: Create{Entity}Service,
    private readonly list{Entity}Service: List{Entity}Service,
  ) {}

  @Post()
  create(@Body() dto: Create{Entity}DTO): Promise<{Entity}> {
    return this.create{Entity}Service.execute(dto);
  }

  @Get()
  list(): Promise<{Entity}s[]> {
    return this.list{Entity}Service.execute();
  }
}
```

Adicione `@Get(':id')`, `@Patch(':id')` ou `@Delete(':id')` seguindo a mesma forma (ver tabela acima) somente quando o Service daquele caso de uso existir.

## Exemplo aplicado: Contact

Pedido concreto: salvar um contato e trazer a lista completa de contatos da agenda.

- `src/controller/ContactController.ts` -> `ContactController`, rota `/contacts`
- Injeta `CreateContactService` e `ListContactService`
- `POST /contacts` com `CreateContactDTO { name, phone, email? }` -> `Promise<Contact>` (de `@prisma/client`)
- `GET /contacts` -> `Promise<Contacts[]>` (tipo hidratado de `domain/ContactRepository`)

## Escopo desta skill

Esta skill cuida **apenas da camada Controller**. Ela assume que o DTO (`shared/dtos`), o contrato de dominio (`domain/{Entity}Repository`) e os Services (`service`) usados nas assinaturas ja existem ou serao criados pelas skills proprias de cada camada — nao crie esses arquivos aqui. Se algo necessario ainda nao existir, sinalize a dependencia em vez de criar um stub.

## Checklist ao aplicar

1. Confirmar o nome da entidade e quais operacoes sao necessarias agora (nao assumir CRUD completo)
2. Confirmar quais Services, DTO e contrato de dominio essas operacoes vao usar (sem criar esses arquivos)
3. Criar o controller seguindo o template
4. Registrar o controller no module correspondente (`src/module/{entity}/{Entity}Module.ts` — ver skill `module`)
5. Rodar o build para validar — se as dependencias (Service/DTO/domain) ainda nao existirem, o erro de compilacao esperado e de import faltante, nao do controller em si
