````markdown
# 📚 Nosso TBR

**Nosso TBR** é uma aplicação para organização e acompanhamento de leituras, feita para ajudar leitores a gerenciar suas listas de livros, acompanhar o progresso e criar experiências personalizadas.

---

## 🚀 Começando

Siga os passos abaixo para ter o projeto rodando localmente.

### 📦 Instalação

Primeiro, clone o repositório e acesse a pasta do projeto:

```bash
git clone [https://github.com/seu-usuario/nosso-tbr.git](https://github.com/seu-usuario/nosso-tbr.git)
cd nosso-tbr
```
````

Em seguida, instale as dependências usando `yarn`:

```bash
yarn install
```

### ▶️ Execução

Para iniciar a aplicação em modo de desenvolvimento, use o seguinte comando:

```bash
yarn dev
```

Para criar uma build de produção e executá-la, utilize:

```bash
# Criar a build
yarn build

# Executar a build
yarn start
```

---

## 🛠 Tecnologias

Este projeto foi construído utilizando as seguintes tecnologias:

- **Next.js**
- **TypeScript**
- **Supabase**
- **TanStack Query**
- **Zustand**
- **React Hook Form**
- **Tailwind CSS**

---

## 📌 Regras de Contribuição

Para garantir a qualidade e a consistência do código, siga as seguintes regras ao contribuir:

- Não é permitido fazer `push` diretamente para a branch `main` ou `develop`.
- Toda nova funcionalidade, correção ou melhoria deve ser feita em uma branch separada e, ao final, devolvida para a branch `develop`.
- Toda branch deve ter um propósito claro e seguir o padrão de nomenclatura:
  - `feat/` para novas funcionalidades
  - `fix/` para correções de bugs
  - `chore/` para tarefas de manutenção ou melhorias internas
- Nenhum **Pull Request** pode ser aprovado sem revisão.

---

## 🏗 Estrutura do Projeto

O projeto segue uma arquitetura clara para separar a responsabilidade entre componentes, serviços e lógica.

### 📂 Guia de Componentes

Nossos componentes são divididos em três camadas:

- **Page Server** (`app/.../page.tsx`): Responsável por buscar dados no servidor (SSR/SSG). **Não deve conter lógica de estado ou eventos.**
- **Componente Cliente** (`app/.../components/NomeDoComponente.tsx`): Contém a renderização e a interação com o usuário. **Deve importar a lógica de hooks, sem acessar dados diretamente.**
- **Hooks** (`app/.../hooks/useNomeHook.ts`): Armazena a lógica de estado, manipulação de dados, `Tanstack Query` e eventos.

### 📂 Guia de Serviços

A estrutura de serviços segue um padrão para garantir a organização e a reusabilidade do código:

```
services/
└── books/
    ├── bookQuery.builder.ts
    ├── book.mapper.ts
    └── book.service.ts
```

- `Supabase Client`: Conexão configurada com o banco de dados.
- `Query Builder`: Centraliza consultas, filtros e paginações (`bookQuery.builder.ts`).
- `Mapper`: Mapeia dados do banco de dados para o formato usado no domínio da aplicação (`book.mapper.ts`).
- `Service`: Usa o `Query Builder` e o `Mapper` para fornecer métodos reutilizáveis para o restante do projeto (`book.service.ts`).

---

## 🖥 Exemplos de Código

### **Exemplo de Page Server** (`app/books/page.tsx`)

```ts
import BookList from "./components/BookList";
import { bookService } from "@/services/books/book.service";

export default async function BooksPage() {
  const initialBooks = await bookService.getFeaturedBooks();

  return <BookList initialBooks={initialBooks} />;
}
```

Com certeza! Aqui está a sessão de agradecimento e inspiração no formato Markdown. Você pode adicioná-la no final do seu arquivo `README.md`.

---

## 🙏 Agradecimentos e Mensagem Final

Gostaríamos de expressar nossa sincera gratidão a todos os contribuidores. Cada `pull request`, `issue` e sugestão de melhoria nos ajuda a construir uma ferramenta cada vez melhor para a comunidade de leitores. O **Nosso TBR** é um projeto colaborativo, e seu apoio é o que nos move.

Juntos, transformamos linhas de código em experiências de leitura.

Obrigado por fazer parte dessa história!
