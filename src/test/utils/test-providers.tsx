import React from 'react'
import { BrowserRouter } from 'react-router-dom'

// Test provider wrapper component
export const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}