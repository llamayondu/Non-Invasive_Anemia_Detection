import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';

export default function LiveCameraScreen() {
    const [hasPermissions, setHasPermissions] = useState({
        camera: null,
        audio: null,
        mediaLibrary: null
    });
    const [cameraType, setCameraType] = useState('back');
    const [isRecording, setIsRecording] = useState(false);
    const [recordedVideo, setRecordedVideo] = useState(null);
    const cameraRef = useRef(null);
    const videoRef = useRef(null);

    const requestPermissions = async () => {
        try {
            // Camera Permission
            const cameraPermission = await Camera.requestCameraPermissionsAsync();

            // Audio Permission
            const audioPermission = await Camera.requestMicrophonePermissionsAsync();

            // Media Library Permission
            const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();

            const permissions = {
                camera: cameraPermission.status === 'granted',
                audio: audioPermission.status === 'granted',
                mediaLibrary: mediaLibraryPermission.status === 'granted'
            };

            console.log('Permissions:', {
                camera: cameraPermission,
                audio: audioPermission,
                mediaLibrary: mediaLibraryPermission
            });

            setHasPermissions(permissions);

            return permissions;
        } catch (error) {
            console.error('Permission Request Error:', error);
            return {
                camera: false,
                audio: false,
                mediaLibrary: false
            };
        }
    };

    useEffect(() => {
        requestPermissions();
    }, []);

    const toggleCameraType = () => {
        setCameraType(current => current === 'back' ? 'front' : 'back');
    };

    const startRecording = async () => {
        // Comprehensive permission check
        if (!hasPermissions.camera || !hasPermissions.audio) {
            const permissionResults = await requestPermissions();

            if (!permissionResults.camera || !permissionResults.audio) {
                Alert.alert(
                    'Permissions Required',
                    'Camera and audio permissions are needed to record video.',
                    [{ text: 'OK', onPress: () => { } }]
                );
                return;
            }
        }

        // Additional checks for camera ref and recording state
        if (!cameraRef.current) {
            console.error('Camera ref is not available');
            Alert.alert('Error', 'Camera is not ready');
            return;
        }

        if (isRecording) {
            console.warn('Already recording');
            return;
        }

        try {
            setIsRecording(true);

            console.log('Starting video recording');

            // Updated video recording method
            const video = await cameraRef.current.recordAsync({
                maxDuration: 60, // Optional: limit recording to 60 seconds
                // Removed VideoQuality reference
                mute: false
            });

            console.log('Video recording completed:', video);

            if (video && video.uri) {
                setRecordedVideo(video.uri);
            } else {
                throw new Error('No video data produced');
            }
        } catch (error) {
            console.error('Detailed Recording Error:', error);

            Alert.alert(
                'Recording Error',
                `Failed to record video: ${error.message}`,
                [{ text: 'OK', onPress: () => { } }]
            );
        } finally {
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (cameraRef.current && isRecording) {
            try {
                cameraRef.current.stopRecording();
            } catch (error) {
                console.error('Error stopping recording:', error);
            }
        }
    };

    const retakeVideo = () => {
        setRecordedVideo(null);
    };

    const saveVideo = async () => {
        if (!hasPermissions.mediaLibrary) {
            const permissionResults = await requestPermissions();

            if (!permissionResults.mediaLibrary) {
                Alert.alert(
                    'Media Library Permission',
                    'Media library access is needed to save videos.',
                    [{ text: 'OK', onPress: () => { } }]
                );
                return;
            }
        }

        if (recordedVideo) {
            try {
                await MediaLibrary.saveToLibraryAsync(recordedVideo);
                Alert.alert('Success', 'Video saved to gallery!');
            } catch (error) {
                console.error('Save Error:', error);
                Alert.alert('Error', 'Failed to save video');
            }
        }
    };

    if (recordedVideo) {
        return (
            <View style={styles.container}>
                <Video
                    ref={videoRef}
                    style={styles.video}
                    source={{ uri: recordedVideo }}
                    useNativeControls
                    resizeMode="contain"
                    isLooping
                />
                <View style={styles.previewButtons}>
                    <TouchableOpacity
                        style={[styles.button, styles.retakeButton]}
                        onPress={retakeVideo}
                    >
                        <Text style={styles.buttonText}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.proceedButton]}
                        onPress={saveVideo}
                    >
                        <Text style={styles.buttonText}>Save & Proceed</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={cameraType}
                ref={cameraRef}
            >
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={toggleCameraType}
                    >
                        <Text style={styles.buttonText}>Flip Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, isRecording ? styles.stopButton : styles.recordButton]}
                        onPress={isRecording ? stopRecording : startRecording}
                    >
                        <Text style={styles.buttonText}>
                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    buttonContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        margin: 20,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    button: {
        alignSelf: 'flex-end',
        alignItems: 'center',
        padding: 15,
        borderRadius: 50,
        marginHorizontal: 10,
    },
    recordButton: {
        backgroundColor: 'red',
    },
    stopButton: {
        backgroundColor: 'blue',
    },
    buttonText: {
        fontSize: 18,
        color: 'white',
    },
    video: {
        flex: 1,
        width: '100%',
    },
    previewButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        padding: 20,
    },
    retakeButton: {
        backgroundColor: 'gray',
        padding: 15,
        borderRadius: 5,
    },
    proceedButton: {
        backgroundColor: 'green',
        padding: 15,
        borderRadius: 5,
    },
});