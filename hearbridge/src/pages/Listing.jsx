import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { conditionClass } from '../data/products.js'

// Shows the public grid of available hearing aids, with search
function Listing() {
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get('q') || '').trim().toLowerCase();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'listings'), where('status', '==', 'available')))
      .then((snapshot) => {
        setListings(snapshot.docs.map((listingDoc) => ({ id: listingDoc.id, ...listingDoc.data() })));
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleListings = searchQuery
    ? listings.filter((item) =>
        `${item.brand} ${item.model}`.toLowerCase().includes(searchQuery)
      )
    : listings;

  return (
    <section id="listing" className="section-p1">
      <h2>Hearing Aids</h2>

      {loading && <p className="listing-empty">Loading hearing aids...</p>}

      {!loading && searchQuery && visibleListings.length === 0 && (
        <p className="listing-empty">No hearing aids match your search for "{searchParams.get('q')}".</p>
      )}

      {!loading && !searchQuery && visibleListings.length === 0 && (
        <p className="listing-empty">No hearing aids available right now.</p>
      )}

      <div className="listing-container">
        {visibleListings.map((item) => (
          <Link to={`/product/${item.id}`} className="listing-card" key={item.id}>
            <img src={item.image} alt={`${item.brand} ${item.model}`} />
            <div className="listing-des">
              <span className="listing-brand">{item.brand}</span>
              <h5>{item.model}</h5>
              <span className={`listing-condition ${conditionClass[item.condition]}`}>
                {item.condition}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Listing;
