import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebaseConfig';
import { ref, onValue, push, set, update, remove, query, limitToLast } from 'firebase/database';
import ChatInput from '../components/chat/ChatInput';
import LiveMessageItem from '../components/chat/LiveMessageItem';
import PollCreatorModal from '../components/chat/PollCreatorModal';
import { LiveMessage, parseCommand, PollData } from '../services/roomCommands';
import './LiveChatRoom.css';

interface LiveChatRoomProps {
  showNotification?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const LiveChatRoom: React.FC<LiveChatRoomProps> = ({ showNotification }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<LiveMessage | null>(null);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pollInitialQuestion, setPollInitialQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roomId = 'demo_room'; // Hardcoded for demo

  useEffect(() => {
    const messagesRef = ref(db, `live_rooms/${roomId}/messages`);
    const messagesQuery = query(messagesRef, limitToLast(100)); // Load only last 100 messages for speed
    
    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messageList);
      } else {
        setMessages([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    const chatContainer = document.querySelector('.live-chat-messages');
    if (!chatContainer) return;

    const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 150;
    const isNewMessage = messages.length > prevMessagesLength.current;
    const lastMessage = messages[messages.length - 1];
    const isMyMessage = lastMessage?.senderId === user?.email;

    if (isNewMessage && (isAtBottom || isMyMessage)) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    prevMessagesLength.current = messages.length;
  }, [messages, user?.email]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !user) return;

    const command = parseCommand(text);
    if (command?.type === 'poll') {
      setPollInitialQuestion(command.args);
      setIsPollModalOpen(true);
      return;
    }

    const messagesRef = ref(db, `live_rooms/${roomId}/messages`);
    const newMessageRef = push(messagesRef);
    
    const messageData: Partial<LiveMessage> = {
      text,
      senderId: user.email,
      senderName: user.name || user.username || user.email.split('@')[0],
      timestamp: Date.now()
    };

    if (replyingTo) {
      messageData.replyTo = replyingTo.id;
      setReplyingTo(null);
    }

    await set(newMessageRef, messageData);

    // Check if message triggers AI
    if (text.trim().startsWith('@AI')) {
      setIsTyping(true);
      
      // Simulate AI response for demo
      setTimeout(async () => {
        const aiMessageRef = push(messagesRef);
        const aiMessageData = {
          text: `Hello ${messageData.senderName}! I am UnityDev AI in the Live Room. I saw your message: "${text.replace('@AI', '').trim()}".\n\nI am currently in Demo Mode, but soon I will use my full 9000-token brain to answer you here!`,
          senderId: 'unitydev_ai',
          senderName: 'UnityDev AI',
          timestamp: Date.now(),
          isAI: true
        };
        await set(aiMessageRef, aiMessageData);
        setIsTyping(false);
      }, 2000);
    }
  };

  const handleCreatePoll = async (pollData: Omit<PollData, 'creatorId'>) => {
    if (!user) return;
    const messagesRef = ref(db, `live_rooms/${roomId}/messages`);
    const newMessageRef = push(messagesRef);
    
    const messageData: Partial<LiveMessage> = {
      text: `Created a poll: ${pollData.question}`,
      senderId: user.email,
      senderName: user.name || user.username || user.email.split('@')[0],
      timestamp: Date.now(),
      poll: {
        ...pollData,
        creatorId: user.email
      }
    };

    await set(newMessageRef, messageData);
    if (showNotification) showNotification('Poll created successfully', 'success');
  };

  const handleReact = async (msgId: string, emoji: string) => {
    if (!user) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const currentReactions = msg.reactions || {};
    const usersWithEmoji = currentReactions[emoji] || [];
    
    let newUsers;
    let added = false;
    if (usersWithEmoji.includes(user.email)) {
      newUsers = usersWithEmoji.filter(id => id !== user.email);
    } else {
      newUsers = [...usersWithEmoji, user.email];
      added = true;
    }

    const updates = {
      [`live_rooms/${roomId}/messages/${msgId}/reactions/${emoji}`]: newUsers.length > 0 ? newUsers : null
    };
    
    await update(ref(db), updates);
    if (showNotification) {
      if (added) showNotification(`Reacted with ${emoji}`, 'success');
      else showNotification(`Removed reaction ${emoji}`, 'info');
    }
  };

  const handleVote = async (msgId: string, optionId: string) => {
    if (!user) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.poll) return;

    const poll = msg.poll;
    let newOptions = [...poll.options];
    
    const targetOption = newOptions.find(o => o.id === optionId);
    const hasVotedHere = targetOption?.votes?.includes(user.email);
    const hasVotedAnywhere = newOptions.some(opt => opt.votes?.includes(user.email));
    
    // If they are trying to change/remove a vote and changes are not allowed
    if (!poll.allowChange) {
      if (hasVotedHere) {
        // Trying to un-vote
        if (showNotification) showNotification("You cannot remove your vote once cast.", 'error');
        return;
      }
      if (!poll.allowMultiple && hasVotedAnywhere) {
        // Trying to switch vote when only 1 allowed
        if (showNotification) showNotification("You have already voted and cannot change your vote.", 'error');
        return;
      }
    }

    let voteAdded = false;
    newOptions = newOptions.map(opt => {
      const votes = opt.votes || [];
      const votedForThis = votes.includes(user.email);
      
      if (opt.id === optionId) {
        // Toggle vote on this option
        if (!votedForThis) voteAdded = true;
        return { ...opt, votes: votedForThis ? votes.filter(id => id !== user.email) : [...votes, user.email] };
      } else if (!poll.allowMultiple && !votedForThis && hasVotedAnywhere && !hasVotedHere) {
        // If not multiple, and we are adding a new vote (not removing), remove vote from other options
        return { ...opt, votes: votes.filter(id => id !== user.email) };
      }
      return opt;
    });

    await update(ref(db, `live_rooms/${roomId}/messages/${msgId}/poll`), { options: newOptions });
    if (showNotification) {
      if (voteAdded) showNotification('Vote cast successfully', 'success');
      else showNotification('Vote removed', 'info');
    }
  };

