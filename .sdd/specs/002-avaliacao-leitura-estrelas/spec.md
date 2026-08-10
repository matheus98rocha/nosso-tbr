# Feature Specification: Avaliação de Leitura Finalizada por Estrelas

**Feature ID:** 002  
**Status:** Draft  
**Owner:** Mateus  
**Criada em:** 2026-05-17  
**Domínios relacionados (vault):** [[features/feature-leitura-coletiva]] · [[business-rules]] (status de livro, privacidade por participante)

---

## 1. Resumo executivo

O usuário que **terminou de ler** um livro quer registrar uma **avaliação subjetiva da experiência de leitura** usando uma escala visual familiar — **estrelas** — em vez de apenas mudar o status para “finalizado” sem qualquer nuance emocional ou de satisfação.

Hoje, marcar um livro como finalizado encerra o ciclo funcional, mas **não captura** “o quanto eu gostei” ou “nota que eu dou para esta leitura”. Esta feature introduz a capacidade de **associar uma avaliação por estrelas à leitura concluída**, de forma que o próprio usuário possa **consultar depois** como avaliou aquele título e, quando aplicável, **ajustar** a avaliação ao longo do tempo.

O sistema deve manter **isolamento por usuário**: a avaliação é sempre **do leitor autenticado** em relação àquele livro na sua conta; **não** confunde avaliações entre participantes de uma mesma leitura coletiva.

---

## 2. Por quê (motivação)

- **Memória afetiva:** estrelas funcionam como âncora rápida (“amei”, “ok”, “não foi pra mim”) ao revisitar a biblioteca.
- **Completude da jornada:** finalizar sem registrar satisfação perde uma camada de significado que muitos leitores já esperam de apps de leitura.
- **Baixo atrito:** escala discreta (por exemplo 1 a 5) é mais rápida que texto obrigatório.
- **Coerência com leitura coletiva:** cada participante pode ter vivido o mesmo livro de forma diferente; a nota deve refletir **só** a experiência individual.

---

## 3. Escopo

### 3.1 Dentro do escopo

- Permitir ao usuário autenticado **registrar uma avaliação por estrelas** para um livro cuja leitura está **finalizada** no sentido de domínio do produto (status que representa “terminei de ler”).
- Permitir **visualizar** a própria avaliação onde o produto já mostra livros finalizados ou detalhes do livro na perspectiva do usuário logado.
- Permitir **alterar** a avaliação depois (troca de número de estrelas) e, se fizer sentido para o usuário, **remover** a avaliação para voltar ao estado “finalizado sem nota” — desde que isso não quebre invariantes de negócio já existentes.
- Garantir **textos e feedback em pt-BR** e **acessibilidade** da escala (sem depender só de cor ou só de ícone).
- Respeitar **visitantes não autenticados**: não exibir fluxo de avaliação nem revelar dados que pertençam só ao dono da conta.

### 3.2 Fora do escopo (não-objetivos)

- **NÃO** introduzir, nesta versão, **resenha textual obrigatória** nem campos longos de texto ligados à avaliação (comentários podem vir em feature futura).
- **NÃO** definir nesta spec **média global do título** ou ranking público tipo “nota da comunidade” — a menos que um item em `[NEEDS CLARIFICATION]` abra explicitamente essa porta na fase de produto.
- **NÃO** exigir avaliação para usar outras funções do app (finalizar leitura, ver biblioteca, etc.) — salvo decisão explícita em produto que reverta isso (marcado como clarificação).
- **NÃO** misturar avaliação com **progresso de cronograma** ou páginas lidas; são conceitos diferentes (progresso objetivo vs. satisfação subjetiva).

---

## 4. Personas e cenários

### Persona única

- **Leitor autenticado** que possui livros na biblioteca e consegue alterar o ciclo de vida da leitura até o estado **finalizado**.

### User Scenarios & Testing

#### User Story 1 — Registrar avaliação ao concluir a leitura (Priority: **P1**)

