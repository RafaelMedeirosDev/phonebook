---
name: service
description: Gera uma classe de Service (caso de uso) dentro de src/service, que orquestra um ou mais Repository de domain e aplica regras de negocio. Use para criar, buscar, listar, atualizar ou remover uma entidade.
---

# Skill: Service

E aqui que mora a regra de negocio. Um Service e uma classe com **uma unica responsabilidade** (um caso de uso = uma operacao), que recebe Repository(s) abstratos de `domain` por injecao, valida invariantes e delega a persistencia. Controller nunca chama Repository direto — sempre passa por um Service.

## Convencoes

- Arquivo: `src/service/{Operation}{Entity}Service.ts` — PascalCase, sem kebab-case, sem sufixo com ponto
- Classe: `{Operation}{Entity}Service` (ex.: `CreateContactService`, `ListContactService`, `FindContactService`)
- `@Injectable()` na classe
- **Um metodo publico so**: `execute(...)`. Se a operacao precisa de entrada estruturada, declare uma `interface Request { ... }` no proprio arquivo (sem `export` — e privada ao caso de uso, namespaced pelo arquivo). Se a operacao nao tem entrada (ex.: `list`), `execute()` nao recebe parametro
- Construtor injeta **somente Repository abstratos de `domain`** (nunca a implementacao concreta de `external`, nunca Prisma direto) — inversao de dependencia. Pode injetar mais de um Repository quando a regra de negocio precisa consultar outra entidade antes de agir
- Toda validacao/regra de negocio fica aqui. Quando uma invariante e violada, lance um erro de dominio de `shared/erros/cases/*` (nao use `throw new Error(...)` solto)
- Tipo de retorno segue a mesma convencao da camada controller/domain:
  - `create`/`update` -> `Promise<{Entity}>` (model puro de `@prisma/client`)
  - `list`/`findById` -> `Promise<{Entity}s[]>` / `Promise<{Entity}s | null>` (tipo hidratado de `domain/{Entity}Repository`)
  - `delete` -> `Promise<void>`
- So crie o Service da operacao que foi pedida — nao especule `update`/`delete` sem necessidade

## Template generico — operacao simples (sem regra extra)

```ts
import { Injectable } from '@nestjs/common';
import { {Entity} } from '@prisma/client';
import { {Entity}Repository } from 'src/domain/{Entity}Repository';

interface Request {
  // campos de entrada da operacao
}

@Injectable()
export class {Operation}{Entity}Service {
  constructor(private readonly {entityCamel}Repository: {Entity}Repository) {}

  async execute({ /* campos */ }: Request): Promise<{Entity}> {
    return await this.{entityCamel}Repository.{operationCamel}({ /* campos */ });
  }
}
```

## Template generico — leitura sem entrada (list)

```ts
import { Injectable } from '@nestjs/common';
import { {Entity}Repository, {Entity}s } from 'src/domain/{Entity}Repository';

@Injectable()
export class List{Entity}Service {
  constructor(private readonly {entityCamel}Repository: {Entity}Repository) {}

  async execute(): Promise<{Entity}s[]> {
    return await this.{entityCamel}Repository.findAll();
  }
}
```

## Template generico — com validacao de negocio (multi-repository)

Use quando a operacao precisa checar uma regra antes de agir (ex.: impedir duplicidade), consultando outro Repository.

```ts
import { Injectable } from '@nestjs/common';
import { {Entity} } from '@prisma/client';
import { {Entity}Repository } from 'src/domain/{Entity}Repository';
import { {Related}Repository } from 'src/domain/{Related}Repository';
import { {Regra}AlreadyExists } from 'src/shared/erros/cases/{Regra}AlreadyExists';

interface Request {
  // campos de entrada da operacao
}

@Injectable()
export class {Operation}{Entity}Service {
  constructor(
    private readonly {entityCamel}Repository: {Entity}Repository,
    private readonly {relatedCamel}Repository: {Related}Repository,
  ) {}

  async execute({ /* campos */ }: Request): Promise<{Entity}> {
    const alreadyExists = await this.{relatedCamel}Repository.findByX({ /* campo unico */ });

    if (alreadyExists) {
      throw new {Regra}AlreadyExists();
    }

    return await this.{entityCamel}Repository.create({ /* campos */ });
  }
}
```

## Escopo desta skill

Esta skill cuida **apenas da camada Service**. Ela assume que o(s) Repository de `domain` e as classes de erro de `shared/erros/cases` ja existem ou serao criados pelas skills proprias dessas camadas — nao crie esses arquivos aqui. Se algo necessario ainda nao existir, sinalize a dependencia em vez de criar um stub.

## Checklist ao aplicar

1. Confirmar a operacao (create/list/findById/update/delete), a entidade e se ha alguma regra de negocio envolvida
2. Confirmar quais Repository(s) de `domain` a operacao precisa injetar
3. Se houver regra de validacao, confirmar (ou sinalizar a necessidade de) a classe de erro em `shared/erros/cases`
4. Criar `src/service/{Operation}{Entity}Service.ts` seguindo o template adequado
5. Registrar o Service como provider no module correspondente
6. Rodar o build para validar
