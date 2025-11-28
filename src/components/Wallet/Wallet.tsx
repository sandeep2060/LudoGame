import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { WalletTransaction, UserProfile } from '../../types/user'

type WalletProps = {
  user: UserProfile
  onBalanceUpdate: (newBalance: number) => void
}

export function Wallet({ user, onBalanceUpdate }: WalletProps) {
  const [balance, setBalance] = useState(user.wallet_balance || 0)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'balance' | 'transactions' | 'deposit' | 'withdraw'>('balance')

  useEffect(() => {
    loadTransactions()
    loadBalance()
  }, [user.id])

  const loadBalance = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single()

      if (data && !error) {
        setBalance(data.wallet_balance)
        onBalanceUpdate(data.wallet_balance)
      }
    } catch (error) {
      console.error('Error loading balance:', error)
    }
  }

  const loadTransactions = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data && !error) {
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    if (!supabase) {
      setIsLoading(false)
      return
    }

    try {
      // Create transaction
      const { data: transaction, error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount,
          type: 'deposit',
          status: 'completed',
          description: `Deposit of ₹${amount}`,
        })
        .select()
        .single()

      if (txError) throw txError

      // Update balance
      const { error: balanceError } = await supabase
        .from('user_profiles')
        .update({ wallet_balance: balance + amount })
        .eq('id', user.id)

      if (balanceError) throw balanceError

      setBalance((prev) => prev + amount)
      onBalanceUpdate(balance + amount)
      setDepositAmount('')
      setActiveTab('transactions')
      loadTransactions()
      alert('Deposit successful!')
    } catch (error) {
      console.error('Deposit error:', error)
      alert('Deposit failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (amount > balance) {
      alert('Insufficient balance')
      return
    }

    setIsLoading(true)
    if (!supabase) {
      setIsLoading(false)
      return
    }

    try {
      // Create transaction
      const { data: transaction, error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount: -amount,
          type: 'withdraw',
          status: 'pending',
          description: `Withdrawal request of ₹${amount}`,
        })
        .select()
        .single()

      if (txError) throw txError

      // Update balance (pending withdrawal)
      const { error: balanceError } = await supabase
        .from('user_profiles')
        .update({ wallet_balance: balance - amount })
        .eq('id', user.id)

      if (balanceError) throw balanceError

      setBalance((prev) => prev - amount)
      onBalanceUpdate(balance - amount)
      setWithdrawAmount('')
      setActiveTab('transactions')
      loadTransactions()
      alert('Withdrawal request submitted!')
    } catch (error) {
      console.error('Withdraw error:', error)
      alert('Withdrawal failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h2>💰 Wallet</h2>
        <div className="balance-display">
          <span className="balance-label">Balance</span>
          <span className="balance-amount">₹{balance.toFixed(2)}</span>
        </div>
      </div>

      <div className="wallet-tabs">
        <button
          type="button"
          className={activeTab === 'balance' ? 'active' : ''}
          onClick={() => setActiveTab('balance')}
        >
          Balance
        </button>
        <button
          type="button"
          className={activeTab === 'transactions' ? 'active' : ''}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          type="button"
          className={activeTab === 'deposit' ? 'active' : ''}
          onClick={() => setActiveTab('deposit')}
        >
          Deposit
        </button>
        <button
          type="button"
          className={activeTab === 'withdraw' ? 'active' : ''}
          onClick={() => setActiveTab('withdraw')}
        >
          Withdraw
        </button>
      </div>

      <div className="wallet-content">
        {activeTab === 'balance' && (
          <div className="balance-info">
            <div className="info-card">
              <span className="info-label">Available Balance</span>
              <span className="info-value">₹{balance.toFixed(2)}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Total Games</span>
              <span className="info-value">{user.total_games || 0}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Total Wins</span>
              <span className="info-value">{user.total_wins || 0}</span>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-list">
            {transactions.length === 0 ? (
              <p className="empty-state">No transactions yet</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className={`transaction-item ${tx.type}`}>
                  <div className="transaction-info">
                    <span className="transaction-type">{tx.type.toUpperCase()}</span>
                    <span className="transaction-desc">{tx.description}</span>
                    <span className="transaction-date">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={`transaction-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                    {tx.amount >= 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                  </div>
                  <span className={`transaction-status ${tx.status}`}>{tx.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'deposit' && (
          <div className="deposit-form">
            <label className="input-group">
              <span>Amount (₹)</span>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                step="0.01"
              />
            </label>
            <button
              type="button"
              className="primary-btn"
              onClick={handleDeposit}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Deposit'}
            </button>
            <p className="form-note">Minimum deposit: ₹10</p>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="withdraw-form">
            <label className="input-group">
              <span>Amount (₹)</span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                max={balance}
                step="0.01"
              />
            </label>
            <button
              type="button"
              className="primary-btn"
              onClick={handleWithdraw}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Withdraw'}
            </button>
            <p className="form-note">Available: ₹{balance.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

