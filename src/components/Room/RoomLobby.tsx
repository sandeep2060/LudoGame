import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { GameRoom, RoomPlayer, RoomMessage } from '../../types/room'
import type { UserProfile } from '../../types/user'

type RoomLobbyProps = {
  currentUser: UserProfile
  roomId: string
  onStartGame: (room: GameRoom) => void
  onLeaveRoom: () => void
}

export function RoomLobby({ currentUser, roomId, onStartGame, onLeaveRoom }: RoomLobbyProps) {
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [messages, setMessages] = useState<RoomMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [isHost, setIsHost] = useState(false)

  useEffect(() => {
    loadRoom()
    subscribeToRoom()
    subscribeToPlayers()
    subscribeToMessages()
  }, [roomId])

  const loadRoom = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*, players:room_players(*, user:user_profiles(*))')
        .eq('id', roomId)
        .single()

      if (data && !error) {
        setRoom(data)
        setPlayers(data.players || [])
        setIsHost(data.host_id === currentUser.id)
      }
    } catch (error) {
      console.error('Error loading room:', error)
    }
  }

  const subscribeToRoom = () => {
    if (!supabase) return

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          setRoom(payload.new as GameRoom)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const subscribeToPlayers = () => {
    if (!supabase) return

    const channel = supabase
      .channel(`room-players:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadRoom()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const subscribeToMessages = () => {
    if (!supabase) return

    const channel = supabase
      .channel(`room-messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadMessages()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const loadMessages = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('room_messages')
        .select('*, user:user_profiles(username)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (data) {
        setMessages(data)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleJoinRoom = async () => {
    if (!supabase || !room) return
    try {
      const playerCount = players.length
      if (playerCount >= room.max_players) {
        alert('Room is full!')
        return
      }

      const { error } = await supabase.from('room_players').insert({
        room_id: roomId,
        user_id: currentUser.id,
        player_index: playerCount,
        is_ready: false,
      })

      if (error) throw error
    } catch (error) {
      console.error('Error joining room:', error)
      alert('Failed to join room')
    }
  }

  const handleToggleReady = async () => {
    if (!supabase) return
    try {
      const player = players.find((p) => p.user_id === currentUser.id)
      if (!player) return

      const { error } = await supabase
        .from('room_players')
        .update({ is_ready: !isReady })
        .eq('id', player.id)

      if (error) throw error
      setIsReady(!isReady)
    } catch (error) {
      console.error('Error updating ready status:', error)
    }
  }

  const handleStartGame = async () => {
    if (!supabase || !room || !isHost) return

    const allReady = players.length >= 2 && players.every((p) => p.is_ready)
    if (!allReady) {
      alert('All players must be ready!')
      return
    }

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ status: 'playing' })
        .eq('id', roomId)

      if (error) throw error
      onStartGame(room)
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Failed to start game')
    }
  }

  const handleSendMessage = async () => {
    if (!supabase || !newMessage.trim()) return
    try {
      const { error } = await supabase.from('room_messages').insert({
        room_id: roomId,
        user_id: currentUser.id,
        message: newMessage.trim(),
        type: 'player',
      })

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleLeaveRoom = async () => {
    if (!supabase) return
    try {
      const player = players.find((p) => p.user_id === currentUser.id)
      if (player) {
        await supabase.from('room_players').delete().eq('id', player.id)
      }
      onLeaveRoom()
    } catch (error) {
      console.error('Error leaving room:', error)
    }
  }

  useEffect(() => {
    const player = players.find((p) => p.user_id === currentUser.id)
    if (player) {
      setIsReady(player.is_ready)
    } else {
      handleJoinRoom()
    }
  }, [players])

  useEffect(() => {
    loadMessages()
  }, [])

  if (!room) {
    return (
      <div className="room-lobby">
        <div className="loading">Loading room...</div>
      </div>
    )
  }

  const allReady = players.length >= 2 && players.every((p) => p.is_ready)
  const canStart = isHost && allReady && room.status === 'waiting'

  return (
    <div className="room-lobby">
      <div className="lobby-header">
        <h2>🎮 {room.name}</h2>
        {room.room_code && <div className="room-code">Code: {room.room_code}</div>}
        <button type="button" className="ghost-btn" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="lobby-content">
        <div className="players-section">
          <h3>Players ({players.length}/{room.max_players})</h3>
          <div className="players-list">
            {players.map((player) => (
              <div key={player.id} className={`player-card ${player.is_ready ? 'ready' : ''}`}>
                <div className="player-info">
                  <span className="player-avatar">
                    {player.user?.username?.[0]?.toUpperCase() || 'P'}
                  </span>
                  <div>
                    <p className="player-name">
                      {player.user?.username || 'Player'} {player.user_id === currentUser.id && '(You)'}
                    </p>
                    <p className="player-status">
                      {player.is_ready ? '✅ Ready' : '⏳ Not Ready'}
                    </p>
                  </div>
                </div>
                {player.user_id === room.host_id && <span className="host-badge">👑 Host</span>}
              </div>
            ))}
          </div>

          {players.length < room.max_players && (
            <p className="waiting-text">Waiting for more players...</p>
          )}

          <div className="lobby-actions">
            {players.find((p) => p.user_id === currentUser.id) && (
              <button
                type="button"
                className={`ready-btn ${isReady ? 'ready' : ''}`}
                onClick={handleToggleReady}
              >
                {isReady ? '✅ Ready' : '⏳ Not Ready'}
              </button>
            )}

            {canStart && (
              <button type="button" className="primary-btn" onClick={handleStartGame}>
                🎮 Start Game
              </button>
            )}
          </div>
        </div>

        <div className="chat-section">
          <h3>Chat</h3>
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-msg ${msg.user_id === currentUser.id ? 'own' : ''}`}>
                <span className="msg-sender">{msg.user?.username || 'System'}:</span>
                <span className="msg-text">{msg.message}</span>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
            />
            <button type="button" className="send-btn" onClick={handleSendMessage}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

