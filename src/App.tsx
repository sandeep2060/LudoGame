import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabaseClient'
import { LudoGame } from './components/LudoGame/LudoGame'
import { MultiplayerGame } from './components/MultiplayerGame/MultiplayerGame'
import { RoomBrowser } from './components/Room/RoomBrowser'
import { RoomLobby } from './components/Room/RoomLobby'
import { CreateRoom } from './components/Room/CreateRoom'
import { Wallet } from './components/Wallet/Wallet'
import { Friends } from './components/Friends/Friends'
import { Chat } from './components/Chat/Chat'
import type { UserProfile } from './types/user'
import type { GameRoom } from './types/room'

const featureHighlights = [
  'Instant matchmaking with friends or global players',
  'Daily quests and rewards to boost your token stash',
  'Smart reconnect so you never lose a winning streak',
]

type AuthIntent = 'Log in' | 'Sign up'

type AuthFormProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>, intent: AuthIntent) => void
  isLoading: boolean
}

const LoginForm = ({ onSubmit, isLoading }: AuthFormProps) => (
  <form className="form" onSubmit={(event) => onSubmit(event, 'Log in')} aria-busy={isLoading}>
    <label className="input-group">
      <span>Email</span>
      <input type="email" name="email" placeholder="you@example.com" required />
    </label>
    <label className="input-group">
      <span>Password</span>
      <input type="password" name="password" placeholder="••••••••" required />
    </label>

    <div className="form-meta">
      <label className="checkbox">
        <input type="checkbox" name="remember" />
        <span>Keep me logged in</span>
      </label>
      <button type="button" className="ghost-link">
        Forgot password?
      </button>
    </div>

    <button type="submit" className="primary-btn" disabled={isLoading}>
      {isLoading ? 'Rolling dice...' : 'Enter the Game'}
    </button>

    <div className="divider">
      <span>Develop by Sandeep Gaire</span>
    </div>

    
  </form>
)

const SignupForm = ({ onSubmit, isLoading }: AuthFormProps) => (
  <form className="form" onSubmit={(event) => onSubmit(event, 'Sign up')} aria-busy={isLoading}>
    <label className="input-group">
      <span>Display name</span>
      <input type="text" name="username" placeholder="Sandeep Gaire" required />
    </label>
    <label className="input-group">
      <span>Email</span>
      <input type="email" name="email" placeholder="you@example.com" required />
    </label>
    <label className="input-group">
      <span>Password</span>
      <input type="password" name="password" placeholder="At least 8 characters" required />
    </label>
    <label className="checkbox small-print">
      <input type="checkbox" name="updates" defaultChecked />
      <span>Send me weekly arena stats and tips</span>
    </label>

    <button type="submit" className="primary-btn" disabled={isLoading}>
      {isLoading ? 'Creating...' : 'Create free account'}
    </button>

    <p className="terms">
      By signing up you agree to the <a href="#">community rules</a> and <a href="#">privacy policy</a>.
    </p>
  </form>
)

type AuthStatus = {
  type: 'idle' | 'loading' | 'success' | 'error'
  message: string
}

