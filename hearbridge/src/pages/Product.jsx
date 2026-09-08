import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { conditionClass } from '../data/products.js'

// Opens the product page for one hearing aid, with a Book Now button
function Product() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'listings', id))
      .then((snapshot) => {
        setProduct(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <section id="product-detail" className="section-p1">
        <p>Loading...</p>
      </section>
    );
  }

  if (!product) {
    return (
      <section id="product-detail" className="section-p1">
        <p>Product not found.</p>
        <Link to="/listings" className="normal">Back to Listings</Link>
      </section>
    );
  }

  if (product.status === 'sold') {
    return (
      <section id="product-detail" className="section-p1">
        <p>This item is no longer available.</p>
        <Link to="/listings" className="normal">Back to Listings</Link>
      </section>
    );
  }

  return (
    <section id="product-detail" className="section-p1">
      <div className="product-detail-card">
        <img src={product.image} alt={`${product.brand} ${product.model}`} />

        <div className="product-detail-des">
          <span className="product-detail-brand">{product.brand}</span>
          <h2>{product.model}</h2>
          <span className={`listing-condition ${conditionClass[product.condition]}`}>
            {product.condition}
          </span>

          <span className="product-detail-price">£{product.price.toFixed(2)}</span>

          <p className="product-detail-description">{product.description}</p>

          <Link to={`/booking/new?product=${product.id}`} className="normal product-detail-book">
            Book Now
          </Link>

        </div>
      </div>
    </section>
  );
}

export default Product;
