# PensLE — Aplicativo React + Capacitor (Android) para Captura de Pensamentos

## VISÃO GERAL DO PROJETO

Construa um aplicativo Android usando React + Capacitor chamado "PensLE".
O propósito central é: o usuário grava um áudio, a IA transcreve, organiza em
Markdown, extrai tags semânticas, e conecta automaticamente esse novo pensamento
com notas anteriores — formando uma rede de conhecimento pessoal, inspirada no
Obsidian, com interface radicalmente simples.

---

## STACK TECNOLÓGICA

- **Frontend**: React 18 + TypeScript
- **Mobile**: Capacitor 5 (build Android)
- **Banco de dados local**: SQLite via `@capacitor-community/sqlite`
  (armazenar metadados, tags, relações entre notas)
- **Arquivos Markdown**: salvos no sistema de arquivos local via
  `@capacitor/filesystem` (diretório privado do app)
- **Gravação de áudio**: `@capacitor-community/audio-recorder` ou
  MediaRecorder API com wrapper Capacitor
- **Transcrição de áudio (FREE)**: API Groq — modelo `whisper-large-v3`
  (gratuito com tier generoso, melhor custo-benefício de transcrição disponível)
- **LLM para análise e conexões (FREE)**: API Groq — modelo `llama-3.1-8b-instant`
  ou `llama-3.3-70b-versatile` (gratuito, alta performance)
- **Grafo de conexões**: `react-force-graph-2d` (visualização tipo Obsidian)
- **Renderização Markdown**: `react-markdown` + `remark-gfm`
- **UI**: Tailwind CSS (mobile-first, dark theme por padrão)
- **Ícones**: Lucide React
- **Roteamento**: React Router v6

---

## ARQUITETURA GERAL

```
src/
├── components/
│   ├── recorder/        # Tela principal: botão de gravação
│   ├── vault/           # Listagem e gerenciamento de notas
│   ├── note/            # Visualizador/editor de nota individual
│   ├── graph/           # Grafo de conexões entre notas
│   └── settings/        # Configurações (API key Groq, preferências)
├── services/
│   ├── audioService.ts  # Gravação e gerenciamento de áudio
│   ├── transcriptionService.ts  # Whisper via Groq API
│   ├── aiService.ts     # LLM para análise, tags e conexões
│   ├── markdownService.ts       # Geração e parsing de arquivos .md
│   ├── storageService.ts        # SQLite + Filesystem
│   └── graphService.ts  # Construção do grafo de relações
├── hooks/
│   ├── useRecorder.ts
│   ├── useVault.ts
│   └── useGraph.ts
├── types/
│   └── index.ts         # Interfaces: Note, Tag, Connection, etc.
└── pages/
    ├── RecorderPage.tsx  # Tela principal
    ├── VaultPage.tsx
    ├── NotePage.tsx
    ├── GraphPage.tsx
    └── SettingsPage.tsx
```

---

## TELA PRINCIPAL — RecorderPage (INTERFACE MÍNIMA)

Esta tela deve ser a mais simples possível. Objetivo: máxima clareza, zero
distrações. O usuário abre o app e já pode gravar.

### Layout:
- Fundo escuro (ex: `#0A0A0A`)
- Centro da tela: um único botão circular grande de gravação
  - Estado idle: ícone de microfone, cor neutra (ex: cinza escuro com borda sutil)
  - Estado gravando: animação de pulso/onda sonora ao redor, cor vermelha suave,
    ícone muda para "parar"
  - Transições suaves com CSS animations
- Abaixo do botão: timer discreto mostrando duração da gravação (aparece só
  durante a gravação)
- Após parar: exibir um card sutil de "Processando..." com loading indicator
  enquanto a IA trabalha (transcrição → análise → salvamento)
- Após processar: exibir brevemente um toast/snackbar com o título gerado pela
  IA e as tags identificadas. Toque nesse toast leva à nota criada.
- Canto superior direito: ícone discreto de menu (hamburger ou grid) para
  navegar para Vault, Grafo, Configurações

### Comportamento:
1. Toque no botão → inicia gravação (solicitar permissão de microfone via
   Capacitor na primeira vez)
2. Segundo toque → para a gravação
3. Exibe "Processando..." imediatamente
4. Internamente: envia áudio para pipeline de IA (ver seção Pipeline de IA)
5. Ao finalizar: salva nota, exibe toast, volta ao estado idle

---

## PIPELINE DE IA (CORE DO APLICATIVO)

Este é o coração do app. Deve ser implementado em `aiService.ts` e
`transcriptionService.ts`.

