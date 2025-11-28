export interface GameRoom {
  id: string
  name: string
  host_id: string
  status: 'waiting' | 'playing' | 'finished'
  max_players: number
  current_players: number
  players: RoomPlayer[]
  game_state?: string // JSON stringified GameState
  created_at: string
  updated_at: string
  bet_amount?: number
  is_private: boolean
  room_code?: string // For private rooms
}

export interface RoomPlayer {
  id: string
  user_id: string
  room_id: string
  player_index: number
  is_ready: boolean
  joined_at: string
  user?: {
    id: string
    username: string
    avatar_url?: string
  }
}

export interface RoomMessage {
  id: string
  room_id: string
  user_id: string
  message: string
  type: 'system' | 'player'
  created_at: string
  user?: {
    username: string
  }
}

