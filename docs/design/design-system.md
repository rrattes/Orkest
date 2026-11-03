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

- **Ticket:** ORKEST-006-DESIGN-CORRECTION · **Data:** 2026-11-03
- **Status:** **PROPOSTA DE CORREÇÃO — aguarda confirmação do Maestro.** Onde houver conflito, esta seção **substitui** as dimensões do modal em §4.3 (560 px, `max-height` 80 vh, padding 24, botões 32, título 18/24, tiles 32). Tokens de cor, tipografia base, estados e demais componentes **não mudam**.
- **Motivo:** a captura real em janela **941×508** mostrou o modal desproporcional (controles grandes, conteúdo cortado).
- **Limites de evidência:** não examinei a captura; a correção parte dos números informados e da aritmética da spec. A **causa raiz não foi verificada**: pode ser só a escala dos controles (a §4.3 usava 40 px nos cartões de CLI e 24 px de padding) ou também DPR/zoom do WebKitGTK. Por isso a §9.4 pede diagnóstico antes de qualquer ajuste global. Os totais de altura abaixo são **soma de valores da spec (estimativa)**, não medição; ver V-26.

### 9.1 Controles compactos (tokens exatos)

| Token | Valor | Uso |
|---|---|---|
| `--ork-ctl-h` | **28px** | altura de input, select, controle segmentado e botões **dentro de modais/formulários** |
| `--ork-ctl-h-lg` | 32px | somente o botão primário do estado vazio (§4.2); **não usar no modal** |
| `--ork-ctl-px` | 8px | padding horizontal interno de input/select; botões usam 12px |
| `--ork-field-gap` | 12px | espaço vertical entre linhas de campos |
| `--ork-field-gap-tight` | 8px | entre controle e seu hint, entre prévia e controle |
| `--ork-section-gap` | 16px | entre seções (Execução / Identidade / Role) |
| `--ork-label-w` | 72px | coluna de rótulos; gap rótulo→controle 12px |
| `--ork-tile-sm` | 24px | tile do agente em abas, prévia no modal e listas (glifo 16px) |
| `--ork-icon-tile` | 28px | tile do seletor de ícone (glifo 16px) |
| `--ork-icon-gap` | 4px | gap da grade de ícones |
| `--ork-swatch` | 16px | amostra de cor de identidade (gap 8px) |

**Tipografia dentro do modal** (a escala global §3.4 permanece; estes são papéis adicionais):

| Papel | Tamanho/linha | Peso | Uso |
|---|---|---|---|
| `--ork-fs-title-modal` | 16 / 20 | 600 | título do modal (antes 18/24) |
| `--ork-fs-heading-compact` | 13 / 16 | 600 | cabeçalho de seção (antes 14/20); sem caixa alta |
| rótulo de campo | 12 / 16 | 500, `text-secondary` | coluna de rótulos |
| texto de controle | 13 / 16 | 400 | valor em input/select; botões 13/16 peso 500 |
| hint / erro | 12 / 16 | 400 | `--ork-fs-caption` |

**Dimensões por controle:**

| Controle | Altura | Observação |
|---|---|---|
| Input / select / campo mono | 28 | borda 1px `border-control`, raio `r-md`, padding 0 8px, ícone de chevron 16px |
| Botão (primário/secundário/destrutivo) | 28 | padding 0 12px; botão "Procurar" ao lado do campo de workspace também 28 |
| Controle segmentado (Tipo) | 28 total | borda 1 + padding 2 + segmentos de 22px |
| Cartão de CLI (grade 2×2) | **32** (antes 40) | padding 0 8px, glifo 16px, gap interno 8px, gap da grade 8px; selecionado: borda 1,5px `accent` + `accent-subtle` |
| Cartão de CLI desabilitado ("não instalado") | 32 | duas linhas **empilhadas**: nome 13/14 e tag mono 11/14, padding vertical 2px; nunca quebrar o nome |
| Prévia da Role | auto, **2 linhas** | mono 11/16, padding 8px 12px, fundo `bg-canvas` |

### 9.2 Modal: geometria, rolagem e cabeçalho/rodapé fixos

