import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { theme } from '../../styles/theme';
import { getSpeedDistribution } from '../../api/services/analyticsService';

const screenWidth = Dimensions.get("window").width;

const SpeedDistributionChart = () => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attempts, setAttempts] = useState(0);

    // Function to load chart data
    const loadChartData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log(`Loading chart data (attempt ${attempts + 1})...`);
            const data = await getSpeedDistribution();
            console.log('Chart data received:', JSON.stringify(data));
            
            // Basic validation
            if (!data) {
                console.error('No data returned from getSpeedDistribution');
                setError('Dati del grafico mancanti.');
                // Use default data
                setChartData(getDefaultChartData());
                return;
            }
            
            // Check if data has the expected structure
            if (data.labels && Array.isArray(data.labels) && 
                data.datasets && Array.isArray(data.datasets) && 
                data.datasets[0] && Array.isArray(data.datasets[0].data)) {
                
                // Ensure data length matches labels length
                if (data.labels.length === data.datasets[0].data.length) {
                    setChartData(data);
                } else {
                    console.error("Data length mismatch for chart:", 
                        `labels (${data.labels.length}) != data (${data.datasets[0].data.length})`);
                    
                    // Fix the data by padding or trimming
                    const fixedData = fixDataLengthMismatch(data);
                    setChartData(fixedData);
                }
            } else {
                console.error('Invalid chart data structure:', data);
                setError('Struttura dati del grafico non valida.');
                // Use default chart data
                setChartData(getDefaultChartData());
            }
        } catch (err) {
            console.error("Error loading speed distribution chart:", err);
            setError('Impossibile caricare la distribuzione velocità.');
            // Use default chart data
            setChartData(getDefaultChartData());
        } finally {
            setLoading(false);
        }
    };
    
    // Helper function to fix data length mismatch
    const fixDataLengthMismatch = (data) => {
        const labels = [...data.labels];
        const values = [...data.datasets[0].data];
        
        // If we have more labels than data points, add zeros
        while (labels.length > values.length) {
            values.push(0);
        }
        
        // If we have more data points than labels, add generic labels
        while (values.length > labels.length) {
            labels.push(`Range ${labels.length + 1}`);
        }
        
        return {
            labels,
            datasets: [{
                data: values
            }]
        };
    };
    
    // Default chart data when API fails
    const getDefaultChartData = () => {
        return {
            labels: ["0-50", "50-100", "100-150", "150-200", "200-250", "250+"],
            datasets: [{
                data: [15, 25, 35, 20, 10, 5]
            }]
        };
    };

    // Effect to load data and retry on failure
    useEffect(() => {
        loadChartData();
        
        // Setup retry mechanism
        if (error && attempts < 2) {
            const retryTimer = setTimeout(() => {
                setAttempts(attempts + 1);
                loadChartData();
            }, 2000); // Retry after 2 seconds
            
            return () => clearTimeout(retryTimer);
        }
    }, [attempts]);

    if (loading && !chartData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Caricamento grafico...</Text>
            </View>
        );
    }

    // Always render the chart if we have data, even if there was an error
    // This ensures we always show something, even if it's default data
    if (chartData) {
        const chartConfig = {
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.6})`,
            style: {
                borderRadius: 8,
            },
            propsForDots: {
                r: "0",
                strokeWidth: "0",
            },
            barPercentage: 0.6,
            formatYLabel: (value) => `${value} min`,
        };

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Distribuzione Velocità</Text>
                <Text style={styles.chartSubtitle}>(Minuti per range di velocità km/h)</Text>
                {error && <Text style={styles.warningText}>{error}</Text>}
                <BarChart
                    style={styles.chart}
                    data={chartData}
                    width={screenWidth - 30}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=" min"
                    chartConfig={chartConfig}
                    verticalLabelRotation={0}
                    fromZero={true}
                    showValuesOnTopOfBars={false}
                />
            </View>
        );
    }

    // Fallback UI if everything else fails
    return (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Impossibile visualizzare il grafico.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    chartContainer: {
        marginTop: 20,
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        paddingVertical: 15,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    chartSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 10,
    },
    chart: {
        borderRadius: 8,
    },
    loadingContainer: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        marginTop: 20,
    },
    loadingText: {
        marginTop: 10,
        color: theme.colors.textSecondary,
    },
    errorContainer: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        marginTop: 20,
    },
    errorText: {
        textAlign: 'center',
        color: theme.colors.error,
        padding: 20,
    },
    warningText: {
        fontSize: 12,
        color: theme.colors.warning || '#FFA500',
        marginBottom: 8,
    }
});

export default SpeedDistributionChart; 