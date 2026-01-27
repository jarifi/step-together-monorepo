import { Dimensions, StyleSheet } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
    // ---------- global styles ----------
    font: {
        fontFamily: 'Century Gothic',
    },

    // ---------- dashboard styles ----------
    container: {
        backgroundColor: '#F5F7F4',
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 20,
    },
    topSection: {
        //paddingTop: 100,
        backgroundColor: 'transparent',
        padding: 0,
        marginTop: 10
    },

    // ---------- expired challenge warning banner ----------
    expiredWarningContainer: {

        borderLeftWidth: 4,
        borderLeftColor: '#DC2626',
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginHorizontal: 0,
        marginTop: 50,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    expiredWarningIcon: {
        marginTop: 2,
    },
    expiredWarningContent: {
        flex: 1,
    },
    expiredWarningTitle: {
        color: '#DC2626',
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 4,
    },
    expiredWarningText: {
        color: '#DC2626',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 18,
    },
    closeWarningButton: {
        padding: 4,
        marginTop: -4,
    },

    // ---------- date picker styles ----------
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    calIconBtn: {
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#E8EFEA',
    },
    date: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F3E34',
    },

    // ---------- step challenge styles ----------
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
    challengeLabel: { color: '#7FA58C', fontWeight: '900' },
    challengeMeta: { color: '#6B7280' },

    // ---------- calories and Distance section styles ----------
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 20,
        justifyContent: 'space-between',
        paddingHorizontal: screenWidth < 380 ? 0 : 10,
    },
    metricSide: {
        width: screenWidth < 380 ? 60 : 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricSideValue: {
        fontSize: screenWidth < 380 ? 14 : 16,
        fontWeight: '700',
        color: '#2F3E34',
        lineHeight: 18,
        textAlign: 'center',
    },
    metricSideLabel: {
        fontSize: screenWidth < 380 ? 11 : 12,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 2,
    },

    // ---------- circle steps styles ----------
    stepCircleWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: screenWidth < 380 ? 140 : 170,
    },
    stepCircleOuter: {
        width: screenWidth < 380 ? 140 : 170,
        height: screenWidth < 380 ? 140 : 170,
        borderRadius: 999,
        backgroundColor: '#C5DECD',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: screenWidth < 380 ? 10 : 12,
        borderColor: '#DFEBE2',
    },
    stepCircleInnerRing: {
        position: 'absolute',
        width: screenWidth < 380 ? 110 : 134,
        height: screenWidth < 380 ? 110 : 134,
        borderRadius: 999,
        borderWidth: screenWidth < 380 ? 4 : 6,
        borderColor: '#E8EFEA',
    },
    stepCircle: {
        width: screenWidth < 380 ? 112 : 135,
        height: screenWidth < 380 ? 112 : 135,
        borderRadius: 999,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepValue: {
        fontSize: screenWidth < 380 ? 24 : 28,
        fontWeight: '800',
        color: '#2F3E34',
        textAlign: 'center',
    },
    stepLabel: {
        marginTop: 2,
        fontSize: screenWidth < 380 ? 10 : 11,
        letterSpacing: 1.2,
        color: '#6B7280',
        textAlign: 'center',
    },

    // ---------- week chart styles ----------
    weeklyTitle: {
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 30,
        fontSize: 18,
        color: '#2F3E34',
    },
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

    // ---------- progress card styles ----------
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

    // ---------- team section styles ----------
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

    // ---------- ranking list styles ----------
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
    
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    youNote: {
        color: '#6B7280',
        fontSize: 18
    },
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

    // ---------- edit button styles ----------
    editBtn: {
        alignSelf: 'center',
        backgroundColor: '#86AD8E',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 18,
        marginTop: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
    },
    editBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700'
    },

    // ---------- modal styles ----------
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 16,
    },
    stepsCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.20,
        shadowRadius: 18,
        elevation: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2F3E34',
        textAlign: 'center',
        flex: 1,
    },
    headerX: {
        width: 32,
        height: 32,
        borderRadius: 999,
        backgroundColor: '#F2F5F3',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    fieldWrap: {
        marginBottom: 14
    },
    fieldLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 6,
        fontWeight: '700'
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAF8',
        borderWidth: 1,
        borderColor: '#E4EFE8',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    inputBare: {
        flex: 1,
        fontSize: 16,
        color: '#2F3E34'
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
        marginBottom: 8,
    },
    primaryBtn: {
        flex: 1,
        backgroundColor: '#86AD8E',
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16
    },
    secondaryBtn: {
        flex: 1,
        backgroundColor: '#E8EFEA',
        borderWidth: 1,
        borderColor: '#C7D6CD',
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
    },
    secondaryBtnText: {
        color: '#2F3E34',
        fontWeight: '800',
        fontSize: 16
    },
    cancelGhost: {
        paddingVertical: 8,
        alignItems: 'center'
    },
    cancelGhostText: {
        color: '#6B7280',
        fontWeight: '700'
    },
    expiredModalWarning: {
        backgroundColor: '#FEF2F2',
        borderLeftWidth: 4,
        borderLeftColor: '#DC2626',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    expiredModalWarningText: {
        color: '#DC2626',
        fontWeight: '500',
        fontSize: 14,
        flex: 1,
        lineHeight: 18,
    },

    // ---------- calendar styles ----------

    calendarCard: {
        maxWidth: 400,
        maxHeight: 600,
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 12,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 5,
        overflow: 'visible',
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
        width: '100%',
        marginTop: 6,
        marginBottom: 6,
    },

    weekCell: {
        flex: 1,
        minWidth: 0,
        textAlign: 'center',
        fontSize: 12,
        color: '#7B8A80',
        fontWeight: '700',
        includeFontPadding: false,
    },

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        marginTop: 4,
        marginBottom: 16,
    },

    dayCellWrap: {
        flexBasis: '14.2857%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },

    dayCellInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    dayCellText: {
        fontSize: 16,
        color: '#2F3E34',
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        lineHeight: 16,
    },

    daySelectedWrap: {
        backgroundColor: '#D7E3DA',
    },

    dayOutText: {
        color: '#AEB7B1',
    },

    daySelectedText: {
        fontWeight: '800',
    },

    dayPastWrap: {
        backgroundColor: '#EEF3EF',
    },

    dayTodayWrap: {
        borderWidth: 2,
        borderColor: '#BFD4C5',
        borderRadius: 12,
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