# Echoverse - Tool Creation Guidelines

Technical design standards and registration workflow for building utility tools in **Echoverse**.

---

## 1. Tool Definition Standard

All tools are defined as standalone JSON files in `src/tools/[appId].json`. Tools must use pure software metadata schemas without persona/character attributes (`birthday`, `likes`, `character`, `systemPrompt`, `greeting`, `personality`, `habits`, `lore`, `dialogueExamples`, or `initialMessages`).

### Standardized Tool Schema (`src/tools/[appId].json`)

```json
{
  "id": "app_<appId>",
  "name": "<Tool Name>",
  "role": "<Short Tagline>",
  "category": "Tools",
  "description": "<Detailed description>",
  "isApp": true,
  "appId": "<appId>",
  "isOnDevice": true,
  "avatar": "<SVG Data URI>",
  "theme": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6"
  },
  "howToUse": "1. Input data.\n2. Adjust settings.\n3. Export output.",
  "features": "• Feature 1\n• Feature 2"
}
```

---

## 2. Container & Layout Standards

| Element | Specification |
| :--- | :--- |
| **Root Container** | Use `bg-transparent` with backdrop overlay (`bg-slate-50/30 dark:bg-[#0a0a0a]/30`). |
| **Header** | Render `<img src={persona.avatar} onClick={onOpenPersonaInfo} />` and `<div className="min-w-0 cursor-pointer" onClick={onOpenPersonaInfo}>`. |
| **Navigation** | Use `<ArrowLeft />` to open the main sidebar on mobile viewports. |
| **Borders & Radii** | Avoid heavy shadow utility classes. Use `border border-slate-200 dark:border-white/10` and `rounded-lg` / `rounded-xl`. |
| **Sidebar Width** | Set settings sidebar width to `w-full lg:w-[320px] 2xl:w-[360px]`. |

---

## 3. Controls & UI Components

| Control Type | Design Standard |
| :--- | :--- |
| **Primary Action Buttons** | Compact height (`h-7` / `h-9`), `text-[11px]`, `font-bold`, `uppercase`, `tracking-widest`, and click scaling (`active:scale-95`). |
| **Utility Buttons** | Inline icon buttons for actions like clipboard copy, reset form, or downloading output. |
| **Segmented Controls** | Sliding pill controls (`bg-slate-100 dark:bg-white/5` container with sliding `bg-white dark:bg-[#2a2a2a]` pill). |
| **Toggle Switches** | Custom pill toggle switches instead of native browser checkboxes. |

---

## 4. Design Tokens & Color Standards

| UI Token | Class Pairing |
| :--- | :--- |
| **Panel Background** | `bg-white dark:bg-[#1a1a1a]` |
| **Borders** | `border-slate-200 dark:border-white/10` |
| **Primary Text** | `text-slate-800 dark:text-white` |
| **Secondary Text** | `text-slate-500 dark:text-slate-400` |
| **Input Background** | `bg-slate-50 dark:bg-[#0a0a0a]/50` |
| **Accent Color** | Bind dynamically to `persona.theme.primary`. |

---

## 5. Registration Workflow

| Step | Action | Path / Target |
| :--- | :--- | :--- |
| **1. Tool Schema** | Create tool definition JSON | `src/tools/[appId].json` |
| **2. React Component** | Create tool UI component | `src/components/apps/[App]App.jsx` |
| **3. App Registry** | Register tool entry metadata | `src/lib/appRegistry.js` (`APP_REGISTRY`) |
| **4. Resolution** | Auto-loaded by service layer | Handled automatically by `PersonaService` & `ToolRegistryService` |

---

## 6. UI Polish Rules

| Rule | Requirement |
| :--- | :--- |
| **Header Toggle** | Attach `onClick={onOpenPersonaInfo}` to both avatar image and title container. |
| **Button Labels** | Keep action button labels concise (1 to 2 words). |
| **Empty States** | Keep preview empty states minimal (muted icon with short status message). |
