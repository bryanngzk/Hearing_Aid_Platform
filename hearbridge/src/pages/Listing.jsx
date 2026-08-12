import { Link } from 'react-router-dom'
import { conditionClass, products } from '../data/products.js'

function Listing() {
  return (
    <section id="listing" className="section-p1">
      <h2>Hearing Aids</h2>
      <div className="listing-container">
        {products.map((item) => (
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
