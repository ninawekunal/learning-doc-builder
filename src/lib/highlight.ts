import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import bash from 'shiki/langs/bash.mjs'
import css from 'shiki/langs/css.mjs'
import html from 'shiki/langs/html.mjs'
import json from 'shiki/langs/json.mjs'
import tsx from 'shiki/langs/tsx.mjs'
import typescript from 'shiki/langs/typescript.mjs'
import githubDark from 'shiki/themes/github-dark.mjs'
import githubLight from 'shiki/themes/github-light.mjs'

// Created once, synchronously, with the regex engine that needs no WASM.
const highlighter = createHighlighterCoreSync({
  themes: [githubLight, githubDark],
  langs: [tsx, typescript, bash, css, html, json],
  engine: createJavaScriptRegexEngine(),
})

const ALIASES: Record<string, string> = {
  ts: 'typescript',
  js: 'tsx',
  jsx: 'tsx',
  javascript: 'tsx',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
}

/** Language label shown on the code block header. */
export const languageLabel = (lang: string): string => {
  const key = lang.toLowerCase()

  if (key === 'tsx' || key === 'jsx') return key.toUpperCase()
  if (key === 'ts' || key === 'typescript') return 'TypeScript'
  if (key === '' || key === 'text') return 'Text'

  return key.toUpperCase()
}

/**
 * Highlight code into HTML carrying both light and dark colours as CSS
 * variables, so the theme toggle needs no re-highlight.
 */
export const highlightCode = (code: string, lang: string): string | null => {
  const resolved = ALIASES[lang.toLowerCase()] ?? lang.toLowerCase()

  if (!highlighter.getLoadedLanguages().includes(resolved)) return null

  return highlighter.codeToHtml(code, {
    lang: resolved,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  })
}
