# Ludo King - Setup Guide

A full-featured Ludo game platform with wallet, chat, and friend system, inspired by [Ludo King](https://ludoking.com/).

## Features

- 🎮 **Full Ludo Game** - Complete game with 4 players, dice rolling, and piece movement
- 💰 **Wallet System** - Deposit, withdraw, and track transactions
- 💬 **Real-time Chat** - Global, game, and private chat
- 👥 **Friend System** - Add friends, send requests, and challenge them
- 🎲 **Betting System** - Place bets on games and win money
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy and paste the contents of `supabase-migration.sql` and run it
4. Go to **Settings** > **API** and copy:
   - Project URL
   - `anon` public key

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Database Schema

The migration creates the following tables:

- **user_profiles** - User information and wallet balance
- **wallet_transactions** - All wallet transactions
- **friend_requests** - Friend request management
- **friends** - Friend relationships
- **chat_messages** - Chat messages (global, game, private)
- **game_bets** - Betting information

## Features Overview

### Wallet System
- Starting balance: ₹1000
- Deposit money
- Withdraw money
- View transaction history
- Automatic balance updates

### Chat System
- **Global Chat** - Chat with all players
- **Game Chat** - Chat during a game
- **Private Chat** - One-on-one messaging (coming soon)

### Friend System
- Search for players by username
- Send friend requests
- Accept/reject requests
- View friend list
- Challenge friends to games

### Betting System
- Place bets on games before they start
- Select which player to bet on
- Win money if your bet wins
- Automatic wallet updates

## Project Structure

```
src/
├── components/
│   ├── Betting/          # Betting component
│   ├── Chat/             # Chat component
│   ├── Friends/           # Friends component
│   ├── Wallet/            # Wallet component
│   ├── LudoGame/          # Main game component
│   ├── LudoBoard/         # Game board
│   ├── PlayerArea/        # Player information
│   ├── GameControls/      # Game controls
│   └── InteractivePiece/  # Interactive game pieces
├── lib/
│   ├── gameLogic/         # Game logic and engine
│   └── supabaseClient.js  # Supabase client
├── types/
│   ├── game.ts            # Game types
│   └── user.ts            # User types
└── App.tsx                # Main app component
```

## Customization

### Starting Balance
Edit `supabase-migration.sql`:
```sql
wallet_balance DECIMAL(10, 2) DEFAULT 1000.00  -- Change 1000.00 to your desired amount
```

Or in `App.tsx`, change the starting balance when creating a profile:
```typescript
wallet_balance: 1000,  // Change this value
```

### Colors and Styling
All styles are in `src/index.css`. The design uses:
- Primary: Blue (#2563eb)
- Success: Green (#22c55e)
- Warning: Yellow (#facc15)
- Error: Red (#ef4444)

## Troubleshooting

### Supabase Connection Issues
- Verify your `.env` file has correct values
- Check Supabase project is active
- Ensure RLS policies are enabled

### Database Errors
- Run the migration SQL again
- Check table permissions
- Verify RLS policies are correct

### Chat Not Working
- Check Supabase Realtime is enabled
- Verify channel subscriptions
- Check browser console for errors

## Production Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to:
   - Vercel
   - Netlify
   - Any static hosting service

3. Update environment variables in your hosting platform

## Security Notes

- Never commit `.env` file
- Use Supabase RLS policies for security
- Validate all user inputs
- Implement rate limiting for production
- Add proper authentication checks

## License

Developed by Sandeep Gaire

## Support

For issues or questions, check the code comments or Supabase documentation.

