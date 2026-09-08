import Cover from '../components/Cover.jsx'
import Banner from '../components/Banner.jsx'
import Products from '../components/Products.jsx'
import Newsletter from '../components/Newsletter.jsx'

// Puts together the homepage out of the hero, banner, product and newsletter sections
function Home() {
  return (
    <>
      <Cover />
      <Banner />
      <Products />
      <Newsletter />
    </>
  );
}

export default Home;