- **Descrição:** Como leitor logado, quando marco um livro como **leitura finalizada**, quero poder **atribuir imediatamente** uma nota em estrelas, para registrar na hora o quanto gostei da experiência.
- **Razão da prioridade P1:** É o momento de maior relevância emocional e maior taxa de conclusão do fluxo; sem isso, a feature perde adesão.
- **Independent Test:** Usuário com livro em estado anterior a finalizado; executar fluxo de marcar como finalizado e observar oferta de avaliação.
- **Acceptance Scenarios:**
  - **Given** usuário autenticado com livro elegível a ser finalizado, **When** confirma a finalização da leitura, **Then** o sistema oferece seleção de estrelas antes de encerrar o fluxo ou em passo contíguo claro e opcional/obrigatório conforme decisão de produto em §9.
  - **Given** o usuário seleciona um valor válido na escala acordada, **When** confirma, **Then** a avaliação fica associada ao par **usuário + livro** e pode ser recuperada nas próximas sessões.
  - **Given** o usuário abandona o fluxo antes de confirmar estrelas, **Then** o livro permanece finalizado conforme regras atuais do produto e a avaliação permanece ausente até novo registro — sem estado inconsistente “meio avaliado”.

#### User Story 2 — Ver minha avaliação em livros já finalizados (Priority: **P2**)

- **Descrição:** Como leitor logado, ao ver um livro que já finalizei, quero **ver quantas estrelas eu dei**, para lembrar minha opinião sem abrir fluxos ocultos.
- **Razão da prioridade P2:** Fecha o ciclo de valor depois do momento inicial; aumenta confiança de que o dado foi salvo.
- **Independent Test:** Usuário com livro finalizado e avaliação pré-registrada; navegar pelas superfícies onde o produto lista ou detalha livros finalizados do próprio usuário.
- **Acceptance Scenarios:**
  - **Given** livro finalizado **com** avaliação, **When** o usuário visualiza o livro em contexto autenticado próprio, **Then** as estrelas (ou equivalente textual+aural acessível) aparecem de forma consistente com o valor salvo.
  - **Given** livro finalizado **sem** avaliação, **When** o mesmo contexto, **Then** não há estrelas “zeradas” enganosas; ou não se exibe avaliação ou exibe convite discreto para avaliar — decisão de UX em fase Plan (ver §9).

#### User Story 3 — Alterar ou remover minha avaliação depois (Priority: **P2**)

- **Descrição:** Como leitor logado, quero **mudar** minha nota depois de tempo ou humor diferentes, ou **apagar** a nota se preferir não ter avaliação registrada.
- **Razão da prioridade P2:** Evita frustração de erro ou maturidade da opinião; comum em produtos de leitura.
- **Independent Test:** Livro finalizado com avaliação X; alterar para Y e para ausência de avaliação.
- **Acceptance Scenarios:**
  - **Given** avaliação existente, **When** o usuário escolhe novo valor válido e confirma, **Then** apenas o valor atual permanece visível e histórico não é exposto ao usuário final (sem linha do tempo de mudanças), salvo requisito futuro explícito.
  - **Given** avaliação existente, **When** o usuário remove a avaliação (se permitido), **Then** o sistema volta ao estado “finalizado sem avaliação” sem apagar o fato de que o livro foi finalizado.

#### User Story 4 — Privacidade por participante em leitura coletiva (Priority: **P2**)

- **Descrição:** Como participante de leitura coletiva, quero que **minha avaliação por estrelas seja só minha**, para que outros participantes não vejam minha nota como se fosse deles ou vice-versa.
- **Razão da prioridade P2:** Evita incidentes de privacidade e alinha expectativa em grupo.
- **Independent Test:** Dois usuários no mesmo livro coletivo; cada um avalia com valores diferentes; verificar isolamento nas vistas de cada sessão.
- **Acceptance Scenarios:**
  - **Given** dois usuários distintos finalizaram o mesmo livro em contexto coletivo, **When** cada um visualiza sua própria conta, **Then** cada um vê **apenas** sua própria avaliação (ou ausência dela).
  - **Given** usuário B, **When** navega na interface como participante do mesmo livro, **Then** não visualiza a avaliação por estrelas **do** usuário A (exceto se uma política explícita de visibilidade social for adotada — marcado em §9 como clarificação).

