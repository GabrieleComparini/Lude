import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getUserTracks } from '../../api/services/trackService';
import { formatDistance, formatTime, formatSpeed } from '../../utils/formatters';

// Component per visualizzare ogni elemento della lista tracciati
const TrackListItem = ({ track, onPress }) => {
    // Estrai i dati rilevanti dal track
    const { startTime, distance, duration, avgSpeed } = track;
    const date = new Date(startTime);

    return (
        <TouchableOpacity style={styles.trackItem} onPress={onPress}>
            <View style={styles.trackLeftContent}>
                <Text style={styles.trackDate}>
                    {date.toLocaleDateString()} - {date.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                </Text>
                <View style={styles.trackStats}>
                    <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={16} color="#555" />
                        <Text style={styles.statText}>{formatTime(duration)}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="map-outline" size={16} color="#555" />
                        <Text style={styles.statText}>{formatDistance(distance)} km</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="speedometer-outline" size={16} color="#555" />
                        <Text style={styles.statText}>{formatSpeed(avgSpeed)} km/h</Text>
                    </View>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#007AFF" />
        </TouchableOpacity>
    );
};

const HistoryScreen = () => {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(true);
    const [totalTracks, setTotalTracks] = useState(0);
    
    const navigation = useNavigation();

    // Funzione per caricare i tracciati
    const loadTracks = async (pageNum = 1, shouldRefresh = false) => {
        if (shouldRefresh) {
            setRefreshing(true);
        } else if (pageNum === 1) {
            setLoading(true);
        }
        
        setError(null);
        
        try {
            const response = await getUserTracks(pageNum, 10);
            const { tracks: newTracks, totalPages, totalTracks: total } = response;
            
            setTotalTracks(total);
            setHasMorePages(pageNum < totalPages);
            
            if (shouldRefresh || pageNum === 1) {
                setTracks(newTracks);
                setPage(1);
            } else {
                setTracks(prevTracks => [...prevTracks, ...newTracks]);
                setPage(pageNum);
            }
        } catch (err) {
            console.error('Error fetching tracks:', err);
            setError('Impossibile caricare i tracciati. Riprova più tardi.');
            Alert.alert('Errore', 'Impossibile caricare i tracciati. Riprova più tardi.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Carica i dati iniziali
    useEffect(() => {
        loadTracks();
    }, []);

    // Funzione per gestire il refresh quando si trascina verso il basso
    const handleRefresh = () => {
        loadTracks(1, true);
    };

    // Funzione per caricare più dati quando si arriva alla fine della lista
    const handleLoadMore = () => {
        if (hasMorePages && !loading && !refreshing) {
            loadTracks(page + 1);
        }
    };

    // Funzione per navigare ai dettagli di un tracciato
    const handleTrackPress = (track) => {
        navigation.navigate('TripDetail', { trackId: track._id });
    };

    // Renderizza il footer della lista (loader per caricamento paginato)
    const renderFooter = () => {
        if (!hasMorePages) return null;
        if (!loading) return null;
        
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.footerText}>Caricamento...</Text>
            </View>
        );
    };

    // Renderizza messaggio quando non ci sono tracciati
    const renderEmptyList = () => {
        if (loading && page === 1) return null;
        
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="map-outline" size={60} color="#ccc" />
                <Text style={styles.emptyTitle}>Nessun tracciato trovato</Text>
                <Text style={styles.emptyText}>I tuoi tracciati appariranno qui dopo averli salvati</Text>
            </View>
        );
    };

    return (
  <View style={styles.container}>
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            <FlatList
                data={tracks}
                renderItem={({ item }) => <TrackListItem track={item} onPress={() => handleTrackPress(item)} />}
                keyExtractor={item => item._id}
                contentContainerStyle={tracks.length === 0 ? { flexGrow: 1 } : { paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#007AFF']}
                    />
                }
                ListEmptyComponent={renderEmptyList}
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
            />
  </View>
);
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        margin: 10,
    },
    trackItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 12,
        marginTop: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    trackLeftContent: {
        flex: 1,
    },
    trackDate: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#333',
    },
    trackStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 14,
    },
    statText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#555',
    },
    footerLoader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    footerText: {
        marginLeft: 8,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 12,
        color: '#333',
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    }
});

export default HistoryScreen; 