import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { BACKEND_URL } from '../utils/api';
import styles from './EternalAIAssistant.module.css';

const publicQuickPrompts = [
  'Find easy tours',
  'Show affordable tours under $500',
  'What tours are available this month?',
];

const userQuickPrompts = [
  'Show my bookings',
  'Show upcoming trips only',
  'Show bookings with failed payment',
  'What trips do I have this month?',
];

const getImageSrc = (imagePath) => {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${BACKEND_URL || ''}/${imagePath.replace(/^\/+/, '')}`;
};

export default function EternalAIAssistant({ open, onClose, userRole, memoryKey }) {
  const [input, setInput] = useState('');
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I’m your Eternal AI Assistant. I can answer tour questions for everyone. Sign in with a user account if you want me to look up your private bookings.',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const canViewBookings = userRole === 'user';
  const quickPrompts = canViewBookings ? userQuickPrompts : publicQuickPrompts;

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text: canViewBookings
          ? 'Hello! I’m your Eternal AI Assistant. I can answer tour questions and look up your own bookings. I can’t change reservations or payments.'
          : 'Hello! I’m your Eternal AI Assistant. I can answer questions about our tours. Sign in with a user account to get help with your bookings.',
      },
    ]);
    setInput('');
  }, [canViewBookings, memoryKey, userRole]);

  useEffect(() => {
    if (!open) return undefined;

    const previousActiveElement = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = document.querySelectorAll(
        '#eternal-ai-assistant button:not(:disabled), #eternal-ai-assistant input:not(:disabled)'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    inputRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previousActiveElement?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const handleSubmit = async (promptText) => {
    const nextText = (promptText ?? input).trim();
    if (!nextText) return;

    const history = messages
      .filter((message) => ['user', 'assistant'].includes(message.role))
      .slice(-8)
      .map(({ role, text }) => ({ role, content: text }));
    setMessages((prev) => [...prev, { role: 'user', text: nextText }]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/eternal-ai-assistant/chat', {
        message: nextText,
        history,
      });
      const assistantReply =
        response.data?.data?.reply || 'I could not fetch that information right now.';
      const records = response.data?.data?.records || [];
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: assistantReply,
          tools: response.data?.data?.toolsUsed || [],
          records,
        },
      ]);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || 'I could not answer that request right now.';
      setMessages((prev) => [...prev, { role: 'assistant', text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <section
        id="eternal-ai-assistant"
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="eternal-ai-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.identity}>
            <span className={styles.logo} aria-hidden="true">
              ✦
            </span>
            <div>
              <h2 id="eternal-ai-title">Eternal AI Assistant</h2>
              <p className={styles.notice}>Your personal, read-only trip companion</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close Eternal AI Assistant"
          >
            ×
          </button>
        </div>

        <div className={styles.chatBox} ref={chatBoxRef} role="log" aria-live="polite">
          {messages.map((message, idx) => (
            <div
              key={`${message.role}-${idx}`}
              className={`${styles.bubble} ${styles[message.role]}`}
            >
              <div className={styles.avatar}>{message.role === 'assistant' ? 'E' : 'Y'}</div>
              <div className={styles.messageContent}>
                <p>{message.text}</p>
                {message.records?.length > 0 && (
                  <div className={styles.records}>
                    {message.records.map((record, recordIdx) => (
                      <div
                        key={`${record?.tour?.id || record?.bookingId || recordIdx}`}
                        className={styles.recordCard}
                      >
                        <strong>
                          {record.tour?.name || record.tourName || record.name || 'Trip detail'}
                        </strong>
                        {record.summary || record.tour?.summary ? (
                          <span>{record.summary || record.tour.summary}</span>
                        ) : null}
                        {record.bookingId ? <span>Booking: {record.bookingId}</span> : null}
                        {record.paymentStatus ? <span>Payment: {record.paymentStatus}</span> : null}
                        {record.tour?.difficulty ? (
                          <span>Difficulty: {record.tour.difficulty}</span>
                        ) : null}
                        {record.price !== undefined ? <span>Price: $ {record.price}</span> : null}
                        {record.discount > 0 ? <span>Discount: $ {record.discount}</span> : null}
                        {record.rating ? (
                          <span>
                            Rating: {record.rating}
                            {record.reviewCount ? ` (${record.reviewCount} reviews)` : ''}
                          </span>
                        ) : null}
                        {record.tour?.durationDays ? (
                          <span>Duration: {record.tour.durationDays} days</span>
                        ) : null}
                        {record.tour?.startLocation ? (
                          <span>Start: {record.tour.startLocation}</span>
                        ) : null}
                        {record.tour?.startDates?.length > 0 ? (
                          <span>Dates: {record.tour.startDates.join(', ')}</span>
                        ) : record.startDates?.length > 0 ? (
                          <span>Dates: {record.startDates.join(', ')}</span>
                        ) : record.id ? (
                          <span>No upcoming departures listed</span>
                        ) : null}
                        {record.tour?.itinerary?.length > 0 ? (
                          <span>
                            Itinerary:{' '}
                            {record.tour.itinerary
                              .map((item) =>
                                [
                                  item.day ? `Day ${item.day}` : null,
                                  item.address,
                                  item.description,
                                ]
                                  .filter(Boolean)
                                  .join(' — ')
                              )
                              .join('; ')}
                          </span>
                        ) : null}
                        {(record.tour?.id || record.id) && (
                          <Link
                            className={styles.tourLink}
                            to={`/tour/${record.tour?.id || record.id}`}
                            onClick={onClose}
                          >
                            View tour
                          </Link>
                        )}
                        {(record.tour?.image || record.image) && (
                          <img
                            className={styles.tourImage}
                            src={getImageSrc(record.tour?.image || record.image)}
                            alt={`${record.tour?.name || record.name || 'Tour'} tour`}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.hidden = true;
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className={`${styles.bubble} ${styles.assistant}`}>
              <div className={styles.avatar}>E</div>
              <div className={styles.messageContent}>
                <p>Thinking...</p>
              </div>
            </div>
          )}
        </div>

        <div className={styles.quickPrompts}>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSubmit(prompt)}
              disabled={loading}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className={styles.composer}>
          <p className={styles.privacyNotice}>
            {canViewBookings
              ? 'Recent messages and requested booking details are sent to Gemini. Use synthetic data only with the free tier.'
              : 'Messages are sent to Gemini. Use synthetic data only with the free tier.'}
          </p>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={2000}
              placeholder={
                canViewBookings ? 'Ask about your bookings or tours...' : 'Ask about our tours...'
              }
              aria-label="Message Eternal AI Assistant"
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {loading ? 'Thinking...' : 'Send'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
