import React, { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, Animated, FlatList, PanResponder, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, Text } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import PoseCard from "@/components/PoseCard"
import { PoseCategoryResponse, PoseResponse } from "@/services/poseApi"

// ------------- Types ----------------------------
interface PoseSelectorSheetProps {
    poses: PoseResponse[]
    categories: PoseCategoryResponse[]
    selectedPoseId: string | null
    onSelectPose: (pose: PoseResponse | null) => void
    isLoading?: boolean
    activeCategory?: string | null
    onCategoryChange?: (category: string | null) => void
    visible: boolean
    onClose: () => void
}

// ------------- Constants ------------------------
const HIDDEN_HEIGHT = 0
const COLLAPSED_HEIGHT = 240
const EXPANDED_HEIGHT = 400
const DRAG_THRESHOLD = 40
const CARD_GAP = 8
const CARD_WIDTH = 88

// ------------- Component ------------------------
const PoseSelectorSheet: React.FC<PoseSelectorSheetProps> = ({
    poses,
    categories,
    selectedPoseId,
    onSelectPose,
    isLoading = false,
    activeCategory = null,
    onCategoryChange,
    visible,
    onClose
}) => {
    const insets = useSafeAreaInsets()
    const { width } = useWindowDimensions()

    const [isExpanded, setIsExpanded] = useState(false)
    const [localCategory, setLocalCategory] = useState<string | null>(null)

    const currentCategory = onCategoryChange ? activeCategory : localCategory;
    const handleCategoryChange = onCategoryChange ?? setLocalCategory;
    
    // Animated height
    const heightAnim = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
    const dragStartY = useRef(0);
    const currentHeight = useRef(COLLAPSED_HEIGHT);

    useEffect(() => {
        const target = visible ? (isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT) : HIDDEN_HEIGHT
        currentHeight.current = target

        Animated.spring(heightAnim, {
            toValue: target,
            useNativeDriver: false,
            speed: 20,
            bounciness: 4
        }).start()
    }, [visible, isExpanded, heightAnim])

    // PanResponder
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,

            onPanResponderGrant: (_, g) => {
                dragStartY.current = g.y0
            },

            onPanResponderMove: (_, g) => {
                if (!visible) return

                const newH = Math.max(COLLAPSED_HEIGHT, Math.min(EXPANDED_HEIGHT, currentHeight.current - g.dy))
                heightAnim.setValue(newH)
            },

            onPanResponderRelease: (_, g) => {
                if (!visible) return

                const shouldExpand = g.dy < -DRAG_THRESHOLD
                const shouldCollapse = g.dy > DRAG_THRESHOLD && currentHeight.current > COLLAPSED_HEIGHT + 30
                const shouldClose = g.dy > DRAG_THRESHOLD && currentHeight.current <= COLLAPSED_HEIGHT + 30

                if (shouldClose) {
                    onClose()
                    return
                }

                const target = shouldExpand ? EXPANDED_HEIGHT
                                            : shouldCollapse ? COLLAPSED_HEIGHT
                                            : currentHeight.current
                
                currentHeight.current = target
                setIsExpanded(target === EXPANDED_HEIGHT)

                Animated.spring(heightAnim, {
                    toValue: target,
                    useNativeDriver: false,
                    speed: 20,
                    bounciness: 4
                }).start()
            }
        })
    ).current

    // Toggle expand/collapse
    const toggleExpand = useCallback(() => {
        const target = isExpanded ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT
        currentHeight.current = target

        setIsExpanded(!isExpanded)

        Animated.spring(heightAnim, {
            toValue: target,
            useNativeDriver: false,
            speed: 20,
            bounciness: 4
        }).start()
    }, [heightAnim, isExpanded])

    // Press/Unpress pose
    const handlePosePress = useCallback(
        (pose: PoseResponse) =>  {
            onSelectPose(pose.id === selectedPoseId ? null : pose)
        }, [selectedPoseId, onSelectPose]
    )

    // Render pose card
    const renderCard = useCallback(
        ({ item }: { item: PoseResponse }) => (
            <PoseCard pose={item} isSelected={item.id === selectedPoseId} onPress={handlePosePress} style={{ marginRight: CARD_GAP }} />
        ), [selectedPoseId, handlePosePress]
    )

    const keyExtractor = useCallback((item: PoseResponse) => item.id, [])

    return (
        <Animated.View style={[styles.sheet, {height: heightAnim, paddingBottom: visible ? insets.bottom + 8 : 0},]}>
        {/* ── Drag Handle ── */}
        <View style={styles.handleArea}>
                <View {...panResponder.panHandlers} style={styles.dragZone}>
                    <Pressable onPress={toggleExpand} style={styles.handleTouchable}>
                        <View style={styles.handle} />
                    </Pressable>
                </View>
                <Pressable onPress={onClose} style={styles.closeSheetBtn}>
                    <Text style={styles.closeSheetBtnText}>Xong</Text>
                </Pressable>
            </View>
    
        {/* ── Category Pills ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer} style={styles.pillsScroll}>
            {/* "All" pill */}
            <Pressable style={[styles.pill, currentCategory === null && styles.pillActive]} onPress={() => handleCategoryChange(null)}>
                <Text style={[styles.pillText, currentCategory === null && styles.pillTextActive ]}>
                    All
                </Text>
            </Pressable>
    
            {categories.map((cat) => (
                <Pressable key={cat.id} style={[styles.pill, currentCategory === cat.id && [
                    styles.pillActive,
                    { borderColor: cat.color },
                ]]} onPress={() => handleCategoryChange(
                    currentCategory === cat.id ? null : cat.id
                )}>
                    <View style={[styles.pillDot, { backgroundColor: cat.color }]} />
                    <Text style={[styles.pillText, currentCategory === cat.id && styles.pillTextActive]}>
                        {cat.label}
                    </Text>
                </Pressable>
            ))}
        </ScrollView>
    
        {/* ── Pose Cards ── */}
        {isLoading ? (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color="#00E5FF" size="small" />
                <Text style={styles.loadingText}>Đang tải mẫu...</Text>
            </View>
        ) : poses.length === 0 ? (
            <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có mẫu nào</Text>
            </View>
        ) : (
            <FlatList data={poses} renderItem={renderCard} keyExtractor={keyExtractor} horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardList} initialNumToRender={8} maxToRenderPerBatch={6} windowSize={5} getItemLayout={(_, index) => ({
                length: CARD_WIDTH + CARD_GAP,
                offset: (CARD_WIDTH + CARD_GAP) * index,
                index,
            })} />
        )}
        </Animated.View>
    )
}

