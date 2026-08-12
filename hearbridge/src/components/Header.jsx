import { Link } from 'react-router-dom'
import { useState } from 'react'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <section id="header">
      <Link to="/home" className="brand">
        <img src="/hearbridge_icon.svg" className="brand-icon" alt="" />
      </Link>

      <div className="header-right">
        <ul id="navbar" className={menuOpen ? 'active' : ''}>
          <li><Link to="/listings" onClick={() => setMenuOpen(false)}>Hearing Aids</Link></li>
          <li><Link to="/trade-in" onClick={() => setMenuOpen(false)}>Trade-in</Link></li>
          <li><Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link></li>
          <li><Link to="/booking" onClick={() => setMenuOpen(false)}><i className="fa-solid fa-calendar"></i></Link></li>
        </ul>

        <div className="form">
          <input type="text" placeholder="Search" />
          <button className="normal"><i className="fa-solid fa-magnifying-glass"></i></button>
        </div>

        <button
          type="button"
          className="mobile-menu-btn"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </div>
    </section>
  );
}

export default Header;

