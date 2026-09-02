export const clinics = [
  { id: 'cardiff', name: 'HearBridge Cardiff Clinic' },
  { id: 'swansea', name: 'HearBridge Swansea Clinic' },
  { id: 'newport', name: 'HearBridge Newport Clinic' },
];

export function getClinicName(clinicId) {
  return clinics.find((clinic) => clinic.id === clinicId)?.name || '';
}

const OPEN_HOUR = 9;
const CLOSE_HOUR = 17;
const SLOT_MINUTES = 30;

export function getDaySlots() {
  const slots = [];
  for (let minutes = OPEN_HOUR * 60; minutes < CLOSE_HOUR * 60; minutes += SLOT_MINUTES) {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    slots.push(`${hours}:${mins}`);
  }
  return slots;
}

export function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isClinicOpenOn(dateStr) {
  if (!dateStr || dateStr < todayDateString()) return false;
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day >= 1 && day <= 5;
}

export function isPastSlot(dateStr, time) {
  const today = todayDateString();
  if (dateStr > today) return false;
  if (dateStr < today) return true;
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  return hours < now.getHours() || (hours === now.getHours() && minutes <= now.getMinutes());
}

export function slotDocId(clinicId, date, time) {
  return `${clinicId}_${date}_${time}`;
}

export function generateBookingId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `HB-${timestamp}-${random}`;
}
