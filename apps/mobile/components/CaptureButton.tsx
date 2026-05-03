import React, { useCallback, useEffect, useRef } from "react"
import { Pressable, View, StyleSheet, ActivityIndicator, Animated, Easing } from "react-native"

// ------------- Styles -----------------
interface CaptureButtonProps {
    onPress: () => void
    isCapturing?: boolean
    disabled?: boolean
    size?: number
}

// ------------- Constants ----------------------
const OUTER_RING = 3
const INNER_GAP = 5

// ------------- Component ----------------------
const CaptureButton: React.FC<CaptureButtonProps> = ({
    onPress,
    isCapturing = false,
    disabled = false,
    size = 72,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current
    const spinAnim = useRef(new Animated.Value(0)).current
    const opacityAnim = useRef(new Animated.Value(disabled ? 0.45 : 1)).current

    const innerSize = size - (OUTER_RING + INNER_GAP) * 2

    // ------------- Spinner while capturing -----------
    useEffect(() => {
        if (isCapturing) {
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.linear,
                    useNativeDriver: true
                })
            ).start()
        } else {
            spinAnim.stopAnimation()
            spinAnim.setValue(1)
        }
    }, [isCapturing, spinAnim])

    // ------------- Disable opacity -------------------
    useEffect(() => {
        Animated.timing(opacityAnim, {
            toValue: disabled ? 0.45 : 1,
            duration: 150,
            useNativeDriver: true
        }).start()
    }, [disabled, opacityAnim])

    // ------------- Press animation -------------------
    const handlePressIn = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 0.88,
            useNativeDriver: true,
            speed: 50,
            bounciness: 0
        }).start()
    }, [scaleAnim])

    const handlePressOut = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 10
        }).start()
    }, [scaleAnim])

    const spinDeg = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"]
    })

    return (
        <Animated.View style={[styles.wrapper, {width: size, height: size}, {transform: [{scale: scaleAnim}], opacity: opacityAnim}]}>
            <Pressable onPress={disabled ? undefined : onPress} onPressIn={disabled ? undefined : handlePressIn} onPressOut={disabled ? undefined : handlePressOut} style={[styles.pressable, {width: size, height: size}]}
                accessibilityLabel="Capture" accessibilityRole="button" accessibilityState={{disabled}}>
                    <View style={[styles.outerRing, {width: size, height: size, borderRadius: size / 2, borderWidth: OUTER_RING}]} />

                    {isCapturing && (
                        <Animated.View style={[StyleSheet.absoluteFill, {transform: [{rotate: spinDeg}]}]}>
                            <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: OUTER_RING + 0.5, borderColor: "transparent", borderTopColor: "#00E5FF", borderRightColor: "transparent" }} />
                        </Animated.View>
                    )}

                    <View style={[styles.innerCircle, {width: innerSize, height: innerSize, borderRadius: innerSize / 2, backgroundColor: isCapturing ? "rgba(255,255,255,0.55)" : "#FFFFFF"}]} />
                </Pressable>
        </Animated.View>
    )
}

export default CaptureButton

// ------------- Styles -------------------------------
const styles = StyleSheet.create({
    wrapper: {alignItems: "center", justifyContent: "center"},
    pressable: {alignItems: "center", justifyContent: "center"},
    outerRing: {position: "absolute", borderColor: "rgba(255,255,255,0.9)"},
    innerCircle: {shadowColor: "#fff", shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4}
})