### ETAPA 1 — Transcrição com Whisper (Groq)

```
typescript
// transcriptionService.ts
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.m4a');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'pt'); // detectar automaticamente ou usar preferência
  formData.append('response_format', 'text');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: formData,
  });

  return await response.text(); // transcrição pura
}
```

### ETAPA 2 — Análise Semântica com LLM (Groq)

Após a transcrição, enviar o texto + contexto do vault atual para o LLM com o
seguinte system prompt cuidadosamente construído:

```
SYSTEM PROMPT (usar exatamente este):

Você é um sistema especializado em organização de conhecimento pessoal.
Sua função é analisar uma transcrição de áudio e realizar TRÊS tarefas com
precisão máxima:

1. ESTRUTURAR a nota em Markdown bem formatado
2. EXTRAIR tags semânticas reais (não inventadas)
3. IDENTIFICAR conexões genuínas com notas existentes

REGRAS CRÍTICAS PARA CONEXÕES:
- Conecte APENAS se houver relação semântica real e clara
- Prefira NÃO conectar a conectar de forma forçada
- Uma conexão válida requer: mesmo tema, pessoa, projeto, conceito, ou
  causalidade direta entre as ideias
- Similaridade superficial de palavras NÃO é conexão suficiente
- Para cada conexão proposta, justifique brevemente o motivo

FORMATO DE RESPOSTA (JSON estrito, sem texto fora do JSON):
{
  "title": "Título conciso que captura a essência (máx 60 chars)",
  "summary": "Resumo de 1-2 frases do pensamento principal",
  "body": "Conteúdo completo em Markdown, bem estruturado, com headers se necessário",
  "tags": ["tag1", "tag2", "tag3"],
  "connections": [
    {
      "noteId": "id_da_nota",
      "noteTitle": "Título da nota relacionada",
      "reason": "Motivo específico da conexão",
      "strength": "strong|moderate|weak"
    }
  ],
  "wikilinks": ["[[Título de nota relacionada]]"]
}

SOBRE AS TAGS:
- Use apenas tags que realmente aparecem no conteúdo
- Formato: minúsculas, sem espaços, use-hífen-para-espaços
- Entre 2 e 6 tags por nota
- Pense em: tópico principal, subtópico, tipo de conteúdo (ideia, tarefa,
  reflexão, projeto, pessoa, lugar, etc.)

SOBRE O MARKDOWN:
- Use headers (##, ###) para estruturar se o conteúdo tiver múltiplas partes
- Use bullet points para listas de ideias
- Use **negrito** para conceitos-chave
- Adicione wikilinks Obsidian-style [[Nome da Nota]] para conceitos que têm
  ou poderiam ter notas próprias
- Inclua o resumo no frontmatter YAML

FORMATO DO ARQUIVO MARKDOWN GERADO:
---
title: "{{title}}"
date: "{{ISO date}}"
tags: [{{tags}}]
summary: "{{summary}}"
---

{{body com wikilinks incluídos}}
```

### ETAPA 3 — Busca de Contexto do Vault (antes de chamar a LLM)

Antes de chamar a LLM, buscar as notas existentes relevantes para incluir como
contexto. Estratégia:

```typescript
async function getVaultContext(transcription: string): Promise<string> {
  // 1. Buscar TODAS as notas existentes do SQLite (título + tags + summary)
  const allNotes = await storageService.getAllNotesSummaries();
  // Retorna: [{ id, title, tags, summary, createdAt }]

  // 2. Limitar a 20 notas mais recentes + busca por palavras-chave simples
  //    (evitar context window enorme)
  const recentNotes = allNotes.slice(0, 20);

  // 3. Formatar para o prompt
  const context = recentNotes.map(note =>
    `ID: ${note.id} | Título: ${note.title} | Tags: ${note.tags.join(', ')} | Resumo: ${note.summary}`
  ).join('\n');

  return context;
}
```

O prompt do usuário (user message) para a LLM deve ser:

```
TRANSCRIÇÃO DO ÁUDIO:
"""
{{transcription}}
"""

NOTAS EXISTENTES NO VAULT (para identificar conexões):
"""
{{vaultContext}}
"""

Analise a transcrição e retorne o JSON conforme instruído.
```

---

## ESTRUTURA DO BANCO DE DADOS (SQLite)

