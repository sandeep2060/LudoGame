import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { UserProfile } from '../../types/user'

type CreateRoomProps = {
  currentUser: UserProfile
  onRoomCreated: (roomId: string) => void
  onCancel: () => void
}

export function CreateRoom({ currentUser, onRoomCreated, onCancel }: CreateRoomProps) {
  const [roomName, setRoomName] = useState(`${currentUser.username}'s Room`)
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [isPrivate, setIsPrivate] = useState(false)
  const [betAmount, setBetAmount] = useState('0')
  const [isCreating, setIsCreating] = useState(false)

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreateRoom = async () => {
    if (!supabase || !roomName.trim()) return
    setIsCreating(true)

    try {
      const roomCode = isPrivate ? generateRoomCode() : null

      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          name: roomName.trim(),
          host_id: currentUser.id,
          status: 'waiting',
          max_players: maxPlayers,
          current_players: 0,
          is_private: isPrivate,
          room_code: roomCode,
          bet_amount: parseFloat(betAmount) || 0,
        })
        .select()
        .single()

      if (error) throw error

      // Join as host
      await supabase.from('room_players').insert({
        room_id: data.id,
        user_id: currentUser.id,
        player_index: 0,
        is_ready: false,
      })

      // Update current players count
      await supabase
        .from('game_rooms')
        .update({ current_players: 1 })
        .eq('id', data.id)

      onRoomCreated(data.id)
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="create-room">
      <div className="create-room-header">
        <h2>Create Game Room</h2>
        <button type="button" className="close-btn" onClick={onCancel}>
          ×
        </button>
      </div>

      <div className="create-room-form">
        <label className="input-group">
          <span>Room Name</span>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            maxLength={50}
          />
        </label>

        <label className="input-group">
          <span>Max Players</span>
          <select value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))}>
            <option value={2}>2 Players</option>
            <option value={3}>3 Players</option>
            <option value={4}>4 Players</option>
          </select>
        </label>

        <label className="input-group">
          <span>Bet Amount (₹)</span>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="0 for free play"
            min="0"
            step="10"
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          <span>Private Room (Requires code to join)</span>
        </label>

        <div className="form-actions">
          <button type="button" className="ghost-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={handleCreateRoom}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  )
}

