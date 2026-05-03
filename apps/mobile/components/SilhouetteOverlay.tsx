import React, { useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Animated, Easing, Image } from 'react-native';

// ------------- Types -------------------------------
export interface PoseData {
    id: string
    color: string
    thumbnailUrl: string | null
    opacity: number
}

export type MatchState = "idle" | "close" | "matched"

interface SilhouetteOverlayProps {
    pose: PoseData | null
    width: number
    height: number
    matchState?: MatchState
}

// ------------- Constants ----------------------------
const COLOR_BY_STATE: Record<MatchState, string | null> = {
    idle: null,
    close: "#FFD600",
    matched: "#00E676"
}

const GLOW_OPACITY_BY_STATE: Record<MatchState, number> = {
    idle: 0.15,
    close: 0.3,
    matched: 0.5
}

// ------------- Component -----------------------------
const SilhouetteOverlay: React.FC<SilhouetteOverlayProps> = ({
    pose,
    width,
    height,
    matchState = "idle"
}) => {
    const breathAnim = useRef(new Animated.Value(1)).current
    const glowAnim = useRef(new Animated.Value(0)).current
    const rippleAnim = useRef(new Animated.Value(0)).current
    const rippleOpacity = useRef(new Animated.Value(0)).current

    const startBreathing = useCallback(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(breathAnim, {
                    toValue: 1.012,
                    duration: 1800,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                }),
                Animated.timing(breathAnim, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                })
            ])
        ).start()
    }, [breathAnim])

    const startGlow = useCallback((intensity: number) => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: intensity,
                    duration: 900,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 900,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true
                })
            ])
        ).start()
    }, [glowAnim])

    const triggerRipple = useCallback(() => {
        rippleAnim.setValue(0)
        rippleOpacity.setValue(0.6)

        Animated.parallel([
            Animated.sequence([
                Animated.timing(rippleAnim, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true
                }),
                Animated.timing(rippleOpacity, {
                    toValue: 0,
                    duration: 700,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true
                })
            ])
        ]).start()
    }, [rippleAnim, rippleOpacity])

    useEffect(() => {
        if (!pose) {
            breathAnim.stopAnimation()
            glowAnim.stopAnimation()
            return
        }

        startBreathing()

        if (matchState === "idle") {
            glowAnim.stopAnimation()
            glowAnim.setValue(0)
        } else if (matchState === "close") {
            startGlow(0.4)
        } else if (matchState === "matched") {
            startGlow(1)
            triggerRipple()
        }

        return () => {
            breathAnim.stopAnimation()
            glowAnim.stopAnimation()
        }
    }, [pose?.id, matchState, startBreathing, startGlow, triggerRipple])

    if (!pose || !pose.thumbnailUrl) return null

    const activeColor = COLOR_BY_STATE[matchState] ?? pose?.color
    const glowOpacity = GLOW_OPACITY_BY_STATE[matchState]

    const rippleScale = rippleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.06]
    })

    return (
        <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents='none'>
            {/* Layer 1: Glow */}
            <Animated.View style={[StyleSheet.absoluteFill, styles.layer, { opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, glowOpacity]
            })}]}>
                <Image source={{ uri: pose.thumbnailUrl }} style={{ width, height, tintColor: activeColor }} resizeMode='contain' />
            </Animated.View>

            {/* Layer 2: Ripple scale */}
            <Animated.View style={[StyleSheet.absoluteFill, styles.layer, { opacity: rippleOpacity, transform: [{ scale: rippleScale }]}]}>
                <Image source={{ uri: pose.thumbnailUrl }} style={{ width, height, tintColor: activeColor }} resizeMode='contain' />
            </Animated.View>

            {/* Layer 3: Main path */}
            <Animated.View style={[StyleSheet.absoluteFill, styles.layer, { opacity: pose.opacity, transform: [ {scale: breathAnim }, { translateX: 0 }, { translateY: 0 }]}]}>
                <Image source={{ uri: pose.thumbnailUrl }} style={{ width, height, tintColor: activeColor }} resizeMode='contain' />
            </Animated.View>
        </View>
    )
}

// ------------- Styles ------------------------------
const styles = StyleSheet.create({
    container: {
        zIndex: 10
    },
    layer: {
        alignItems: 'center',
        justifyContent: 'center'
    }
})

export default SilhouetteOverlay