// Helper function to calculate distance between two lat/lng points (Haversine formula)
// Note: Consider using a dedicated library like 'geolib' for more robust calculations if needed.
export function calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
        return 0;
    }
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    return distance;
}

// Helper to format seconds into HH:MM:SS or MM:SS
export const formatTime = (seconds) => {
    if (seconds == null || isNaN(seconds) || seconds < 0) {
        return '00:00';
    }
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(secs).padStart(2, '0');

    if (hours > 0) {
        const formattedHours = String(hours).padStart(2, '0');
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    } else {
        return `${formattedMinutes}:${formattedSeconds}`;
    }
};

// Helper to format meters into km with 2 decimal places
export const formatDistance = (meters) => {
     if (meters == null || isNaN(meters) || meters < 0) {
        return '0.00';
    }
    const kilometers = meters / 1000;
    return kilometers.toFixed(2); // String with 2 decimal places
};

// Helper to format speed (m/s) into km/h as integer
export const formatSpeed = (speedMs) => {
     if (speedMs == null || isNaN(speedMs) || speedMs < 0) {
        return 0;
    }
    const speedKmh = speedMs * 3.6;
    return Math.floor(speedKmh); // Integer km/h
}; 