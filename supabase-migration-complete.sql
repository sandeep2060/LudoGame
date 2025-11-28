-- ============================================
-- COMPLETE LUDO KING DATABASE SETUP
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- STEP 1: Drop all existing tables (if they exist)
DROP TABLE IF EXISTS room_messages CASCADE;
DROP TABLE IF EXISTS room_players CASCADE;
DROP TABLE IF EXISTS game_rooms CASCADE;
DROP TABLE IF EXISTS game_bets CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- STEP 2: Drop function if exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- STEP 3: Create Tables
-- ============================================

-- User Profiles Table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  avatar_url TEXT,
  wallet_balance DECIMAL(10, 2) DEFAULT 1000.00,
  total_wins INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet Transactions Table
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'bet', 'win', 'refund')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  description TEXT NOT NULL,
  game_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friend Requests Table
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Friends Table
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Chat Messages Table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  room_id TEXT,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('private', 'game', 'global')) DEFAULT 'game',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Bets Table
CREATE TABLE game_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'won', 'lost', 'refunded')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Rooms Table
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'playing', 'finished')) DEFAULT 'waiting',
  max_players INTEGER NOT NULL DEFAULT 4,
  current_players INTEGER DEFAULT 0,
  game_state TEXT,
  is_private BOOLEAN DEFAULT false,
  room_code TEXT UNIQUE,
  bet_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room Players Table
CREATE TABLE room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  player_index INTEGER NOT NULL,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id),
  UNIQUE(room_id, player_index)
);

-- Room Messages Table
CREATE TABLE room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('system', 'player')) DEFAULT 'player',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create Indexes
-- ============================================

CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_type ON chat_messages(type);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_game_bets_game_id ON game_bets(game_id);
CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_rooms_host ON game_rooms(host_id);
CREATE INDEX idx_room_players_room ON room_players(room_id);
CREATE INDEX idx_room_players_user ON room_players(user_id);
CREATE INDEX idx_room_messages_room ON room_messages(room_id);

-- ============================================
-- STEP 5: Enable Row Level Security
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Create RLS Policies
-- ============================================

-- User Profiles Policies
CREATE POLICY "Users can view all profiles" ON user_profiles 
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Wallet Transactions Policies
CREATE POLICY "Users can view own transactions" ON wallet_transactions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON wallet_transactions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friend Requests Policies
CREATE POLICY "Users can view own friend requests" ON friend_requests 
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create friend requests" ON friend_requests 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own received requests" ON friend_requests 
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Friends Policies
CREATE POLICY "Users can view own friends" ON friends 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can add friends" ON friends 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own friendships" ON friends 
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Chat Messages Policies
CREATE POLICY "Users can view relevant messages" ON chat_messages 
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR 
    type = 'global' OR 
    type = 'game'
  );

CREATE POLICY "Users can send messages" ON chat_messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Game Bets Policies
CREATE POLICY "Users can view own bets" ON game_bets 
  FOR SELECT USING (auth.uid()::text = player_id);

CREATE POLICY "Users can create own bets" ON game_bets 
  FOR INSERT WITH CHECK (auth.uid()::text = player_id);

-- Game Rooms Policies
CREATE POLICY "Users can view public rooms" ON game_rooms 
  FOR SELECT USING (is_private = false OR host_id = auth.uid());

CREATE POLICY "Users can create rooms" ON game_rooms 
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update own rooms" ON game_rooms 
  FOR UPDATE USING (auth.uid() = host_id);

-- Room Players Policies
CREATE POLICY "Users can view room players" ON room_players 
  FOR SELECT USING (true);

CREATE POLICY "Users can join rooms" ON room_players 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own status" ON room_players 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON room_players 
  FOR DELETE USING (auth.uid() = user_id);

-- Room Messages Policies
CREATE POLICY "Users can view room messages" ON room_messages 
  FOR SELECT USING (true);

CREATE POLICY "Users can send messages" ON room_messages 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STEP 7: Create Function and Trigger
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! All tables, policies, and triggers created
-- ============================================

