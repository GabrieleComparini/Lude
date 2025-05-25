import apiClient from '../client';
import { getUserTracks } from './trackService';

/**
 * Get speed distribution data from user tracks
 * The response will contain data about how much time (in minutes) 
 * the user spent in different speed ranges
 */
export const getSpeedDistribution = async () => {
  try {
    console.log('Fetching speed distribution data...');
    const response = await apiClient.get('/api/analytics/speed-distribution');
    console.log('Speed distribution response:', response.status, JSON.stringify(response.data));
    
    // Format the data for the chart
    // We need to convert seconds to minutes for display
    if (response.data && Array.isArray(response.data)) {
      console.log('Converting API response to chart format');
      return {
        labels: response.data.map(item => `${item.minSpeed}-${item.maxSpeed}`),
        datasets: [{
          data: response.data.map(item => (item.timeSpent / 60).toFixed(1)), // Convert seconds to minutes
        }],
      };
    }
    
    // Se non abbiamo i dati nel formato atteso, lanciamo un errore
    throw new Error('API response not in expected format');
  } catch (error) {
    console.error('Error fetching speed distribution:', error);
    // Propagiamo l'errore invece di restituire dati falsi
    throw error;
  }
};

/**
 * Get user analytics summary with calculation of total distance if needed
 */
export const getAnalyticsSummary = async () => {
  try {
    console.log('Fetching analytics summary...');
    const response = await apiClient.get('/api/analytics/summary');
    
    // Log dettagliato della risposta
    console.log('Analytics summary response:', JSON.stringify(response.data, null, 2));
    
    let summaryData = response.data;
    
    // Verifica se totalDistance è presente
    if (!summaryData || (
        summaryData.totalDistance === undefined && 
        summaryData.total_distance === undefined && 
        summaryData.distance === undefined
    )) {
      console.log('Total distance not found in API response, calculating from tracks...');
      
      // Se totalDistance non è presente, calcoliamolo dai tracciati
      try {
        const tracksResponse = await getUserTracks(1, 100); // Ottieni fino a 100 tracciati
        if (tracksResponse && Array.isArray(tracksResponse.tracks)) {
          const totalDistance = tracksResponse.tracks.reduce((sum, track) => {
            return sum + (track.distance || 0);
          }, 0);
          
          console.log('Calculated total distance from tracks:', totalDistance);
          
          // Inizializza summaryData se è null
          if (!summaryData) {
            summaryData = {};
          }
          
          // Aggiungi totalDistance ai dati
          summaryData.totalDistance = totalDistance;
        }
      } catch (err) {
        console.error('Error calculating total distance from tracks:', err);
      }
    }
    
    return summaryData;
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    throw error;
  }
};

export default {
  getSpeedDistribution,
  getAnalyticsSummary
}; 