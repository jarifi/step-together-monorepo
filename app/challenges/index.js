import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ChallengeCard from '../../components/ChallengeCard';
import { getChallenges } from '../../services/challengeService';

export default function ChallengesScreen() {
    const [challenges, setChallenges] = useState([]);
    const [skip, setSkip] = useState(0);
    const limit = 10;
    const [loadingInital, setLoadingInitial] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const router = useRouter();

    const loadChallenges = async () => {
        if (loadingMore || !hasMore) return;

        const isInitial = challenges.length === 0;
        if (isInitial) setLoadingInitial(true);
        else setLoadingMore(true);

        try {
            const data = await getChallenges(skip, limit);
            setChallenges(prev => [...prev, ...data]);
            setSkip(prev => prev + data.length);

            if (data.length < limit) {
                setHasMore(false);
            }

        } catch (err) {
            console.error('Failed to load challenges:', err);
        } finally {
            if (isInitial) setLoadingInitial(false);
            else setLoadingMore(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setSkip(0);
            setChallenges([]);
            setHasMore(true);
            loadChallenges();
        }, [])
    );

    if (loadingInital) {
        return <ActivityIndicator style={styles.loader} size="large" />;
    }

    return (
        <View style={styles.container}>
            <Pressable onPress={() => router.push('/challenges/create')} style={styles.createButton}>
                <Text style={styles.createButtonText}>Neue Challenge erstellen</Text>
            </Pressable>

            {loadingInital && challenges.length === 0 ? (
                <ActivityIndicator style={styles.loader} size="large" />
            ) : (
                <FlatList
                    data={challenges}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <ChallengeCard
                            challenge={item}
                            onUpdate={() =>
                                router.push({
                                    pathname: '/challenges/update',
                                    params: {
                                        id: item.id,
                                        name: item.name,
                                        startLocation: item.startLocation,
                                        targetLocation: item.targetLocation,
                                        distance: item.distance?.toString(),
                                        startDate: item.startDate,
                                        endDate: item.endDate,
                                        creatorId: item.creatorId,
                                        teamId: item.teamId,
                                        state: item.state,
                                    },
                                })
                            }
                        />
                    )}
                    onEndReached={loadChallenges}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} /> : null}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
    createButton: {
        backgroundColor: '#6B8F71',
        padding: 12,
        marginBottom: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});