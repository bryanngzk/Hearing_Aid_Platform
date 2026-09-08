import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { conditionClass } from '../data/products.js'
import { generateCouponCode } from '../data/coupons.js'

// Turns a Firestore timestamp into a readable UK date, e.g. "05 Sep 2026"
function formatDate(timestamp) {
  if (!timestamp) return 'Just now';
  return timestamp.toDate().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Clinic-only page for one trade-in: approve/reject it and publish it as a listing
function TradeInDetail() {
  const { tradeInId } = useParams();

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [isClinic, setIsClinic] = useState(false);

  const [tradeIn, setTradeIn] = useState(null);
  const [loadingTradeIn, setLoadingTradeIn] = useState(true);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [couponPercent, setCouponPercent] = useState('');

  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const snapshot = await getDoc(doc(db, 'users', currentUser.uid));
        setIsClinic(snapshot.exists() && snapshot.data().role === 'clinic');
      }

      setAuthChecked(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isClinic) return;

    getDoc(doc(db, 'tradeIns', tradeInId))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() };
          setTradeIn(data);
          setPrice(data.price != null ? String(data.price) : '');
          setDescription(data.description || '');
        }
      })
      .finally(() => setLoadingTradeIn(false));

    getDoc(doc(db, 'listings', tradeInId)).then((snapshot) => {
      if (snapshot.exists()) {
        setBrand(snapshot.data().brand || '');
      }
    });
  }, [isClinic, tradeInId]);

  // Approves or rejects the trade-in, issuing a coupon if a percentage was entered
  const handleDecision = async (status) => {
    setStatusError('');
    setUpdatingStatus(true);
    try {
      await updateDoc(doc(db, 'tradeIns', tradeInId), {
        status,
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
      });

      const percent = parseFloat(couponPercent) || 0;
      if (status === 'approved' && percent > 0) {
        await setDoc(doc(db, 'coupons', generateCouponCode()), {
          donorId: tradeIn.donorId,
          donorName: tradeIn.donorName,
          donorEmail: tradeIn.donorEmail,
          tradeInId,
          deviceModel: tradeIn.deviceModel,
          condition: tradeIn.condition,
          percentOff: percent,
          status: 'active',
          createdAt: serverTimestamp(),
        });
      }

      setTradeIn((current) => ({ ...current, status }));
    } catch {
      setStatusError('Could not update this trade-in. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Saves the price/description on the trade-in and publishes/updates its public listing
  const handleSaveListing = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaved(false);

    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setSaveError('Please enter a valid price.');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'tradeIns', tradeInId), {
        price: parsedPrice,
        description,
        updatedAt: serverTimestamp(),
      });

      const listingRef = doc(db, 'listings', tradeInId);
      const listingSnapshot = await getDoc(listingRef);
      await setDoc(listingRef, {
        brand,
        model: tradeIn.deviceModel,
        condition: tradeIn.condition,
        image: tradeIn.photos?.[0] || '',
        price: parsedPrice,
        description,
        updatedAt: serverTimestamp(),
        ...(listingSnapshot.exists() ? {} : { status: 'available', createdAt: serverTimestamp() }),
      }, { merge: true });

      setTradeIn((current) => ({ ...current, price: parsedPrice, description }));
      setSaved(true);
    } catch {
      setSaveError('Could not save the listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked || (isClinic && loadingTradeIn)) {
    return (
      <section id="trade-in-detail" className="section-p1">
        <p>Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section id="trade-in-detail" className="section-p1">
        <p>You need to log in as a partnered clinic to view this page.</p>
        <Link to="/login" className="normal">Log In</Link>
      </section>
    );
  }

  if (!isClinic) {
    return (
      <section id="trade-in-detail" className="section-p1">
        <p>This page is only available to partnered clinic accounts.</p>
      </section>
    );
  }

  if (!tradeIn) {
    return (
      <section id="trade-in-detail" className="section-p1">
        <p>Trade-in not found.</p>
        <Link to="/clinic-approval" className="normal">Back to Trade-In Approvals</Link>
      </section>
    );
  }

  return (
    <section id="trade-in-detail" className="section-p1">
      <Link to="/clinic-approval" className="trade-in-detail-back">
        <i className="fa-solid fa-arrow-left"></i> Back to Trade-In Approvals
      </Link>

      <div className="trade-in-detail-card">
        <div className="trade-in-detail-photos">
          {tradeIn.photos && tradeIn.photos.length > 0 ? (
            tradeIn.photos.map((photo, i) => (
              <img src={photo} alt={`${tradeIn.deviceModel} ${i + 1}`} key={i} />
            ))
          ) : (
            <div className="trade-in-detail-no-photo">No photos provided</div>
          )}
        </div>

        <div className="trade-in-detail-des">
          <span className="trade-in-detail-id">{tradeIn.id}</span>
          <h2>{tradeIn.deviceModel}</h2>

          <span className={`listing-condition ${conditionClass[tradeIn.condition] || ''}`}>
            {tradeIn.condition}
          </span>
          <span className={`trade-in-detail-status status-${tradeIn.status}`}>
            {tradeIn.status}
          </span>

          <div className="trade-in-detail-donor">
            <p><i className="fa-solid fa-user"></i> {tradeIn.donorName}</p>
            <p><i className="fa-solid fa-envelope"></i> {tradeIn.donorEmail}</p>
            <p><i className="fa-solid fa-calendar"></i> Submitted {formatDate(tradeIn.createdAt)}</p>
          </div>

          {tradeIn.status === 'pending' && (
            <div className="trade-in-detail-field trade-in-detail-coupon-field">
              <label htmlFor="coupon-percent">Coupon % (optional)</label>
              <input
                id="coupon-percent"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 10"
                value={couponPercent}
                onChange={(e) => setCouponPercent(e.target.value)}
              />
            </div>
          )}

          {tradeIn.status === 'pending' && (
            <div className="trade-in-detail-actions">
              <button
                type="button"
                className="normal trade-in-detail-approve"
                disabled={updatingStatus}
                onClick={() => handleDecision('approved')}
              >
                Approve
              </button>
              <button
                type="button"
                className="normal trade-in-detail-reject"
                disabled={updatingStatus}
                onClick={() => handleDecision('rejected')}
              >
                Reject
              </button>
            </div>
          )}
          {statusError && <p className="trade-in-detail-error">{statusError}</p>}

          {tradeIn.status === 'rejected' && (
            <p className="trade-in-detail-note">This trade-in was rejected and can't be listed.</p>
          )}

          {tradeIn.status === 'approved' && (
            <form className="trade-in-detail-listing" onSubmit={handleSaveListing}>
              <h4>Listing Details</h4>

              <div className="trade-in-detail-field">
                <label htmlFor="brand">Brand</label>
                <input
                  id="brand"
                  type="text"
                  placeholder="e.g. Phonak"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </div>

              <div className="trade-in-detail-field">
                <label htmlFor="price">Price (£)</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="trade-in-detail-field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  rows="8"
                  placeholder={'Condition & History\nAge of Device: ...\nCosmetic condition: ...\nBattery type: ...\n\nTechnical Specifications\nHearing loss range: ...\nCompatibility with Phonak app: ...\n\nThis item has been verified by [Clinic], tested/calibrated with no issues.'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {saveError && <p className="trade-in-detail-error">{saveError}</p>}
              {saved && <p className="trade-in-detail-saved">Listing saved.</p>}

              <button type="submit" className="normal trade-in-detail-submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Listing'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default TradeInDetail;
