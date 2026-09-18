/** Language label shown on the code block header. */
export const languageLabel = (lang: string): string => {
  const key = lang.toLowerCase()

  if (key === 'tsx' || key === 'jsx') return key.toUpperCase()
  if (key === 'ts' || key === 'typescript') return 'TypeScript'
  if (key === '' || key === 'text') return 'Text'

  return key.toUpperCase()
}
