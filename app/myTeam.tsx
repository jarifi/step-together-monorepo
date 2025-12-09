import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { Animated, Easing } from 'react-native';

import {
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import styles from './styles/teamStyles';



type Member = {
    id: string;
    name: string;
    birth?: string;
    status?: 'manager' | 'pending' | 'invited';
};

const DUMMY_MEMBERS: Member[] = [
    { id: '1', name: 'Eleanor Pena', status: 'manager' },
    { id: '2', name: 'John Belford', status: 'pending' },
    { id: '3', name: 'Brooklyn Simmons', status: 'invited' },
    { id: '4', name: 'Ali Driver' },
    { id: '5', name: 'Carmel Velasquez' },
    { id: '6', name: 'Anna Carry' },
];

export default function TeamsScreen() {

    const [tab, setTab] = useState<'members' | 'events' | 'insights'>('members');
    const [search, setSearch] = useState('');
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [inviteModal, setInviteModal] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const friendCode = useMemo(() => 'STEP-' + Math.random().toString(36).slice(2, 8).toUpperCase(), []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return q ? DUMMY_MEMBERS.filter(m => m.name.toLowerCase().includes(q)) : DUMMY_MEMBERS;
    }, [search]);

    const toggleSelect = (id: string) =>
        setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

    const selectedCount = useMemo(
        () => Object.values(selected).filter(Boolean).length,
        [selected]
    );

    const copyCode = async () => {
        await Clipboard.setStringAsync(friendCode);
    };



    const shareCode = async () => {
        try {
            setIsSharing(true);
            await Share.share({
                message: `Join my Step Together challenge! Use invite code: ${friendCode}`,
            });
        } finally {
            setIsSharing(false);
        }
    };

    const renderPerson = ({ item }: { item: Member }) => {
        const initials = item.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

        return (
            <View style={styles.personRow}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>

                {selecting ? (
                    <TouchableOpacity
                        onPress={() => toggleSelect(item.id)}
                        style={styles.checkboxTouch}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: !!selected[item.id] }}
                    >
                        <View style={[styles.checkbox, !!selected[item.id] && styles.checkboxChecked]}>
                            {!!selected[item.id] && <Ionicons name="checkmark" size={16} color="#fff" />}
                        </View>
                    </TouchableOpacity>
                ) : (
                    <Ionicons name="ellipsis-horizontal" size={20} />
                )}
            </View>
        );
    };



    const overlayOpacity = useMemo(() => new Animated.Value(0), []);
    const sheetY = useMemo(() => new Animated.Value(40), []); // start slightly below

    const openInvite = () => {
        setInviteModal(true);
        // fade overlay immediately, then slide sheet
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.timing(sheetY, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    };

    const closeInvite = () => {
        Animated.parallel([
            Animated.timing(sheetY, { toValue: 40, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
            Animated.timing(overlayOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start(({ finished }) => {
            if (finished) setInviteModal(false);
        });
    };


    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="chevron-back" size={22} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Teams</Text>
                    <View style={{ width: 22 }} />
                </View>

        

                {/* Selector list (like left screenshot) */}
                {selecting && (
                    <View style={styles.selectorCard}>
                        <View style={styles.selectorHeader}>
                            <Text style={styles.selectorTitle}>{filtered.length} people found</Text>
                            <TouchableOpacity onPress={() => setSelected({})}>
                                <Text style={styles.selectorAction}>Clear</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            scrollEnabled={false}
                            data={filtered}
                            keyExtractor={(m) => m.id}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => toggleSelect(item.id)} activeOpacity={0.8}>
                                    {renderPerson({ item })}
                                </TouchableOpacity>
                            )}
                        />

                        <View style={styles.footerBar}>
                            <Text style={styles.footerText}>
                                {selectedCount === 0 ? 'No people selected' : `${selectedCount} people selected`}
                            </Text>
                            <TouchableOpacity
                                style={[styles.continueBtn, selectedCount === 0 && styles.continueBtnDisabled]}
                                disabled={selectedCount === 0}
                                onPress={() => {
                                    // hook up to your /teams/addMembers endpoint here
                                    setSelecting(false);
                                    setSelected({});
                                }}
                            >
                                <Text style={styles.continueText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Members list (like right screenshot) */}
                <View style={styles.membersBlock}>
                    <Text style={styles.blockHeading}>Members list</Text>
                    <FlatList
                        data={DUMMY_MEMBERS}
                        keyExtractor={(m) => m.id}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        renderItem={renderPerson}
                    />
                </View>
            </ScrollView>

           
            {/* --- Modal --- */}
            <Modal visible={inviteModal} transparent animationType="none" onRequestClose={closeInvite}>
                <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
                    <Animated.View
                        style={[
                            styles.modalCard,
                            styles.modalCardShadow,
                            { transform: [{ translateY: sheetY }] },
                        ]}
                    >
                        <Text style={styles.modalTitle}>Invite with code</Text>
                        <Text style={styles.modalHint}>
                            Friends can join your challenge by entering this code:
                        </Text>

                        <View style={styles.codePill}>
                            <Text style={styles.codeText}>{friendCode}</Text>
                            <TouchableOpacity onPress={copyCode} style={styles.copyBtn}>
                                <Ionicons name="copy-outline" size={20} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={shareCode} style={styles.shareBtn}>
                            <Ionicons name="share-outline" size={20} color="#fff" />
                            <Text style={styles.shareBtnText}>Share code</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={closeInvite} style={styles.modalClose}>
                            <Text style={styles.modalCloseText}>Close</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </Modal>


        </SafeAreaView>
    );
}
