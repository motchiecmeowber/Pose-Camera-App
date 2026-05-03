import React, { useCallback } from "react";
import { Pressable, StyleSheet, View, ViewStyle, Image, Text } from "react-native"
import { PoseResponse } from "@/services/poseApi";

// ------------- Types ---------------------------------
interface PoseCardProps {
    pose: PoseResponse,
    isSelected: boolean,
    onPress: (pose: PoseResponse) => void,
    style?: ViewStyle
}

// ------------- Constants -----------------------------
const CARD_WIDTH = 88
const CARD_HEIGHT = 112
const PREVIEW_W = CARD_WIDTH - 16
const PREVIEW_H = CARD_HEIGHT - 36



// ------------- Component -----------------------------
const PoseCard = React.memo(({ pose, isSelected, onPress, style }: PoseCardProps) => {
    const handlePress = useCallback(() => onPress(pose), [pose, onPress])

    return (
        <Pressable onPress={handlePress} style={({ pressed }) => [
            styles.card,
            isSelected && styles.cardSelected,
            pressed && styles.cardPressed,
            style
        ]}>
            {isSelected && (
                <View style={[styles.selectedBar, {backgroundColor: pose.color}]} />
            )}

            <View style={[styles.preview, isSelected && {opacity: 1}]}>
                {pose.thumbnailUrl && (
                    <Image source={{ uri: pose.thumbnailUrl }} style={[styles.thumbnail, { tintColor: pose.color }]} resizeMode="contain" />
                )}
            </View>

            <Text style={[styles.label, isSelected && { color: pose.color }]} numberOfLines={2} >
                {pose.name}
            </Text>
        </Pressable>
    )
})

export default PoseCard

// ------------- Styles --------------------------------
const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 4,
        overflow: "hidden",
    },
    cardSelected: {
        backgroundColor: "rgba(255,255,255,0.1)",
        borderColor: "rgba(255,255,255,0.3)",
    },
    cardPressed: {
        opacity: 0.75,
        transform: [{ scale: 0.96 }],
    },
    selectedBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2.5,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    preview: {
        width: PREVIEW_W,
        height: PREVIEW_H,
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.85,
    },
    thumbnail: {
        width: PREVIEW_W,
        height: PREVIEW_H,
        borderRadius: 6,
    },
    label: {
        color: "rgba(255,255,255,0.75)",
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 0.3,
        textAlign: "center",
        marginTop: 4,
        lineHeight: 13,
    }
})