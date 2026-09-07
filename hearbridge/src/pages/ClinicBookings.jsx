import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { statusMeta } from '../data/bookings.js'
import { tabs } from '../data/tabs.js'

// To access this page, on the link insert '/clinic-bookings'
// Clinic-only page listing bookings for the clinic's own location(s), with a Complete action
function ClinicBookings() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [isClinic, setIsClinic] = useState(false);
  const [clinicIds, setClinicIds] = useState([]);

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [completingId, setCompletingId] = useState('');
  const [completeError, setCompleteError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const snapshot = await getDoc(doc(db, 'users', currentUser.uid));
        if (snapshot.exists() && snapshot.data().role === 'clinic') {
          setIsClinic(true);
          setClinicIds(snapshot.data().clinicIds || []);
        }
      }

      setAuthChecked(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isClinic || clinicIds.length === 0) {
      setLoadingBookings(false);
      return;
    }

    getDocs(query(collection(db, 'bookings'), where('clinicId', 'in', clinicIds)))
      .then((snapshot) => {
        const items = snapshot.docs.map((bookingDoc) => ({ id: bookingDoc.id, ...bookingDoc.data() }));
        items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setBookings(items);
      })
      .finally(() => setLoadingBookings(false));
  }, [isClinic, clinicIds]);

  // Marks a booking as completed once the visit has happened
  const handleMarkCompleted = async (bookingId) => {
    setCompleteError('');
    setCompletingId(bookingId);
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed',
        updatedAt: serverTimestamp(),
      });
      setBookings((current) =>
        current.map((booking) => (booking.id === bookingId ? { ...booking, status: 'completed' } : booking))
      );
    } catch {
      setCompleteError('Could not update this booking. Please try again.');
    } finally {
      setCompletingId('');
    }
  };

  if (!authChecked) {
    return (
      <section id="clinic-bookings" className="section-p1">
        <p>Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section id="clinic-bookings" className="section-p1">
        <p>You need to log in as a partnered clinic to view this page.</p>
        <Link to="/login" className="normal">Log In</Link>
      </section>
    );
  }

  if (!isClinic) {
    return (
      <section id="clinic-bookings" className="section-p1">
        <p>This page is only available to partnered clinic accounts.</p>
      </section>
    );
  }

  if (clinicIds.length === 0) {
    return (
      <section id="clinic-bookings" className="section-p1">
        <p>Your account isn't linked to a clinic location yet. Contact an admin to set your clinicIds.</p>
      </section>
    );
  }

  const visibleBookings = bookings.filter(
    (booking) => activeTab === 'all' || booking.status === activeTab
  );

  return (
    <section id="clinic-bookings" className="section-p1">
      <h2>Clinic Bookings</h2>

      <div className="clinic-bookings-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`clinic-bookings-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {completeError && <p className="clinic-bookings-error">{completeError}</p>}

      <div className="clinic-bookings-list">
        {loadingBookings && <p className="clinic-bookings-empty">Loading bookings...</p>}

        {!loadingBookings && visibleBookings.length === 0 && (
          <p className="clinic-bookings-empty">No {activeTab === 'all' ? '' : activeTab} bookings found.</p>
        )}

        {visibleBookings.map((booking) => {
          const meta = statusMeta[booking.status];
          return (
            <div className="clinic-bookings-card" key={booking.id}>
              <div className="clinic-bookings-card-top">
                <span className={`booking-status ${meta.className}`}>
                  <i className={`fa-solid ${meta.icon}`}></i> {meta.label}
                </span>
                <span className="clinic-bookings-ref">Ref: {booking.id}</span>
              </div>

              <h5>{booking.productLabel || 'Hearing Aid Viewing'}</h5>
              <p className="clinic-bookings-location">
                <i className="fa-solid fa-location-dot"></i> {booking.clinicName}
              </p>
              <p className="clinic-bookings-patient">
                <i className="fa-solid fa-user"></i> {booking.userEmail}
              </p>
              <p className="clinic-bookings-datetime">
                <i className="fa-solid fa-calendar"></i> {booking.date}
                <i className="fa-solid fa-clock"></i> {booking.time}
              </p>

              {booking.status === 'upcoming' && (
                <button
                  type="button"
                  className="normal clinic-bookings-complete"
                  disabled={completingId === booking.id}
                  onClick={() => handleMarkCompleted(booking.id)}
                >
                  {completingId === booking.id ? 'Updating...' : 'Mark as Completed'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ClinicBookings;
