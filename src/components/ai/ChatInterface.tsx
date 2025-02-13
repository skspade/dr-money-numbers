import React from 'react'

export interface ChatInterfaceProps {
  messages: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
}

export function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  return (
    <div>
      {/* Add component implementation */}
    </div>
  )
}
