import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

// Top nav bar: logo, links, search, and the mobile hamburger menu
function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  // Sends the typed search text to the Hearing Aids listing page
  const handleSearch = (e) => {
    e.preventDefault()
    setMenuOpen(false)
    navigate(`/listings?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <section id="header">
      <Link to="/home" className="brand">
        <img src="/hearbridge_icon.svg" className="brand-icon" alt="" />
      </Link>

      <div className="header-right">
        <ul id="navbar" className={menuOpen ? 'active' : ''}>
          <li><Link to="/home" onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li><Link to="/listings" onClick={() => setMenuOpen(false)}>Hearing Aids</Link></li>
          <li><Link to="/trade-in" onClick={() => setMenuOpen(false)}>Trade-in</Link></li>
          <li><Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link></li>
          <li><Link to="/booking" onClick={() => setMenuOpen(false)}><i className="fa-solid fa-calendar"></i></Link></li>
        </ul>

        <form className="form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="normal"><i className="fa-solid fa-magnifying-glass"></i></button>
        </form>

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
