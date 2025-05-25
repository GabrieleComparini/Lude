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

    // Function to load chart data
    const loadChartData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Loading chart data...');
            const data = await getSpeedDistribution();
            console.log('Chart data received:', JSON.stringify(data));
            
            // Basic validation
            if (!data) {
                console.error('No data returned from getSpeedDistribution');
                setError('Dati del grafico non disponibili.');
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
                    setError('Errore nei dati del grafico: lunghezza inconsistente.');
                }
            } else {
                console.error('Invalid chart data structure:', data);
                setError('Struttura dati del grafico non valida.');
            }
        } catch (err) {
            console.error("Error loading speed distribution chart:", err);
            setError('Impossibile caricare la distribuzione velocità.');
        } finally {
            setLoading(false);
        }
    };

    // Effect to load data on component mount
    useEffect(() => {
        loadChartData();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Caricamento grafico...</Text>
            </View>
        );
    }

    // If we have valid chart data, render the chart
    if (chartData) {
        const chartConfig = {
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.9})`,
            style: {
                borderRadius: 8,
            },
            propsForDots: {
                r: "0",
                strokeWidth: "0",
            },
            barPercentage: 0.6,
            formatYLabel: (value) => {
                const minutes = Math.round(parseFloat(value));
                return `${minutes}`;
            },
            propsForBackgroundLines: {
                strokeWidth: 1,
                stroke: `rgba(255, 255, 255, 0.1)`,
                strokeDasharray: "5, 5"
            },
            propsForLabels: {
                fontSize: 12,
                fontWeight: '600',
            },
            withHorizontalLines: true,
            withVerticalLines: false,
            segments: 5,
        };

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Distribuzione Velocità</Text>
                <Text style={styles.chartSubtitle}>(Minuti per range di velocità km/h)</Text>
                <View style={styles.yAxisLabelContainer}>
                    <Text style={styles.yAxisLabel}>Minuti</Text>
                </View>
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
                    showValuesOnTopOfBars={true}
                    withInnerLines={true}
                />
            </View>
        );
    }

    // If there's an error, show error message
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.errorSubtext}>Si prega di riprovare più tardi.</Text>
            </View>
        );
    }

    // Fallback UI if no data and no error
    return (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Dati non disponibili.</Text>
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
        marginLeft: -10,
    },
    yAxisLabelContainer: {
        position: 'absolute',
        left: 10,
        top: '50%',
        transform: [{ rotate: '-90deg' }],
        zIndex: 1,
    },
    yAxisLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
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
        padding: 10,
        fontSize: 16,
    },
    errorSubtext: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    }
});

export default SpeedDistributionChart; 