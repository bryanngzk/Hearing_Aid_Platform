import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, sendPasswordResetEmail, signOut } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { statusMeta } from '../data/bookings.js'
import { tradeInStatusMeta } from '../data/tradeIns.js'
import { couponStatusMeta } from '../data/coupons.js'

const RECENT_LIMIT = 3;

// Turns a Firestore timestamp into a readable UK date, e.g. "05 Sep 2026"
function formatDate(timestamp) {
  if (!timestamp) return '—';
  return timestamp.toDate().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Shows a patient's own details plus their bookings, trade-ins and coupons
function Profile() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ firstName: '', lastName: '' });
  const [resetStatus, setResetStatus] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [tradeIns, setTradeIns] = useState([]);
  const [loadingTradeIns, setLoadingTradeIns] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [revealedCoupons, setRevealedCoupons] = useState(new Set());
  const [copiedId, setCopiedId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);

      if (currentUser) {
        const snapshot = await getDoc(doc(db, 'users', currentUser.uid));
        if (snapshot.exists()) {
          setProfile(snapshot.data());
        }
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    getDocs(query(collection(db, 'tradeIns'), where('donorId', '==', user.uid)))
      .then((snapshot) => {
        const items = snapshot.docs.map((tradeInDoc) => ({ id: tradeInDoc.id, ...tradeInDoc.data() }));
        items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setTradeIns(items);
      })
      .finally(() => setLoadingTradeIns(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    getDocs(query(collection(db, 'bookings'), where('userId', '==', user.uid)))
      .then((snapshot) => {
        const items = snapshot.docs.map((bookingDoc) => ({ id: bookingDoc.id, ...bookingDoc.data() }));
        items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setBookings(items.slice(0, RECENT_LIMIT));
      })
      .finally(() => setLoadingBookings(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    getDocs(query(collection(db, 'coupons'), where('donorId', '==', user.uid)))
      .then((snapshot) => {
        const items = snapshot.docs.map((couponDoc) => ({ id: couponDoc.id, ...couponDoc.data() }));
        items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setCoupons(items);
      })
      .finally(() => setLoadingCoupons(false));
  }, [user]);

  // Sends the user a Firebase password-reset email
  const handleChangePassword = async () => {
    setResetStatus('');
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetStatus('Password reset email sent. Check your inbox.');
    } catch {
      setResetStatus('Could not send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // Logs the user out and sends them back to the login page
  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut(auth);
    navigate('/login');
  };

  // Shows or re-hides a coupon code so it isn't left visible to anyone nearby
  const toggleCouponCode = (couponId) => {
    setRevealedCoupons((current) => {
      const next = new Set(current);
      if (next.has(couponId)) {
        next.delete(couponId);
      } else {
        next.add(couponId);
      }
      return next;
    });
  };

  // Copies a coupon code to the clipboard and briefly confirms it
  const handleCopyCode = async (couponId) => {
    try {
      await navigator.clipboard.writeText(couponId);
      setCopiedId(couponId);
      setTimeout(() => setCopiedId(''), 2000);
    } catch {
      // Clipboard access unavailable — nothing more we can do here.
    }
  };

  if (!authChecked) {
    return (
      <section id="profile" className="section-p1">
        <p>Loading profile...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section id="profile" className="section-p1">
        <p>You need to log in to view your profile.</p>
        <Link to="/login" className="normal">Log In</Link>
      </section>
    );
  }

  return (
    <section id="profile" className="section-p1">
      <div className="profile-header">
        <h2>My Profile</h2>
        <button
          type="button"
          className="normal profile-signout-btn"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-field">
          <span className="profile-label">First Name</span>
          <span className="profile-value">{profile.firstName || '—'}</span>
        </div>

        <div className="profile-field">
          <span className="profile-label">Last Name</span>
          <span className="profile-value">{profile.lastName || '—'}</span>
        </div>

        <div className="profile-field">
          <span className="profile-label">Email</span>
          <span className="profile-value">{user.email}</span>
        </div>

        <div className="profile-field">
          <span className="profile-label">Password</span>
          <button
            type="button"
            className="normal profile-password-btn"
            onClick={handleChangePassword}
            disabled={resetLoading}
          >
            {resetLoading ? 'Sending...' : 'Change Password'}
          </button>
        </div>
        {resetStatus && <p className="profile-reset-status">{resetStatus}</p>}
      </div>

      <div className="profile-bookings">
        <div className="profile-bookings-header">
          <h4>Booking History</h4>
          <Link to="/booking" className="profile-bookings-link">View All</Link>
        </div>

        {loadingBookings && <p>Loading bookings...</p>}

        {!loadingBookings && bookings.length === 0 && (
          <p>You haven't booked any appointments yet.</p>
        )}

        {bookings.map((booking) => {
          const meta = statusMeta[booking.status];
          return (
            <div className="profile-booking-row" key={booking.id}>
              <div className="profile-booking-info">
                <h5>{booking.productLabel || 'Hearing Aid Viewing'}</h5>
                <p>{booking.clinicName} · {booking.date} at {booking.time}</p>
              </div>
              <span className={`booking-status ${meta.className}`}>
                <i className={`fa-solid ${meta.icon}`}></i> {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="profile-tradeins">
        <div className="profile-bookings-header">
          <h4>Trade-In History</h4>
          <Link to="/trade-in" className="profile-bookings-link">New Trade-In</Link>
        </div>

        {loadingTradeIns && <p>Loading trade-ins...</p>}

        {!loadingTradeIns && tradeIns.length === 0 && (
          <p>You haven't submitted any trade-ins yet.</p>
        )}

        {tradeIns.map((tradeIn) => {
          const meta = tradeInStatusMeta[tradeIn.status] || tradeInStatusMeta.pending;
          return (
            <div className="profile-booking-row" key={tradeIn.id}>
              <div className="profile-booking-info">
                <h5>{tradeIn.deviceModel}</h5>
                <p>{tradeIn.condition} · Submitted {formatDate(tradeIn.createdAt)}</p>
              </div>
              <span className={`booking-status ${meta.className}`}>
                <i className={`fa-solid ${meta.icon}`}></i> {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="profile-coupons">
        <div className="profile-bookings-header">
          <h4>My Coupons</h4>
        </div>

        {loadingCoupons && <p>Loading coupons...</p>}

        {!loadingCoupons && coupons.length === 0 && (
          <p>You don't have any coupons yet.</p>
        )}

        {coupons.map((coupon) => {
          const meta = couponStatusMeta[coupon.status] || couponStatusMeta.active;
          const isRevealed = revealedCoupons.has(coupon.id);
          return (
            <div className="profile-booking-row" key={coupon.id}>
              <div className="profile-booking-info">
                <h5>{coupon.percentOff}% off &middot; {coupon.deviceModel}</h5>
                <div className="profile-coupon-code">
                  <span className="profile-coupon-code-value">
                    {isRevealed ? coupon.id : '•'.repeat(coupon.id.length)}
                  </span>
                  <button
                    type="button"
                    className="profile-coupon-toggle"
                    onClick={() => toggleCouponCode(coupon.id)}
                    aria-label={isRevealed ? 'Hide code' : 'Show code'}
                  >
                    <i className={`fa-solid ${isRevealed ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                  <button
                    type="button"
                    className="profile-coupon-copy"
                    onClick={() => handleCopyCode(coupon.id)}
                  >
                    {copiedId === coupon.id ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
              <span className={`booking-status ${meta.className}`}>
                <i className={`fa-solid ${meta.icon}`}></i> {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Profile;
