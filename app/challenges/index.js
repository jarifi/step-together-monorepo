import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ChallengeCard from '../../components/ChallengeCard';
import { getChallenges } from '../../services/ChallengeService';

export default function ChallengesScreen() {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loadChallenges = async () => {
        setLoading(true);
        const data = await getChallenges();
        setChallenges(data);
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadChallenges();
        }, [])
    );

    if (loading) {
        return <ActivityIndicator style={styles.loader} size="large" />;
    }

    return (
        <View style={styles.container}>
            <Pressable onPress={() => router.push('/challenges/create')} style={styles.createButton}>
                <Text style={styles.createButtonText}>Neue Challenge erstellen</Text>
            </Pressable>
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
            />
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