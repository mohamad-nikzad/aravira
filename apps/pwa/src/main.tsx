import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'

import { getRouter } from './router'
import { AuthProvider, registerAuthQueryDefaults } from './lib/auth'
import { queryClient } from './lib/query-client'
import { ThemeProvider } from './lib/theme'

registerAuthQueryDefaults(queryClient)

const router = getRouter({ queryClient })

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}
