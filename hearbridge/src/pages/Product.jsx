import { Link, useParams } from 'react-router-dom'
import { conditionClass, getProductById } from '../data/products.js'

function Product() {
  const { id } = useParams();
  const product = getProductById(id);

  if (!product) {
    return (
      <section id="product-detail" className="section-p1">
        <p>Product not found.</p>
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
