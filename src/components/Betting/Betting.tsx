import { useState } from 'react'
import type { UserProfile, GameBet } from '../../types/user'

type BettingProps = {
  currentUser: UserProfile
  gameId: string
  players: Array<{ id: number; name: string; color: string }>
  onBetPlaced: (bet: GameBet) => void
}

export function Betting({ currentUser, gameId, players, onBetPlaced }: BettingProps) {
  const [betAmount, setBetAmount] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handlePlaceBet = () => {
    const amount = parseFloat(betAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid bet amount')
      return
    }

    if (amount > currentUser.wallet_balance) {
      alert('Insufficient balance')
      return
    }

    if (!selectedPlayer) {
      alert('Please select a player to bet on')
      return
    }

    const bet: GameBet = {
      id: `bet-${Date.now()}`,
      game_id: gameId,
      player_id: selectedPlayer.toString(),
      amount,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    onBetPlaced(bet)
    setBetAmount('')
    setSelectedPlayer(null)
    setIsOpen(false)
    alert(`Bet of ₹${amount} placed on ${players.find((p) => p.id === selectedPlayer)?.name}`)
  }

  return (
    <div className="betting-container">
      <button
        type="button"
        className="betting-toggle"
        onClick={() => setIsOpen(!isOpen)}
        disabled={currentUser.wallet_balance <= 0}
      >
        🎲 Place Bet
      </button>

      {isOpen && (
        <div className="betting-panel">
          <div className="betting-header">
            <h3>Place Your Bet</h3>
            <button type="button" className="close-btn" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <div className="betting-content">
            <div className="balance-info">
              <span>Available Balance: ₹{currentUser.wallet_balance.toFixed(2)}</span>
            </div>

            <div className="player-selection">
              <label>Select Player to Bet On</label>
              <div className="player-options">
                {players.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    className={`player-option ${selectedPlayer === player.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPlayer(player.id)}
                  >
                    <span className={`player-color ${player.color}`}></span>
                    {player.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bet-amount">
              <label>
                Bet Amount (₹)
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  max={currentUser.wallet_balance}
                  step="0.01"
                />
              </label>
            </div>

            <button type="button" className="primary-btn" onClick={handlePlaceBet}>
              Place Bet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

