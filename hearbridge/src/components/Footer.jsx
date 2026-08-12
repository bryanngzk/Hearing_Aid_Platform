function Footer() {
  return (
    <footer className="section-p1">
      <div className="col">
        <img className="logo" src="/public/hearbridge_icon.svg" alt="" />
        <h4>Contact</h4>
        <div className="follow">
          <h4>Follow Us</h4>
          <div className="icon">
            <i className="fab fa-facebook-f"></i>
            <i className="fab fa-twitter"></i>
            <i className="fab fa-instagram"></i>
            <i className="fab fa-pinterest-p"></i>
            <i className="fab fa-youtube"></i>
          </div>
        </div>
      </div>

      <div className="col">
        <h4>About</h4>
        <a href="#">About Us</a>
        <a href="#">Terms &amp; Conditions</a>
        <a href="#">Contact Us</a>
      </div>

      <div className="col">
        <h4>My Account</h4>
        <a href="#">Help</a>
      </div>
    </footer>
  );
}

export default Footer;
