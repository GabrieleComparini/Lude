import apiClient from '../client';

/**
 * Get speed distribution data from user tracks
 * The response will contain data about how much time (in minutes) 
 * the user spent in different speed ranges
 */
export const getSpeedDistribution = async () => {
  try {
    const response = await apiClient.get('/api/analytics/speed-distribution');
    
    // Format the data for the chart
    // We need to convert seconds to minutes for display
    if (response.data && Array.isArray(response.data)) {
      return {
        labels: response.data.map(item => `${item.minSpeed}-${item.maxSpeed}`),
        datasets: [{
          data: response.data.map(item => (item.timeSpent / 60).toFixed(1)), // Convert seconds to minutes
        }],
      };
    }
    
    // If the API doesn't return the expected format yet, use track data to calculate
    // This is a fallback that could be removed once the API is fully implemented
    const tracksResponse = await apiClient.get('/api/tracks/list');
    const tracks = tracksResponse.data;
    
    // Default speed ranges in km/h
    const speedRanges = [
      { min: 0, max: 50 },
      { min: 50, max: 100 },
      { min: 100, max: 150 },
      { min: 150, max: 200 },
      { min: 200, max: 250 },
      { min: 250, max: Infinity }
    ];
    
    // Calculate time spent in each speed range across all tracks
    const timeInRanges = speedRanges.map(range => {
      let totalSeconds = 0;
      
      tracks.forEach(track => {
        if (track.points && Array.isArray(track.points)) {
          track.points.forEach((point, index) => {
            if (index > 0) {
              const speed = point.speed || 0; // km/h
              if (speed >= range.min && speed < range.max) {
                // Assuming points have timestamps in milliseconds
                const timeSpent = (point.timestamp - track.points[index - 1].timestamp) / 1000; // Convert to seconds
                totalSeconds += timeSpent;
              }
            }
          });
        }
      });
      
      // Convert seconds to minutes for display
      return totalSeconds / 60;
    });
    
    return {
      labels: speedRanges.map(range => 
        range.max === Infinity ? `${range.min}+` : `${range.min}-${range.max}`
      ),
      datasets: [{
        data: timeInRanges,
      }]
    };
  } catch (error) {
    console.error('Error fetching speed distribution:', error);
    throw error;
  }
};

/**
 * Get user analytics summary
 */
export const getAnalyticsSummary = async () => {
  try {
    const response = await apiClient.get('/api/analytics/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    throw error;
  }
};

export default {
  getSpeedDistribution,
  getAnalyticsSummary
}; 