---

## 5. Regras de domínio (novas RNs propostas)

> Promover ao vault em `01-Projetos/nosso-tbr/business-rules.md` após aprovação e entrega.

- **RNxx-01 — Escopo da avaliação:** Uma avaliação por estrelas refere-se sempre ao **mesmo objeto conceitual** que identifica “esta leitura deste livro **nesta conta**”. Não existe avaliação anônima nem avaliação “do livro em si” desvinculada do leitor.
- **RNxx-02 — Elegibilidade:** Somente usuário **autenticado** pode criar, ver (a própria), editar ou remover avaliação. Visitantes não participam do fluxo.
- **RNxx-03 — Estado do livro:** O sistema só aceita registrar ou manter avaliação quando o livro está no estado de domínio que significa **leitura finalizada** para aquele usuário. Se o livro deixa de estar finalizado por qualquer fluxo já existente no produto, a política sobre o que acontece com a avaliação (bloqueio, ocultação, limpeza) será decidida na fase Plan com base nas invariantes atuais — ver `[NEEDS CLARIFICATION]` em §9.
- **RNxx-04 — Escala:** A avaliação usa uma escala **ordinal discreta de estrelas** com número fixo de passos acordado globalmente no produto (ex.: inteiro de 1 a 5). Passos fracionários (meia estrela) só entram se produto clarificar em §9.
- **RNxx-05 — Unicidade lógica:** Para cada par **usuário autenticado + livro** existe **no máximo uma** avaliação ativa por vez; atualizar substitui o valor anterior sem expor histórico ao usuário.
- **RNxx-06 — Visibilidade padrão:** Por omissão de produto descrita nesta spec, **somente o próprio usuário** vê sua avaliação nas vistas típicas da conta. Qualquer visibilidade para terceiros exige decisão explícita em §9.

---

## 6. Functional Requirements

### 6.1 Criação e persistência

- **FR-001:** O sistema DEVE permitir que um usuário autenticado **registre** uma avaliação por estrelas para um livro **finalizado** por ele.
- **FR-002:** O sistema DEVE **persistir** a avaliação de forma que sobreviva a novas sessões de login no mesmo usuário.
- **FR-003:** O sistema DEVE garantir que cada usuário tenha **no máximo uma** avaliação ativa por livro avaliável (substituição de valor, não duplicatas concorrentes).

### 6.2 Leitura e apresentação

- **FR-004:** O sistema DEVE permitir que o usuário autenticado **visualize** sua própria avaliação onde o produto já mostra livros finalizados ou detalhes pertinentes ao **próprio** usuário.
- **FR-005:** O sistema NÃO DEVE sugerir avaliação “zerada” como se fosse nota real quando não há avaliação; estado ausente DEVE ser distinguível de nota mínima.
- **FR-006:** O sistema DEVE usar **pt-BR** em rótulos, mensagens de confirmação e strings auxiliares do fluxo de avaliação.

### 6.3 Edição e remoção

- **FR-007:** O sistema DEVE permitir **alterar** o número de estrelas depois do registro inicial.
- **FR-008:** O sistema DEVE permitir **remover** completamente a avaliação (voltando ao estado sem avaliação), salvo se a política de produto definir avaliação obrigatória — nesse caso remoção pode ser proibida (§9).

### 6.4 Privacidade e sessão

- **FR-009:** O sistema DEVE isolar avaliações entre usuários diferentes para o mesmo livro (ninguém vê a estrela do outro nas condições padrão desta spec).
- **FR-010:** O sistema NÃO DEVE expor fluxo de avaliação a usuários não autenticados.

### 6.5 Acessibilidade

