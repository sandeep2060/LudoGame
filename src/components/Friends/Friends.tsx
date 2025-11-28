import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { Friend, FriendRequest, UserProfile } from '../../types/user'

type FriendsProps = {
  currentUser: UserProfile
}

export function Friends({ currentUser }: FriendsProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadFriends()
    loadFriendRequests()
  }, [currentUser.id])

  const loadFriends = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*, friend:user_profiles!friend_id(*)')
        .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`)

      if (data && !error) {
        setFriends(data)
      }
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }

  const loadFriendRequests = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*, sender:user_profiles!sender_id(*), receiver:user_profiles!receiver_id(*)')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .eq('status', 'pending')

      if (data && !error) {
        setFriendRequests(data)
      }
    } catch (error) {
      console.error('Error loading friend requests:', error)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim() || !supabase) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', currentUser.id)
        .limit(10)

      if (data && !error) {
        setSearchResults(data)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendFriendRequest = async (userId: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase.from('friend_requests').insert({
        sender_id: currentUser.id,
        receiver_id: userId,
        status: 'pending',
      })

      if (error) throw error

      alert('Friend request sent!')
      loadFriendRequests()
    } catch (error) {
      console.error('Error sending friend request:', error)
      alert('Failed to send friend request')
    }
  }

  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!supabase) return
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Create friend relationship
      const { error: friendError } = await supabase.from('friends').insert({
        user_id: currentUser.id,
        friend_id: senderId,
      })

      if (friendError) throw friendError

      alert('Friend request accepted!')
      loadFriends()
      loadFriendRequests()
    } catch (error) {
      console.error('Error accepting friend request:', error)
      alert('Failed to accept friend request')
    }
  }

  const rejectFriendRequest = async (requestId: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)

      if (error) throw error

      loadFriendRequests()
    } catch (error) {
      console.error('Error rejecting friend request:', error)
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!supabase) return
    if (!confirm('Are you sure you want to remove this friend?')) return

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.id})`)

      if (error) throw error

      loadFriends()
    } catch (error) {
      console.error('Error removing friend:', error)
      alert('Failed to remove friend')
    }
  }

  const incomingRequests = friendRequests.filter((req) => req.receiver_id === currentUser.id)
  const outgoingRequests = friendRequests.filter((req) => req.sender_id === currentUser.id)

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h2>👥 Friends</h2>
        <div className="friends-tabs">
          <button
            type="button"
            className={activeTab === 'friends' ? 'active' : ''}
            onClick={() => setActiveTab('friends')}
          >
            Friends ({friends.length})
          </button>
          <button
            type="button"
            className={activeTab === 'requests' ? 'active' : ''}
            onClick={() => setActiveTab('requests')}
          >
            Requests
            {incomingRequests.length > 0 && (
              <span className="badge">{incomingRequests.length}</span>
            )}
          </button>
          <button
            type="button"
            className={activeTab === 'search' ? 'active' : ''}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
        </div>
      </div>

      <div className="friends-content">
        {activeTab === 'friends' && (
          <div className="friends-list">
            {friends.length === 0 ? (
              <p className="empty-state">No friends yet. Search for players to add!</p>
            ) : (
              friends.map((friend) => {
                const friendProfile = friend.friend_id === currentUser.id ? friend.user_id : friend.friend_id
                const friendData = friend.friend || (friend.user_id === currentUser.id ? null : null)
                if (!friendData) return null

                return (
                  <div key={friend.id} className="friend-item">
                    <div className="friend-info">
                      <div className="friend-avatar">
                        {friendData.avatar_url ? (
                          <img src={friendData.avatar_url} alt={friendData.username} />
                        ) : (
                          <span>{friendData.username[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="friend-name">{friendData.username}</p>
                        <p className="friend-stats">
                          {friendData.total_wins || 0} wins • {friendData.total_games || 0} games
                        </p>
                      </div>
                    </div>
                    <div className="friend-actions">
                      <button
                        type="button"
                        className="primary-btn small"
                        onClick={() => {
                          // Navigate to game with friend
                          alert('Challenge friend feature coming soon!')
                        }}
                      >
                        Challenge
                      </button>
                      <button
                        type="button"
                        className="ghost-btn small"
                        onClick={() => removeFriend(friendData.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests-list">
            {incomingRequests.length > 0 && (
              <div>
                <h3>Incoming Requests</h3>
                {incomingRequests.map((req) => (
                  <div key={req.id} className="request-item">
                    <div className="request-info">
                      <span className="request-sender">{req.sender?.username}</span>
                      <span className="request-date">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="request-actions">
                      <button
                        type="button"
                        className="primary-btn small"
                        onClick={() => acceptFriendRequest(req.id, req.sender_id)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="ghost-btn small"
                        onClick={() => rejectFriendRequest(req.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {outgoingRequests.length > 0 && (
              <div>
                <h3>Sent Requests</h3>
                {outgoingRequests.map((req) => (
                  <div key={req.id} className="request-item">
                    <div className="request-info">
                      <span className="request-sender">{req.receiver?.username}</span>
                      <span className="request-status pending">Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
              <p className="empty-state">No friend requests</p>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="search-section">
            <div className="search-input">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
              <button type="button" className="primary-btn" onClick={searchUsers} disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="search-results">
              {searchResults.map((user) => {
                const isFriend = friends.some(
                  (f) => f.friend_id === user.id || f.user_id === user.id,
                )
                const hasRequest = friendRequests.some(
                  (r) =>
                    (r.sender_id === currentUser.id && r.receiver_id === user.id) ||
                    (r.receiver_id === currentUser.id && r.sender_id === user.id),
                )

                return (
                  <div key={user.id} className="search-result-item">
                    <div className="result-info">
                      <div className="result-avatar">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} />
                        ) : (
                          <span>{user.username[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="result-name">{user.username}</p>
                        <p className="result-stats">
                          {user.total_wins || 0} wins • {user.total_games || 0} games
                        </p>
                      </div>
                    </div>
                    {!isFriend && !hasRequest && (
                      <button
                        type="button"
                        className="primary-btn small"
                        onClick={() => sendFriendRequest(user.id)}
                      >
                        Add Friend
                      </button>
                    )}
                    {hasRequest && <span className="request-sent">Request sent</span>}
                    {isFriend && <span className="already-friend">Friend</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