| Item | Especificação exata |
|---|---|
| Largura | `--ork-modal-w: min(480px, 92vw)` |
| Altura máxima | `--ork-modal-max-h: min(90vh, calc(100dvh - 24px))`; usar `90vh` como fallback se `dvh` não for suportado |
| Altura mínima | nenhuma (cresce com o conteúdo até o máximo) |
| Estrutura | coluna flex: **cabeçalho** (`flex: none`) · **corpo** (`flex: 1 1 auto; min-height: 0; overflow-y: auto`) · **rodapé** (`flex: none`) |
| Cabeçalho | padding 12px 16px; título 16/20; subtítulo 12/16 (opcional); botão fechar 24×24; hairline inferior `border-subtle`; **sempre visível** |
| Corpo | padding 12px 16px 16px; `overscroll-behavior: contain`; `scrollbar-gutter: stable`; rolagem só aqui, nunca na página/janela |
| Rodapé | padding 12px 16px; botões 28px alinhados à direita, gap 8px; hairline superior `border-subtle`; **sempre visível**, nunca rola |
| Raio / sombra | `r-xl` (8px), `--ork-shadow-modal` (inalterado) |
| Foco em rolagem | campo focado é rolado para a vista (`scroll-margin: 16px`); o anel de foco (2px + offset 2px = 4px) tem folga ≥ 4px dentro do corpo, sem corte pelo `overflow` |
| Scrim / fechar | inalterados (§4.3): clique no scrim não fecha |

**Orçamento de altura (estimativa por soma; viewport alvo 941×508):**

| Bloco | Cálculo | px |
|---|---|---|
| Cabeçalho (com subtítulo) | 12 + 20 + 2 + 16 + 12 + 1 | 63 |
| Rodapé | 12 + 28 + 12 + 1 | 53 |
| Corpo: Execução | título 16+8 · CLI 32×2+8 · 12 · modelo 28 · 12 · workspace 28 | 176 |
| Corpo: Identidade | título 24 · nome 28 · 12 · ícone (28×2+4=60, +8, amostras 16 = 84) · 12 · tipo 28 | 188 |
| Corpo: Role | título 24 · select 28 · 8 · prévia 48 | 108 |
| Corpo: paddings e gaps | 12 + 16 (topo/base) + 16 + 16 (entre seções) | 60 |
| **Total (estimado)** | 63 + 53 + 176 + 188 + 108 + 60 | **648** |

- Altura disponível a 90vh em 508 px ≈ **457 px** → o corpo mostra ≈ 341 px e **rola ≈ 190 px**. Isso é o comportamento esperado: o modal só cabe sem rolagem com viewport ≥ ≈ 720 px de altura. Garantia exigida: **nada cortado sem alcance** (tudo acessível por rolagem e por Tab), com cabeçalho e rodapé sempre à vista.

**Regras responsivas:**

| Condição de viewport | Regra |
|---|---|
| largura < 520 px | rótulo **acima** do controle (coluna única, gap 4px); `--ork-label-w` = 0; grade de ícones continua 8 colunas (252 px cabem) |
| altura ≤ 600 px | modo compacto: ocultar subtítulo do cabeçalho (−18); ocultar hints de ajuda (erros continuam visíveis); `--ork-section-gap` 12px; prévia da Role recolhida atrás de "Mostrar prévia" (−56) |
| altura < 360 px (efetiva) | mesmo comportamento; o corpo rola; não adicionar outra regra |

**Janela mínima.** §3.6 definia 960×600, mas a captura (941×508) mostra que esse mínimo **não está sendo imposto**. Proposta (para o Maestro aprovar): impor no Tauri **mínimo 720×480** e manter o modal funcional também abaixo disso pela rolagem do corpo. As abas continuam em 168–240 px com rolagem horizontal (§4.1).

### 9.3 Seletor de ícones (grade compacta)

| Item | Especificação |
|---|---|
| Grade | `grid-template-columns: repeat(8, 28px)`; gap `4px`; 16 glifos → **2 linhas**; largura 252 px, altura 60 px |
| Tile | 28×28, raio `r-md`, glifo 16px; selecionado: borda 1,5px `accent` + `accent-subtle`; hover `bg-hover`; foco `focus-ring` |
| Alternativa permitida | 10 colunas × 24px (gap 4px = 276 px), glifo 14–16px — só se o Builder precisar de menos altura; **nenhum tile acima de 28px** |
| Amostras de cor | 8 círculos de 16px, gap 8px, 8px abaixo da grade; selecionada: anel 2px `text-primary` offset 2px; prévia do tile do agente (24px) alinhada à direita |
| Teclado | grupo `radiogroup`; setas movem a seleção dentro da linha e entre linhas; `Home`/`End` |

