import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';


export default function Home() {
  const { user, loading: authLoading, login, logout, signup } = useAuth();
  const navigate = useNavigate();
  
  const isLoggedIn = !authLoading && user && typeof user === 'string' && user.trim().length > 0;
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [occasions, setOccasions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    title: '',
    eventDate: '',
    imageUrl: '',
  });
  const today = getTodayDateValue();

  useEffect(() => {
    if (user) {
      loadOccasions();
    }
  }, [user]);

  async function loadOccasions() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getOccasions();
      setOccasions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    try {
      await login(formData.email, formData.password);
      setShowAuthModal(false);
      loadOccasions();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) {
      setError('Name required');
      return;
    }
    try {
      await signup(formData.name, formData.email, formData.password);
      setAuthTab('login');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateOccasion(e) {
    e.preventDefault();
    if (!formData.title) {
      setError('Title required');
      return;
    }
    if (formData.eventDate && formData.eventDate < today) {
      setError('Event date must be today or in the future');
      return;
    }
    try {
      const newOccasion = await api.createOccasion({
        title: formData.title,
        eventDate: formData.eventDate || null,
        imageUrl: formData.imageUrl,
      });
      setShowCreateModal(false);
      setFormData({ ...formData, title: '', eventDate: '', imageUrl: '' });
      setOccasions([...occasions, newOccasion]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteOccasion(id) {
    if (!confirm('Delete this occasion?')) return;
    try {
      await api.deleteOccasion(id);
      loadOccasions();
    } catch (err) {
      setError(err.message);
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
          <a href="#my" className="nav-link">My Wishlists</a>
        </div>
        <div className="nav-actions">
          {isLoggedIn ? (
            <button className="ghost" onClick={logout}>
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
          <h1>Create wishlists for every occasion.</h1>
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
            <p>Add items you love to receive for any occasion.</p>
          </div>
          <div className="info-card">
            <div className="icon">👥</div>
            <h3>Share with friends</h3>
            <p>Your friends can browse your wishlist and see what you're hoping for.</p>
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
            <h2>My Wishlists</h2>
            <p>Create and manage your gift wishlists.</p>
          </div>
          {isLoggedIn ? (
            <button className="primary" onClick={() => setShowCreateModal(true)}>
              + New Wishlist
            </button>
          ) : null}
        </div>
        <div className="wishlist-grid">
          {!user && (
            <>
              <article className="wishlist-card">
                <div className="wishlist-cover cover-a"></div>
                <div className="wishlist-body">
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
              <article className="wishlist-card">
                <div className="wishlist-cover cover-b"></div>
                <div className="wishlist-body">
                  <span className="pill">Christmas</span>
                  <h3>Holiday Wishlist 2026</h3>
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
            occasions.length === 0 &&
            !error && <div className="empty-state">You have no wishlists yet.</div>}
          {isLoggedIn && occasions.length > 0 && (
            <div className="grid-contents">
              {occasions.map((item, index) => (
                <article
                  key={item.id}
                  className="wishlist-card"
                  onClick={() => navigate(`/occasion/${item.id}`)}
                >
                  <div
                    className={`wishlist-cover ${
                      ['cover-a', 'cover-b', 'cover-c'][index % 3]
                    }`}
                  ></div>
                  <div className="wishlist-body">
                    <span className="pill">{item.expired ? 'Expired' : 'Occasion'}</span>
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
                          handleDeleteOccasion(item.id);
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
            <h3>Create Occasion</h3>
            <p className="hint">Add the occasion details below.</p>
            <form onSubmit={handleCreateOccasion}>
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
                Add Occasion
              </button>
              {error && <div className="result error">{error}</div>}
            </form>
          </div>
        </div>
      )}
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
