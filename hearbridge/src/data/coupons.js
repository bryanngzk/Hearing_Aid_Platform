export const couponStatusMeta = {
  active: { label: 'Active', icon: 'fa-circle-check', className: 'status-approved' },
  redeemed: { label: 'Redeemed', icon: 'fa-clock-rotate-left', className: 'status-completed' },
};

// Makes up a short, readable coupon code, e.g. CPN-ABC123-XYZ
export function generateCouponCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `CPN-${timestamp}-${random}`;
}
