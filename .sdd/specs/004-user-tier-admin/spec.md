# Feature Specification: Tier de Usuário (Admin / Common-User)

**Feature ID:** 004  
**Status:** Draft  
**Owner:** Mateus  
**Criada em:** 2026-09-05  
**Domínios relacionados (vault):** [[business-rules]] · [[telas-mobile/autores/tela-autores]] · [[telas-mobile/registro-convite/tela-registro-convite]] · [[database/database-schema]]

---

## 1. Resumo executivo

O sistema passa a distinguir dois **tiers** de usuário:

- **admin**
- **common-user**

No momento do lançamento, apenas o usuário com id `bd12cc9a-51ec-452d-8722-a97547b6e0c0` é **admin**. Todos os demais (existentes e novos cadastros) são **common-user**.

O **admin** tem acesso exclusivo a:

1. **Tela de administração** — lista todos os usuários do sistema e exibe o **link atual de convite** para registro.
2. **Tela de autores** — gestão de autores (já existente), restrita ao admin.

Usuários **common-user** não veem esses itens na navegação e, se tentarem acessar as rotas diretamente, são bloqueados.

---

## 2. Por quê (motivação)

- Hoje qualquer participante autenticado acessa a tela de autores e não há painel para quem administra o convite fechado.
- O cadastro por convite (RN35–RN37) depende de um segredo de ambiente; quem administra precisa ver o link vigente sem consultar o servidor manualmente.
- Separar papéis evita que leitores comuns alterem o catálogo de autores ou vejam dados administrativos.

---

## 3. Escopo

### 3.1 Dentro do escopo

- Persistir o tier de cada usuário no perfil do sistema.
- Garantir que novos cadastros recebam **common-user** por padrão.
- Promover (via dados iniciais) o usuário `bd12cc9a-51ec-452d-8722-a97547b6e0c0` a **admin**.
- Criar **tela de administração** acessível só ao admin, com:
  - lista de todos os usuários (identificação suficiente para administração: nome, e-mail, tier);
  - link atual de convite para registro (`/register?invite=…`).
- Restringir a **tela de autores** (navegação + rota) ao admin.
- Impedir mutações de edição/exclusão de autores por quem não é admin.
- Ocultar da navegação os itens “Administração” e “Autores” para quem não é admin.
- Bloquear APIs administrativas (listagem admin de usuários, link de convite) para não-admins.

### 3.2 Fora do escopo (não-objetivos)

- **NÃO** permitir que o admin altere o tier de outros usuários pela UI (só o seed/migração inicial define o admin atual).
- **NÃO** criar múltiplos admins pela interface.
- **NÃO** regenerar ou rotacionar o segredo de convite pela UI.
- **NÃO** restringir a **criação** pontual de autor no fluxo de adicionar livro (common-user continua podendo criar autor ao cadastrar livro).
- **NÃO** alterar o fluxo público de login/registro além do default de tier no perfil.
- **NÃO** implementar painéis extras (moderação de livros, logs, etc.).

---

## 4. Personas e cenários

### Personas

- **Admin** — único operador com tier admin (id fixo no lançamento).
- **Common-user** — leitor participante autenticado.
- **Visitante** — não autenticado (sem acesso às telas admin/autores).

### User Scenarios & Testing

### User Story 1 - Tier persistido e default common-user (Priority: P1)

Todo usuário do sistema possui um tier. Novos cadastros são common-user. O usuário seed é admin.

**Independent Test:** Cadastrar via convite e verificar tier common-user; consultar o usuário seed e verificar admin.

**Acceptance Scenarios:**

1. **Given** um cadastro válido por convite, **When** o perfil é criado, **Then** o tier é common-user.
2. **Given** o usuário `bd12cc9a-51ec-452d-8722-a97547b6e0c0` no banco, **When** a migração/seed é aplicada, **Then** o tier dele é admin.
3. **Given** usuários já existentes sem tier, **When** a migração roda, **Then** recebem common-user (exceto o seed admin).

### User Story 2 - Tela de administração (Priority: P1)

O admin vê todos os usuários e o link de convite vigente.

**Independent Test:** Login como admin → abrir administração → conferir lista e link; login como common-user → acesso negado.

**Acceptance Scenarios:**

1. **Given** um admin autenticado, **When** acessa a administração, **Then** vê a lista de todos os usuários com nome, e-mail e tier.
2. **Given** um admin autenticado e convite configurado no servidor, **When** acessa a administração, **Then** vê o link completo de registro com o token atual.
3. **Given** um common-user autenticado, **When** tenta abrir a administração, **Then** é bloqueado (sem acesso ao conteúdo).
4. **Given** visitante, **When** tenta abrir a administração, **Then** é bloqueado.

### User Story 3 - Autores exclusivo do admin (Priority: P1)

A tela de autores e a edição/exclusão de autores ficam restritas ao admin.

**Independent Test:** Admin acessa `/authors` e edita; common-user não vê o menu e é bloqueado na rota; common-user ainda cria autor no fluxo de livro.

**Acceptance Scenarios:**

1. **Given** admin autenticado, **When** abre Autores, **Then** vê a tela de gestão e pode editar/excluir.
2. **Given** common-user autenticado, **When** olha a navegação, **Then** não vê o item Autores nem Administração.
3. **Given** common-user autenticado, **When** acessa a rota de autores diretamente, **Then** é bloqueado.
4. **Given** common-user no fluxo de adicionar livro, **When** cria um autor novo, **Then** a criação pontual continua permitida.

### User Story 4 - Navegação condicional (Priority: P2)

Itens administrativos só aparecem para admin.

**Independent Test:** Alternar sessão admin vs common-user e conferir menu.

**Acceptance Scenarios:**

1. **Given** admin, **When** abre o menu, **Then** vê Administração e Autores.
2. **Given** common-user, **When** abre o menu, **Then** não vê Administração nem Autores.

---

## 5. Requirements

### Functional Requirements

- **FR-001:** O sistema MUST persistir um tier por usuário: `admin` ou `common-user`.
- **FR-002:** Novos cadastros MUST receber `common-user` por padrão.
- **FR-003:** O usuário `bd12cc9a-51ec-452d-8722-a97547b6e0c0` MUST ser `admin` após a aplicação dos dados iniciais.
- **FR-004:** A tela de administração MUST listar todos os usuários com identificação administrativa (nome, e-mail, tier).
- **FR-005:** A tela de administração MUST exibir o link atual de convite para registro.
- **FR-006:** Somente admin MUST acessar a tela de administração (UI e APIs correspondentes).
- **FR-007:** Somente admin MUST acessar a tela de autores.
- **FR-008:** Edição e exclusão de autores MUST exigir tier admin.
- **FR-009:** Criação pontual de autor no fluxo de livro MUST permanecer disponível a usuários autenticados (common-user incluso).
- **FR-010:** Navegação MUST ocultar Administração e Autores para não-admins.
- **FR-011:** Tentativa de acesso direto às rotas restritas por não-admin MUST ser bloqueada sem expor o conteúdo.

### Success Criteria

- **SC-001:** Admin consegue abrir administração, ver todos os usuários e copiar/usar o link de convite.
- **SC-002:** Common-user não acessa administração nem autores pela UI nem pela rota direta.
- **SC-003:** Novo usuário cadastrado por convite nasce como common-user.
- **SC-004:** O usuário seed permanece admin após migração.
- **SC-005:** Common-user ainda consegue cadastrar livro escolhendo/criando autor no formulário de livro.
