import { File, Paths } from "expo-file-system"
import { ImageManipulator, SaveFormat } from "expo-image-manipulator"
import * as MediaLibrary from "expo-media-library"
import { Camera, CameraView } from "expo-camera"
import { Platform } from "react-native"
import React from "react"
import { PoseData } from "@/components/SilhouetteOverlay"

// ------------- Types --------------------------------
export interface CaptureOptions {
    cameraRef: React.RefObject<CameraView | null>
    pose: PoseData | null
    screenWidth: number
    screenHeight: number
    fit?: string
    quality?: number
}

export interface CaptureResult {
    uri: string
    width: number
    height: number
    asset: MediaLibrary.Asset
}

// ------------- Option 1: Simple image capture (no SVG merging) ---------------
export async function capturePhoto(
    cameraRef: React.RefObject<CameraView | null>,
    quality = 0.92
): Promise<CaptureResult> {
    if (!cameraRef.current) {
        throw new Error("[captureWithOverlay] CameraView ref is not yet available")
    }

    const photo = await cameraRef.current.takePictureAsync({
        quality,
        skipProcessing: true
    })
    if (!photo?.uri)
        throw new Error("[captureWithOverlay] takePictureAsync returns null")

    const asset = await MediaLibrary.createAssetAsync(photo.uri)

    return {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        asset
    }
}

// ------------- Option 2: Capture View (camera + overlay simultaneously) ------------------
export async function captureViewWithOverlay(
    viewRef: React.RefObject<import("react-native").View | null>,
    quality = 0.92
): Promise<CaptureResult> {
    let captureScreen: (ref: any, option?: any) => Promise<string>

    try {
        const viewShot = await import("react-native-view-shot")
        captureScreen = viewShot.captureRef
    } catch {
        throw new Error(
            "[captureWithOverlay] You need to install react-native-view-shoot:\n" +
            "npx expo install react-native-view-shot"
        )
    }

    if(!viewRef.current)
        throw new Error("[captureViewOverlay] View ref not yet mounted")

    const uri = await captureScreen(viewRef.current, {
        format: "jpg",
        quality,
        result: "tmpfile"
    })

    const tempFile = new File(uri)
    if (!tempFile.exists)
        throw new Error("[captureWithOverlay] The image file does not exist")

    const imageContext = ImageManipulator.manipulate(uri)
    const imageRef = await imageContext.renderAsync()
    const imgResult = await imageRef.saveAsync({
        format: SaveFormat.JPEG,
        compress: quality
    })

    const asset = await MediaLibrary.createAssetAsync(imgResult.uri)

    try {
        if (tempFile.exists)
            tempFile.delete()
    } catch (e) {}

    return {
        uri: imgResult.uri,
        width: imgResult.width,
        height: imgResult.height,
        asset
    }
}

// ------------- API ------------------------------
export async function captureWithOverlay(
    options: CaptureOptions & { viewRef?: React.RefObject<import("react-native").View | null>}
): Promise<CaptureResult> {
    const {cameraRef, quality = 0.92, viewRef} = options

    if (viewRef?.current)
        return captureViewWithOverlay(viewRef, quality)

    return capturePhoto(cameraRef, quality)
}

// ------------- Cleanup helper ------------------------------
export async function cleanupTempFiles(): Promise<void> {
    try {
        if (!Paths.cache.exists) return

        const files = Paths.cache.list()
        for (const item of files) {
            if (item instanceof File && item.name.startsWith("overlay_") && item.name.endsWith(".svg"))
                item.delete()
        }
    } catch (err) {
        console.warn("[captureWithOverlay] cleanupTempFiles:", err)
    }
}