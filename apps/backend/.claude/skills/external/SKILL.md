---
name: external
description: Gera a implementacao concreta de um Repository (contrato definido em src/domain) dentro de src/external/repositories. Use depois que o contrato {Entity}Repository ja existir em domain.
---

# Skill: External (Repository implementation)

Implementa, com Prisma (ou outra fonte), o contrato abstrato definido em `src/domain/{Entity}Repository.ts`. Esta skill so cuida da implementacao concreta — o contrato e responsabilidade da skill `domain`.

## Estrutura de pastas

```
src/external/repositories/
  remote/   -> implementacoes contra uma fonte remota (Postgres via Prisma)
  local/    -> implementacoes locais (ex: in-memory, fixtures, cache) — mesmo contrato, sem Prisma
```

## Convencoes (remote / Prisma)

- Arquivo: `src/external/repositories/remote/Prisma{Entity}Repository.ts` — PascalCase, sem kebab-case
- Classe: `Prisma{Entity}Repository implements {Entity}Repository`
- Injeta `PrismaRemoteRepository` (wrapper do PrismaClient, ja existente em `external/repositories/remote/PrismaRemoteRepository.ts` — e criado uma unica vez, nao por entidade)
- Cada metodo abstrato do dominio e implementado delegando para `this.repository.{entityCamel}.<metodo do Prisma>`
- Os `include` de relations devem espelhar exatamente o que o tipo `{Entity}s` do dominio promete

## Template generico (remote)

```ts
import { Injectable } from '@nestjs/common';
import {
  Create,
  {Entity}Repository,
  {Entity}s,
  FindById,
} from 'src/domain/{Entity}Repository';
import { PrismaRemoteRepository } from './PrismaRemoteRepository';
import { {Entity} } from '@prisma/client';

@Injectable()
export class Prisma{Entity}Repository implements {Entity}Repository {
  constructor(private readonly repository: PrismaRemoteRepository) {}

  create(input: Create): Promise<{Entity}> {
    return this.repository.{entityCamel}.create({ data: input });
  }

  findAll(): Promise<{Entity}s[]> {
    return this.repository.{entityCamel}.findMany({
      include: {
        // relacoes do {Entity}s
      },
      orderBy: { /* campo de ordenacao */ },
    });
  }

  findById({ id }: FindById): Promise<{Entity}s | null> {
    return this.repository.{entityCamel}.findFirst({
      where: { id },
      include: {
        // relacoes do {Entity}s
      },
    });
  }
}
```

### Quando a criacao depende de registros relacionados

Se `create` precisar gravar uma entidade relacionada antes (ex.: Customer precisa de uma Identification previa), use uma transaction em vez de chamar o model direto:

```ts
create(input: Create): Promise<{Entity}> {
  return this.repository.$transaction(async (tx) => {
    const relacionado = await tx.relacionado.create({ data: { /* ... */ } });
    return tx.{entityCamel}.create({ data: { ...input, relacionadoId: relacionado.id } });
  });
}
```

## Pre-requisito

`PrismaRemoteRepository` precisa existir antes de qualquer `Prisma{Entity}Repository`. Se ainda nao existir, sinalize a dependencia em vez de criar um stub aqui.

## Checklist ao aplicar

1. Confirmar que `{Entity}Repository` ja existe em `domain` (senao, aplicar a skill `domain` primeiro)
2. Confirmar que `PrismaRemoteRepository` ja existe em `external/repositories/remote`
3. Criar `Prisma{Entity}Repository` em `external/repositories/remote` implementando cada metodo abstrato
4. Registrar o provider no module, ligando o token abstrato a implementacao concreta: `{ provide: {Entity}Repository, useClass: Prisma{Entity}Repository }`
5. Rodar o build para validar
