function Header() {
  return (
    <section id="header">
      <a href="/" className="brand">
        <img src="/hearbridge_icon.svg" className="brand-icon" alt="" />
      </a>

      <div className="header-right">
        <ul id="navbar">
          <li><a href="/">Home</a></li>
          <li><a href="">Profile</a></li>
          <li><a href="#">Blog</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Contact</a></li>
          <li><a href="#"><i className="fa-solid fa-calendar"></i></a></li>
        </ul>

        <div className="form">
          <input type="text" placeholder="Search" />
          <button className="normal"><i className="fa-solid fa-magnifying-glass"></i></button>
        </div>
      </div>
    </section>
  );
}

export default Header;
