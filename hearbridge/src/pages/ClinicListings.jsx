import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { conditionClass } from '../data/products.js'

// To access this page, on the link insert '/clinic-listings'
// Clinic-only page to view every listing and toggle it between Available and Sold
function ClinicListings() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [isClinic, setIsClinic] = useState(false);

  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [updateError, setUpdateError] = useState('');

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

    getDocs(collection(db, 'listings'))
      .then((snapshot) => {
        setListings(snapshot.docs.map((listingDoc) => ({ id: listingDoc.id, ...listingDoc.data() })));
      })
      .finally(() => setLoadingListings(false));
  }, [isClinic]);

  // Flips a listing between Available and Sold
  const handleToggleStatus = async (listing) => {
    setUpdateError('');
    setUpdatingId(listing.id);
    const nextStatus = listing.status === 'sold' ? 'available' : 'sold';
    try {
      await updateDoc(doc(db, 'listings', listing.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      setListings((current) =>
        current.map((item) => (item.id === listing.id ? { ...item, status: nextStatus } : item))
      );
    } catch {
      setUpdateError('Could not update this listing. Please try again.');
    } finally {
      setUpdatingId('');
    }
  };

  if (!authChecked) {
    return (
      <section id="clinic-listings" className="section-p1">
        <p>Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section id="clinic-listings" className="section-p1">
        <p>You need to log in as a partnered clinic to view this page.</p>
        <Link to="/login" className="normal">Log In</Link>
      </section>
    );
  }

  if (!isClinic) {
    return (
      <section id="clinic-listings" className="section-p1">
        <p>This page is only available to partnered clinic accounts.</p>
      </section>
    );
  }

  return (
    <section id="clinic-listings" className="section-p1">
      <h2>Manage Listings</h2>

      {loadingListings && <p className="clinic-listings-empty">Loading listings...</p>}

      {!loadingListings && listings.length === 0 && (
        <p className="clinic-listings-empty">No listings found.</p>
      )}

      {updateError && <p className="clinic-listings-error">{updateError}</p>}

      <div className="clinic-listings-container">
        {listings.map((item) => (
          <div className="clinic-listings-card" key={item.id}>
            <img src={item.image} alt={`${item.brand} ${item.model}`} />
            <div className="clinic-listings-des">
              <span className="clinic-listings-brand">{item.brand}</span>
              <h5>{item.model}</h5>
              <span className={`listing-condition ${conditionClass[item.condition] || ''}`}>
                {item.condition}
              </span>
              <span className="clinic-listings-price">£{item.price?.toFixed?.(2) ?? item.price}</span>
              <span className={`clinic-listings-status status-${item.status}`}>
                {item.status}
              </span>

              <button
                type="button"
                className="normal clinic-listings-toggle"
                disabled={updatingId === item.id}
                onClick={() => handleToggleStatus(item)}
              >
                {updatingId === item.id
                  ? 'Updating...'
                  : item.status === 'sold'
                    ? 'Mark as Available'
                    : 'Mark as Sold'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ClinicListings;
