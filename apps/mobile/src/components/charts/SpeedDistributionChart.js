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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getSpeedDistribution();
                if (data && data.labels && data.datasets && data.datasets[0].data) {
                   // Ensure data length matches labels length
                   if (data.labels.length === data.datasets[0].data.length) {
                       setChartData(data);
                   } else {
                       console.error("Data length mismatch for chart");
                       setError('Dati del grafico non validi.');
                   }
                } else {
                     setError('Dati del grafico mancanti.');
                }
            } catch (err) {
                console.error("Error fetching speed distribution:", err);
                setError('Impossibile caricare la distribuzione velocità.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Caricamento grafico...</Text>
            </View>
        );
    }

    if (error) {
        return <Text style={styles.errorText}>{error}</Text>;
    }

    if (!chartData) {
        return <Text style={styles.errorText}>Nessun dato disponibile per il grafico.</Text>;
    }

    const chartConfig = {
        backgroundColor: theme.colors.surface,
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        decimalPlaces: 1, // Show decimals for minutes
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
    },
    loadingText: {
        marginTop: 10,
        color: theme.colors.textSecondary,
    },
    errorText: {
        height: 220,
        textAlign: 'center',
        textAlignVertical: 'center',
        color: theme.colors.error,
        padding: 20,
    },
});

export default SpeedDistributionChart; 