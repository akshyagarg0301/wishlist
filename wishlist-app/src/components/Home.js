import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, resolveApiUrl } from '../services/api';
import { LoadingOverlay, ConfirmDialog } from './FeedbackChrome';
import defaultEventImage from '../assets/default-event.svg';


export default function Home() {
  const { user, loading: authLoading, login, logout, signup } = useAuth();
  const navigate = useNavigate();
  
  const isLoggedIn = !authLoading && user && typeof user === 'string' && user.trim().length > 0;
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyMessage, setBusyMessage] = useState('');
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: 'Confirm action',
    message: 'Are you sure you want to continue?',
    confirmLabel: 'Confirm',
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    title: '',
    eventDate: '',
    imageUrl: '',
  });
  const today = getTodayDateValue();
  const confirmResolverRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  async function loadEvents() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function showBusy(message) {
    setBusyMessage(message);
  }

  function hideBusy() {
    setBusyMessage('');
  }

  function confirmAction({ title, message, confirmLabel = 'Confirm' }) {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmState({
        open: true,
        title,
        message,
        confirmLabel,
      });
    });
  }

  function resolveConfirmation(value) {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(value);
      confirmResolverRef.current = null;
    }
    setConfirmState((current) => ({ ...current, open: false }));
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    if (!formData.email.trim() || !formData.password) {
      setError('Email and password required');
      return;
    }
    setShowAuthModal(false);
    showBusy('Signing in...');
    try {
      await login(formData.email, formData.password);
      await loadEvents();
    } catch (err) {
      setError(err.message);
      setAuthTab('login');
      setShowAuthModal(true);
    } finally {
      hideBusy();
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) {
      setError('Name required');
      return;
    }
    setShowAuthModal(false);
    showBusy('Creating account...');
    try {
      await signup(formData.name, formData.email, formData.password);
      setAuthTab('login');
      setFormData((current) => ({
        ...current,
        name: '',
        password: '',
      }));
      setShowAuthModal(true);
    } catch (err) {
      setError(err.message);
      setAuthTab('signup');
      setShowAuthModal(true);
    } finally {
      hideBusy();
    }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    setError('');
    if (!formData.title) {
      setError('Event title required');
      return;
    }
    if (formData.eventDate && formData.eventDate < today) {
      setError('Event date must be today or in the future');
      return;
    }
    setShowCreateModal(false);
    showBusy('Creating event...');
    try {
      const newEvent = await api.createEvent({
        title: formData.title,
        eventDate: formData.eventDate || null,
        imageUrl: formData.imageUrl,
      });
      setFormData((current) => ({ ...current, title: '', eventDate: '', imageUrl: '' }));
      setEvents((current) => [...current, newEvent]);
    } catch (err) {
      setError(err.message);
      setShowCreateModal(true);
    } finally {
      hideBusy();
    }
  }

  async function handleDeleteEvent(id) {
    setError('');
    const confirmed = await confirmAction({
      title: 'Delete event',
      message: 'This event will be removed permanently.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    showBusy('Deleting event...');
    try {
      await api.deleteEvent(id);
      await loadEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      hideBusy();
    }
  }

  async function handleLogout() {
    setError('');
    showBusy('Signing out...');
    try {
      await logout();
      setEvents([]);
    } catch (err) {
      setError(err.message);
    } finally {
      hideBusy();
    }
  }

  return (
    <div className="page">
      <nav className="topbar">
        <div className="brand" onClick={() => navigate('/')}>
          <span className="brand-icon">🎁</span>
          <span className="brand-name">Giftly</span>
        </div>
        <div className="nav-links">
          <a href="#home" className="nav-link active">Home</a>
          <a href="#my" className="nav-link">My Events</a>
        </div>
        <div className="nav-actions">
          {isLoggedIn ? (
            <button className="ghost" onClick={handleLogout}>
              Sign Out
            </button>
          ) : (
            <button className="ghost" onClick={() => setShowAuthModal(true)}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      <section id="home" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Every gift tells a story</p>
          <h1>Create gift plans for every event.</h1>
          <p className="lede">
            Recipients add gift ideas and share with friends. Friends mark items as
            purchased for joyful surprises.
          </p>
        </div>
        <div className="hero-media">
          <div className="hero-image"></div>
        </div>
      </section>

      <section className="how" aria-label="How it works">
        <div className="section-head">
          <h2>How it works</h2>
          <p>Three simple steps to perfect gifting.</p>
        </div>
        <div className="card-grid">
          <div className="info-card">
            <div className="icon">🎀</div>
            <h3>Create your list</h3>
            <p>Add items you would love to receive for any event.</p>
          </div>
          <div className="info-card">
            <div className="icon">👥</div>
            <h3>Share with friends</h3>
            <p>Your friends can browse your event and see what you're hoping for.</p>
          </div>
          <div className="info-card">
            <div className="icon">❤️</div>
            <h3>Gift with joy</h3>
            <p>Friends mark items as purchased—no duplicate surprises.</p>
          </div>
        </div>
        {!user && (
          <button className="primary center" onClick={() => setShowAuthModal(true)}>
            Get Started →
          </button>
        )}
      </section>

      <section id="my" className="section">
        <div className="section-head row">
          <div>
            <h2>My Events</h2>
            <p>Create and manage your gift events.</p>
          </div>
          {isLoggedIn ? (
            <button className="primary" onClick={() => setShowCreateModal(true)}>
              + New Event
            </button>
          ) : null}
        </div>
        <div className="event-grid">
          {!user && (
            <>
              <article className="event-card">
                <div className="event-cover cover-a"></div>
                <div className="event-body">
                  <span className="pill">Birthday</span>
                  <h3>My 30th Birthday</h3>
                  <div className="meta">
                    <span>Apr 15, 2026</span>
                    <span>1/3 purchased</span>
                  </div>
                  <div className="progress">
                    <span style={{ width: '33%' }}></span>
                  </div>
                </div>
              </article>
              <article className="event-card">
                <div className="event-cover cover-b"></div>
                <div className="event-body">
                  <span className="pill">Christmas</span>
                  <h3>Holiday Event 2026</h3>
                  <div className="meta">
                    <span>Dec 25, 2026</span>
                    <span>0/2 purchased</span>
                  </div>
                  <div className="progress">
                    <span style={{ width: '10%' }}></span>
                  </div>
                </div>
              </article>
            </>
          )}
          {isLoggedIn && loading && <div className="empty-state">Loading...</div>}
          {isLoggedIn &&
            !loading &&
            events.length === 0 &&
            !error && <div className="empty-state">You have no events yet.</div>}
          {isLoggedIn && events.length > 0 && (
            <div className="grid-contents">
              {events.map((item) => (
                <article
                  key={item.id}
                  className="event-card"
                  onClick={() => navigate(`/event/${item.id}`)}
                >
                  <div className="event-cover">
                    <img
                      src={item.imageUrl ? resolveApiUrl(item.imageUrl) : defaultEventImage}
                      alt={item.title}
                      className="event-image"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = defaultEventImage;
                      }}
                    />
                  </div>
                  <div className="event-body">
                    <span className="pill">{item.expired ? 'Expired' : 'Event'}</span>
                    <h3>{item.title}</h3>
                    <div className="meta">
                      <span>
                        {item.eventDate || 'No date'}
                        {item.expired ? ' · Expired' : ''}
                      </span>
                    </div>
                    <div className="actions">
                      <button
                        className="ghost small danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(item.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {showAuthModal && (
        <div className="modal" onClick={() => setShowAuthModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setShowAuthModal(false)}>
              ×
            </button>
            <div className="auth-tabs">
              <button
                className={`auth-tab ${authTab === 'login' ? 'active' : ''}`}
                onClick={() => setAuthTab('login')}
              >
                Login
              </button>
              <button
                className={`auth-tab ${authTab === 'signup' ? 'active' : ''}`}
                onClick={() => setAuthTab('signup')}
              >
                Sign Up
              </button>
            </div>
            {authTab === 'login' ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <h3>Login</h3>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="alex@example.com"
                  />
                </label>
                <label>
                  Password
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••"
                  />
                </label>
                <button type="submit" className="primary">
                  Login
                </button>
                {error && <div className="result error">{error}</div>}
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSignup}>
                <h3>Sign Up</h3>
                <label>
                  Name
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Alex"
                  />
                </label>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="alex@example.com"
                  />
                </label>
                <label>
                  Password
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••"
                  />
                </label>
                <button type="submit" className="ghost">
                  Create Account
                </button>
                {error && <div className="result error">{error}</div>}
              </form>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setShowCreateModal(false)}>
              ×
            </button>
            <h3>Create Event</h3>
            <p className="hint">Add the event details below.</p>
            <form onSubmit={handleCreateEvent}>
              <label>
                Title
                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Birthday"
                />
              </label>
              <label>
                Date
                <input
                  name="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  min={today}
                />
              </label>
              <label>
                Image URL
                <input
                  name="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/bday.jpg"
                />
              </label>
              <button type="submit" className="primary" style={{ marginTop: 12 }}>
                Add Event
              </button>
              {error && <div className="result error">{error}</div>}
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={() => resolveConfirmation(true)}
        onCancel={() => resolveConfirmation(false)}
      />
      <LoadingOverlay message={busyMessage} />
    </div>
  );
}

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
