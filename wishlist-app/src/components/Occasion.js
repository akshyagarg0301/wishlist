import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';


export default function Occasion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [occasion, setOccasion] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    purchaseLink: '',
  });
  const isExpired = Boolean(occasion?.expired);

  useEffect(() => {
    loadData();
  }, [id, user]);

  async function loadData() {
    setLoading(true);
    try {
      const occasionData = await api.getOccasion(id);
      setOccasion(occasionData);

      const recipientId = user;
      const isOwnerCheck = occasionData.recipientId === recipientId;
      setIsOwner(isOwnerCheck);

      let giftsData;
      if (isOwnerCheck) {
        giftsData = await api.getGifts();
        giftsData = giftsData.filter((g) => g.occasionId === id);
      } else {
        giftsData = await api.getOccasionGifts(id);
      }
      setGifts(giftsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleCreateGift(e) {
    e.preventDefault();
    if (isExpired) {
      setError('Expired occasions can only be deleted');
      return;
    }
    if (!formData.name || !formData.purchaseLink) {
      setError('Name and purchase link required');
      return;
    }
    try {
      const newGift = await api.createGift({ ...formData, occasionId: id });
      setGifts((current) => [...current, newGift]);
      setShowGiftModal(false);
      setFormData({ name: '', description: '', imageUrl: '', purchaseLink: '' });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteGift(giftId) {
    if (isExpired) {
      setError('Expired occasions can only be deleted');
      return;
    }
    if (!confirm('Delete this gift?')) return;
    try {
      await api.deleteGift(giftId);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReserve(giftId) {
    try {
      await api.reserveGift(giftId, 'Guest', 'guest@example.com');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePurchase(giftId) {
    try {
      await api.purchaseGift(giftId, 'Guest', 'guest@example.com');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const shareUrl = `${window.location.origin}/occasion/${id}`;

  if (loading) {
    return <div className="page"><div className="empty-state">Loading...</div></div>;
  }

  if (error && !occasion) {
    return (
      <div className="page">
        <div className="empty-state error">{error}</div>
        <Link to="/" className="ghost">← Back to My Wishlists</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="topbar">
        <div className="brand" onClick={() => navigate('/')}>
          <span className="brand-icon">🎁</span>
          <span className="brand-name">Giftly</span>
        </div>
        <div className="nav-actions">
          <button className="ghost" onClick={() => navigate('/')}>
            ��� Back to My Wishlists
          </button>
        </div>
      </nav>

      <section className="section detail">
        <div className="banner">
          <div>
            <span className="pill">{isExpired ? 'Expired' : 'Occasion'}</span>
            <h2>{occasion?.title}</h2>
            <p>
              {occasion?.eventDate || 'No date'}
              {isExpired ? ' · Expired' : ''}
            </p>
          </div>
          {isOwner && !isExpired && (
            <button className="primary" onClick={() => setShowGiftModal(true)}>
              + New Gift
            </button>
          )}
        </div>

        {isOwner && isExpired && (
          <div className="empty-state" style={{ marginTop: 12 }}>
            This occasion is expired. It can only be deleted.
          </div>
        )}

        {isOwner && (
          <div className="section-head row" style={{ marginTop: 12 }}>
            <div>
              <h3>Share this occasion</h3>
              <p>Send this link to friends so they can reserve or purchase gifts.</p>
            </div>
            <div className="footer-actions">
              <button className="ghost" onClick={() => setShowShareModal(true)}>
                Share Link
              </button>
            </div>
          </div>
        )}

        <h3 className="subhead">Gift Items</h3>
        {gifts.length === 0 && (
          <div className="empty-state">
            {isOwner && isExpired
              ? 'This occasion is expired. It can only be deleted.'
              : isOwner
              ? 'No gifts added yet. Click "+ New Gift" to add your first item.'
              : 'No gifts have been added yet.'}
          </div>
        )}
        <div className="gift-list">
          {gifts.map((item) => (
            <div key={item.id} className={`gift-card ${item.status === 'PURCHASED' ? 'purchased' : ''}`}>
              <div className="gift-thumb gold">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : null}
              </div>
              <div className="gift-info">
                <h4>{item.name}</h4>
                <p>{item.description || 'No description'}</p>
                <div className="hint">
                  {item.status === 'AVAILABLE'
                    ? 'Available'
                    : item.buyerName
                    ? `Buyer: ${item.buyerName}`
                    : 'Buyer hidden'}
                </div>
                {isOwner && !isExpired && (
                  <div className="actions">
                    <button
                      className="ghost small danger"
                      onClick={() => handleDeleteGift(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
                {!isOwner && item.status === 'AVAILABLE' && (
                  <div className="actions">
                    <button className="ghost small" onClick={() => handleReserve(item.id)}>
                      Reserve
                    </button>
                    <button className="primary small" onClick={() => handlePurchase(item.id)}>
                      Mark Purchased
                    </button>
                  </div>
                )}
              </div>
              <div className="price">{item.status}</div>
            </div>
          ))}
        </div>
      </section>

      {showGiftModal && (
        <div className="modal" onClick={() => setShowGiftModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setShowGiftModal(false)}>
              ×
            </button>
            <h3>Add Gift Item</h3>
            <form onSubmit={handleCreateGift}>
              <label>
                <span className="label-text">
                  Name<span className="required">*</span>
                </span>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Noise Cancelling Headphones"
                />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Over-ear, black."
                ></textarea>
              </label>
              <label>
                Image URL
                <input
                  name="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/hp.jpg"
                />
              </label>
              <label>
                <span className="label-text">
                  Purchase Link<span className="required">*</span>
                </span>
                <input
                  name="purchaseLink"
                  type="url"
                  value={formData.purchaseLink}
                  onChange={handleInputChange}
                  placeholder="https://store.example.com/item"
                />
              </label>
              <button type="submit" className="primary" style={{ marginTop: 12 }}>
                Add Gift
              </button>
              {error && <div className="result error">{error}</div>}
            </form>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="modal" onClick={() => setShowShareModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setShowShareModal(false)}>
              ×
            </button>
            <h3>Share this occasion</h3>
            <label>
              Share Link
              <input type="url" value={shareUrl} readOnly />
            </label>
            <div className="footer-actions">
              <button
                className="ghost"
                onClick={() => navigator.clipboard.writeText(shareUrl)}
              >
                Copy Link
              </button>
              <button
                className="primary"
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(
                      `Here's the gift list: ${shareUrl}`
                    )}`,
                    '_blank'
                  )
                }
              >
                Share on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
