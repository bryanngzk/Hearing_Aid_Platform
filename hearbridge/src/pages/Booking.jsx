import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { statusMeta } from '../data/bookings.js'
import { tabs } from '../data/tabs.js'
import { slotDocId } from '../data/clinics.js'

function Booking() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancelingId, setCancelingId] = useState('');
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    getDocs(query(collection(db, 'bookings'), where('userId', '==', user.uid)))
      .then((snapshot) => {
        const items = snapshot.docs.map((bookingDoc) => ({ id: bookingDoc.id, ...bookingDoc.data() }));
        items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setBookings(items);
      })
      .finally(() => setLoadingBookings(false));
  }, [user]);

  const handleCancel = async (booking) => {
    setCancelError('');
    setCancelingId(booking.id);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'bookings', booking.id), { status: 'cancelled', updatedAt: serverTimestamp() });
      batch.delete(doc(db, 'bookingSlots', slotDocId(booking.clinicId, booking.date, booking.time)));
      await batch.commit();
      setBookings((current) =>
        current.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b))
      );
    } catch {
      setCancelError('Could not cancel this booking. Please try again.');
    } finally {
      setCancelingId('');
    }
  };

  if (!authChecked) {
    return (
      <section id="booking" className="section-p1">
        <p>Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section id="booking" className="section-p1">
        <p>You need to log in to view your bookings.</p>
        <Link to="/login" className="normal">Log In</Link>
      </section>
    );
  }

  const visibleBookings = bookings.filter(
    (booking) => activeTab === 'all' || booking.status === activeTab
  );

  return (
    <section id="booking" className="section-p1">
      <h2>My Bookings</h2>

      <div className="booking-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`booking-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {cancelError && <p className="booking-empty">{cancelError}</p>}

      <div className="booking-list">
        {loadingBookings && <p className="booking-empty">Loading your bookings...</p>}

        {!loadingBookings && visibleBookings.length === 0 && (
          <p className="booking-empty">You have no {activeTab === 'all' ? '' : activeTab} bookings.</p>
        )}

        {visibleBookings.map((booking) => {
          const meta = statusMeta[booking.status];
          return (
            <div className="booking-card" key={booking.id}>
              <div className="booking-card-top">
                <span className={`booking-status ${meta.className}`}>
                  <i className={`fa-solid ${meta.icon}`}></i> {meta.label}
                </span>
                <span className="booking-ref">Ref: {booking.id}</span>
              </div>

              <h5>{booking.productLabel || 'Hearing Aid Viewing'}</h5>
              <p className="booking-provider">
                <i className="fa-solid fa-location-dot"></i> {booking.clinicName}
              </p>
              <p className="booking-datetime">
                <i className="fa-solid fa-calendar"></i> {booking.date}
                <i className="fa-solid fa-clock"></i> {booking.time}
              </p>

              <div className="booking-actions">
                {booking.status === 'upcoming' && (
                  <>
                    <Link to={`/booking/new?reschedule=${booking.id}`}>
                      <button className="normal">Reschedule</button>
                    </Link>
                    <button
                      className="normal booking-cancel"
                      disabled={cancelingId === booking.id}
                      onClick={() => handleCancel(booking)}
                    >
                      {cancelingId === booking.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </>
                )}
                {booking.status !== 'upcoming' && (
                  <button className="normal">View Details</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Booking;
