const products = [
  { img: "/img/products/1.jpg", name: "Phonak" },
  { img: "/img/products/4.jpg", name: "Siemens" },
  { img: "/img/products/3.jpg", name: "Oticons" },
  { img: "/img/products/2.jpg", name: "Hansaton" },
];

// Shows the "Featured Brands" row on the homepage
function Products() {
  return ( 
    <section id="product1" className="section-p1">
      <h2>Featured Brands</h2>
      <div className="pro-container">
        {products.map((product) => (
          <div className="pro" key={product.name}>
            <img src={product.img} alt="" />
            <div className="des">
              <span>{product.name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Products;
