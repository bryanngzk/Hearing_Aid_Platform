import { useState } from 'react'
import { bookings, statusMeta } from '../data/bookings.js'

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function Booking() {
  const [activeTab, setActiveTab] = useState('all');

  const visibleBookings = bookings.filter(
    (booking) => activeTab === 'all' || booking.status === activeTab
  );

  return (
    <section id="booking" className="section-p1">
      <h2>My Bookings</h2>

      <div className="booking-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`booking-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="booking-list">
        {visibleBookings.length === 0 && (
          <p className="booking-empty">You have no {activeTab} bookings.</p>
        )}

        {visibleBookings.map((booking) => {
          const meta = statusMeta[booking.status];
          return (
            <div className="booking-card" key={booking.id}>
              <div className="booking-card-top">
                <span className={`booking-status ${meta.className}`}>
                  <i className={`fa-solid ${meta.icon}`}></i> {meta.label}
                </span>
                <span className="booking-ref">Ref: {booking.id}</span>
              </div>

              <h5>{booking.service}</h5>
              <p className="booking-provider">
                <i className="fa-solid fa-location-dot"></i> {booking.provider}
              </p>
              <p className="booking-datetime">
                <i className="fa-solid fa-calendar"></i> {booking.date}
                <i className="fa-solid fa-clock"></i> {booking.time}
              </p>

              <div className="booking-actions">
                {booking.status === 'upcoming' && (
                  <>
                    <button className="normal">Reschedule</button>
                    <button className="normal booking-cancel">Cancel</button>
                  </>
                )}
                {booking.status !== 'upcoming' && (
                  <button className="normal">View Details</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Booking;
