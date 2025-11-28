export interface UserProfile {
  id: string
  username: string
  email: string
  avatar_url?: string
  wallet_balance: number
  total_wins: number
  total_games: number
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  user_id: string
  amount: number
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'refund'
  status: 'pending' | 'completed' | 'failed'
  description: string
  game_id?: string
  created_at: string
}

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  sender?: UserProfile
  receiver?: UserProfile
}

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  created_at: string
  friend?: UserProfile
}

export interface ChatMessage {
  id: string
  sender_id: string
  receiver_id?: string
  room_id?: string
  message: string
  type: 'private' | 'game' | 'global'
  created_at: string
  sender?: UserProfile
}

export interface GameBet {
  id: string
  game_id: string
  player_id: string
  amount: number
  status: 'pending' | 'won' | 'lost' | 'refunded'
  created_at: string
}

