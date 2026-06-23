---
name: domain
description: Gera o contrato de Repository (classe abstrata) e os tipos de uma entidade dentro de src/domain. Use ao definir como uma entidade e persistida, antes de implementar o repositorio concreto em external.
---

# Skill: Domain (Repository contract)

Define, para uma entidade, o contrato que qualquer implementacao de persistencia (Prisma, in-memory, etc.) precisa cumprir. Este arquivo nao tem implementacao — so tipos e uma classe abstrata. Quem implementa de fato vive em `external/repositories/*` (ver skill `external`).

## Convencoes

- Arquivo: `src/domain/{Entity}Repository.ts` — PascalCase, sem kebab-case, nome igual ao da classe exportada
- Os tipos de input de cada metodo (`Create`, `FindById`, `Update`, ...) sao interfaces simples, nomeadas pela operacao (sem prefixo da entidade — o namespace e o proprio arquivo)
- `{Entity}s` (plural) e o tipo "hidratado": a entidade base do Prisma (`@prisma/client`) com as relations incluidas (`& { relacao1; relacao2[] }`). E usado em `findAll`/`findById`, que normalmente precisam das relations carregadas
- A classe `{Entity}Repository` e `abstract` — so declara assinaturas, sem corpo
- So declare os metodos que a feature realmente precisa agora — nao especule `update`/`delete` sem necessidade

## Template generico

```ts
import { {Entity} /*, Relation1, Relation2 */ } from '@prisma/client';

export interface Create {
  // campos necessarios para criar a entidade
}

export type {Entity}s = {Entity} & {
  // relacoes incluidas, ex: relation1: Relation1; relation2: Relation2[];
};

export interface FindById {
  id: string;
}

export abstract class {Entity}Repository {
  abstract create(input: Create): Promise<{Entity}>;
  abstract findAll(): Promise<{Entity}s[]>;
  abstract findById({ id }: FindById): Promise<{Entity}s | null>;
}
```

### Extensoes opcionais (so adicionar se o caso de uso existir)

```ts
export interface Update {
  id: string;
  // campos atualizaveis
}

// dentro da abstract class:
abstract update(input: Update): Promise<{Entity}>;
abstract delete({ id }: FindById): Promise<void>;
```

## Checklist ao aplicar

1. Confirmar a entidade e quais operacoes de persistencia sao necessarias agora
2. Confirmar quais relations (se alguma) precisam vir incluidas em `{Entity}s`
3. Criar `src/domain/{Entity}Repository.ts` seguindo o template
4. A implementacao concreta (Prisma ou outra) e responsabilidade da skill `external` — nao implemente aqui
