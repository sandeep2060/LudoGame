import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { ChatMessage, UserProfile } from '../../types/user'

type ChatProps = {
  currentUser: UserProfile
  roomId?: string
  receiverId?: string
  type?: 'private' | 'game' | 'global'
}

export function Chat({ currentUser, roomId, receiverId, type = 'game' }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
    subscribeToMessages()
  }, [roomId, receiverId, type])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    if (!supabase) return
    try {
      let query = supabase
        .from('chat_messages')
        .select('*, sender:user_profiles(*)')
        .eq('type', type)
        .order('created_at', { ascending: true })
        .limit(50)

      if (type === 'private' && receiverId) {
        query = query.or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`)
      } else if (type === 'game' && roomId) {
        query = query.eq('room_id', roomId)
      }

      const { data, error } = await query

      if (data && !error) {
        setMessages(data)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const subscribeToMessages = () => {
    if (!supabase) return

    const channel = supabase
      .channel(`chat:${type}:${roomId || receiverId || 'global'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: type === 'game' && roomId ? `room_id=eq.${roomId}` : undefined,
        },
        (payload) => {
          loadMessages()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !supabase) return

    try {
      const { error } = await supabase.from('chat_messages').insert({
        sender_id: currentUser.id,
        receiver_id: receiverId || null,
        room_id: roomId || null,
        message: newMessage.trim(),
        type,
      })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={`chat-container ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat"
      >
        💬 {isOpen ? 'Close' : 'Chat'}
        {messages.length > 0 && <span className="chat-badge">{messages.length}</span>}
      </button>

      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <h3>
              {type === 'private' ? 'Private Chat' : type === 'game' ? 'Game Chat' : 'Global Chat'}
            </h3>
            <button type="button" className="close-btn" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <p className="empty-chat">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === currentUser.id
                return (
                  <div key={msg.id} className={`chat-message ${isOwn ? 'own' : 'other'}`}>
                    {!isOwn && msg.sender && (
                      <span className="message-sender">{msg.sender.username}</span>
                    )}
                    <div className="message-content">{msg.message}</div>
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              maxLength={500}
            />
            <button type="button" className="send-btn" onClick={sendMessage} disabled={!newMessage.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