export default PoseSelectorSheet

// ------------- Styles ---------------------------
const styles = StyleSheet.create({
    sheet: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(8, 8, 12, 0.96)",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 20,
        overflow: "hidden",
    },
     
    // ── Handle ──
    handleArea: {
        alignItems: "center",
        paddingTop: 6,
        paddingBottom: 2,
    },
    handleTouchable: {
        paddingVertical: 8,
        paddingHorizontal: 40,
        alignItems: "center",
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    dragZone: { 
        flex: 1, 
        alignItems: "center" 
    },
    closeSheetBtn: { 
        position: 'absolute', 
        right: 16, 
        padding: 8 
    },
    closeSheetBtnText: { 
        color: "#00E5FF", 
        fontWeight: "600", 
        fontSize: 15 
    },
     
    // ── Category pills ──
    pillsScroll: {
        flexGrow: 0,
    },
    pillsContainer: {
        paddingHorizontal: 14,
        paddingBottom: 10,
        gap: 6,
        flexDirection: "row",
        alignItems: "center",
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    pillActive: {
        backgroundColor: "rgba(255,255,255,0.1)",
        borderColor: "rgba(255,255,255,0.35)",
    },
    pillDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    pillText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 12,
        fontWeight: "500",
        letterSpacing: 0.3,
    },
      pillTextActive: {
        color: "rgba(255,255,255,0.95)",
        fontWeight: "600",
    },
     
    // ── Card list ──
    cardList: {
        paddingHorizontal: 14,
        paddingBottom: 4,
        alignItems: "flex-start",
    },
     
    // ── States ──
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 10,
    },
    loadingText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 13,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        color: "rgba(255,255,255,0.3)",
        fontSize: 13,
    }
})