declare global {
  interface Window {
    __coverage__: Record<string, unknown> | undefined
  }
}

export {}
