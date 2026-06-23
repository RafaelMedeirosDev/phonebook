---
name: dto
description: Gera uma classe DTO dentro de src/shared/dtos, com validacao via class-validator, para tipar e validar o body de entrada de um Controller. Use ao definir o que uma operacao (create/update) aceita como entrada.
---

# Skill: DTO

Um DTO descreve e valida a forma de entrada de uma operacao HTTP. Cada campo carrega seus proprios decorators de `class-validator` — a validacao acontece na borda (Controller), antes de qualquer regra de negocio no Service.

## Convencoes

- Arquivo: `src/shared/dtos/{Operation}{Entity}DTO.ts` — PascalCase, sem kebab-case, sem sufixo com ponto
- Classe: `{Operation}{Entity}DTO`
- Campos obrigatorios usam asserção de atribuicao definitiva (`!:`), nao ha construtor na classe
- Campos opcionais usam `@IsOptional()` + `?:` em vez de `!:`
- Cada campo recebe os decorators de `class-validator` que correspondem ao seu tipo/semantica:
  - `@IsNotEmpty()` em todo campo obrigatorio
  - `@IsString()`, `@IsNumber()`, `@IsBoolean()`, `@IsEmail()`, `@IsEnum({EnumType})` conforme o tipo do campo
  - Enums sempre importados de `@prisma/client` (mesma fonte de verdade do schema), nunca redeclarados
- Quando a validacao built-in do `class-validator` nao cobre a regra (ex.: formato especifico, checksum), use um validator customizado de `src/validators/*` — esta skill nao cria o validator, so referencia
- So inclua os campos que a operacao realmente recebe — `Create{Entity}DTO` nao tem `id`/`createdAt` (sao gerados pelo banco); em `update`, o `id` normalmente vem do `@Param()` da rota, nao do body

## Template generico — create

```ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class Create{Entity}DTO {
  @IsNotEmpty()
  @IsString()
  {campo}!: string;

  @IsOptional()
  @IsString()
  {campoOpcional}?: string;
}
```

## Template generico — com enum e validator customizado

```ts
import { {EnumType} } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Is{RegraCustomizada} } from 'src/validators/Is{RegraCustomizada}';

export class Create{Entity}DTO {
  @IsNotEmpty()
  @IsString()
  {campo}!: string;

  @IsNotEmpty()
  @IsEnum({EnumType})
  {campoEnum}!: {EnumType};

  @IsNotEmpty()
  @IsString()
  @Is{RegraCustomizada}()
  {campoValidado}!: string;
}
```

## Update — reaproveitando o Create (opcional)

Quando `Update{Entity}DTO` so torna os mesmos campos opcionais, prefira reaproveitar em vez de duplicar:

```ts
import { PartialType } from '@nestjs/mapped-types';
import { Create{Entity}DTO } from './Create{Entity}DTO';

export class Update{Entity}DTO extends PartialType(Create{Entity}DTO) {}
```

Se `update` tiver campos com regras diferentes do `create`, declare os campos manualmente em vez de usar `PartialType`.

## Escopo desta skill

Esta skill cuida **apenas das classes DTO**. Ela assume que enums do Prisma e validators customizados em `src/validators/*` ja existem — nao crie esses arquivos aqui. Se um validator customizado necessario ainda nao existir, sinalize a dependencia em vez de criar um stub.

## Checklist ao aplicar

1. Confirmar a entidade, a operacao (`create`/`update`) e quais campos a operacao recebe
2. Para cada campo, decidir o(s) decorator(s) de `class-validator` adequados (built-in primeiro, customizado so se necessario)
3. Confirmar se algum campo usa enum do Prisma (`@prisma/client`) ou validator customizado existente
4. Criar `src/shared/dtos/{Operation}{Entity}DTO.ts` seguindo o template
5. Conferir que o Controller usa esse DTO tipando o `@Body()`
