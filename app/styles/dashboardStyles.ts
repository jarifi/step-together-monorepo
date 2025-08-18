import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F5F7F4',
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 35,
    },

    topSection: {
        backgroundColor: 'transparent',
        padding: 0,
    },

    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    calIconBtn: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#E8EFEA',
    },

    date: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F3E34',
    },
    hr: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
        marginTop: 25,
        marginBottom: 25,
    },
    challengeRow: {
        textAlign: 'center',
        fontSize: 18,
        color: '#2F3E34',
        marginBottom: 20,
    },
    challengeLabel: { color: '#7FA58C', fontWeight: '700' },
    challengeMeta: { color: '#6B7280' },

    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    metricSide: {
        width: 70,
        alignItems: 'center',
    },
    metricSideValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2F3E34',
        lineHeight: 18,
        marginHorizontal: 18,
    },
    metricSideLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginHorizontal: 24,
    },

    stepCircleWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleOuter: {
        width: 170,
        height: 170,
        borderRadius: 999,
        backgroundColor: '#C5DECD',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 12,
        borderColor: '#DFEBE2',
    },
    stepCircleInnerRing: {
        position: 'absolute',
        width: 134,
        height: 134,
        borderRadius: 999,
        borderWidth: 6,
        borderColor: '#E8EFEA',
    },
    stepCircle: {
        width: 135,
        height: 135,
        borderRadius: 999,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2F3E34',
    },
    stepLabel: {
        marginTop: 2,
        fontSize: 11,
        letterSpacing: 1.2,
        color: '#6B7280',
    },

    editBtn: {
        alignSelf: 'center',
        backgroundColor: '#7FA58C',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 18,
        marginTop: 1,
    },
    editBtnText: { color: '#FFFFFF', fontSize: 16 },

    weeklyTitle: {
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 30,
        fontSize: 18,
        color: '#2F3E34',
    },

    /* bars — uniform color */
    weekChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 190,
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 2,
        marginBottom: 80,
    },
    barCol: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    barTrack: {
        width: 20,
        height: 170,
        borderRadius: 12,
        backgroundColor: '#E4EFE8',
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    barFill: {
        width: 20,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        backgroundColor: '#7EA88F',
    },
    dayLabel: {
        marginTop: 6,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },

    /* progress card (scrolled area) */
    progressCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        marginTop: 8,

    },
    progressTitle: {
        textAlign: 'center',
        fontSize: 20,
        color: '#2F3E34',
        fontWeight: '800',
        marginTop: 6,
        marginBottom: 30,
    },
    topScaleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 6,
    },
    scaleTick: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    progressTrack: {
        height: 12,
        backgroundColor: '#E5E5E5',
        borderRadius: 999,
        overflow: 'hidden',
        marginTop: 8,
        marginBottom: 12,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#7FA58C',
        borderRadius: 999,
    },
    progressNote: {
        textAlign: 'center',
        fontSize: 18,
        color: '#2F3E34',
        marginTop: 20,
        marginBottom: 20,
    },

    teamSectionHeader: {
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: '#E6EAE5',
        marginTop: 10,
    },
    teamTitle: {
        textAlign: 'center',
        fontWeight: '800',
        fontSize: 22,
        color: '#1F2937',
        marginBottom: 10,
        marginTop: 10,
    },
    teamSubtitle: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: 20,
        marginBottom: 16,
    },

    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderColor: '#F0F2EF',
        borderRadius: 12,
    },
    rankRowMe: {
        backgroundColor: '#D7E3DA',
    },
    rankBadge: {
        width: 34,
        fontSize: 19,
        fontWeight: '800',
        color: '#6B7280',
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 999,
        backgroundColor: '#D1D5DB',
        marginRight: 25,
    },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    youNote: { color: '#6B7280', fontSize: 18 },
    userName: {
        fontSize: 17,
        color: '#111827',
        fontWeight: '600',
    },
    userSteps: {
        fontSize: 15,
        color: '#7FA58C',
        fontWeight: '800',
        marginTop: 2,
    },

    /* font hook */
    font: {
        // fontFamily: 'VarelaRound_400Regular',
        fontFamily: 'Century Gothic',
    },

    /* modal (shared overlay) */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },

    /* steps modal */
    modalView: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 22,
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 16,
        fontWeight: '800',
        color: '#5F764E',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#C7D6CD',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#F9FBF9',
        color: '#2F3E34',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeBtn: {
        backgroundColor: '#7FA58C',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },

    /* calendar modal card (clean, rounded, modern) */
    calendarCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 5,
    },
    calHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    calHeaderTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2F3E34',
    },
    navPill: {
        width: 34,
        height: 34,
        borderRadius: 999,
        backgroundColor: '#F2F5F3',
        alignItems: 'center',
        justifyContent: 'center',
    },

    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
        marginBottom: 6,
        paddingHorizontal: 6,
    },
    weekCell: {
        width: `${100 / 7}%`,
        textAlign: 'center',
        fontSize: 12,
        color: '#7B8A80',
        fontWeight: '700',
    },

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
        marginBottom: 16,
    },
    dayCellWrap: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    daySelectedWrap: {
        backgroundColor: '#D7E3DA',
    },
    dayCellText: {
        fontSize: 16,
        color: '#2F3E34',
    },
    dayOutText: {
        color: '#AEB7B1',
    },
    daySelectedText: {
        fontWeight: '800',
    },

    applyBtn: {
        backgroundColor: '#415949',
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 8,
    },
    applyBtnText: {
        color: '#86AD8E',
        fontWeight: '800',
        fontSize: 16,
    },
    cancelBtn: {
        backgroundColor: '#E8EFEA',
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#2F3E34',
        fontWeight: '700',
    },
});

export default styles;
