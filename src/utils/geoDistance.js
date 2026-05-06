const toRad = (deg) => (deg * Math.PI) / 180;

// Haversine formula — returns distance in miles between two lat/lng points
export const haversineMiles = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
};

export const formatMiles = (miles) =>
  miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;

export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });
