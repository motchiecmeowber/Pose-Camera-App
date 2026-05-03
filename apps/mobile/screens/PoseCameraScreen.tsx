import React, { useRef, useState, useCallback, useEffect } from "react";
import { StyleSheet, View,Text, Pressable, useWindowDimensions, Alert } from "react-native";
import { CameraType, CameraView, useCameraPermissions, } from "expo-camera"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as MediaLibrary from "expo-media-library"
import { captureWithOverlay, cleanupTempFiles } from "@/utils/captureWithOverlay"
import SilhouetteOverlay, { MatchState, PoseData } from "@/components/SilhouetteOverlay";
import { usePoses } from "@/hooks/use-poses";
import CaptureButton from "@/components/CaptureButton";
import PoseSelectorSheet from "@/components/PoseSelectorSheet";
import { fetchPoseById, PoseResponse } from "@/services/poseApi";

const SHEET_PEEK = 140

export default function PoseCameraScreen() {
    const {width, height} = useWindowDimensions()
    const insets = useSafeAreaInsets()

    const [cameraPermission, requestCameraPermission] = useCameraPermissions()
    const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions({ writeOnly: true})

    const [facing, setFacing] = useState<CameraType>("back")
    const [selectedPose, setSelectedPose] = useState<PoseData | null>(null)
    const [matchState] = useState<MatchState>("idle")
    const [isCapturing, setIsCapturing] = useState(false)
    const [lastSaved, setLastSaved] = useState(false)

    const [isSheetVisible, setIsSheetVisible] = useState(false)

    const cameraRef = useRef<CameraView>(null)
    const cameraContainerRef = useRef<View>(null)

    const {poses, categories, isLoading, activeCategory, setActiveCategory} = usePoses()
    const cameraHeight = height - SHEET_PEEK - insets.bottom

    useEffect(() => () => {cleanupTempFiles()}, [])

    const ensureMediaPermission = useCallback(async (): Promise<boolean> => {
        if (mediaPermission?.granted)
            return true

        const {granted} = await requestMediaPermission()
        if (!granted) {
            Alert.alert(
                "Access required",
                "Go to Settings -> Apps to allow saving photos",
                [{text: "OK"}]
            )
        }
        return granted
    }, [mediaPermission, requestMediaPermission])

    const handleCapture = useCallback(async () => {
        if (isCapturing)
            return

        if(!(await ensureMediaPermission()))
            return

        try {
            setIsCapturing(true)
            await captureWithOverlay({
                cameraRef,
                pose: null,
                screenWidth: width,
                screenHeight: cameraHeight,
                quality: 1
            })

            setLastSaved(true)
            setTimeout(() => setLastSaved(false), 1800)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Please try again"
            Alert.alert("Unable to save image", message)
            console.error("[PoseCameraScreen]", err)
        } finally {
            setIsCapturing(false)
        }
    }, [isCapturing, ensureMediaPermission])

    const handleSelectPose = useCallback(async (poseFromList: PoseResponse | null) => {
        if (!poseFromList) {
            setSelectedPose(null)
            return
        }

        try {
            const detailedPose = await fetchPoseById(poseFromList.id)
            setSelectedPose(detailedPose)
        } catch (error) {
            console.error("[PoseCameraScreen] fetchPoseById error:", error)
            setSelectedPose(poseFromList)
        }
    }, [])

    const handleFlip = useCallback(() => {
        setFacing((f) => (f === "back" ? "front" : "back"))
    }, [])

    if (!cameraPermission)
        return <View style={styles.fill} />

    if (!cameraPermission.granted)
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>The apps needs camera access permission</Text>
                <Pressable style={styles.permissionBtn} onPress={requestCameraPermission}>
                    <Text style={styles.permissionBtnText}>Gant permissions</Text>
                </Pressable>
            </View>
        )

    return (
        <View style={styles.fill}>
            <View ref={cameraContainerRef} collapsable={false} style={[styles.cameraContainer, {height: cameraHeight}]}>
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash="off" />
                <SilhouetteOverlay pose={selectedPose} width={width} height={cameraHeight} matchState={matchState} />

                {lastSaved && (
                    <View style={styles.savedToast}>
                        <Text style={styles.savedToastText}>Saved to collection</Text>
                    </View>
                )}

                <Pressable style={[styles.flipBtn, {top: insets.top + 12}]} onPress={handleFlip}>
                    <Text style={styles.flipBtnText}>⇄</Text>
                </Pressable>

                {selectedPose && (
                    <Pressable style={[styles.clearBtn, {top: insets.top + 12}]} onPress={() => setSelectedPose(null)}>
                        <Text style={styles.clearBtnText}>X</Text>
                    </Pressable>
                )}
            </View>

            <View style={[styles.bottomBar, {paddingBottom: insets.bottom + 12}]}>
                {!isSheetVisible && (
                    <>
                        <CaptureButton onPress={handleCapture} isCapturing={isCapturing} disabled={isCapturing} />
                        
                        <Pressable style={styles.suggestionBtn} onPress={() => setIsSheetVisible(true)}>
                            <View style={styles.suggestionIconCircle}>
                                <Text style={{fontSize: 20}}>✨</Text>
                            </View>
                            <Text style={styles.suggestionBtnText}>Gợi ý</Text>
                        </Pressable>
                    </>
                )}
            </View>

            <PoseSelectorSheet poses={poses} categories={categories} selectedPoseId={selectedPose?.id ?? null} onSelectPose={handleSelectPose} isLoading={isLoading} 
                activeCategory={activeCategory} onCategoryChange={setActiveCategory} visible={isSheetVisible} onClose={() => setIsSheetVisible(false)} />
        </View>
    )
}

const styles = StyleSheet.create({
    fill: {flex: 1, backgroundColor: "#000"},
    cameraContainer: {width: "100%", backgroundColor: "#000", overflow: "hidden"},
    bottomBar: {alignItems: "center", justifyContent: "center", paddingTop: 16, backgroundColor: "#0a0a0a"},

    suggestionBtn: { position: "absolute", right: 32, alignItems: "center", justifyContent: "center" },
    suggestionIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
    suggestionBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },

    flipBtn: {position: "absolute", right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center"},
    flipBtnText: {color: "#fff", fontSize: 20},
    clearBtn: {position: "absolute", left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center"},
    clearBtnText: {color: "#fff", fontSize: 14},
    savedToast: {position: "absolute", bottom: 20, alignSelf: "center", backgroundColor: "rgba(0,230,118,0.9)", paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20},
    savedToastText: {color: "#fff", fontWeight: "600", fontSize: 13},
    permissionContainer: {flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", gap: 16, padding: 32},
    permissionText: {color: "#fff", fontSize: 16, textAlign: "center"},
    permissionBtn: {backgroundColor: "#00E5FF", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24},
    permissionBtnText: {color: "#000", fontWeight: "700", fontSize: 15}
})