- **FR-011:** O controle de estrelas DEVE ser operável por **teclado** e informável a tecnologias assistivas (nome acessível que comunica valor selecionado e escala).
- **FR-012:** A avaliação NÃO DEVE depender **somente** da cor para transmitir diferença entre níveis.

### 6.6 Erros e consistência

- **FR-013:** Falhas ao salvar avaliação DEVEM comunicar erro compreensível em pt-BR e DEVEM preservar o estado anterior da interface até nova tentativa bem-sucedida (sem dados fantasmas).
- **FR-014:** O sistema DEVE impedir valores fora da escala definida (validação).

---

## 7. Success Criteria

- **SC-001:** Em teste com três livros finalizados pelo mesmo usuário, **100%** das avaliações registradas são recuperadas corretamente após recarregar a sessão.
- **SC-002:** Em teste com dois usuários no mesmo livro coletivo, **nenhum** enxerga a avaliação do outro nas condições padrão desta spec (conforme FR-009).
- **SC-003:** Auditoria rápida de acessibilidade não introduz regressões graves no controle de estrelas (foco visível, nome acessível, operação por teclado).
- **SC-004:** **Zero** avaliações órfãs que violem a elegibilidade decidida na resolução de §9 (ex.: avaliação ativa ligada a livro não-finalizado, se essa combinação for proibida).
- **SC-005:** Tempo para completar avaliação no fluxo feliz (selecionar estrelas + confirmar) permanece **≤ 15 segundos** para usuário médio em teste moderado de usabilidade interna.

---

## 8. Riscos, dependências e premissas

### 8.1 Premissas

- O produto já possui conceito de **livro finalizado** reconhecível pelo usuário.
- Estrelas são suficientes como MVP de satisfação; texto livre fica fora do escopo desta spec.

### 8.2 Riscos

- **R-01 — Avaliação obrigatória vs. opcional:** Obrigar pode gerar abandono na finalização; opcional pode gerar baixa adoção. Resolver em §9.
- **R-02 — Semântica social:** Se no futuro avaliações virarem públicas, mudam expectativas legais/normativas — mantido fora do escopo salvo clarificação.

### 8.3 Dependências internas (contextuais)

- Fluxo atual de mudança de status do livro até **finalizado**.
- Superfícies onde livros finalizados aparecem para o usuário (lista, detalhe, cartões).

### 8.4 Dependências externas

- Nenhuma obrigatória descrita nesta fase.

---

## 9. Itens marcados como [NEEDS CLARIFICATION]

1. **Obrigatoriedade:** Ao finalizar, a avaliação é **opcional com skip explícito** ou **obrigatória** para concluir?
2. **Granularidade:** Apenas estrelas **inteiras** ou também **frações** (ex.: meia estrela)?
3. **Transição de estado:** Se o usuário **reverte** finalização (fluxo já existente ou futuro), o que ocorre com a avaliação — mantém-se oculta, é apagada automaticamente ou permanece até novo estado elegível?
4. **Superfícies mínimas:** Além do momento de finalização, onde mais a avaliação **DEVE** aparecer obrigatoriamente (detalhe do livro, lista “Finalizados”, ambos)?
5. **Ausência de avaliação:** Em livro finalizado sem nota, preferimos **nada**, **CTA discreto “Avaliar”**, ou **placeholder neutro**?
6. **Visibilidade social:** Permanece **100% privado ao usuário**, ou há requisito de mostrar avaliação a outros participantes / visitantes do perfil?

> Esses itens devem ser fechados antes ou durante a fase **Plan** como decisões de produto e UX; não substituem requisitos funcionais já declarados onde estão determinísticos.

---

## 10. Notas de governança SDD

- Fase atual: **Specify** (esta branch conceitual: `avaliacao-leitura-estrelas`).
- Próxima fase: **Plan** — traduzir decisões de §9 em modelo de dados, contratos e superfícies de UI sem alterar o WHAT desta spec.
- Após entrega: atualizar vault (`business-rules`, nota em `features/`) com RNs promovidas.
