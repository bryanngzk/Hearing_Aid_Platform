import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

function formatDate(timestamp) {
  if (!timestamp) return 'Just now';
  return timestamp.toDate().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// To access this page, on the link insert '/redeem-coupon'
function RedeemCoupon() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [isClinic, setIsClinic] = useState(false);

  const [codeInput, setCodeInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [searched, setSearched] = useState(false);
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');

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

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupError('');
    setRedeemError('');
    setCoupon(null);
    setSearched(true);

    const code = codeInput.trim().toUpperCase();
    if (!code) return;

    setLooking(true);
    try {
      const snapshot = await getDoc(doc(db, 'coupons', code));
      if (snapshot.exists()) {
        setCoupon({ id: snapshot.id, ...snapshot.data() });
      }
    } catch {
      setLookupError('Could not look up that code. Please try again.');
    } finally {
      setLooking(false);
    }
  };

  const handleRedeem = async () => {
    setRedeemError('');
    setRedeeming(true);
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), {
        status: 'redeemed',
        redeemedBy: user.uid,
        redeemedAt: serverTimestamp(),
      });
      setCoupon((current) => ({ ...current, status: 'redeemed' }));
    } catch {
      setRedeemError('Could not redeem this coupon. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  if (!authChecked) {
    return (
      <section id="redeem-coupon" className="section-p1">
        <p>Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section id="redeem-coupon" className="section-p1">
        <p>You need to log in as a partnered clinic to view this page.</p>
        <Link to="/login" className="normal">Log In</Link>
      </section>
    );
  }

  if (!isClinic) {
    return (
      <section id="redeem-coupon" className="section-p1">
        <p>This page is only available to partnered clinic accounts.</p>
      </section>
    );
  }

  return (
    <section id="redeem-coupon" className="section-p1">
      <h2>Redeem Coupon</h2>
      <p>Enter a donor's coupon code to look it up and redeem it in store.</p>

      <form className="redeem-coupon-search" onSubmit={handleLookup}>
        <input
          type="text"
          placeholder="Coupon code (e.g. CPN-XXXXXX-XXX)"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
        />
        <button type="submit" className="normal" disabled={looking}>
          {looking ? 'Looking up...' : 'Look Up'}
        </button>
      </form>

      {lookupError && <p className="redeem-coupon-error">{lookupError}</p>}

      {searched && !looking && !lookupError && !coupon && (
        <p className="redeem-coupon-empty">No coupon found with that code.</p>
      )}

      {coupon && (
        <div className="redeem-coupon-card">
          <span className={`redeem-coupon-status status-${coupon.status}`}>
            {coupon.status}
          </span>

          <h4>{coupon.percentOff}% off</h4>
          <p><i className="fa-solid fa-user"></i> {coupon.donorName}</p>
          <p><i className="fa-solid fa-envelope"></i> {coupon.donorEmail}</p>
          <p><i className="fa-solid fa-ear-listen"></i> {coupon.deviceModel} ({coupon.condition})</p>
          <p><i className="fa-solid fa-calendar"></i> Issued {formatDate(coupon.createdAt)}</p>

          {coupon.status === 'redeemed' && (
            <p className="redeem-coupon-redeemed-note">
              Already redeemed {formatDate(coupon.redeemedAt)}.
            </p>
          )}

          {coupon.status === 'active' && (
            <button
              type="button"
              className="normal redeem-coupon-btn"
              disabled={redeeming}
              onClick={handleRedeem}
            >
              {redeeming ? 'Redeeming...' : 'Mark as Redeemed'}
            </button>
          )}

          {redeemError && <p className="redeem-coupon-error">{redeemError}</p>}
        </div>
      )}
    </section>
  );
}

export default RedeemCoupon;
