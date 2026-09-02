import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Listing from './pages/Listing.jsx'
import Product from './pages/Product.jsx'
import Appointments from './pages/Appointments.jsx'
import Booking from './pages/Booking.jsx'
import TradeIn from './pages/TradeIn.jsx'
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'
import Profile from './pages/Profile.jsx'
import ClinicApproval from './pages/ClinicApproval.jsx'
import TradeInDetail from './pages/TradeInDetail.jsx'
import RedeemCoupon from './pages/RedeemCoupon.jsx'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/listings" element={<Listing />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking/new" element={<Appointments />} />
        <Route path="/trade-in" element={<TradeIn />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/clinic-approval" element={<ClinicApproval />} />
        <Route path="/clinic-approval/:tradeInId" element={<TradeInDetail />} />
        <Route path="/redeem-coupon" element={<RedeemCoupon />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App