function App() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ type: 'idle', message: '' })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [activeView, setActiveView] = useState<'game' | 'wallet' | 'friends' | 'chat' | 'multiplayer'>('multiplayer')
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [roomView, setRoomView] = useState<'browser' | 'lobby' | 'game'>('browser')

  const loadUserProfile = async () => {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return
    }
    
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        return
      }
      
      if (!user) {
        console.log('No user found')
        return
      }

      // Check if profile exists
      let { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // Check if it's a 404 (table doesn't exist) or PGRST116 (row doesn't exist)
        if (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          // Profile doesn't exist, create it
          const username = user.user_metadata?.username || user.email?.split('@')[0] || `Player${Math.random().toString(36).substr(2, 5)}`
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              username,
              email: user.email || '',
              wallet_balance: 1000, // Starting balance
              total_wins: 0,
              total_games: 0,
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            // If table doesn't exist, show helpful message
            if (createError.message?.includes('relation') || createError.message?.includes('does not exist')) {
              setAuthStatus({
                type: 'error',
                message: 'Database tables not found! Please run the SQL migration in Supabase SQL Editor. Check SETUP.md for instructions.',
              })
            }
            return
          }
          profile = newProfile
        } else {
          console.error('Error loading profile:', error)
          return
        }
      }

      if (profile) {
        setUserProfile(profile as UserProfile)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setAuthStatus({
        type: 'error',
        message: 'Failed to load profile. Please check your database setup.',
      })
    }
  }

  useEffect(() => {
    if (isAuthenticated && supabase) {
      loadUserProfile()
    }
  }, [isAuthenticated])

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>, intent: AuthIntent) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!supabase) {
      setAuthStatus({
        type: 'error',
        message: 'Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      })
      return
    }

    const formValues = Object.fromEntries(new FormData(form) as Iterable<[string, FormDataEntryValue]>)
    const actionCopy = intent === 'Log in' ? 'Signing you in…' : 'Creating your squad slot…'
    setAuthStatus({ type: 'loading', message: actionCopy })

    try {
      if (intent === 'Log in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formValues.email,
          password: formValues.password,
        })

        if (error) {
          throw error
        }

        setAuthStatus({ type: 'success', message: 'Login successful! Redirecting to the lobby…' })
        setIsAuthenticated(true)
        await loadUserProfile()
      } else {
        const { error } = await supabase.auth.signUp({
          email: formValues.email,
          password: formValues.password,
          options: {
            data: {
              username: formValues.username?.trim(),
            },
          },
        })

        if (error) {
          throw error
        }

        setAuthStatus({
          type: 'success',
          message: 'Account created! Check your inbox to confirm your email.',
        })
        form.reset()
      }
    } catch (error) {
      setAuthStatus({
        type: 'error',
        message: error?.message ?? 'Something went wrong. Please try again.',
      })
    }
  }

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setIsAuthenticated(false)
    setAuthStatus({ type: 'idle', message: '' })
  }

  if (isAuthenticated && userProfile) {
    return (
      <div className="game-page">
        <header className="game-top-bar">
          <div className="logo">
            <span role="img" aria-label="dice" className="logo-dice">
              🎲
            </span>
            <div>
              <p className="brand-title">Ludo King</p>
              <p className="brand-tagline">Play. Win. Earn.</p>
            </div>
          </div>
          <div className="top-bar-actions">
            <div className="wallet-badge">
              <span className="wallet-icon">💰</span>
              <span className="wallet-balance">₹{userProfile.wallet_balance.toFixed(0)}</span>
            </div>
            <nav className="main-nav">
              <button
                type="button"
                className={`nav-btn ${activeView === 'game' ? 'active' : ''}`}
                onClick={() => setActiveView('game')}
              >
                🎮 Play
              </button>
              <button
                type="button"
                className={`nav-btn ${activeView === 'wallet' ? 'active' : ''}`}
                onClick={() => setActiveView('wallet')}
              >
                💰 Wallet
              </button>
              <button
                type="button"
                className={`nav-btn ${activeView === 'friends' ? 'active' : ''}`}
                onClick={() => setActiveView('friends')}
              >
                👥 Friends
              </button>
              <button
                type="button"
                className={`nav-btn ${activeView === 'multiplayer' ? 'active' : ''}`}
                onClick={() => setActiveView('multiplayer')}
              >
                🎮 Online
              </button>
              <button
                type="button"
                className={`nav-btn ${activeView === 'game' ? 'active' : ''}`}
                onClick={() => setActiveView('game')}
              >
                🎲 Solo
              </button>
              <button
                type="button"
                className={`nav-btn ${activeView === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveView('chat')}
              >
                💬 Chat
              </button>
            </nav>
            <div className="user-menu">
              <span className="username">{userProfile.username}</span>
              <button type="button" className="ghost-btn" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="main-content">
          {activeView === 'game' && <LudoGame currentUser={userProfile} />}
          {activeView === 'multiplayer' && (
            <>
              {roomView === 'browser' && !showCreateRoom && (
                <RoomBrowser
                  currentUser={userProfile}
                  onCreateRoom={() => setShowCreateRoom(true)}
                  onJoinRoom={(roomId) => {
                    setCurrentRoom({ id: roomId } as GameRoom)
                    setRoomView('lobby')
                  }}
                />
              )}
              {showCreateRoom && (
                <CreateRoom
                  currentUser={userProfile}
                  onRoomCreated={(roomId) => {
                    setCurrentRoom({ id: roomId } as GameRoom)
                    setShowCreateRoom(false)
                    setRoomView('lobby')
                  }}
                  onCancel={() => setShowCreateRoom(false)}
                />
              )}
              {roomView === 'lobby' && currentRoom && (
                <RoomLobby
                  currentUser={userProfile}
                  roomId={currentRoom.id}
                  onStartGame={(room) => {
                    setCurrentRoom(room)
                    setRoomView('game')
                  }}
                  onLeaveRoom={() => {
                    setCurrentRoom(null)
                    setRoomView('browser')
                  }}
                />
              )}
              {roomView === 'game' && currentRoom && (
                <MultiplayerGame
                  currentUser={userProfile}
                  room={currentRoom}
                  onLeaveGame={() => {
                    setCurrentRoom(null)
                    setRoomView('browser')
                  }}
                />
              )}
            </>
          )}
          {activeView === 'wallet' && (
            <Wallet
              user={userProfile}
              onBalanceUpdate={(newBalance) => {
                setUserProfile({ ...userProfile, wallet_balance: newBalance })
              }}
            />
          )}
          {activeView === 'friends' && <Friends currentUser={userProfile} />}
          {activeView === 'chat' && <Chat currentUser={userProfile} type="global" />}
        </main>

      </div>
    )
  }

  if (isAuthenticated && !userProfile) {
    return (
      <div className="loading-page">
        <div className="loading-spinner">🎲</div>
        <p>Loading your profile...</p>
        {authStatus.type === 'error' && (
          <div className="error-message" style={{ marginTop: '20px', padding: '16px', background: '#fee2e2', borderRadius: '12px', color: '#b91c1c', maxWidth: '500px' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>⚠️ {authStatus.message}</p>
            <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>
              Make sure you've run the SQL migration in Supabase SQL Editor. Check SETUP.md file for instructions.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="brand-band">
        <div className="logo">
          <span role="img" aria-label="dice" className="logo-dice">
            🎲
          </span>
          <div>
            <p className="brand-title">Ludo League</p>
            <p className="brand-tagline">Roll. Race. Reign.</p>
          </div>
        </div>
        <span className="status-pill">Season 07 live</span>
      </div>

      <main className="auth-shell">
        <section className="hero">
          <p className="eyebrow">Multiplayer Ludo • Fast • Free</p>
          <h1>
            Keep the dice rolling—<span>log in</span> or <span>sign up</span> in seconds.
          </h1>
          <p className="lead">
            Track trophies, sync progress across devices, and squad up with friends for private matches.
            Jump back into the arena anytime, anywhere.
          </p>
          <ul className="feature-list">
            {featureHighlights.map((copy) => (
              <li key={copy}>
                <span className="dot" />
                {copy}
              </li>
            ))}
          </ul>

          <div className="support-card">
            <div>
              <p className="support-title">Need help joining?</p>
              <p className="support-copy">Our pit crew is online 24/7 to get you rolling again.</p>
            </div>
            <button type="button" className="secondary-btn">
              Chat support
            </button>
          </div>
        </section>

        <section className="form-panel">
          <div className="form-toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'login'}
              className={activeTab === 'login' ? 'active' : ''}
              onClick={() => setActiveTab('login')}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'signup'}
              className={activeTab === 'signup' ? 'active' : ''}
              onClick={() => setActiveTab('signup')}
            >
              Sign up
            </button>
          </div>

          <div className="form-card">
            {activeTab === 'login' ? (
              <LoginForm onSubmit={handleAuthSubmit} isLoading={authStatus.type === 'loading'} />
            ) : (
              <SignupForm onSubmit={handleAuthSubmit} isLoading={authStatus.type === 'loading'} />
            )}
          </div>

          {authStatus.message && (
            <p className={`status-banner ${authStatus.type}`} role="status" aria-live="polite">
              {authStatus.message}
            </p>
          )}

          <p className="mobile-helper">
            {activeTab === 'login' ? (
              <>
                New commander?{' '}
                <button className="ghost-link" type="button" onClick={() => setActiveTab('signup')}>
                  Create a free account
                </button>
              </>
            ) : (
              <>
                Already playing?{' '}
                <button className="ghost-link" type="button" onClick={() => setActiveTab('login')}>
                  Jump back in
                </button>
              </>
            )}
          </p>
        </section>
      </main>
    </div>
  )
}

export default App
