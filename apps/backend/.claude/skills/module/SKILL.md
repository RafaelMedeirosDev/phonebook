---
name: module
description: Registra Controller, Service(s), Tools e o binding do Repository abstrato (domain) com a implementacao concreta (external) de uma entidade diretamente em src/app.module.ts. Use depois que Controller, Service, Domain e External da entidade ja existirem.
---

# Skill: Module (registro em AppModule)

Este projeto **nao** usa um Module por entidade — nao existe pasta `module/` nem arquivo `{Entity}Module.ts`. Tudo e registrado direto em `src/app.module.ts`, que e quem liga os fios: registra o Controller, os Services e as Tools como providers, e faz o binding de cada Repository abstrato (`domain`) com sua implementacao concreta (`external`/Prisma) via `provide`/`useClass`. Sem esse binding, o Nest nao sabe qual classe concreta instanciar quando um Service pede `{Entity}Repository` no construtor.

Este projeto nao usa autenticacao por enquanto — nao inclua `JwtModule`, `PassportModule`, `Strategy` ou `Guard`. Se isso mudar no futuro, e uma skill propria.

## Convencoes

- Nao crie nenhum arquivo de module novo — edite `src/app.module.ts` direto
- `controllers`: adicione o(s) Controller(s) da entidade ao array existente
- `providers` recebe, por entidade:
  1. Os Services usados pelo Controller, direto pela classe (sem `provide`/`useClass`)
  2. Um `{ provide: {Entity}Repository, useClass: Prisma{Entity}Repository }` para **cada** Repository abstrato que algum Service da entidade injeta (inclui Repository de entidade relacionada, se houver)
  3. As Tools da entidade (skill `tools`), se existirem — e adicione-as tambem ao `inject`/corpo do `useFactory` do provider `TOOLS`
- `PrismaRemoteRepository` e o provider `TOOLS` ja existem em `app.module.ts` e sao registrados **uma unica vez** (nao por entidade) — so adicione a entidade nova aos lugares certos, nao recrie essas pecas

## Exemplo (Contact, real e completo)

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContactController } from 'src/controller/ContactController';
import { ContactRepository } from 'src/domain/ContactRepository';
import { PrismaContactRepository } from 'src/external/repositories/remote/PrismaContactRepository';
import { PrismaRemoteRepository } from 'src/external/repositories/remote/PrismaRemoteRepository';
import { CreateContactService } from 'src/service/CreateContactService';
import { ListContactService } from 'src/service/ListContactService';
import { CreateContactTool } from 'src/tools/CreateContactTool';
import { ListContactTool } from 'src/tools/ListContactTool';
import { Tool, TOOLS } from 'src/tools/Tool';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, ContactController],
  providers: [
    AppService,
    PrismaRemoteRepository,
    CreateContactService,
    ListContactService,
    CreateContactTool,
    ListContactTool,
    {
      provide: ContactRepository,
      useClass: PrismaContactRepository,
    },
    {
      provide: TOOLS,
      useFactory: (
        createContactTool: CreateContactTool,
        listContactTool: ListContactTool,
      ): Tool[] => [createContactTool, listContactTool],
      inject: [CreateContactTool, ListContactTool],
    },
  ],
})
export class AppModule {}
```

## Adicionando uma entidade nova

`PrismaRemoteRepository` e o provider `TOOLS` ja existem — nao recrie. Para cada entidade nova:

1. Adicione o Controller em `controllers`
2. Adicione os Services em `providers`
3. Adicione `{ provide: {Entity}Repository, useClass: Prisma{Entity}Repository }` em `providers`
4. Se a entidade tiver Tools: adicione-as em `providers` **e** inclua-as nos parametros/array do `useFactory` do `TOOLS` (tanto no `inject` quanto no corpo da funcao)

## Escopo desta skill

Esta skill cuida apenas de editar `src/app.module.ts`. Ela assume que Controller, Service(s), Repository de `domain`, implementacao de `external` e Tools (se houver) ja existem — nao cria nenhum deles aqui.

## Checklist ao aplicar

1. Confirmar quais Controllers e Services da entidade existem e precisam ser registrados
2. Confirmar quais Repository abstratos precisam de binding `provide`/`useClass`
3. Confirmar se a entidade tem Tools que precisam entrar no `useFactory` do `TOOLS`
4. Editar `src/app.module.ts` adicionando essas entradas (sem criar nenhum arquivo novo)
5. Rodar o build **e iniciar a aplicacao** para validar — erro de DI so aparece em runtime, nao no build
