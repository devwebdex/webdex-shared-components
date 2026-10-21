import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// O jsdom não implementa estas APIs do navegador, que o Radix (posicionamento e captura de ponteiro)
// e o cmdk (rolagem até o item em destaque) chamam. Sem elas, abrir a lista lança erro no teste.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
Element.prototype.scrollIntoView ??= () => {}
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => {}
