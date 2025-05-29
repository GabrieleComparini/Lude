import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTrackComments, addComment, deleteComment } from '../../../api/services/trackService';
import { useAuth } from '../../../context/AuthContext';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const CommentItem = ({ comment, onDelete, isCurrentUser }) => {
  return (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        {comment.userId.profileImage ? (
          <Image source={{ uri: comment.userId.profileImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {comment.userId.name ? comment.userId.name.charAt(0).toUpperCase() : 
              comment.userId.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.commentInfo}>
          <Text style={styles.commentAuthor}>
            {comment.userId.name || comment.userId.username}
          </Text>
          <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
        </View>
        {isCurrentUser && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(comment._id)}>
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.commentText}>{comment.text}</Text>
    </View>
  );
};

const CommentsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { trackId } = route.params;
  const { user } = useAuth();
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);

  const fetchComments = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setCurrentPage(1);
      }
      
      const page = refresh ? 1 : currentPage;
      const response = await getTrackComments(trackId, { page, limit: 15 });
      
      if (refresh) {
        setComments(response.comments || []);
      } else {
        setComments(prev => [...prev, ...(response.comments || [])]);
      }
      
      setHasMoreComments(response.currentPage < response.totalPages);
      
      if (!refresh) {
        setCurrentPage(prev => prev + 1);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Errore nel caricamento dei commenti. Riprova più tardi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [trackId, currentPage]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleRefresh = () => {
    fetchComments(true);
  };

  const handleLoadMore = () => {
    if (!isLoading && !isRefreshing && !isLoadingMore && hasMoreComments) {
      setIsLoadingMore(true);
      fetchComments();
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    
    setIsPosting(true);
    
    try {
      const result = await addComment(trackId, newComment.trim());
      setComments(prev => [result, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      Alert.alert('Errore', 'Impossibile pubblicare il commento. Riprova più tardi.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Elimina commento',
      'Sei sicuro di voler eliminare questo commento?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(trackId, commentId);
              setComments(prev => prev.filter(comment => comment._id !== commentId));
            } catch (err) {
              console.error('Error deleting comment:', err);
              Alert.alert('Errore', 'Impossibile eliminare il commento. Riprova più tardi.');
            }
          }
        }
      ]
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
      style={styles.container}
    >
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={comments}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <CommentItem 
                comment={item} 
                onDelete={handleDeleteComment} 
                isCurrentUser={user?._id === item.userId._id}
              />
            )}
            contentContainerStyle={styles.commentsContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-outline" size={50} color="#999" />
                <Text style={styles.emptyText}>Non ci sono commenti</Text>
                <Text style={styles.emptySubtext}>Sii il primo a commentare</Text>
              </View>
            }
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator style={styles.loadingMore} color="#007AFF" size="small" />
              ) : null
            }
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Scrivi un commento..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            {isPosting ? (
              <ActivityIndicator size="small" color="#007AFF" style={styles.postButton} />
            ) : (
              <TouchableOpacity
                style={[styles.postButton, !newComment.trim() && styles.disabledButton]}
                onPress={handlePostComment}
                disabled={!newComment.trim() || isPosting}
              >
                <Ionicons name="send" size={24} color={newComment.trim() ? "#007AFF" : "#999"} />
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  commentItem: {
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E1E1E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#666',
  },
  commentInfo: {
    marginLeft: 10,
    flex: 1,
  },
  commentAuthor: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
    paddingLeft: 46, // Align with author name
  },
  deleteButton: {
    padding: 8,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    padding: 8,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    backgroundColor: '#F9F9F9',
  },
  postButton: {
    marginLeft: 12,
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  loadingMore: {
    padding: 16,
  },
});

export default CommentsScreen; 