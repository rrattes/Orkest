# Orkest — Direção visual e design system (v0.1)

- **Ticket:** ORKEST-002-DESIGN
- **Autor:** VISUAL-DESIGN-DIRECTOR (consultor independente)
- **Data:** 2026-11-03
- **Status:** **Direção A "Partitura" APROVADA pelo usuário em 2026-11-03.** Base de implementação a partir de agora. As 8 decisões abertas da §7 seguem pendentes e recebem defaults sensatos até decisão do usuário.
- **Escopo:** app desktop Linux (Arch/Hyprland/Wayland), tema escuro, uma tela principal (barra de abas de agentes + painel de terminal) e um modal de criação de agente.
- **Fora de escopo:** tema claro, mobile, Floors/Connections/broker (telas futuras), código de app.

> **Evidência e limites.** Os contrastes marcados `✔ calc` foram calculados com a fórmula de luminância relativa WCAG 2.x sobre os hexadecimais da tabela. Nenhum protótipo renderizado foi produzido neste ticket: os wireframes abaixo são ASCII, são **conceito, não protótipo funcional**. Comportamento de fontes, `backdrop-filter` e animações no webkit2gtk (Tauri 2) **não foi testado** aqui; está listado como risco/verificação do Builder.

---

## 1. Contexto e premissas

| Item | Premissa (derivada de `README.md`, `docs/architecture.md`, ADR-0001, ainda hipótese) |
|---|---|
| Usuário | Desenvolvedor que opera vários agentes de IA CLI em paralelo, por horas, em um monitor; teclado primeiro. |
| Tarefa central | Ver de relance **quem** está rodando, **em que estado**, e alternar/ler o terminal real sem fricção. |
| Plataforma | Tauri 2 (webkit2gtk) + React + Tailwind + xterm.js. Isso é web: CSS vale. Se o ADR mudar para Qt/QML, os tokens se preservam, mas a seção 5 deve ser remapeada. |
| Marca | Identidade própria. Não usa o Maestri (nem sua paleta, composição ou ícones) nem o Omarchy como base. |
| Terminal | Conteúdo mais importante da tela. A interface é moldura; o terminal é o palco. |

---

## 2. Duas direções visuais

Diferem em **composição, densidade, material e tipografia**, não só na cor.

### Direção A — "Partitura" (régua e pauta)

**Tese:** o Orkest rege vários agentes; a interface é uma **pauta**: linhas finas, alinhamento rigoroso, cada agente é uma "voz" numa faixa, e o estado é um **sinal de régua** (trilho de 2 px na base da aba) em vez de decoração.

- **Composição:** barra de abas horizontal no topo (44 px), terminal em tela cheia, barra de contexto de 24 px no rodapé. Sem sidebar, sem cards.
- **Hierarquia:** 1º terminal; 2º aba ativa; 3º estado dos outros agentes; 4º restante.
- **Material/profundidade:** plano. Separação por **luminância em degraus** e hairlines de 1 px. Sombra só em overlays (modal, menu). Luz só para comunicar estado (trilho animado de `running`, anel de foco).
- **Tipografia:** IBM Plex Sans (UI, tom de engenharia, tabular nos números) + JetBrains Mono (terminal e metadados técnicos).
- **Cor:** grafite neutro frio + **um** acento ciano "sinal" + cores semânticas separadas.
- **Densidade:** alta (UI base 13 px), raios baixos (4–6 px).
- **Movimento:** curto e funcional (120–180 ms); só estado e transição de overlay.
- **Exclusões:** blur de vidro, gradientes de fundo, glow, ilustrações, cards de dashboard, contadores decorativos.

### Direção B — "Strata" (camadas)

**Tese:** o app como **pilha de camadas** de uma bancada escura: agentes vivem num **trilho vertical** de cartões que flutuam sobre o fundo; o terminal é uma lâmina elevada à direita.

- **Composição:** sidebar vertical de 248 px com cartões de agente (ícone grande, nome, CLI·modelo, mini-atividade); terminal como painel elevado com raio 12 px.
- **Material/profundidade:** superfícies translúcidas em azul-ardósia, borda superior de 1 px com luz, sombras suaves em 3 níveis, profundidade espacial na troca de agente (a lâmina desliza).
- **Tipografia:** grotesca geométrica (ex.: Space Grotesk) para títulos + mono para terminal.
- **Cor:** azul-ardósia profundo + acento âmbar/latão.
- **Densidade:** média-baixa (cartões altos), raios 10–12 px.
- **Movimento:** transições espaciais de 240–320 ms.
- **Exclusões:** neon, grids de métricas.

### Comparação (mesmo conteúdo: 6 agentes, 1 terminal ativo)

| Critério | A — Partitura | B — Strata |
|---|---|---|
| Atende "abas = agentes" do brief | Direto (barra de abas) | Reinterpreta (sidebar de cartões); exige validação |
| Agentes visíveis simultaneamente | ~7–8 em 1280 px sem rolagem | ~12 em altura 1080 px, poucos em telas baixas |
| Espaço para o terminal | Máximo (sem sidebar) | −248 px de largura; menos colunas |
| Leitura de estado de relance | Glifo + trilho por aba, escaneável numa linha | Cartão rico, mais informativo, mais lento de escanear |
| Identidade/memorabilidade | Média-alta: o "trilho de régua" é a assinatura | Alta: profundidade e luz |
| Risco técnico (webkit2gtk) | Baixo (CSS plano) | Alto: `backdrop-filter`, sombras e animações de camadas podem custar fps/ficar inconsistentes; **não verificado** |
| Custo de implementação | Baixo/médio | Médio/alto |
| Risco de "estética genérica de IA" | Baixo se o trilho e a tipografia forem respeitados | Médio (glass/gradiente tende a virar clichê) |

### Recomendação (proposta): **Direção A — Partitura**

Justificativa:
1. **Tarefa:** o brief pede abas e bom uso de espaço; A dá o máximo de área ao terminal e escaneia estado numa linha.
2. **Rams — "o mínimo de design possível" (nº 10) e "honesto" (nº 6):** a profundidade de B é ornamental para a tarefa; em A a única "luz" existente (trilho animado) **significa** estado.
3. **Kuznetsov — profundidade, luz e coreografia como material:** aplicados com economia. A luz e o movimento existem apenas onde guiam atenção (agente passou a `running`/`blocked`/`failed`); a identidade vem do sinal de régua, não de um efeito.
4. **Risco:** plataforma webkit2gtk não validada para blur/camadas; A não depende disso.
5. **Custo de reversão:** os tokens (seção 3) são independentes do layout; se o usuário preferir B, trocam-se a paleta e a composição sem refazer a semântica de estado.

