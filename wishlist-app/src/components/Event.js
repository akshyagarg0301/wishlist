import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, resolveApiUrl } from '../services/api';
import { LoadingOverlay, ConfirmDialog } from './FeedbackChrome';
import defaultEventImage from '../assets/default-event.svg';


export default function Event() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [error, setError] = useState('');
  const [giftPreviewLoading, setGiftPreviewLoading] = useState(false);
  const [busyMessage, setBusyMessage] = useState('');
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: 'Confirm action',
    message: 'Are you sure you want to continue?',
    confirmLabel: 'Confirm',
  });
  const [guestIdentity, setGuestIdentity] = useState({
    verified: false,
    name: '',
    email: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    purchaseLink: '',
  });
  const isExpired = Boolean(event?.expired);
  const confirmResolverRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [id, user]);

  async function loadData() {
    setLoading(true);
    try {
      setError('');
      const pageData = await api.getEventPage(id);
      setEvent(pageData.event);
      setIsOwner(Boolean(pageData.owner));
      setGuestIdentity({
        verified: Boolean(pageData.guestVerified),
        name: pageData.guestName || '',
        email: pageData.guestEmail || '',
      });
      setGifts(pageData.gifts || []);
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

  function looksLikeProductLink(value) {
    if (!value) {
      return false;
    }
    try {
      const normalized = value.startsWith('http://') || value.startsWith('https://')
        ? value
        : `https://${value}`;
      const url = new URL(normalized);
      return Boolean(url.hostname && url.hostname.includes('.'));
    } catch (err) {
      return false;
    }
  }

  async function handleFetchProductDetails(link = formData.purchaseLink, options = {}) {
    const { silent = false } = options;
    if (!link) {
      return;
    }
    setGiftPreviewLoading(true);
    try {
      const product = await api.previewImport(link);
      setFormData((current) => ({
        ...current,
        name: current.name || product.name || '',
        description: current.description || product.description || '',
        imageUrl: current.imageUrl || product.imageUrl || '',
        purchaseLink: product.purchaseLink || current.purchaseLink || link,
      }));
      if (!silent) {
        setError('');
      }
    } catch (err) {
      if (!silent) {
        setError(err.message);
      }
    } finally {
      setGiftPreviewLoading(false);
    }
  }

  async function handleCreateGift(e) {
    e.preventDefault();
    setError('');
    if (isExpired) {
      setError('Expired events can only be deleted');
      return;
    }
    if (!formData.purchaseLink) {
      setError('Purchase link required');
      return;
    }
    setShowGiftModal(false);
    showBusy('Adding gift...');
    try {
      const newGift = await api.createGift({ ...formData, eventId: id });
      setGifts((current) => [...current, newGift]);
      setFormData({ name: '', description: '', imageUrl: '', purchaseLink: '' });
      setError('');
    } catch (err) {
      setError(err.message);
      setShowGiftModal(true);
    } finally {
      hideBusy();
    }
  }

  async function handleDeleteGift(giftId) {
    setError('');
    if (isExpired) {
      setError('Expired events can only be deleted');
      return;
    }
    const confirmed = await confirmAction({
      title: 'Delete gift',
      message: 'This gift item will be removed permanently.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    showBusy('Deleting gift...');
    try {
      await api.deleteGift(giftId);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      hideBusy();
    }
  }

  async function handleReserve(giftId) {
    setError('');
    if (!guestIdentity.verified || !guestIdentity.name || !guestIdentity.email) {
      setError('Sign in is required to reserve gifts');
      return;
    }
    showBusy('Reserving gift...');
    try {
      await api.reserveGift(giftId, guestIdentity.name, guestIdentity.email);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      hideBusy();
    }
  }

  async function handlePurchase(giftId) {
    setError('');
    if (!guestIdentity.verified || !guestIdentity.name || !guestIdentity.email) {
      setError('Sign in is required to purchase gifts');
      return;
    }
    showBusy('Marking gift as purchased...');
    try {
      await api.purchaseGift(giftId, guestIdentity.name, guestIdentity.email);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      hideBusy();
    }
  }

  function getStatusMeta(status) {
    switch (status) {
      case 'PURCHASED':
        return { label: 'Purchased', className: 'purchased' };
      case 'RESERVED':
        return { label: 'Reserved', className: 'reserved' };
      default:
        return { label: 'Available', className: 'available' };
    }
  }

  function getOwnerHint(item) {
    if (item.status === 'AVAILABLE') {
      return '';
    }
    if (item.buyerName) {
      return `Buyer: ${item.buyerName}`;
    }
    return 'Buyer hidden';
  }

  function getGuestHint(status) {
    if (status === 'RESERVED') {
      return 'Someone has already reserved this gift.';
    }
    if (status === 'PURCHASED') {
      return 'This gift has already been purchased.';
    }
    return '';
  }

  function truncateWords(text, wordLimit = 25) {
    const normalized = (text || '').trim();
    if (!normalized) {
      return 'No description';
    }
    const words = normalized.split(/\s+/);
    if (words.length <= wordLimit) {
      return normalized;
    }
    return `${words.slice(0, wordLimit).join(' ')}...`;
  }

  const shareUrl = `${window.location.origin}/event/${id}`;

  if (loading) {
    return <div className="page"><div className="empty-state">Loading...</div></div>;
  }

  if (error && !event) {
    return (
      <div className="page">
        <div className="empty-state error">{error}</div>
        <Link to="/" className="ghost">← Back to My Events</Link>
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
            ← Back to My Events
          </button>
        </div>
      </nav>

      <section className="section detail">
        <div className="banner">
          <div className="banner-copy">
            <span className="pill">{isExpired ? 'Expired' : 'Event'}</span>
            <h2>{event?.title}</h2>
            <p>
              {event?.eventDate || 'No date'}
              {isExpired ? ' · Expired' : ''}
            </p>
          </div>
          <div className="banner-media">
            <img
              src={event?.imageUrl ? resolveApiUrl(event.imageUrl) : defaultEventImage}
              alt={event?.title || 'Event'}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultEventImage;
              }}
            />
          </div>
          {isOwner && !isExpired && (
            <button className="primary banner-action" onClick={() => setShowGiftModal(true)}>
              + New Gift
            </button>
          )}
        </div>

        {isOwner && isExpired && (
          <div className="empty-state" style={{ marginTop: 12 }}>
            This event is expired. It can only be deleted.
          </div>
        )}

        {isOwner && (
          <div className="section-head row" style={{ marginTop: 12 }}>
            <div>
              <h3>Share this event</h3>
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
        {!isOwner && !guestIdentity.verified && (
          <div className="empty-state" style={{ marginBottom: 12 }}>
            Sign in to reserve or mark gifts as purchased.
          </div>
        )}
        {gifts.length === 0 && (
          <div className="empty-state">
            {isOwner && isExpired
              ? 'This event is expired. It can only be deleted.'
              : isOwner
              ? 'No gifts added yet. Click "+ New Gift" to add your first item.'
              : 'No gifts have been added yet.'}
          </div>
        )}
        <div className="gift-list">
          {gifts.map((item) => {
            const statusMeta = getStatusMeta(item.status);
            const ownerHint = getOwnerHint(item);
            const guestHint = getGuestHint(item.status);

            return (
              <div key={item.id} className={`gift-card ${item.status === 'PURCHASED' ? 'purchased' : ''}`}>
                <div className={`gift-thumb ${item.imageUrl ? 'gold' : 'gift-thumb-fallback'}`} aria-hidden={!item.imageUrl}>
                  {item.imageUrl ? (
                    <img src={resolveApiUrl(item.imageUrl)} alt={item.name} />
                  ) : (
                    <span className="gift-thumb-icon">🎁</span>
                  )}
                </div>
                <div className="gift-info">
                  <h4>{item.name}</h4>
                  <p>{truncateWords(item.description, 25)}</p>
                  {(isOwner ? ownerHint : guestHint) ? (
                    <div className="gift-meta">
                      <span className="hint">
                        {isOwner ? ownerHint : guestHint}
                      </span>
                    </div>
                  ) : null}
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
                      <button
                        className="ghost small"
                        onClick={() => handleReserve(item.id)}
                        disabled={!guestIdentity.verified}
                      >
                        Reserve
                      </button>
                      <button
                        className="primary small"
                        onClick={() => handlePurchase(item.id)}
                        disabled={!guestIdentity.verified}
                      >
                        Mark Purchased
                      </button>
                    </div>
                  )}
                </div>
                <div className={`status-badge ${statusMeta.className}`}>{statusMeta.label}</div>
              </div>
            );
          })}
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
                Name
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
                  onPaste={(e) => {
                    const pastedLink = e.clipboardData?.getData('text') || '';
                    window.setTimeout(() => {
                      if (
                        looksLikeProductLink(pastedLink) &&
                        !formData.name &&
                        !formData.description &&
                        !formData.imageUrl &&
                        !giftPreviewLoading
                      ) {
                        handleFetchProductDetails(pastedLink, { silent: true });
                      }
                    }, 0);
                  }}
                  onBlur={() => {
                    if (
                      looksLikeProductLink(formData.purchaseLink) &&
                      !formData.name &&
                      !formData.description &&
                      !formData.imageUrl &&
                      !giftPreviewLoading
                    ) {
                      handleFetchProductDetails(formData.purchaseLink, { silent: true });
                    }
                  }}
                  placeholder="https://store.example.com/item"
                />
              </label>
              <button type="submit" className="primary" style={{ marginTop: 12 }}>
                {giftPreviewLoading ? 'Fetching product...' : 'Add Gift'}
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
            <h3>Share this event</h3>
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
