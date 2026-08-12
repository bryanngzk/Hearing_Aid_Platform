export const bookings = [
  {
    id: 'HB-20487',
    service: 'Hearing Aid Fitting',
    provider: 'HearBridge Cardiff Clinic',
    date: '12 Aug 2026',
    time: '10:30 AM',
    status: 'upcoming',
  },
  {
    id: 'HB-20412',
    service: 'Free Hearing Test',
    provider: 'HearBridge Swansea Clinic',
    date: '03 Aug 2026',
    time: '2:00 PM',
    status: 'upcoming',
  },
  {
    id: 'HB-19875',
    service: 'Trade-In Evaluation',
    provider: 'HearBridge Cardiff Clinic',
    date: '18 Jun 2026',
    time: '11:15 AM',
    status: 'completed',
  },
  {
    id: 'HB-19630',
    service: 'Device Repair Consultation',
    provider: 'HearBridge Newport Clinic',
    date: '02 May 2026',
    time: '9:45 AM',
    status: 'completed',
  },
  {
    id: 'HB-19402',
    service: 'Hearing Aid Fitting',
    provider: 'HearBridge Swansea Clinic',
    date: '14 Apr 2026',
    time: '3:30 PM',
    status: 'cancelled',
  },
];

export const statusMeta = {
  upcoming: { label: 'Upcoming', icon: 'fa-circle-check', className: 'status-upcoming' },
  completed: { label: 'Completed', icon: 'fa-clock-rotate-left', className: 'status-completed' },
  cancelled: { label: 'Cancelled', icon: 'fa-circle-xmark', className: 'status-cancelled' },
};