*Referências consultadas como princípio, não como modelo:* [Vitsoe — Good design](https://www.vitsoe.com/us/about/good-design) (Rams) e [glebich.com](https://glebich.com/about) (Kuznetsov). Nenhuma obra, composição ou componente foi reproduzida.

**Decisão necessária:** aprovar A, aprovar B ou pedir híbrido. Até lá, o restante deste documento especifica A como **proposta**.

---

## 3. Tokens (Direção A)

Prefixo `--ork-` para evitar colisão. Camadas: **primitivo → semântico → componente**. Somente o tema escuro existe em V1; tokens semânticos são o contrato, para permitir outro tema depois.

### 3.1 Cores — superfícies e bordas

| Token semântico | Valor | Uso | Contraste / nota |
|---|---|---|---|
| `--ork-bg-canvas` | `#0F1012` | fundo da janela, área atrás de tudo | base |
| `--ork-bg-chrome` | `#151619` | barra de abas, barra de contexto | degrau +1 |
| `--ork-bg-surface` | `#1B1D21` | modal, popovers, campos | degrau +2 |
| `--ork-bg-raised` | `#222529` | itens hover em menus, segmentos selecionados | degrau +3 |
| `--ork-bg-hover` | `#2A2D32` | hover em itens interativos | |
| `--ork-bg-terminal` | `#0C0D0F` | fundo do xterm (mais fundo que a moldura de propósito: o palco) | |
| `--ork-border-subtle` | `#25282D` | divisórias estruturais (hairline 1 px) | decorativo, não carrega informação |
| `--ork-border` | `#32363C` | bordas de modal/cartão | decorativo |
| `--ork-border-control` | `#70767F` | borda de inputs, checkbox, segmentos (limite de controle) | ✔ calc ≥3:1 sobre `bg-canvas` 4,16 · `bg-surface` 3,69 · `bg-raised` 3,36 |

### 3.2 Cores — texto

| Token | Valor | Uso | Contraste ✔ calc (canvas / chrome / surface / raised) |
|---|---|---|---|
| `--ork-text-primary` | `#E6E8EB` | nomes, rótulos, conteúdo | 15,5 / 14,7 / 13,8 / 12,5 |
| `--ork-text-secondary` | `#A3A9B2` | descrições, valores secundários | 8,05 / 7,65 / 7,13 / 6,50 |
| `--ork-text-tertiary` | `#8A919B` | metadados (CLI·modelo), placeholders, hints | 5,99 / 5,69 / 5,31 / 4,84 — ≥4,5 em todas as superfícies |
| `--ork-text-disabled` | `#5C626A` | desabilitado (**isento de contraste mínimo WCAG**, mas nunca é o único portador de informação) | ≈3,1 / 2,9 / 2,7 / 2,5 |
| `--ork-text-on-accent` | `#07181C` | texto sobre `--ork-accent` | 8,75 |

> Nota de correção: o cinza `#848B95` (primeira tentativa) dava 4,48:1 em `bg-raised`; foi substituído por `#8A919B`.

### 3.3 Acento e estados

O acento é **um só** e **não** é cor de estado semântico (exceto `running`, ver 4.5). Estados têm cor **e forma** (ver 4.5): cor nunca é o único canal.

| Token | Valor | Uso | Contraste sobre chrome / surface |
|---|---|---|---|
| `--ork-accent` | `#4CC3D9` | foco, seleção, ação primária, aba ativa, estado `running` | 8,71 / 8,13 ✔ calc |
| `--ork-accent-hover` | `#6FD3E5` | hover do acento | alto (derivado, não calculado) |
| `--ork-accent-subtle` | `rgba(76,195,217,.14)` | fundo de selecionado/ativo | decorativo |
| `--ork-success` | `#5DC47E` | `done`, validação ok | 8,32 / 7,77 ✔ calc |
| `--ork-attention` | `#E8B04A` | `blocked`, avisos | 9,25 / 8,63 ✔ calc |
| `--ork-error` | `#EE6B63` | `failed`, erro de validação, destrutivo | 5,96 / 5,56 ✔ calc |
| `--ork-neutral` | `#8A919B` | `idle`, inativo | 5,69 / 5,31 ✔ calc |
| `--ork-*-subtle` (success/attention/error) | a cor a 14% de alpha | fundos de banners/badges | decorativo |

**Cores de identidade do agente** (só tingem o tile do ícone, nunca o estado): 8 matizes de luminosidade comparável — `#7AA7F0` azul, `#B38DEB` lilás, `#E58BB0` rosa, `#F0A06A` laranja, `#D9C36A` areia, `#8CCB8C` sálvia, `#6FCFC4` água, `#B5B9C2` pedra. *Contraste do glifo sobre o tile não foi calculado; verificar ≥3:1 (ícone, WCAG 1.4.11) na implementação — critério V-07.*

### 3.4 Tipografia

Fontes **empacotadas localmente** (woff2, licença OFL): sem CDN; app deve funcionar offline.

| Papel | Família | Fallback |
|---|---|---|
| UI | IBM Plex Sans | `system-ui, sans-serif` |
| Mono (terminal, metadados técnicos, caminhos, IDs) | JetBrains Mono | `ui-monospace, "DejaVu Sans Mono", monospace` |

| Token | Tamanho/linha | Peso | Uso |
|---|---|---|---|
| `--ork-fs-title` | 18 / 24 | 600 | título de modal |
| `--ork-fs-heading` | 14 / 20 | 600 | títulos de seção do modal |
| `--ork-fs-body` | 13 / 20 | 400 | texto base, campos |
| `--ork-fs-label` | 13 / 16 | 500 | nome da aba, rótulos de campo, botões |
| `--ork-fs-meta` | 11 / 14 | 400 (mono) | CLI·modelo na aba, rodapé, tags |
| `--ork-fs-caption` | 12 / 16 | 400 | ajuda e erro de campo |
| `--ork-fs-terminal` | 13 / 1.25 (padrão; configurável 10–20) | 400 | xterm |

Regras: pesos usados 400/500/600 apenas; números alinhados com `font-variant-numeric: tabular-nums`; sem caixa alta em texto longo; letter-spacing 0 (exceto +0,02em em `meta`).

### 3.5 Espaçamento, raios, sombras, movimento

| Grupo | Tokens |
|---|---|
| Espaçamento (base 4 px) | `0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40` → `--ork-space-{n}` |
| Raios | `--ork-r-sm` 2 (badge, trilho) · `--ork-r-md` 4 (botões, abas, inputs) · `--ork-r-lg` 6 (tile de ícone, popover) · `--ork-r-xl` 8 (modal) |
| Sombras (apenas overlays) | `--ork-shadow-pop`: `0 8px 24px rgba(0,0,0,.45), 0 0 0 1px var(--ork-border)` · `--ork-shadow-modal`: `0 24px 64px rgba(0,0,0,.6), 0 0 0 1px var(--ork-border)` · scrim: `rgba(5,6,8,.6)` |
| Foco | `--ork-focus-ring`: anel 2 px `--ork-accent` com offset 2 px (`outline`), nunca removido sem substituto |
| Duração | `--ork-dur-fast` 120 ms (hover/press) · `--ork-dur-base` 180 ms (overlay, troca de aba) · `--ork-dur-loop` 1600 ms (trilho `running`) |
| Easing | `--ork-ease-out: cubic-bezier(.2,.8,.2,1)` |
| Movimento reduzido | `prefers-reduced-motion: reduce` → durações 0 ms; o trilho `running` fica estático (segmento fixo) |

### 3.6 Layout global

| Região | Dimensão | Observação |
|---|---|---|
| Barra de abas | altura **44 px** | `bg-chrome`; hairline inferior `border-subtle` |
| Terminal | restante | `bg-terminal`; padding interno 8 px vertical / 12 px horizontal |
| Barra de contexto | altura **24 px** | rodapé; mono 11 px |
| Largura mínima da janela | 960 × 600 | abaixo disso, rolagem nas abas, nunca quebra de linha |

Wireframe (conceito):

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ▣ atlas ◆  ◜ │ ▣ revisor  ✓ │ ▣ build  ▲ │ ▣ docs  ○ │ ▣ api  ✕ │  [+]   │ 44px
│   claude·opus 5.5           │   codex·gpt-5 …                              │
│ ═══════(trilho 2px)═══════                                                 │
├──────────────────────────────────────────────────────────────────────────┤
│ $ claude                                                                   │
│ > …                                                                        │  terminal
│                                                                            │
├──────────────────────────────────────────────────────────────────────────┤
│ ~/Work/orkest · sessão tmux orkest-a1f3 · running · 120×34                 │ 24px
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Componentes

Formato: anatomia · variantes · dimensões · estados · teclado/acessibilidade.

### 4.1 Barra de abas de agentes

**Papel ARIA:** `role="tablist"` (orientação horizontal); cada aba `role="tab"` + `aria-selected`, `aria-controls` apontando ao painel do terminal; o painel é `role="tabpanel"`.

**Aba — anatomia (esquerda→direita, 2 linhas):**

```
┌───────────────────────────────────────────────────┐
│ [tile]  Nome do agente  ◆  [glifo de estado] [×]  │  linha 1: label 13/500
│ [24px]  claude · opus 5.5                         │  linha 2: meta 11 mono, text-tertiary
└───────────────────────────────────────────────────┘
 ═══ trilho de estado 2px (base da aba) ═══
```

| Parte | Especificação |
|---|---|
| Tile do ícone | 24×24, raio `r-lg`, fundo = cor de identidade a 16% de alpha, glifo 16 px na cor de identidade |
| Nome | `fs-label`, truncado com reticências; tooltip com nome completo |
| Marca de Maestro | losango ◆ 8 px em `text-secondary` após o nome; especialista não tem marca. `aria-label` inclui "Maestro" |
| Linha 2 | `CLI · modelo` em mono 11 px; modelo longo é truncado no meio |
| Glifo de estado | 14 px, ver 4.5; sempre presente (inclusive `idle`) |
| Fechar `×` | 16 px; aparece em hover/aba ativa/foco; ver comportamento abaixo |
| Trilho de estado | 2 px na base, cor do estado (ver 4.5); só em estados não-`idle`; `running` anima |
| Largura | min 168, max 240, flexível; abaixo do mínimo ativa rolagem horizontal |
| Altura | 44 |

**Estados:**

| Estado | Gatilho | Resposta visual | Teclado/AT |
|---|---|---|---|
| default | — | fundo transparente sobre `bg-chrome`; nome `text-secondary` | — |
| hover | ponteiro | fundo `bg-hover`; nome `text-primary`; mostra `×` | — |
| **selected (ativa)** | clique / `Ctrl+1…9` | fundo `bg-terminal` (a aba "se funde" ao terminal), nome `text-primary`, linha de 2 px `accent` no topo, trilho de estado mantido | `aria-selected=true` |
| focus-visible | Tab/setas | `focus-ring` interno (offset −2) | setas ←/→ movem foco (roving tabindex), Enter/Espaço ativa, Home/End |
| active (pressionado) | mousedown | fundo `bg-raised` | — |
| disabled | sessão encerrada e removida | não aplicável (aba é removida) | — |
| loading | sessão iniciando | glifo de `running` + texto da linha 2 "iniciando…" | `aria-busy=true` |
| unseen | aba inativa teve saída nova | ponto de 6 px `accent` ao lado do glifo; some ao selecionar | `aria-label` "nova saída" |
| arrastando | reordenar | elevação `shadow-pop`, demais abas deslizam em `dur-base` | Alt+←/→ reordena por teclado |

**Fechar `×`:** fecha a **aba**; como "fechar a janela não encerra tarefas" (architecture.md), ao fechar um agente `running` o app deve perguntar "Encerrar o agente ou apenas ocultar a aba?" (decisão de produto — ver §7). Visual: dialog de confirmação no padrão do modal, ação destrutiva em `error`.

**Overflow:** setas ‹ › 28×44 nas extremidades quando há rolagem + fade de 16 px; botão "▾ Todas as abas" lista agentes com estado. A aba ativa é sempre rolada para a vista.

**Atalhos sugeridos:** `Ctrl+Tab`/`Ctrl+Shift+Tab` cicla; `Ctrl+1…9` vai ao n-ésimo; `Ctrl+Shift+N` abre o modal; `Ctrl+W` fecha aba. *Conflitos com atalhos do xterm/CLIs devem ser verificados: quando o terminal tem foco, só atalhos com `Ctrl+Shift` ou `Alt` são capturados pelo app; `Ctrl+C`, `Ctrl+W`, `Ctrl+Tab` etc. pertencem ao terminal. Isto é uma proposta a validar com o Builder.*

### 4.2 Botão "+" (criar/abrir agente)

| Item | Especificação |
|---|---|
| Posição | após a última aba, fixo à direita da região rolável (não rola junto) |
| Tamanho | 32×32 (alvo ≥24 px, WCAG 2.5.8), ícone "+" 16 px, raio `r-md` |
| Função | clique abre um popover (`shadow-pop`, 240 px) com dois itens: **"Novo agente…"** (`Ctrl+Shift+N`, abre o modal 4.3) e **"Abrir agente salvo"** (submenu/lista de agentes persistidos que não têm sessão ativa, cada um com tile, nome, CLI·modelo) |
| Estados | default `text-secondary` · hover `bg-hover` + `text-primary` · focus-visible `focus-ring` · active `bg-raised` · aberto (menu expandido) `bg-accent-subtle` + `aria-expanded=true` · disabled quando não é possível criar (ex.: backend indisponível), com tooltip explicando |
| Vazio | sem agentes salvos, o segundo item aparece desabilitado: "Nenhum agente salvo" |
| AT | `aria-haspopup="menu"`, `aria-label="Criar ou abrir agente"`, menu com `role="menu"`/`menuitem`, setas/Enter/Esc |

**Estado vazio da aplicação (nenhum agente):** terminal substituído por uma área central com título 18 px "Nenhum agente aberto", uma linha de texto e **o mesmo botão primário** "Novo agente" + atalho. Sem ilustração.

### 4.3 Modal de criação de agente

**Papel:** `role="dialog"` `aria-modal="true"`, `aria-labelledby` = título. Foco preso; ao abrir, foco no primeiro campo; ao fechar, foco retorna ao botão "+".

**Dimensões:** largura 560 px (máx. 92 vw), altura máx. 80 vh com corpo rolável, cabeçalho e rodapé fixos. Fundo `bg-surface`, raio `r-xl`, `shadow-modal`, scrim sobre o app. Padding 24 px; espaço entre campos 16 px; entre seções 24 px.

**Anatomia:**

```
┌────────────────────────────────────────────────┐
│ Novo agente                                [×] │ título 18/600
│ Escolha o CLI, o modelo e o papel do agente.   │ body, text-secondary
├────────────────────────────────────────────────┤
│ Execução                                        │ heading 14/600
│ CLI            (•) Claude Code  ( ) Codex       │ cartões 2×2
│                ( ) OpenCode     ( ) Gemini CLI  │
│ Modelo         [ Padrão do CLI            ▾ ]   │
│ Workspace      [ /home/…/projeto  ] [Procurar]  │ mono
│                                                 │
│ Identidade                                      │
│ Nome           [ atlas                      ]   │
│ Ícone          [tile][tile][tile]…  + cor ●●●●  │
│ Tipo           [ Maestro | Especialista ]       │
│                                                 │
│ Role                                            │
│ Role           [ Selecionar role…          ▾ ]  │
│                prévia (3 linhas, mono, readonly)│
├────────────────────────────────────────────────┤
│                       [ Cancelar ] [Criar agente]│ rodapé fixo
└────────────────────────────────────────────────┘
```

**Campos:**

| Campo | Controle | Regras de comportamento visual |
|---|---|---|
| CLI | grupo de rádio em cartões 2×2 (altura 40, raio `r-md`): nome do CLI + glifo neutro do CLI (sem logos de terceiros como identidade do app) | obrigatório; selecionado = borda `accent` 1,5 px + `accent-subtle`; CLI não encontrado no `PATH` → opção desabilitada com tag "não instalado" |
| Modelo | select (combobox acessível) dependente do CLI | primeira opção "Padrão do CLI"; trocar o CLI limpa o modelo e mostra "carregando…" se a lista for assíncrona; erro de lista → mensagem e campo livre |
| Workspace | campo mono + botão "Procurar" (seletor de pasta nativo) | valida existência e permissão; erro inline `error`; `~` expandido; caminho truncado no meio com tooltip |
| Nome | input texto | obrigatório, único entre agentes; sugestão automática (`<cli>-<n>`); contador não necessário; erro de duplicidade |
| Ícone | grade de 16 glifos (tile 32×32, 8 por linha) + linha de 8 amostras de cor de identidade (16×16) | seleção única por grupo; pré-visualização do tile 24 px junto ao nome |
| Tipo | controle segmentado "Maestro / Especialista" | padrão Especialista; helper em `caption` descrevendo a diferença; se houver regra de Maestro único por workspace (ver §7), desabilitar com explicação |
| Role | select de roles persistidas + item "Nova role…" | opcional se produto permitir; prévia somente leitura (3 linhas, mono, `text-secondary`) com link "Editar role" (abre o editor, fora do escopo desta v0.1) |

**Estados do modal:**

| Estado | Visual |
|---|---|
| default | "Criar agente" desabilitado até campos obrigatórios válidos |
| campo focus-visible | `focus-ring` em cada controle; borda do input vira `accent` |
| erro de campo | borda `error`, ícone + texto `caption` abaixo, `aria-invalid` e `aria-describedby`; não só cor |
| loading (criando) | botão primário com spinner 14 px e texto "Criando…", campos `disabled`, `Esc` cancela se possível |
| erro de criação | banner `error-subtle` no topo do corpo com mensagem + ação "Tentar de novo"; foco vai ao banner (`role="alert"`) |
| sucesso | modal fecha, nova aba selecionada, terminal recebe foco |

**Botões:** primário (`accent` com `text-on-accent`, altura 32, raio `r-md`, peso 500); secundário (borda `border-control`, transparente); destrutivo (`error`). Cada um: hover (`accent-hover`/`bg-hover`), active (escurece 8%), focus-visible `focus-ring`, disabled (`bg-raised` + `text-disabled`).

**Teclado:** Tab/Shift+Tab percorrem na ordem visual; setas trocam opções em rádios e segmentados; `Enter` envia quando o formulário é válido (exceto dentro de select aberto); `Esc` fecha (pede confirmação só se houver alterações); clique no scrim não fecha (evita perda).

### 4.4 Painel de terminal (xterm.js)

**Regra-mãe:** nada sobrepõe o conteúdo do terminal exceto banners de estado de sessão (altura 36 px, colados ao rodapé do painel, empurrando o canvas via `fit`, nunca por cima).

| Item | Especificação |
|---|---|
| Fundo / texto | `bg-terminal` `#0C0D0F`; foreground `#D7DAE0` (contraste alto, ≈15:1 — estimado a partir de `text-primary`; não calculado para este hex) |
| Fonte | `fs-terminal` JetBrains Mono 13 px, altura de linha 1,25, ligaduras **desativadas por padrão** (fidelidade a saída de CLI) |
| Cursor | bloco `accent` quando o terminal tem foco, bloco **vazado** (contorno) sem foco; pisca 530 ms apenas com foco; sem piscar se `prefers-reduced-motion` |
| Seleção | `rgba(76,195,217,.28)` com texto preservado |
| Padding | 8 / 12 px (terminal usa `fit`; recalcular colunas/linhas ao redimensionar e reportar à PTY) |
| Barra de rolagem | 10 px, trilha transparente, polegar `border-control` a 60%, hover 100% |
| Foco do painel | linha de 1 px `accent` no topo do painel quando focado; ao perder foco, linha some e cursor vira vazado |
| Barra de contexto (rodapé 24 px) | esquerda: workspace (mono, truncado no meio); centro: nome da sessão; direita: rótulo textual do estado + `cols×rows`. Texto sempre `text-tertiary` |

**Paleta ANSI proposta** (tema do xterm; CLIs mantêm suas próprias cores truecolor):

| Slot | Normal | Brilhante |
|---|---|---|
| black | `#3A3F47` | `#7A808A` |
| red | `#EE6B63` | `#FF8A80` |
| green | `#5DC47E` | `#7FDB9A` |
| yellow | `#E8B04A` | `#F5C96B` |
| blue | `#6C9EF0` | `#8DB6FF` |
| magenta | `#C08BE8` | `#D5A8F5` |
| cyan | `#4CC3D9` | `#78D9EA` |
| white | `#C9CED6` | `#F2F4F6` |

*Contraste das 16 cores sobre `#0C0D0F` não foi calculado slot a slot; red/green/yellow/cyan normais têm cálculo de §3.3 sobre `bg-terminal` (≥6,4). `brightBlack` (`#7A808A`) é estimado ≥4,5; **verificar** (critério V-06). `black` normal (`#3A3F47`) é intencionalmente de baixo contraste (texto "apagado" de CLIs) e não deve carregar informação essencial.*

**Estados de sessão no painel:**

| Estado | Visual |
|---|---|
| Iniciando | linha "Iniciando sessão…" em mono `text-tertiary` + spinner mono `⠋⠙⠹…`; terminal inativo (`aria-busy`) |
| Rodando | normal |
| Encerrada (exit 0) | banner `success-subtle` 36 px: "Sessão encerrada (código 0)" + botões "Reiniciar" / "Fechar aba" |
| Falhou (exit ≠ 0 / crash) | banner `error-subtle` com código e último erro conhecido + "Reiniciar" / "Ver log" |
| Desconectada (broker/tmux perdido) | banner `attention-subtle` "Sessão desconectada" + "Reconectar" |
| Redimensionando | sem animação; sem flicker (xterm `fit` com debounce 50 ms) |

**Acessibilidade:** o terminal expõe `role="region"` com `aria-label="Terminal de <nome do agente>"`; xterm accessibility mode (`screenReaderMode`) configurável; texto copiável; `Ctrl+Shift+C/V` copiar/colar (convenção Linux); foco programático vai ao terminal ao trocar de aba.

### 4.5 Indicadores de estado

Cada estado = **forma + cor + rótulo textual** (tooltip e `aria-label`). A forma permite distinguir sem cor (daltonismo).

| Estado | Glifo (14 px, traço 1,5) | Cor | Trilho da aba | Animação | Rótulo / AT |
|---|---|---|---|---|---|
| **idle** | anel vazio ○ | `neutral` | nenhum | — | "Ocioso" |
| **running** | arco aberto girando ◜ (¾ de anel) | `accent` | 2 px `accent`; segmento de 24 px que percorre a aba em 1600 ms | giro 900 ms linear; sem movimento se `reduce` → arco fixo + trilho estático | "Executando" (`aria-live="polite"` só na mudança de estado, não continuamente) |
| **done** | disco preenchido com ✓ | `success` | 2 px `success`, estático; some após o usuário visualizar a aba | transição `fast` ao entrar | "Concluído" |
| **blocked** | triângulo com barra ▲ | `attention` | 2 px `attention`, estático, **persiste** até resolver | pulsação única (1 ciclo, 360 ms) ao entrar | "Bloqueado — aguardando ação" |
| **failed** | quadrado arredondado com ✕ | `error` | 2 px `error`, estático, persiste até ação | sem tremor; apenas transição `fast` | "Falhou" |

Regras:
- A mudança de estado em aba **inativa** dispara a marca *unseen* (4.1).
- `blocked` e `failed` pedem atenção: ao entrar, e se a janela estiver desfocada, emitir notificação de desktop (decisão de produto, §7).
- Fora da aba, o mesmo glifo é usado em listas ("Todas as abas", "Abrir agente salvo"), menu, barra de contexto, garantindo vocabulário único.
- Transições de estado têm no máximo uma animação; nenhum estado anima de forma contínua além de `running`.

### 4.6 Ícones

- Ícones de UI: conjunto de traço único, 16 px (grade 16, traço 1,5, extremidades arredondadas). Fonte sugerida: **Lucide** (licença ISC) como base de implementação — *licença e cobertura a confirmar pelo Builder*; complementar com SVGs próprios onde faltar.
- 16 glifos de identidade de agente (grade do modal): geométricos e abstratos — círculo, quadrado, triângulo, losango, hexágono, arco, linhas paralelas, cruz, ponto-em-anel, onda, "pauta" (cinco linhas), escada, grade 2×2, chave, órbita, seta. Desenho original do projeto; não usar logos de marcas (Anthropic, OpenAI, Google) como ícone de agente.
- Cada glifo funciona isolado em 16 px, sem dependência de cor.

---

## 5. Mapeamento de implementação (orientativo, para o Builder)

- Tokens vivem em **uma fonte única** (CSS custom properties em `:root`), espelhados no `theme.extend` do Tailwind; nenhum hexadecimal literal em componentes.
- Nomes Tailwind sugeridos: `bg-canvas`, `bg-chrome`, `bg-surface`, `bg-raised`, `bg-terminal`, `text-primary|secondary|tertiary`, `accent`, `success|attention|error|neutral`.
- Tema do xterm montado a partir dos mesmos tokens (não duplicar valores à mão).
- Antes de implementar, o Builder confirma: carregamento das fontes locais no webkit2gtk, renderização do `fit`, desempenho do trilho `running` com 8+ abas simultâneas (animar `transform`, não `left/width`).

---

## 6. Critérios de aceite visuais

Revisão da implementação (cada item é verificável por captura/inspeção; "✔" só pode ser marcado com evidência anexada).

| ID | Critério | Como verificar |
|---|---|---|
| V-01 | Todos os valores de cor/tipografia/espaçamento/raio vêm dos tokens da §3; nenhum hex literal em componentes | busca no código + revisão |
| V-02 | Texto normal ≥4,5:1 e texto grande/ícones/bordas de controle ≥3:1 em todas as superfícies em que aparecem | medição por ferramenta (ex.: DevTools/axe) |
| V-03 | Os 5 estados são distinguíveis em escala de cinza (forma diferente) | captura em grayscale |
| V-04 | Altura da barra de abas 44 px, rodapé 24 px, aba 168–240 px; abas truncam sem quebrar linha | inspeção de layout em 960, 1280 e 1920 px |
| V-05 | Aba ativa é identificável sem cor (linha de topo + fusão com o terminal + `aria-selected`) | captura + AT |
| V-06 | Terminal: fonte JetBrains Mono 13 px, cursor bloco/vazado conforme foco, `brightBlack` ≥4,5:1, `fit` correto (cols×rows batem com a PTY) | teste manual + `stty size` |
| V-07 | Glifo do tile do agente ≥3:1 sobre o tile em todos os 8 matizes | medição |
| V-08 | Navegação completa por teclado: abas (setas), "+" (menu), modal (Tab/Esc/Enter), foco visível em tudo, sem armadilha de foco | roteiro manual |
| V-09 | Modal: estados default/foco/erro/loading/erro de criação conformes à §4.3; foco inicial e retorno corretos | roteiro manual + captura |
| V-10 | `prefers-reduced-motion`: nenhuma animação contínua; trilho `running` estático | emular preferência |
| V-11 | `running` com 8 abas: 60 fps na rolagem do terminal e na animação do trilho; CPU ociosa baixa (sem animação fora do estado `running`) | profiling (Performance do WebView) |
| V-12 | Alvos interativos ≥24×24 px; "+" 32×32 | inspeção |
| V-13 | Estados vazio, carregando, desconectado, encerrado e falhou do terminal existem e seguem §4.4 | roteiro manual |
| V-14 | Nenhum elemento decorativo sem função (glow, gradiente de fundo, blur); sombra apenas em overlays | revisão visual |
| V-15 | Fontes carregam sem rede; sem flash de fonte do sistema (FOUT) perceptível na abertura | teste offline |
| V-16 | Identidade própria: nenhum ícone, composição ou paleta copiados de Maestri/Omarchy; glifos de agente são os originais da §4.6 | revisão |

---

## 7. Decisões abertas (para Maestro/usuário)

1. **Direção:** aprovar A (recomendada), B ou híbrido. *(bloqueia a v1.0 desta spec)*
2. Fechar uma aba com agente `running`: encerrar, ocultar ou perguntar? (impacto no texto do diálogo de §4.1)
3. Pode haver mais de um Maestro por workspace? (afeta o campo "Tipo" em §4.3)
4. Role é obrigatória? Quem edita roles (editor próprio fora do modal)?
5. Notificações de desktop em `blocked`/`failed`? Som?
6. Reordenar abas e limite máximo de abas visíveis.
7. Lista de modelos por CLI: estática, ou lida do próprio CLI? (afeta loading/erro do campo Modelo)
8. Confirmar fontes (IBM Plex Sans / JetBrains Mono) e biblioteca de ícones (Lucide) quanto a licença e empacotamento.

## 8. Princípios aplicados (resumo)

| Princípio | Onde aparece |
|---|---|
| Rams nº 2 *útil* | Foco em estado e alternância de agentes; sem dashboards |
| Rams nº 4 *compreensível* | Vocabulário único de estado (forma+cor+texto) em todos os pontos |
| Rams nº 6 *honesto* | Sem profundidade ou brilho decorativos; terminal real, sem moldura falsa |
| Rams nº 8 *minucioso* | Estados completos, tabelas de contraste, vazios e erros especificados |
| Rams nº 10 *o mínimo possível* | Plano, uma cor de acento, uma assinatura (trilho) |
| Kuznetsov — luz/profundidade/coreografia como material | Luz e movimento reservados a significado: trilho `running`, pulsação única em `blocked`, elevação em overlays; identidade por forma e composição, não por efeito |

---

## 9. Correção de escala e responsividade

- **Tickets:** ORKEST-006-DESIGN-CORRECTION + refino ORKEST-006 · **Data:** 2026-11-03 · **Revisão 2** (substitui o rascunho anterior desta seção, que reduzia controles para 28 px com base numa causa não verificada).
- **Status:** **PROPOSTA DE REFINO — aguarda confirmação do Maestro/usuário e validação por captura.** Onde houver conflito, esta seção **substitui** §3.6 (altura da barra de abas) e as dimensões do modal em §4.3. Direção A "Partitura" **não muda**; só densidade e proporção.
- **Metas dimensionais** (definidas pelo usuário, sujeitas a validação visual): barra de abas 38–44 px · campos 34–38 px · tiles de ícone 36–40 px · modal 560–640 px de largura e no máximo 85% da área útil · UI 12–14 px · terminal legível, com fonte ajustável de forma independente. **Proibido** usar CSS `zoom` ou `transform: scale()` para compensar.

### 9.0 Revisão visual das capturas reais

Capturas examinadas (todas em `/tmp/opencode/`): `orkest-m1.png`, `orkest-tab.png` (941×508), `orkest-final.png`, `orkest-full.png`, `orkest-clean.png`, `m2-modal.png` (1920×1080). `orkest-dbg.png` e `orkest-now.png` estão ilegíveis/inúteis.

| # | Achado | Evidência | Gravidade |
|---|---|---|---|
| F1 | **O app roda com `devicePixelRatio = 2` num monitor 1×.** O overlay de depuração em `orkest-final.png` mostra `iw=960 ih=540 dpr=2` numa janela de 1920×1080. Em 941×508 o viewport CSS é **≈ 470×254**. | `orkest-final.png`; barra de abas medida ≈ 88 px físicos = 44 CSS × 2; barra de contexto ≈ 47 px = 24 × 2; a barra de contexto informa **54×8** (colunas×linhas) | **Bloqueador** — explica "tudo grande", modal cortado e terminal minúsculo. As dimensões CSS **estavam corretas**; a escala é que estava dobrada |
| F2 | **A barra de status do tmux aparece dentro do terminal** (nome da sessão `orkest-<uuid>` realçado em azul, `1:rrattes`, "Enterprise"). Cores alheias à paleta, UUID visível, consome 1 das poucas linhas. | `orkest-m1.png`, `orkest-tab.png`, `orkest-full.png` | Alta |
| F3 | **Não existe nenhuma captura do modal de criação.** `m2-modal.png` e `orkest-clean.png` (mesmo tamanho em bytes) mostram o estado vazio. **O modal não foi revisado visualmente por mim.** | arquivos listados | Lacuna de evidência |
| F4 | Overlay de depuração `iw/ih/dpr` presente em `orkest-final.png`. | `orkest-final.png` | Remover antes de qualquer release |
| F5 | Estado vazio: botão primário sem ícone "+" e sem a dica `Ctrl+Shift+N` previstos no preview aprovado. Proporção, cor e hierarquia estão corretas. | `orkest-clean.png` | Baixa |
| F6 | Botão "+" fixo no extremo direito, longe da última aba; o preview aprovado o mostra junto à última aba. | `orkest-tab.png` | Baixa (ver §9.2) |
| ✔ | Conformes: aba ativa fundida ao terminal com linha de topo ciano de 2 px; glifo de estado `idle` e `×` na aba ativa; cursor de bloco `accent`; barra de contexto em mono com `workspace · agente · estado · cols×rows`. | `orkest-m1.png` | — |

**Consequência para esta seção:** a escala dos controles do modal não pode ser julgada enquanto F1 existir. As metas abaixo valem para **DPR 1 (viewport CSS = tamanho da janela)**.

### 9.1 Dimensões (tokens exatos, DPR 1)

| Token | Valor | Uso | Meta do usuário |
|---|---|---|---|
| `--ork-tabbar-h` | **40px** (substitui 44) | barra de abas: tile 24 + nome 13/16 + meta 11/14, padding vertical 5px | 38–44 ✔ |
| `--ork-ctxbar-h` | 24px (inalterado) | barra de contexto | — |
| `--ork-ctl-h` | **36px** | input, select, controle segmentado, cartão de CLI e botão ao lado de um campo (ex.: "Procurar") | 34–38 ✔ |
| `--ork-btn-h` | 32px | botões de rodapé do modal e CTA do estado vazio | — |
| `--ork-ctl-px` | 12px | padding horizontal de input/select/cartão; botões 12–16px | — |
| `--ork-field-gap` | 12px | entre linhas de campos | — |
| `--ork-field-gap-tight` | 8px | entre controle e hint / prévia | — |
| `--ork-section-gap` | 16px | entre seções | — |
| `--ork-label-w` | 80px | coluna de rótulos; gap rótulo→controle 12px | — |
| `--ork-tile-sm` | 24px | tile do agente em abas, listas e prévia (glifo 16px) | — |
| `--ork-icon-tile` | **36px** | tile do seletor de ícone (glifo 18px) | 36–40 ✔ |
| `--ork-icon-gap` | 4px | gap da grade de ícones | — |
| `--ork-swatch` | 20px | amostra de cor (gap 8px) | — |

**Tipografia da UI (12–14 px):** corpo e valores de controle 13/16 · rótulos 12/16 peso 500 `text-secondary` · hint/erro 12/16 · cabeçalho de seção 12/16 peso 600 `text-secondary` · **título do modal 14/20 peso 600** · botões 13/16 peso 500 · meta mono 11/14 (§3.4, inalterado). **Exceção deliberada:** título do estado vazio 16/24 peso 600 (não é cromo de ferramenta). Se a revisão visual achar a hierarquia do modal fraca com título 14, o título pode subir para 16/20 — decisão por captura.

**Prioridade da área útil do terminal:** cromo fixo total = 40 + 24 = **64 px** de altura; sem sidebar. Em janela 941×508 (DPR 1) sobram ≈ 444 px para o terminal; com padding de 8 px e fonte 13/16,25 isso dá **≈ 26 linhas × ≈ 115 colunas** (estimativa; confirmar pelo `cols×rows` da barra de contexto).

### 9.2 Modal de criação, abas e "+"

| Item | Especificação exata |
|---|---|
| Largura | `--ork-modal-w: min(560px, 92vw)` (intervalo permitido 560–640 px; padrão 560) |
| Altura máxima | `--ork-modal-max-h: min(85vh, calc(100dvh - 24px))`; fallback `85vh` se `dvh` não for suportado |
| Estrutura | coluna flex: **cabeçalho** `flex: none` · **corpo** `flex: 1 1 auto; min-height: 0; overflow-y: auto` · **rodapé** `flex: none` |
| Cabeçalho | padding 12px 16px; título 14/20; subtítulo 12/16 opcional; botão fechar 28×28; hairline inferior; **sempre visível** |
| Corpo | padding 12px 16px 16px; `overscroll-behavior: contain`; `scrollbar-gutter: stable`; rola só aqui |
| Rodapé | padding 12px 16px; botões 32px à direita, gap 8px; hairline superior; **sempre visível**; ações (Cancelar / Criar agente) nunca rolam |
| Foco | campo focado rola para a vista (`scroll-margin: 16px`); anel de foco (2 px + offset 2 px) com folga ≥ 4 px, sem corte pelo `overflow` |
| Cartão de CLI | 36px de altura, grade 2×2 com gap 8px; desabilitado ("não instalado") com duas linhas empilhadas (nome 13/14 + tag mono 11/14), sem quebra do nome |
| Prévia da Role | 2 linhas mono 11/16, padding 8px 12px |
| "+" | 32×32; **junto à última aba** enquanto houver espaço; ao haver rolagem de abas, fixo à direita da região rolável (fecha F6) |

**Orçamento de altura (estimativa por soma, DPR 1):**

| Bloco | Cálculo | px |
|---|---|---|
| Cabeçalho (com subtítulo) | 12 + 20 + 2 + 16 + 12 + 1 | 63 |
| Rodapé | 12 + 32 + 12 + 1 | 57 |
| Execução | título 16+8 · CLI 36×2+8 · 12 · modelo 36 · 12 · workspace 36 | 200 |
| Identidade | título 24 · nome 36 · 12 · ícone (36×2+4 = 76, +8, amostras 20 = 104) · 12 · tipo 36 | 224 |
| Role | título 24 · select 36 · 8 · prévia 48 | 116 |
| Paddings e gaps do corpo | 12 + 16 + 16 + 16 | 60 |
| **Total** | 63 + 57 + 200 + 224 + 116 + 60 | **720** |

- Em 941×508: 85% = **432 px** → o corpo mostra ≈ 312 px e rola ≈ 288 px. **Isso é esperado**: o modal só cabe inteiro com viewport ≥ ≈ 850 px de altura. Garantia exigida: cabeçalho e rodapé sempre visíveis e **todo campo alcançável** por rolagem e Tab.

**Regras responsivas:**

| Condição (viewport CSS) | Regra |
|---|---|
| largura < 560 px | rótulo **acima** do controle (gap 4px, `--ork-label-w` = 0); a grade de ícones continua em 8 colunas |
| altura ≤ 600 px | modo compacto: `--ork-ctl-h` = 34px (limite inferior da meta); ocultar subtítulo (−18) e hints (erros continuam); `--ork-section-gap` 12px; prévia da Role recolhida atrás de "Mostrar prévia" (−56) |
| altura < 400 px | mesma regra; o corpo rola; nenhuma outra |

**Janela:** ORKEST-008 definiu mínimo **720×480** e padrão 1280×800 — compatível com esta spec (substitui o mínimo de 960×600 da §3.6). Como o Hyprland pode impor tamanhos por tiling (941×508 foi imposto, não vem do app), a UI deve ser correta de **720×480 até 1920×1080**.

### 9.3 Seletor de ícones

| Item | Especificação |
|---|---|
| Grade | `grid-template-columns: repeat(8, 36px)`; gap 4px; 16 glifos → **2 linhas**; largura 316 px, altura 76 px (cabe nos 436 px úteis do modal de 560) |
| Tile | 36×36, raio `r-md`, glifo 18px; selecionado: borda 1,5px `accent` + `accent-subtle`; hover `bg-hover`; foco `focus-ring` |
| Variação permitida | tile 40px (limite da meta) só se a revisão visual pedir mais presença; grade de 8 colunas = 348 px, ainda cabe |
| Amostras de cor | 8 círculos de 20px, gap 8px, 8px abaixo da grade; selecionada com anel 2px `text-primary` offset 2px; prévia do tile do agente (24px) alinhada à direita |
| Teclado | `radiogroup`; setas movem a seleção na linha e entre linhas; `Home`/`End` |

### 9.4 Terminal e área útil

| Item | Especificação |
|---|---|
| **tmux dentro do terminal (F2)** | O terminal não deve exibir a barra de status do tmux. Sessões gerenciadas pelo Orkest devem ocultá-la **por sessão** (opção de status desligada nessa sessão), sem editar o `~/.tmux.conf` do usuário. O estado/nome já vivem na barra de abas e na barra de contexto. Se o status for mantido, ele precisa seguir os tokens (fundo `bg-chrome`, texto `text-tertiary`, sem realce azul) e nunca mostrar o UUID |
| Fonte do terminal | Controle **independente** da UI: `--ork-fs-terminal` 13 px padrão, faixa 10–20 px, passo 1 px; atalhos propostos `Ctrl+Shift+=`, `Ctrl+Shift+-`, `Ctrl+Shift+0` (só captura com `Ctrl+Shift`, preservando `Ctrl+=`/`Ctrl+-` para os CLIs); valor persistido na configuração do app; ao mudar, refazer o `fit` e enviar `cols×rows` à PTY |
| Legibilidade | corpo 13 px com altura de linha 1,25; contraste conforme §4.4 |
| Ordem de prioridade | terminal > aba ativa > estado dos demais agentes > restante (§2, Direção A) |

### 9.5 Nota HiDPI / `devicePixelRatio` / zoom

Princípio: **o layout é definido em px CSS e deve se comportar igual em qualquer DPR**; o que muda é a densidade física. O defeito observado (F1) é **DPR 2 num monitor 1×**, não valores CSS errados.

1. **Causa observada vs. causa provável.** Observado: `dpr=2` no overlay. Provável (diagnóstico do ORKEST-008, ainda sem confirmação visual): `GDK_SCALE=2` herdado no ambiente da sessão combinado com `GDK_BACKEND=x11`. O Builder confirma medindo `devicePixelRatio == 1` no app Tauri após o ajuste.
2. **Sem atalhos proibidos.** Nada de CSS `zoom`, `transform: scale()`, multiplicação de tamanhos por `devicePixelRatio` em JS, nem mudança de variáveis de ambiente/config global do sistema ou do Hyprland. O ajuste de escala fica **dentro do processo do app** (como no ORKEST-008).
3. **Se o DPR correto for ≠ 1** (monitor HiDPI real): nenhuma dimensão da spec muda; bordas continuam `1px`, ícones são SVG em px, alvo mínimo 24×24 px CSS. O xterm refaz o `fit` quando muda o DPR (ex.: mover a janela entre monitores) ou o zoom.
4. **Viewport efetivo.** Com zoom de WebView o viewport em px CSS encolhe; a geometria da §9.2 (`min(…vh)`, `vw`, rolagem interna) deve valer até ≈ 640×360 px CSS.
5. **Zoom do aplicativo** (opcional, ação do usuário, **não** correção de defeito): faixa 80–150%, passo 10%, persistido no app; se a API de zoom do WebView não estiver disponível no Tauri 2, omitir. Não usar como remendo para DPR errado.
6. **Diagnóstico permanente.** A captura de revisão informa `devicePixelRatio`, `innerWidth × innerHeight` e o tamanho da janela. O overlay de depuração (F4) só existe em build de desenvolvimento.

### 9.6 Critérios de aceite adicionais (continuam V-01…V-16; substituem a lista anterior V-17…V-26)

| ID | Critério | Como verificar |
|---|---|---|
| V-17 | No app Tauri em monitor 1×, `devicePixelRatio === 1` e `innerWidth × innerHeight` = tamanho da janela (ex.: 941×508 → 941×508) | log/overlay de dev + captura |
| V-18 | Barra de abas 40 px; barra de contexto 24 px; terminal ocupa o restante; em 941×508 ≥ 24 linhas e ≥ 110 colunas | DevTools + `cols×rows` |
| V-19 | Input, select, segmentado e cartão de CLI = 36 px (34 px em modo compacto); botões de rodapé = 32 px; nenhum controle do modal > 40 px | `getBoundingClientRect` |
| V-20 | Modal ≤ min(560 px, 92 vw) e ≤ 85% da altura em 941×508, 1280×720 e 1920×1080; **cabeçalho e rodapé totalmente visíveis** nos três tamanhos | captura real do app nos três tamanhos |
| V-21 | Corpo do modal rola (`scrollHeight > clientHeight` em 941×508); Cancelar e Criar agente sempre visíveis; todo campo alcançável por Tab e rolagem; anel de foco não cortado | roteiro manual + captura |
| V-22 | Seletor de ícones: 8 colunas de 36 px (até 40), 2 linhas, nenhum tile fora de 36–40 px | inspeção |
| V-23 | Tipografia de UI entre 12 e 14 px (exceção: título do estado vazio 16 px); terminal 13 px por padrão, ajustável 10–20 px sem afetar a UI | inspeção |
| V-24 | O terminal não exibe barra de status do tmux nem UUID de sessão | captura do terminal |
| V-25 | Terminal real: foco (linha `accent` no topo do painel, cursor de bloco ↔ vazado), redimensionamento da janela atualiza `cols×rows` e a PTY, teclado funciona (Tab, Ctrl+C, setas) | roteiro manual + captura |
| V-26 | Nenhum uso de CSS `zoom`, `transform: scale()` ou escala por DPR em JS; nenhuma mudança de env/config global | revisão de código |
| V-27 | Sem overlay de depuração no build de revisão; estado vazio com ícone "+" e dica `Ctrl+Shift+N` no CTA | captura |
| V-28 | Altura medida do modal com tudo visível fica dentro de ±8 px do orçamento (720 px); divergência maior é investigada | medição |
