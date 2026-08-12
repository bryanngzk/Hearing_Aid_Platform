import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, sendPasswordResetEmail, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { bookings, statusMeta } from '../data/bookings.js'

function Profile() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ firstName: '', lastName: '' });
  const [resetStatus, setResetStatus] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
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

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut(auth);
    navigate('/login');
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

        {bookings.map((booking) => {
          const meta = statusMeta[booking.status];
          return (
            <div className="profile-booking-row" key={booking.id}>
              <div className="profile-booking-info">
                <h5>{booking.service}</h5>
                <p>{booking.provider} · {booking.date} at {booking.time}</p>
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
