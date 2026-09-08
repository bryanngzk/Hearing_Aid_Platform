export const clinics = [
  { id: 'HearbridgeCardiff', name: 'HearBridge Cardiff Clinic' },
  { id: 'HearbridgeSwansea', name: 'HearBridge Swansea Clinic' },
  { id: 'HearbridgeNewport', name: 'HearBridge Newport Clinic' },
];

// Looks up a clinic's display name from its id
export function getClinicName(clinicId) {
  return clinics.find((clinic) => clinic.id === clinicId)?.name || '';
}

const OPEN_HOUR = 9;
const CLOSE_HOUR = 17;
const SLOT_MINUTES = 30;

// Lists every 30-minute appointment slot in a clinic's opening hours (09:00-16:30)
export function getDaySlots() {
  const slots = [];
  for (let minutes = OPEN_HOUR * 60; minutes < CLOSE_HOUR * 60; minutes += SLOT_MINUTES) {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    slots.push(`${hours}:${mins}`);
  }
  return slots;
}

// Gives today's date as "YYYY-MM-DD"
export function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Checks a date is a weekday that hasn't already passed
export function isClinicOpenOn(dateStr) {
  if (!dateStr || dateStr < todayDateString()) return false;
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day >= 1 && day <= 5;
}

// Checks whether a given date/time slot has already gone by
export function isPastSlot(dateStr, time) {
  const today = todayDateString();
  if (dateStr > today) return false;
  if (dateStr < today) return true;
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  return hours < now.getHours() || (hours === now.getHours() && minutes <= now.getMinutes());
}

// Builds the unique id used to "lock" one clinic's time slot in Firestore
export function slotDocId(clinicId, date, time) {
  return `${clinicId}_${date}_${time}`;
}

// Makes up a short, readable booking reference, e.g. HB-ABC123-XYZ
export function generateBookingId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `HB-${timestamp}-${random}`;
}
