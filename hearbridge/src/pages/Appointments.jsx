import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection, doc, documentId, getDoc, getDocs, query, runTransaction, serverTimestamp, where,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import {
  clinics, generateBookingId, getClinicName, getDaySlots, isClinicOpenOn, isPastSlot,
  slotDocId, todayDateString,
} from '../data/clinics.js'

// Books a viewing for a specific hearing aid, or reschedules an existing booking
function Appointments() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('product');
  const rescheduleId = searchParams.get('reschedule');

  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(Boolean(productId));

  useEffect(() => {
    if (!productId) {
      setLoadingProduct(false);
      return;
    }
    getDoc(doc(db, 'listings', productId))
      .then((snapshot) => {
        setProduct(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
      })
      .finally(() => setLoadingProduct(false));
  }, [productId]);

  const requiresProduct = !rescheduleId && !loadingProduct && (!product || product.status === 'sold');

  useEffect(() => {
    if (requiresProduct) {
      navigate('/listings', { replace: true });
    }
  }, [requiresProduct, navigate]);

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  const [existingBooking, setExistingBooking] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(rescheduleId));

  const [clinicId, setClinicId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [takenTimes, setTakenTimes] = useState(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedId, setConfirmedId] = useState('');
  const [wasRescheduled, setWasRescheduled] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || !rescheduleId) {
      setLoadingExisting(false);
      return;
    }
    getDoc(doc(db, 'bookings', rescheduleId))
      .then((snapshot) => {
        if (snapshot.exists() && snapshot.data().userId === user.uid) {
          const data = snapshot.data();
          setExistingBooking({ id: snapshot.id, ...data });
          setClinicId(data.clinicId);
          setDate(data.date);
        }
      })
      .finally(() => setLoadingExisting(false));
  }, [user, rescheduleId]);

  // Re-checks which time slots are already booked for the chosen clinic and date
  const refreshSlots = useCallback(() => {
    if (!clinicId || !date || !isClinicOpenOn(date)) {
      setTakenTimes(new Set());
      return;
    }
    setLoadingSlots(true);
    const ids = getDaySlots().map((slotTime) => slotDocId(clinicId, date, slotTime));
    getDocs(query(collection(db, 'bookingSlots'), where(documentId(), 'in', ids)))
      .then((snapshot) => {
        const ownSlotId = existingBooking
          ? slotDocId(existingBooking.clinicId, existingBooking.date, existingBooking.time)
          : null;
        const taken = new Set();
        snapshot.docs.forEach((slotDoc) => {
          if (slotDoc.id === ownSlotId) return;
          taken.add(slotDoc.data().time);
        });
        setTakenTimes(taken);
      })
      .finally(() => setLoadingSlots(false));
  }, [clinicId, date, existingBooking]);

  useEffect(() => {
    setTime('');
    refreshSlots();
  }, [refreshSlots]);

  // Claims the chosen time slot and creates (or reschedules) the booking
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!clinicId || !date || !time) {
      setError('Please choose a clinic, date and time.');
      return;
    }
    if (!isClinicOpenOn(date)) {
      setError('Clinics are open Monday to Friday only.');
      return;
    }
    if (isPastSlot(date, time)) {
      setError('That time has already passed. Please choose another.');
      return;
    }

    setSubmitting(true);
    const clinicName = getClinicName(clinicId);
    const newSlotId = slotDocId(clinicId, date, time);
    const newSlotRef = doc(db, 'bookingSlots', newSlotId);

    try {
      if (existingBooking) {
        const oldSlotId = slotDocId(existingBooking.clinicId, existingBooking.date, existingBooking.time);
        const oldSlotRef = doc(db, 'bookingSlots', oldSlotId);
        const bookingRef = doc(db, 'bookings', existingBooking.id);

        await runTransaction(db, async (transaction) => {
          if (newSlotId !== oldSlotId) {
            const newSlotSnap = await transaction.get(newSlotRef);
            if (newSlotSnap.exists()) {
              throw new Error('slot-taken');
            }
            transaction.delete(oldSlotRef);
            transaction.set(newSlotRef, { clinicId, date, time, userId: user.uid, bookingId: existingBooking.id });
          }
          transaction.update(bookingRef, { clinicId, clinicName, date, time, updatedAt: serverTimestamp() });
        });

        setConfirmedId(existingBooking.id);
        setWasRescheduled(true);
      } else {
        const id = generateBookingId();
        const bookingRef = doc(db, 'bookings', id);

        await runTransaction(db, async (transaction) => {
          const slotSnap = await transaction.get(newSlotRef);
          if (slotSnap.exists()) {
            throw new Error('slot-taken');
          }
          transaction.set(newSlotRef, { clinicId, date, time, userId: user.uid, bookingId: id });
          transaction.set(bookingRef, {
            userId: user.uid,
            userEmail: user.email,
            ...(product ? { productId: product.id, productLabel: `${product.brand} ${product.model}` } : {}),
            clinicId,
            clinicName,
            date,
            time,
            status: 'upcoming',
            createdAt: serverTimestamp(),
          });
        });

        setConfirmedId(id);
      }
    } catch (err) {
      if (err.message === 'slot-taken') {
        setError('That slot was just taken. Please choose another time.');
        refreshSlots();
      } else {
        setError('Could not confirm your booking. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (requiresProduct) {
    return null;
  }

  if (!authChecked || loadingExisting || loadingProduct) {
    return (
      <section id="appointments" className="section-p1">
        <p>Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section id="appointments" className="section-p1">
        <p>You need to log in to book an appointment.</p>
        <Link to="/login" className="normal">Log In</Link>
      </section>
    );
  }

  if (confirmedId) {
    return (
      <section id="appointments" className="section-p1">
        <div className="appointment-success">
          <i className="fa-solid fa-circle-check"></i>
          <h2>{wasRescheduled ? 'Booking rescheduled!' : 'Booking confirmed!'}</h2>
          <p>{getClinicName(clinicId)} · {date} at {time}</p>
          <p className="appointment-ref">Booking Ref: <strong>{confirmedId}</strong></p>
          <div className="appointment-success-actions">
            <Link to="/booking"><button className="normal">View My Bookings</button></Link>
            <Link to="/home"><button className="normal">Back to Home</button></Link>
          </div>
        </div>
      </section>
    );
  }

  const daySlots = getDaySlots();
  const dateChosenButClosed = date && !isClinicOpenOn(date);

  return (
    <section id="appointments" className="section-p1">
      <h2>{existingBooking ? 'Reschedule Appointment' : 'Book an Appointment'}</h2>
      <p>View a hearing aid in person at one of our partnered clinics.</p>

      {product && (
        <div className="appointment-banner">
          <i className="fa-solid fa-ear-listen"></i> Booking a viewing for: <strong>{product.brand} {product.model}</strong>
        </div>
      )}

      {existingBooking && (
        <div className="appointment-banner">
          Rescheduling booking <strong>{existingBooking.id}</strong>
        </div>
      )}

      <form className="appointment-form" onSubmit={handleSubmit}>
        <div className="appointment-field">
          <label htmlFor="clinic">Clinic</label>
          <select
            id="clinic"
            value={clinicId}
            onChange={(e) => setClinicId(e.target.value)}
            required
          >
            <option value="" disabled>Select a clinic</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
            ))}
          </select>
        </div>

        <div className="appointment-field">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            min={todayDateString()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {dateChosenButClosed && (
          <p className="appointment-error">Clinics are closed on weekends. Please choose a weekday.</p>
        )}

        {clinicId && date && !dateChosenButClosed && (
          <div className="appointment-field">
            <span className="appointment-label">Available Times</span>
            {loadingSlots ? (
              <p>Checking availability...</p>
            ) : (
              <div className="appointment-slots">
                {daySlots.map((slotTime) => {
                  const disabled = takenTimes.has(slotTime) || isPastSlot(date, slotTime);
                  return (
                    <button
                      type="button"
                      key={slotTime}
                      disabled={disabled}
                      className={`appointment-slot ${time === slotTime ? 'selected' : ''}`}
                      onClick={() => setTime(slotTime)}
                    >
                      {slotTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error && <p className="appointment-error">{error}</p>}

        <button type="submit" className="normal appointment-submit" disabled={submitting || !time}>
          {submitting ? 'Confirming...' : existingBooking ? 'Confirm Reschedule' : 'Confirm Booking'}
        </button>
      </form>
    </section>
  );
}

export default Appointments;