```sql
-- Tabela principal de notas
CREATE TABLE notes (
  id TEXT PRIMARY KEY,          -- UUID v4
  title TEXT NOT NULL,
  summary TEXT,
  file_path TEXT NOT NULL,      -- caminho do .md no filesystem
  audio_path TEXT,              -- caminho do áudio original (opcional manter)
  tags TEXT NOT NULL,           -- JSON array: ["tag1", "tag2"]
  created_at TEXT NOT NULL,     -- ISO 8601
  updated_at TEXT NOT NULL,
  word_count INTEGER
);

-- Tabela de conexões entre notas
CREATE TABLE connections (
  id TEXT PRIMARY KEY,
  source_note_id TEXT NOT NULL,
  target_note_id TEXT NOT NULL,
  reason TEXT,
  strength TEXT CHECK(strength IN ('strong', 'moderate', 'weak')),
  created_at TEXT NOT NULL,
  FOREIGN KEY(source_note_id) REFERENCES notes(id),
  FOREIGN KEY(target_note_id) REFERENCES notes(id)
);

-- Índices para performance
CREATE INDEX idx_notes_tags ON notes(tags);
CREATE INDEX idx_connections_source ON connections(source_note_id);
CREATE INDEX idx_connections_target ON connections(target_note_id);
```

---

## VAULT PAGE — Gerenciamento de Notas

Interface mais elaborada, mas ainda limpa. Deve ter:

### Layout:
- Barra de busca no topo (busca por título, tags, conteúdo)
- Filtro por tags (chips horizontais scrolláveis)
- Lista de notas em cards compactos, ordenadas por data (mais recente primeiro)
  - Card: título, data relativa ("há 2 dias"), tags como chips coloridos, preview
    do summary em 1 linha
- FAB (Floating Action Button) para voltar à gravação
- Swipe left no card: deletar (com confirmação)
- Toque no card: abre a NotePage

### Ordenação/Filtros disponíveis:
- Por data (padrão)
- Por número de conexões (notas mais conectadas primeiro)
- Por tag específica

---

## NOTE PAGE — Visualizador de Nota

### Layout:
- Header com título da nota e data
- Renderização do Markdown com estilos bonitos (tipografia bem cuidada)
- Seção "Conectado com" ao final: lista de notas conectadas com o motivo da
  conexão. Cada item é tocável (navega para a nota)
- Chips de tags clicáveis (filtram o vault)
- Botão de edição manual (editor de texto simples para o .md)
- Botão para ouvir o áudio original (se mantido)
- Botão de compartilhar (exporta o .md)

### Wikilinks:
- Wikilinks `[[Nome da Nota]]` no corpo do Markdown devem ser renderizados como
  links tocáveis que navegam para a nota correspondente

---

## GRAPH PAGE — Visualização de Conexões (Estilo Obsidian)

```typescript
// Usar react-force-graph-2d
import ForceGraph2D from 'react-force-graph-2d';

// Nodes: cada nota é um nó
// Edges: cada conexão da tabela connections é uma aresta
// Tamanho do nó: proporcional ao número de conexões (notas mais conectadas = nós maiores)
// Cor do nó: baseada na tag principal
// Hover no nó: exibe título e summary em tooltip
// Toque/clique no nó: navega para a nota
```

Configurações do grafo:
- Fundo escuro
- Nós: círculos com cor por tag, label com título truncado
- Arestas: linhas com espessura por força da conexão (strong > moderate > weak)
- Física: d3-force com repulsão moderada para espaçamento legível
- Zoom e pan habilitados

---

## SETTINGS PAGE — Configurações

Simples, com as seguintes opções:

1. **API Key do Groq**: campo de texto para inserir a chave (salva no
   `@capacitor/preferences`, nunca no SQLite)
2. **Idioma padrão da transcrição**: seletor (Português, Inglês, Auto-detectar)
3. **Manter áudios originais**: toggle (economiza espaço se desativado)
4. **Modelo LLM**: seletor entre `llama-3.1-8b-instant` (mais rápido/gratuito)
   e `llama-3.3-70b-versatile` (mais inteligente/ainda gratuito)
5. **Exportar Vault**: botão para exportar todos os .md como ZIP
6. **Limpar Vault**: botão destrutivo com confirmação dupla

---

## FLUXO COMPLETO (do áudio à nota conectada)

