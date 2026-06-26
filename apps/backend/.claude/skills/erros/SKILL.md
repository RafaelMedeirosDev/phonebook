---
name: erros
description: Gera classes de erro de dominio dentro de src/shared/erros (base + cases), lancadas pelos Services quando uma regra de negocio e violada. Use ao criar um novo tipo de falha de negocio (ja existe, nao encontrado, estado invalido, etc.).
---

# Skill: Erros

Erros de negocio sao classes, nunca `throw new Error('...')` solto. A pasta `shared/erros` tem duas camadas:

- `base/` — uma classe por **familia de status HTTP** (Conflict, NotFound, BadRequest, ...). Estende a `HttpException` do Nest correspondente e declara o formato da resposta para o Swagger. E criada **uma vez** e reaproveitada por varios cases.
- `cases/` — uma classe por **falha de negocio especifica** (ex.: `ContactAlreadyExists`, `CustomerNotFound`). Estende o base certo e ja vem com `message`/`error` fixos — quem lanca nao passa nada no construtor.

## Convencoes — base

- Arquivo: `src/shared/erros/base/{Category}Error.ts` — PascalCase, sem kebab-case, sem sufixo com ponto
- Classe: `{Category}Error extends {NestHttpException}` — escolha a exception do Nest que corresponde semanticamente (ver tabela abaixo)
- Sempre declara 3 properties documentadas com `@ApiProperty` (existem para o Swagger descrever o shape do erro): `statusCode: number`, `message: string`, `error: string`
- **Essas 3 properties usam `declare`** (`declare public message: string;`, nao `public message!: string;`). Sem `declare`, o TypeScript (com `target` ES2022+, que e o nosso caso) reinicializa a property depois do `super()`, sobrescrevendo com `undefined` o que `super(message, error)` acabou de setar — bug real ja encontrado neste projeto, silencioso porque o erro HTTP cru (via `getResponse()` do Nest) continua mostrando o texto certo, mas qualquer codigo que leia `error.message` direto (ex.: o orquestrador da IA) recebe `undefined`
- Construtor recebe `(message: string, error: string)` e so chama `super(message, error)` — quem define o status HTTP e a classe do Nest que esta sendo estendida
- Antes de criar um novo base, verificar se ja nao existe um que cubra a familia HTTP necessaria — varios cases reaproveitam o mesmo base

## Mapeamento sugerido (categoria -> exception do Nest)

| Categoria (base)     | Nest Exception         | HttpStatus               | Quando usar                                  |
|-----------------------|--------------------------|----------------------------|-----------------------------------------------|
| AlreadyExistsError    | `ConflictException`      | `HttpStatus.CONFLICT`      | violacao de unicidade (ex.: valor duplicado)  |
| NotFoundError         | `NotFoundException`      | `HttpStatus.NOT_FOUND`     | registro buscado nao existe                   |
| InvalidStateError     | `BadRequestException`    | `HttpStatus.BAD_REQUEST`   | entrada/estado invalido para a operacao        |
| UnauthorizedError     | `UnauthorizedException`  | `HttpStatus.UNAUTHORIZED`  | falta de autenticacao                          |
| ForbiddenError        | `ForbiddenException`     | `HttpStatus.FORBIDDEN`     | autenticado mas sem permissao                  |

## Template generico — base

```ts
import { {NestHttpException}, HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class {Category}Error extends {NestHttpException} {
  @ApiProperty({ example: HttpStatus.{STATUS} })
  declare public statusCode: number;

  @ApiProperty({ type: () => String })
  declare public message: string;

  @ApiProperty({ type: () => String })
  declare public error: string;

  constructor(message: string, error: string) {
    super(message, error);
  }
}
```

## Convencoes — cases

- Arquivo: `src/shared/erros/cases/{Entity}{Reason}.ts` — PascalCase, sem kebab-case, sem sufixo com ponto
- Classe: `{Entity}{Reason} extends {Category}Error` (importado de `../base/{Category}Error`)
- `message` e `error` sao constantes de modulo (`as const`), declaradas **acima** da classe, nunca dentro do construtor:
  - `message`: frase legivel para humano, com inicial maiuscula e ponto final (ex.: `'Contact Already exists.'`)
  - `error`: slug em snake_case minusculo, estavel (e usado por clientes da API para tratar o erro programaticamente) (ex.: `'contact_already_exists'`)
- Construtor **sem parametros** — so chama `super(message, error)`
- So crie o case quando algum Service for de fato lancar esse erro

## Template generico — case

```ts
import { {Category}Error } from '../base/{Category}Error';

const message = '{Mensagem legivel para humano.}' as const;
const error = `{slug_em_snake_case}` as const;

export class {Entity}{Reason} extends {Category}Error {
  constructor() {
    super(message, error);
  }
}
```

## Exemplo aplicado: Contact (ilustrativo)

- Base reaproveitado: `AlreadyExistsError` (se ja existir de outra entidade, nao recriar)
- Case: `ContactAlreadyExists` -> `message = 'Contact Already exists.'`, `error = 'contact_already_exists'`
- Quem lanca: um Service (ex.: `CreateContactService`), apos checar duplicidade num Repository — ver skill `service`

## Escopo desta skill

Esta skill cuida **apenas das classes de erro** (`base` e `cases`). Quem lanca o erro e o Service (skill `service`); esta skill nao cria nem altera Services.

## Checklist ao aplicar

1. Identificar a falha de negocio especifica e o status HTTP correspondente
2. Verificar se ja existe um `base` para aquele status — so criar um novo se nenhum cobrir o caso
3. Criar o `base` (se necessario) seguindo o template
4. Criar o `case` em `cases/` com `message`/`error` proprios, estendendo o base certo
5. Confirmar que o Service que vai lancar esse erro importa o `case` (sem alterar o Service aqui)
