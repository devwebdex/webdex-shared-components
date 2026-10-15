import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
//#if web3=evm
import { Web3Provider } from './components/web3-provider'
//#endif
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root ausente no index.html')

createRoot(root).render(
  <StrictMode>
    //#if web3=evm
    <Web3Provider>
      <App />
    </Web3Provider>
    //#else
    <App />
    //#endif
  </StrictMode>
)
