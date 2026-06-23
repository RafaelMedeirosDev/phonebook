---
name: module
description: Gera o NestJS Module de uma entidade dentro de src/module/{entity}, registrando Controller, Service(s) e o binding do Repository abstrato (domain) com a implementacao concreta (external). Use depois que Controller, Service, Domain e External da entidade ja existirem.
---

# Skill: Module

O Module e quem liga os fios da entidade: registra o Controller, os Services como providers, e faz o binding de cada Repository abstrato (`domain`) com sua implementacao concreta (`external`/Prisma) via `provide`/`useClass`. Sem esse binding, o Nest nao sabe qual classe concreta instanciar quando um Service pede `{Entity}Repository` no construtor.

Este projeto nao usa autenticacao por enquanto — nao inclua `JwtModule`, `PassportModule`, `Strategy` ou `Guard` no module. Se isso mudar no futuro, e uma skill propria.

## Convencoes

- Pasta: `src/module/{entity}/` — nome da entidade em minusculo (snake_case se composto, ex.: `order_service`, `vehicle_user`)
- Arquivo: `src/module/{entity}/{Entity}Module.ts` — PascalCase, sem kebab-case, sem sufixo com ponto
- Classe: `{Entity}Module`
- Imports usam caminho absoluto a partir de `src` (ex.: `'src/domain/{Entity}Repository'`), nao relativo — mesmo padrao usado nas skills `domain`, `external`, `dto` e `service`. Confirmado que o `nest build` reescreve corretamente para `require` relativo no `dist`
- `controllers`: lista o(s) Controller(s) da entidade
- `providers` tem dois tipos de entrada:
  1. Os Services usados pelo Controller, direto pela classe (sem `provide`/`useClass` — Service nao tem abstracao, e a propria implementacao)
  2. Um `{ provide: {Entity}Repository, useClass: Prisma{Entity}Repository }` para **cada** Repository abstrato que algum Service da entidade injeta — inclui o Repository da propria entidade e qualquer Repository de entidade relacionada usado numa regra de negocio (ex.: validacao de duplicidade)

## Template generico

```ts
import { Module } from '@nestjs/common';
import { {Entity}Controller } from 'src/controller/{Entity}Controller';
import { {Entity}Repository } from 'src/domain/{Entity}Repository';
import { Prisma{Entity}Repository } from 'src/external/repositories/remote/Prisma{Entity}Repository';
import { Create{Entity}Service } from 'src/service/Create{Entity}Service';
import { List{Entity}Service } from 'src/service/List{Entity}Service';

@Module({
  controllers: [{Entity}Controller],
  providers: [
    Create{Entity}Service,
    List{Entity}Service,
    {
      provide: {Entity}Repository,
      useClass: Prisma{Entity}Repository,
    },
  ],
})
export class {Entity}Module {}
```

## Quando a entidade depende de outro Repository

Se algum Service injeta o Repository de outra entidade (ex.: checar duplicidade — ver skill `service`), adicione mais um binding `provide`/`useClass` para ele tambem:

```ts
providers: [
  Create{Entity}Service,
  {
    provide: {Entity}Repository,
    useClass: Prisma{Entity}Repository,
  },
  {
    provide: {Related}Repository,
    useClass: Prisma{Related}Repository,
  },
],
```

## Registrar no AppModule

Depois de criar o module da entidade, importe-o em `src/app.module.ts`:

```ts
import { {Entity}Module } from 'src/module/{entity}/{Entity}Module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), {Entity}Module],
  // ...
})
export class AppModule {}
```

## Escopo desta skill

Esta skill cuida apenas do arquivo `{Entity}Module.ts`. Ela assume que Controller, Service(s), Repository de `domain` e implementacao de `external` ja existem — nao cria nenhum deles aqui.

## Checklist ao aplicar

1. Confirmar quais Controllers e Services da entidade existem e precisam ser registrados
2. Confirmar quais Repository abstratos (da propria entidade e de relacionadas) precisam de binding `provide`/`useClass`
3. Criar `src/module/{entity}/{Entity}Module.ts` seguindo o template
4. Importar o module criado em `src/app.module.ts`
5. Rodar o build para validar
