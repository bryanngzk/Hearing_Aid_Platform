import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { conditionClass } from '../data/products.js'
import { generateCouponCode } from '../data/coupons.js'

// To access this page, on the link insert '/clinic-approval'
function formatDate(timestamp) {
  if (!timestamp) return 'Just now';
  return timestamp.toDate().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function ClinicApproval() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [isClinic, setIsClinic] = useState(false);

  const [tradeIns, setTradeIns] = useState([]);
  const [loadingTradeIns, setLoadingTradeIns] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [couponPercents, setCouponPercents] = useState({});

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

    getDocs(query(collection(db, 'tradeIns'), orderBy('createdAt', 'desc')))
      .then((snapshot) => {
        setTradeIns(snapshot.docs.map((tradeInDoc) => ({ id: tradeInDoc.id, ...tradeInDoc.data() })));
      })
      .finally(() => setLoadingTradeIns(false));
  }, [isClinic]);

  const handleDecision = async (tradeInId, status, couponPercent = 0) => {
    setUpdateError('');
    setUpdatingId(tradeInId);
    try {
      await updateDoc(doc(db, 'tradeIns', tradeInId), {
        status,
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
      });

      if (status === 'approved' && couponPercent > 0) {
        const tradeIn = tradeIns.find((t) => t.id === tradeInId);
        await setDoc(doc(db, 'coupons', generateCouponCode()), {
          donorId: tradeIn.donorId,
          donorName: tradeIn.donorName,
          donorEmail: tradeIn.donorEmail,
          tradeInId,
          deviceModel: tradeIn.deviceModel,
          condition: tradeIn.condition,
          percentOff: couponPercent,
          status: 'active',
          createdAt: serverTimestamp(),
        });
      }

      setTradeIns((current) =>
        current.map((tradeIn) =>
          tradeIn.id === tradeInId ? { ...tradeIn, status } : tradeIn
        )
      );
    } catch {
      setUpdateError('Could not update this trade-in. Please try again.');
    } finally {
      setUpdatingId('');
    }
  };

  if (!authChecked) {
    return (
      <section id="clinic-approval" className="section-p1">
        <p>Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section id="clinic-approval" className="section-p1">
        <p>You need to log in as a partnered clinic to view this page.</p>
        <Link to="/login" className="normal">Log In</Link>
      </section>
    );
  }

  if (!isClinic) {
    return (
      <section id="clinic-approval" className="section-p1">
        <p>This page is only available to partnered clinic accounts.</p>
      </section>
    );
  }

  const visibleTradeIns = tradeIns.filter((tradeIn) =>
    tradeIn.id.toLowerCase().includes(searchId.trim().toLowerCase())
  );

  return (
    <section id="clinic-approval" className="section-p1">
      <h2>Trade-In Approvals</h2>

      <div className="clinic-search">
        <input
          type="text"
          placeholder="Browse for Trade-in ID (e.g. TI-XXXXXX-XXX)"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
      </div>

      {loadingTradeIns && <p>Loading trade-in requests...</p>}

      {!loadingTradeIns && visibleTradeIns.length === 0 && (
        <p className="clinic-empty">No trade-in requests found.</p>
      )}

      <div className="clinic-container">
        {visibleTradeIns.map((tradeIn) => (
          <div className="clinic-card" key={tradeIn.id}>
            <div className="clinic-card-photos">
              {tradeIn.photos && tradeIn.photos.length > 0 ? (
                tradeIn.photos.map((photo, i) => (
                  <img src={photo} alt={`${tradeIn.deviceModel} ${i + 1}`} key={i} />
                ))
              ) : (
                <div className="clinic-card-no-photo">No photos provided</div>
              )}
            </div>

            <div className="clinic-card-des">
              <span className="clinic-card-id">{tradeIn.id}</span>
              <h5>{tradeIn.deviceModel}</h5>
              <span className={`listing-condition ${conditionClass[tradeIn.condition] || ''}`}>
                {tradeIn.condition}
              </span>

              <div className="clinic-card-donor">
                <p><i className="fa-solid fa-user"></i> {tradeIn.donorName}</p>
                <p><i className="fa-solid fa-envelope"></i> {tradeIn.donorEmail}</p>
                <p><i className="fa-solid fa-calendar"></i> Submitted {formatDate(tradeIn.createdAt)}</p>
              </div>

              <span className={`clinic-status clinic-status-${tradeIn.status}`}>
                {tradeIn.status}
              </span>

              <Link to={`/clinic-approval/${tradeIn.id}`} className="clinic-view-link">
                View Item
              </Link>

              {tradeIn.status === 'pending' && (
                <>
                  <div className="clinic-coupon-field">
                    <label htmlFor={`coupon-${tradeIn.id}`}>Coupon % (optional)</label>
                    <input
                      id={`coupon-${tradeIn.id}`}
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 10"
                      value={couponPercents[tradeIn.id] ?? ''}
                      onChange={(e) =>
                        setCouponPercents((current) => ({ ...current, [tradeIn.id]: e.target.value }))
                      }
                    />
                  </div>
                  <div className="clinic-card-actions">
                    <button
                      type="button"
                      className="normal clinic-approve"
                      disabled={updatingId === tradeIn.id}
                      onClick={() =>
                        handleDecision(tradeIn.id, 'approved', parseFloat(couponPercents[tradeIn.id]) || 0)
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="normal clinic-reject"
                      disabled={updatingId === tradeIn.id}
                      onClick={() => handleDecision(tradeIn.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {updateError && <p className="clinic-error">{updateError}</p>}
    </section>
  );
}

export default ClinicApproval;
