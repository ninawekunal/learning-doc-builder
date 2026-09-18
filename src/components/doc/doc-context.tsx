import { createContext, useContext } from 'react'

type DocContextValue = { bionic: boolean }

export const DocContext = createContext<DocContextValue>({ bionic: false })

export const useDocContext = (): DocContextValue => useContext(DocContext)