```
[Usuário toca gravar]
        ↓
[MediaRecorder captura áudio em .m4a ou .webm]
        ↓
[Usuário toca parar]
        ↓
[Exibe "Transcrevendo..."]
        ↓
[transcriptionService: envia áudio → Groq Whisper API → recebe texto]
        ↓
[storageService: busca summaries das últimas 20 notas]
        ↓
[Exibe "Analisando conexões..."]
        ↓
[aiService: envia transcrição + contexto → Groq LLM → recebe JSON]
        ↓
[Valida JSON: título, body markdown, tags, conexões com justificativa]
        ↓
[markdownService: gera arquivo .md com frontmatter YAML]
        ↓
[storageService: salva .md no filesystem]
        ↓
[storageService: insere registro na tabela notes]
        ↓
[storageService: insere conexões na tabela connections]
        ↓
[Exibe toast com título + tags]
        ↓
[Volta ao estado idle na RecorderPage]
```

---

## DESIGN SYSTEM (aplicar consistentemente)

```css
/* Paleta */
--bg-primary: #0A0A0A;
--bg-secondary: #141414;
--bg-card: #1C1C1C;
--accent: #7C6AF7;        /* roxo suave — cor principal de ação */
--accent-record: #E05555; /* vermelho para estado de gravação */
--text-primary: #F0F0F0;
--text-secondary: #888888;
--border: #2A2A2A;

/* Tags — cores por categoria (geradas por hash da tag para consistência) */
/* Usar hsl(hash % 360, 60%, 45%) para cor de fundo dos chips de tag */

/* Tipografia */
--font-display: 'DM Sans', sans-serif;
--font-body: 'JetBrains Mono', monospace; /* para o conteúdo Markdown */

/* Animações */
/* Botão de gravação: keyframe de pulso radial com opacity */
/* Processing state: skeleton shimmer nos cards */
/* Transições de página: slide suave */
```

---

## TRATAMENTO DE ERROS

Implementar tratamento robusto para:
- **Sem conexão com internet**: exibir erro claro, oferecer retry, NÃO perder o áudio gravado
- **API key inválida/expirada**: redirecionar para Settings com mensagem explicativa
- **Rate limit Groq**: exibir mensagem com tempo estimado de espera
- **JSON inválido da LLM**: implementar retry com prompt simplificado; em último
  caso, salvar transcrição pura como nota sem conexões
- **Permissão de microfone negada**: tela educativa explicando como habilitar nas
  configurações do Android
- **Armazenamento cheio**: alertar o usuário antes de tentar salvar

---

## REQUISITOS DE QUALIDADE DA IA

Para garantir conexões coerentes e não alucinadas:

1. **Temperature**: usar `temperature: 0.3` nas chamadas à LLM (mais determinístico)
2. **Validação de conexões**: após receber o JSON, validar se os `noteId` das
   conexões realmente existem no banco — descartar conexões com IDs inválidos
3. **Threshold de força**: só exibir conexões "weak" se houver menos de 2
   conexões mais fortes (evitar poluição no grafo)
4. **Limite de conexões por nota**: máximo 5 conexões por nota nova (priorizar
   as de força "strong" e "moderate")
5. **Deduplicação**: verificar se já existe conexão entre dois nós antes de
   inserir no banco

---

## CAPACITOR — CONFIGURAÇÕES NECESSÁRIAS

```typescript
// capacitor.config.ts
{
  appId: 'com.otgan.pensle',
  appName: 'PensLE',
  android: {
    allowMixedContent: true // necessário para chamadas HTTP à API
  }
}
```

Permissões Android (AndroidManifest.xml):
- `RECORD_AUDIO`
- `INTERNET`
- `READ_EXTERNAL_STORAGE` (se exportar para pasta pública)
- `WRITE_EXTERNAL_STORAGE` (idem)

---

## ENTREGÁVEIS ESPERADOS

1. Projeto React completo com toda a estrutura de arquivos descrita
2. Todos os services implementados com tipagem TypeScript completa
3. Todas as páginas funcionais com o design system aplicado
4. Integração completa com Groq API (Whisper + LLaMA)
5. SQLite configurado e funcional via Capacitor
6. Grafo de conexões funcional com react-force-graph-2d
7. `README.md` com instruções de build e configuração da API key
8. `capacitor.config.ts` configurado corretamente

---

## NOTAS FINAIS PARA O DESENVOLVEDOR

- O aplicativo deve funcionar OFFLINE para gravação e leitura de notas.
  Apenas as etapas de transcrição e análise requerem internet.
- Priorize a experiência de gravação: do toque ao início da gravação, deve
  haver menos de 300ms de delay.
- O vault deve suportar pelo menos 1000 notas sem degradação de performance
  (usar paginação na listagem).
- Toda nota deve ser um arquivo .md válido, portável e legível fora do app.
- O usuário deve poder usar qualquer cliente Obsidian apontando para a pasta
  de notas do app (via adb ou gerenciador de arquivos).


---