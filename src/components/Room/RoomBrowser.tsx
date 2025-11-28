import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { GameRoom } from '../../types/room'
import type { UserProfile } from '../../types/user'

type RoomBrowserProps = {
  currentUser: UserProfile
  onCreateRoom: () => void
  onJoinRoom: (roomId: string) => void
}

export function RoomBrowser({ currentUser, onCreateRoom, onJoinRoom }: RoomBrowserProps) {
  const [rooms, setRooms] = useState<GameRoom[]>([])
  const [roomCode, setRoomCode] = useState('')
  const [filter, setFilter] = useState<'all' | 'waiting' | 'playing'>('all')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadRooms()
    subscribeToRooms()
  }, [filter])

  const loadRooms = async () => {
    if (!supabase) return
    setIsLoading(true)
    try {
      let query = supabase
        .from('game_rooms')
        .select('*, host:user_profiles!host_id(username)')
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(20)

      if (filter === 'waiting') {
        query = query.eq('status', 'waiting')
      } else if (filter === 'playing') {
        query = query.eq('status', 'playing')
      }

      const { data, error } = await query

      if (data && !error) {
        setRooms(data)
      }
    } catch (error) {
      console.error('Error loading rooms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToRooms = () => {
    if (!supabase) return

    const channel = supabase
      .channel('room-browser')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
        },
        () => {
          loadRooms()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleJoinByCode = async () => {
    if (!supabase || !roomCode.trim()) return
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('room_code', roomCode.trim().toUpperCase())
        .eq('is_private', true)
        .single()

      if (error || !data) {
        alert('Invalid room code!')
        return
      }

      onJoinRoom(data.id)
    } catch (error) {
      console.error('Error joining by code:', error)
      alert('Failed to join room')
    }
  }

  return (
    <div className="room-browser">
      <div className="browser-header">
        <h2>🎮 Find a Game</h2>
        <button type="button" className="primary-btn" onClick={onCreateRoom}>
          ➕ Create Room
        </button>
      </div>

      <div className="browser-filters">
        <button
          type="button"
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Rooms
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'waiting' ? 'active' : ''}`}
          onClick={() => setFilter('waiting')}
        >
          Waiting
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'playing' ? 'active' : ''}`}
          onClick={() => setFilter('playing')}
        >
          Playing
        </button>
      </div>

      <div className="join-by-code">
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Enter room code..."
          maxLength={6}
        />
        <button type="button" className="primary-btn" onClick={handleJoinByCode}>
          Join by Code
        </button>
      </div>

      <div className="rooms-list">
        {isLoading ? (
          <div className="loading">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">No rooms available. Create one!</div>
        ) : (
          rooms.map((room) => (
            <div key={room.id} className="room-card">
              <div className="room-info">
                <h3>{room.name}</h3>
                <p className="room-host">Host: {room.host?.username || 'Unknown'}</p>
                <div className="room-stats">
                  <span>👥 {room.current_players}/{room.max_players}</span>
                  <span className={`status-badge ${room.status}`}>{room.status}</span>
                  {room.bet_amount && <span>💰 ₹{room.bet_amount}</span>}
                </div>
              </div>
              <div className="room-actions">
                {room.status === 'waiting' && room.current_players < room.max_players ? (
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => onJoinRoom(room.id)}
                  >
                    Join
                  </button>
                ) : (
                  <button type="button" className="ghost-btn" disabled>
                    {room.status === 'playing' ? 'In Game' : 'Full'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