### 9.4 Nota HiDPI / `devicePixelRatio` / zoom do WebKitGTK

Princípio: **o layout é definido em pixels CSS e deve se comportar igual em qualquer DPR**; a densidade física muda, as proporções não. Não alterar configuração global do sistema.

1. **Unidade.** Todas as dimensões desta spec são **px CSS**. Não usar a propriedade CSS `zoom`, não multiplicar tamanhos por `devicePixelRatio` em JS e não mudar variáveis de ambiente globais (`GDK_SCALE`, `GDK_DPI_SCALE`, ajustes do compositor) para "consertar" a escala.
2. **Hairlines e ícones.** Bordas continuam `1px` (renderizam com DPR device pixels, ficando nítidas); ícones são SVG vetoriais em px (sem rasters). Alvo mínimo permanece 24×24 px CSS (V-12).
3. **Viewport efetivo.** Com zoom do WebView, o viewport em px CSS encolhe (ex.: 941×508 a 150% ≈ 627×339 px CSS). Por isso a geometria da §9.2 usa `min(…vh)`/`vw` e rolagem interna: **deve valer até ≈ 640×360 px CSS**.
4. **Terminal (xterm).** Reexecutar o `fit` e reportar `cols×rows` à PTY quando mudar o DPR (por exemplo ao mover a janela entre monitores) ou o zoom, além do redimensionamento (§4.4). Fonte do terminal permanece em px (13 px padrão).
5. **Zoom do usuário.** Se necessário, oferecer **zoom do aplicativo** (não do sistema): `Ctrl+=`, `Ctrl+-`, `Ctrl+0`, faixa 80–150%, passo 10%, persistido na configuração do app, aplicado pela API de zoom do WebView (*o Builder verifica se a API do Tauri 2 expõe isso*). Atalhos só valem fora do terminal com foco, como em §4.1.
6. **Diagnóstico antes de ajustar.** O Builder registra, na captura de revisão, `window.devicePixelRatio`, `innerWidth × innerHeight` e o fator de escala do compositor. *Como o comportamento do WebKitGTK sob escala fracionária no Wayland não foi verificado aqui, não se deve assumir escala inteira.* Se, mesmo com a §9.1–9.3 aplicada, os controles continuarem grandes em DPR 1, o problema é de implementação (valores não aplicados), não de DPR.

### 9.5 Critérios de aceite adicionais (continuam V-01…V-16)

| ID | Critério | Como verificar |
|---|---|---|
| V-17 | Input, select, segmentado e botões do modal medem **28 px** de altura; cartões de CLI **32 px**; nenhum controle do modal ≥ 36 px | DevTools (`getBoundingClientRect`) |
| V-18 | Largura do modal ≤ 480 px e ≤ 92 vw em 941×508 e em 640×400 | inspeção |
| V-19 | Em 941×508 e 640×360 (px CSS) cabeçalho e rodapé estão **totalmente visíveis**; o corpo rola (`scrollHeight > clientHeight`) sem rolagem da janela | captura + inspeção |
| V-20 | Todos os campos são alcançáveis por rolagem e por Tab; campo focado é rolado para a vista e o anel de foco não é cortado | roteiro manual |
| V-21 | Seletor de ícones: 8 colunas de 28 px (ou 10×24), nenhum tile > 28 px, 16 glifos em 2 linhas | inspeção |
| V-22 | Sem barra de rolagem horizontal no modal em 640 px de largura; abaixo de 520 px o rótulo fica acima do controle | inspeção |
| V-23 | Em DPR 1, 1,25, 1,5 e 2, e zoom 100/125/150%: nada de cabeçalho/rodapé cortado, bordas de 1px nítidas, xterm refaz o `fit` e `cols×rows` batem com a PTY | roteiro manual |
| V-24 | Nenhum uso de CSS `zoom`, escala por `devicePixelRatio` em JS ou mudança de variável de ambiente global para ajustar escala | revisão de código |
| V-25 | A captura de revisão informa `devicePixelRatio`, `innerWidth × innerHeight` e o tamanho real da janela | anexo da revisão |
| V-26 | Altura medida do modal fica dentro de ±8 px do orçamento da §9.2 (648 px com tudo visível); divergência maior é investigada | medição |