  const handleDelete = async (msgId: string, forEveryone: boolean) => {
    if (!user) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    if (forEveryone) {
      if (msg.senderId !== user.email) return; // Only sender can delete for everyone
      await update(ref(db, `live_rooms/${roomId}/messages/${msgId}`), { 
        isDeleted: true,
        text: '',
        poll: null,
        reactions: null
      });
      if (showNotification) showNotification('Message deleted for everyone', 'success');
    } else {
      const deletedFor = msg.deletedFor || [];
      if (!deletedFor.includes(user.email)) {
        await update(ref(db, `live_rooms/${roomId}/messages/${msgId}`), {
          deletedFor: [...deletedFor, user.email]
        });
        if (showNotification) showNotification('Message deleted for you', 'success');
      }
    }
  };

  return (
    <div className="live-chat-container">
      <div className="live-chat-header">
        <h2>
          <div className="live-indicator"></div>
          Live Collaborative Chat (Demo)
        </h2>
        <span className="messages-badge">{messages.length} messages</span>
      </div>

      <div className="live-chat-messages">
        {isLoading ? (
          <div className="skeleton-container">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`skeleton-message-wrapper ${i % 2 === 0 ? 'user' : 'other'}`}>
                <div className="skeleton-sender"></div>
                <div className="skeleton-message">
                  <div className="skeleton-line" style={{ width: `${Math.random() * 40 + 40}%` }}></div>
                  {i % 3 === 0 && <div className="skeleton-line" style={{ width: `${Math.random() * 30 + 20}%` }}></div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <LiveMessageItem 
                key={msg.id}
                msg={msg}
                isCurrentUser={user ? msg.senderId === user.email : false}
                currentUserId={user?.email || ''}
                onReply={setReplyingTo}
                onReact={handleReact}
                onDelete={handleDelete}
                onVote={handleVote}
                allMessages={messages}
              />
            ))}
            {isTyping && (
              <div className="message-wrapper other ai-message">
                <div className="message-sender">UnityDev AI</div>
                <div className="message assistant">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="live-chat-input-area">
        {replyingTo && (
          <div className="replying-to-banner">
            <div className="replying-to-content">
              <span className="replying-to-name">Replying to {replyingTo.senderName}</span>
              <span className="replying-to-text">{replyingTo.text.substring(0, 50)}{replyingTo.text.length > 50 ? '...' : ''}</span>
            </div>
            <button className="cancel-reply-btn" onClick={() => setReplyingTo(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}
        <ChatInput 
          onSend={(text) => handleSendMessage(text)}
          disabled={!user || isTyping}
          placeholder={user ? "Type a message, /poll, or @AI..." : "Please login to chat"}
          t={{ send: 'Send', attach: 'Attach' }}
        />
      </div>

      <PollCreatorModal 
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onSubmit={handleCreatePoll}
        initialQuestion={pollInitialQuestion}
      />
    </div>
  );
};

export default LiveChatRoom;
