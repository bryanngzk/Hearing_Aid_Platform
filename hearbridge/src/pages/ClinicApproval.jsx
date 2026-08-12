import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { conditionClass } from '../data/products.js'

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
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ClinicApproval;
