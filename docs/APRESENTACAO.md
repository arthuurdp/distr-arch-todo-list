# Roteiro da apresentação

Guia para a apresentação ao vivo. A ordem segue o que vale mais nota: primeiro o que **precisa** ser demonstrado, depois os extras, **só se sobrar tempo**.

## Sumário

- [O que a banca avalia](#o-que-a-banca-avalia)
- [Preparação](#preparação)
- [Roteiro principal (~10 min)](#roteiro-principal-10-min)
  - [1. Contexto](#1-contexto-30s)
  - [2. Subir tudo ao vivo](#2-subir-tudo-ao-vivo-1-min)
  - [3. API funcionando com persistência](#3-api-funcionando-com-persistência-2-min)
  - [4. Mensageria com RabbitMQ](#4-mensageria-com-rabbitmq-35-min)
  - [5. API Gateway: load balancer e rate limit](#5-api-gateway-load-balancer-e-rate-limit-3-min)
  - [6. Fechamento](#6-fechamento-30s)
- [Se sobrar tempo](#se-sobrar-tempo)
- [Perguntas prováveis](#perguntas-prováveis)
- [Plano B](#plano-b)
- [Cola rápida](#cola-rápida)

---

## O que a banca avalia

| Critério | Peso | Onde aparece no roteiro |
|----------|------|-------------------------|
| Implementação correta das 2 opções | **4** | Blocos 4 e 5 |
| API funcional com persistência | **2** | Bloco 3 |
| Apresentação e domínio técnico | **2** | Todos + perguntas |
| Orquestração via Docker | 1 | Bloco 2 |
| Organização e documentação | 1 | Bloco 6 |

**Regra de ouro:** as duas opções escolhidas valem 40% da nota. Elas precisam ser **mostradas funcionando**, não só explicadas.

---

## Preparação

**No dia anterior**

- [ ] Código da última fase na `main` e `git pull` na máquina da apresentação
- [ ] `docker compose build` já rodado (o build ao vivo demora minutos)
- [ ] Roteiro ensaiado cronometrando, pelo menos 2 vezes

**30 minutos antes**

- [ ] Docker Desktop aberto; programas pesados fechados (são 7 containers)
- [ ] Dados zerados: `docker compose down -v`
- [ ] Abas abertas, com zoom aumentado:

| Aba | Endereço |
|-----|----------|
| Terminal Git Bash na raiz do repositório | fonte grande |
| Swagger | http://localhost:8080/swagger-ui.html |
| Mailpit (emails) | http://localhost:8025 |
| RabbitMQ | http://localhost:15672 (`todolist` / `todolist`) |
| pgAdmin | conectado em `127.0.0.1:5432`, banco `todolist` |

---

## Roteiro principal (~10 min)

> A ordem importa: a demonstração do **rate limit fica por último**, porque depois dela o login fica bloqueado por cerca de 1 minuto.

### 1. Contexto (30s)

**Falar**

- "É uma API de lista de tarefas com login e envio de emails."
- "Das três opções do trabalho, escolhemos **API Gateway com rate limit e load balancer** e **mensageria com RabbitMQ**."
- "Stack: Java 21, Spring Boot 4, PostgreSQL, nginx e RabbitMQ, tudo orquestrado com Docker Compose."

### 2. Subir tudo ao vivo (1 min)

**Fazer**

```bash
docker compose up -d --wait
```

**Falar enquanto sobe** (leva cerca de 1 minuto)

- "Cada componente tem seu próprio Dockerfile: gateway nginx, duas réplicas da API, Postgres, RabbitMQ, o worker que envia emails e o Mailpit, que captura os emails."
- "Os containers sobem na ordem certa por healthchecks: banco e RabbitMQ, depois as APIs, depois o gateway."
- "O gateway é a única porta de entrada. As réplicas da API nem expõem porta."

**Fazer**

```bash
docker compose ps
```

"Sete serviços, todos `healthy`, com um único comando."

### 3. API funcionando com persistência (2 min)

**Fazer, no Swagger**

1. `POST /api/auth/login` com `admin@todolist.com` / `Admin@12345`
2. Copiar o `accessToken` → **Authorize** → colar
3. `POST /api/todos` com `{"title": "Test todo", "dueDate": "2026-09-30"}` → **201**
4. `GET /api/todos` → a tarefa aparece
5. `PUT /api/todos/{id}` com `"completed": true` → **200**
6. No pgAdmin: `SELECT * FROM todos;` → a tarefa está gravada

**Falar**

- "CRUD completo de tarefas, persistido no PostgreSQL."
- "O login devolve um JWT. Como o token não depende de sessão no servidor, qualquer réplica da API aceita. Isso é o que permite o load balancer que vamos mostrar."

### 4. Mensageria com RabbitMQ (3,5 min)

#### 4.1 Producer e consumer: email de boas-vindas (1 min)

**Fazer**

1. Swagger: `POST /api/auth/register` com `{"name": "Test", "email": "test@gmail.com", "password": "Password123!"}` → **201**
2. Abrir o **Mailpit**: o email "Welcome to Todo List" chegou

**Falar**

- "A API é o **producer**: depois de salvar o usuário, ela publica um evento no RabbitMQ e responde na hora, sem esperar o email."
- "O **notification-worker** é o **consumer**: lê a fila e envia o email."
- "O evento só é publicado **depois do commit** no banco. Se a gravação falhasse, nenhum email sairia."

#### 4.2 As duas filas no painel (40s)

**Fazer:** RabbitMQ → aba **Queues and Streams**, depois **Exchanges → notifications → Bindings**.

**Falar**

- "Duas filas com propósitos diferentes, como pede o enunciado: `email.welcome` para boas-vindas e `email.password-reset` para o código de redefinição de senha."
- "A API publica na exchange `notifications`, e a routing key decide a fila."
- "Cada fila tem uma `.dlq`, a fila de mensagens mortas, para o que falhar."

#### 4.3 Segunda fila: código de redefinição de senha (1 min)

**Fazer**

1. Swagger: `POST /api/auth/forgot-password` com `{"email": "test@gmail.com"}` → **202**
2. Mailpit: email com o **código de 6 dígitos**
3. Swagger: `POST /api/auth/reset-password` com o email, o código e `"newPassword": "NewPassword123!"` → **204**

**Falar**

- "Esse fluxo usa a segunda fila."
- "O código vale 15 minutos, é de uso único e só aceita 5 tentativas."

#### 4.4 Resiliência: worker fora do ar (1 min)

**Fazer**

```bash
docker compose stop notification-worker
```

1. Swagger: cadastrar `test1@gmail.com`
2. RabbitMQ: a fila `email.welcome` mostra **1 mensagem Ready**; o Mailpit não recebeu nada

```bash
docker compose start notification-worker
```

3. Em alguns segundos o email chega no Mailpit

**Falar**

- "Com o consumer fora, a mensagem **fica guardada na fila**. Quando ele volta, processa e o email sai. Nada se perde."
- "Esse é o ganho do desacoplamento: a API continuou funcionando normalmente."

### 5. API Gateway: load balancer e rate limit (3 min)

#### 5.1 Load balancer (1 min)

**Fazer**

```bash
bash scripts/lb-demo.sh
```

**Falar**

- "Cada resposta diz qual réplica atendeu. O nginx alterna entre `api-1` e `api-2`."
- "O algoritmo é `least_conn`: cada requisição vai para a réplica com menos conexões ativas."

#### 5.2 Failover (1 min)

**Fazer**

```bash
docker compose stop api-1
bash scripts/lb-demo.sh
docker compose start api-1
```

**Falar**

- "Derrubei uma réplica e **nenhuma requisição falhou**: todas foram para a `api-2`."
- "Quando uma réplica falha, o nginx tira ela de uso e reenvia a requisição para a outra."

#### 5.3 Rate limit, sempre por último (1 min)

**Fazer**

```bash
bash scripts/rate-limit-demo.sh
```

**Falar**

- "15 tentativas de login seguidas: 6 chegaram na API e 9 foram **bloqueadas pelo gateway com 429**."
- "Nas rotas de login o limite é 10 por minuto por IP, com rajada de 5, contra força bruta. No resto da API são 10 por segundo."
- "O limite fica **no gateway** e não na API: se cada réplica contasse sozinha, com duas réplicas o limite dobraria. E as requisições bloqueadas nem chegam a consumir a API."

### 6. Fechamento (30s)

**Falar**

- "Resumindo: API com persistência, gateway distribuindo carga e protegendo com rate limit, e mensageria com duas filas, retry e DLQ, tudo subindo com um único comando."
- "O README explica como rodar, e a pasta `docs/` tem a referência da API e as decisões de arquitetura."

---

## Se sobrar tempo

Na ordem de prioridade. Pare quando o tempo acabar.

### A. Retry e DLQ (1 min)

A mais valiosa, porque aprofunda a opção de mensageria.

```bash
docker compose stop mailpit
```

- Cadastrar `test2@gmail.com`
- Em até 20 segundos a mensagem aparece em `email.welcome.dlq` no RabbitMQ

```bash
docker compose start mailpit
```

- RabbitMQ → `email.welcome.dlq` → **Move messages** para `email.welcome` → o email é enviado

**Falar:** "O worker tenta 3 vezes com espera crescente. Se continuar falhando, a mensagem vai para a DLQ em vez de travar a fila, e pode ser reprocessada depois."

### B. Controle de acesso: ADMIN e USER (1 min)

- Login como `test@gmail.com` → Authorize com o novo token → `GET /api/admin/users` → **403**

**Falar:**
- "Rotas de administração exigem o papel ADMIN."
- "Um USER só vê as próprias tarefas. A tarefa de outra pessoa responde 404, para não revelar que o id existe."

### C. Mesmo token nas duas réplicas (30s)

- Swagger: `GET /api/auth/me` algumas vezes → o header `X-Instance-Id` alterna e todas respondem 200

**Falar:** "O token emitido por uma réplica é aceito pela outra, porque o JWT é stateless e as duas usam o mesmo segredo."

### D. Migrations (30s)

- pgAdmin: tabela `flyway_schema_history`

**Falar:** "O schema é versionado pelo Flyway (V1 a V5). Com duas réplicas subindo juntas, só uma aplica as migrations, graças a um lock no Postgres."

### E. Testes (30s)

Não rode ao vivo (leva cerca de 2 minutos). Mostre a última execução ou um print.

**Falar:** "38 testes de integração com Testcontainers, usando Postgres e RabbitMQ reais, incluindo o fluxo de redefinição de senha e o caminho até a DLQ."

### F. Documentação e Swagger (30s)

- Mostrar o README e a pasta `docs/`

---

## Perguntas prováveis

### Sobre as opções escolhidas (mais prováveis)

| Pergunta | Resposta curta |
|----------|----------------|
| Por que usar fila em vez de enviar o email direto na API? | O usuário não espera o envio, e se o servidor de email estiver fora a requisição não falha. O email sai quando der |
| O que acontece se o worker cair? | As mensagens ficam guardadas na fila e são processadas quando ele voltar |
| E se o envio do email falhar? | 3 tentativas com espera de 1s e 2s. Depois disso a mensagem vai para a DLQ |
| O que é uma DLQ? | Fila que recebe mensagens que falharam em todas as tentativas, para não travar as outras nem se perder |
| Por que publicar só depois do commit? | Se publicasse antes e a gravação falhasse, sairia email de uma conta que nunca existiu |
| E se o RabbitMQ estiver fora na hora de publicar? | O cadastro funciona e o erro vai para o log, mas o email se perde. A evolução seria o padrão *Transactional Outbox* |
| Pode sair email duplicado? | Sim, a entrega é "pelo menos uma vez": se o worker cair depois de enviar e antes de confirmar, a mensagem volta. Para email é aceitável |
| Por que duas filas? | Propósitos diferentes e isolamento: muitos cadastros não atrasam os códigos de senha, e cada fila tem sua DLQ |
| Por que `least_conn` e não round robin? | As requisições têm durações diferentes (o login é mais lento). O `least_conn` manda para a réplica mais livre |
| Como o nginx sabe que uma réplica caiu? | Pelas falhas das próprias requisições: após 3 falhas, a réplica fica fora por 10 segundos |
| Por que o rate limit fica no gateway? | Na API, cada réplica contaria sozinha e o limite dobraria. No gateway é aplicado uma vez só |
| Como funciona o algoritmo de rate limit? | *Leaky bucket*: as requisições saem numa taxa fixa. A rajada absorve picos; o que passa disso recebe 429 |
| Por que funciona sem sticky session? | Porque o JWT é stateless: qualquer réplica valida o token |
| O gateway não é ponto único de falha? | Sim, é uma limitação conhecida. Em produção haveria vários gateways atrás de um balanceador de rede |

### Sobre o restante

| Pergunta | Resposta curta |
|----------|----------------|
| Por que JWT e não sessão? | Sessão fica na memória de uma réplica; o JWT é validado por qualquer uma |
| O conteúdo do JWT é secreto? | Não, é só codificado. A assinatura impede que seja alterado |
| Como fazer logout? | Não há revogação: o token vale até expirar (1 hora) |
| Por que só a API tem banco? | As réplicas são o mesmo serviço e precisam dos mesmos dados. O worker recebe tudo na mensagem |
| Por que Flyway? | Schema versionado e reproduzível em qualquer máquina |
| Por que Testcontainers e não H2? | Testa com Postgres e RabbitMQ reais, exatamente como na aplicação |

---

## Plano B

| Problema ao vivo | Saída |
|------------------|-------|
| Serviço não fica `healthy` | `docker compose logs <serviço>`. Se aparecer `checksum mismatch`: `docker compose down -v` e subir de novo |
| Porta ocupada | Fechar o programa que usa a porta, ou criar `.env` com `GATEWAY_PORT=8081` |
| `429` inesperado no login | O rate limit agiu: aguardar uns 30 segundos e aproveitar para explicar o rate limit |
| `401` no Swagger | O token expirou ou foi colado errado: fazer login de novo |
| Email não chegou | Ver a fila no RabbitMQ (mensagem em Ready ou na DLQ) e `docker compose logs notification-worker` |
| Nada funciona | Ter prints ou um vídeo curto da demonstração completa como último recurso |

---

## Cola rápida

**Credenciais**

| O quê | Valor |
|-------|-------|
| Admin da API | `admin@todolist.com` / `Admin@12345` |
| Usuário de teste | `test@gmail.com` / `Password123!` |
| RabbitMQ | `todolist` / `todolist` |

**Endereços**

| O quê | URL |
|-------|-----|
| Swagger | http://localhost:8080/swagger-ui.html |
| Mailpit | http://localhost:8025 |
| RabbitMQ | http://localhost:15672 |

**Comandos na ordem da apresentação**

```bash
# Antes
docker compose down -v

# Bloco 2
docker compose up -d --wait
docker compose ps

# Bloco 4.4
docker compose stop notification-worker
docker compose start notification-worker

# Bloco 5
bash scripts/lb-demo.sh
docker compose stop api-1
bash scripts/lb-demo.sh
docker compose start api-1
bash scripts/rate-limit-demo.sh

# Extra A (DLQ)
docker compose stop mailpit
docker compose start mailpit
```
