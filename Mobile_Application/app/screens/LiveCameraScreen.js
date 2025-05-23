import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Image } from 'react-native';
import { Camera } from 'expo-camera';
import { CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export default function LiveCameraScreen() {
    const [hasPermissions, setHasPermissions] = useState({
        camera: null,
        mediaLibrary: null
    });
    const [cameraType, setCameraType] = useState('back');
    const [capturedImage, setCapturedImage] = useState(null);
    const cameraRef = useRef(null);

    const requestPermissions = async () => {
        try {
            // Camera Permission
            const cameraPermission = await Camera.requestCameraPermissionsAsync();

            // Media Library Permission
            const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();

            const permissions = {
                camera: cameraPermission.status === 'granted',
                mediaLibrary: mediaLibraryPermission.status === 'granted'
            };

            console.log('Permissions:', {
                camera: cameraPermission,
                mediaLibrary: mediaLibraryPermission
            });

            setHasPermissions(permissions);

            return permissions;
        } catch (error) {
            console.error('Permission Request Error:', error);
            return {
                camera: false,
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

    const takePicture = async () => {
        // Comprehensive permission check
        if (!hasPermissions.camera) {
            const permissionResults = await requestPermissions();

            if (!permissionResults.camera) {
                Alert.alert(
                    'Camera Permission Required',
                    'Camera permission is needed to take a photo.',
                    [{ text: 'OK', onPress: () => { } }]
                );
                return;
            }
        }

        // Additional checks for camera ref
        if (!cameraRef.current) {
            console.error('Camera ref is not available');
            Alert.alert('Error', 'Camera is not ready');
            return;
        }

        try {
            console.log('Taking photo');

            // Capture photo
            const photo = await cameraRef.current.takePictureAsync({
                quality: 1, // Highest quality
                base64: false
            });

            console.log('Photo captured:', photo);

            if (photo && photo.uri) {
                setCapturedImage(photo.uri);
            } else {
                throw new Error('No photo data produced');
            }
        } catch (error) {
            console.error('Detailed Photo Capture Error:', error);

            Alert.alert(
                'Capture Error',
                `Failed to take photo: ${error.message}`,
                [{ text: 'OK', onPress: () => { } }]
            );
        }
    };

    const retakePicture = () => {
        setCapturedImage(null);
    };

    const saveImage = async () => {
        if (!hasPermissions.mediaLibrary) {
            const permissionResults = await requestPermissions();

            if (!permissionResults.mediaLibrary) {
                Alert.alert(
                    'Media Library Permission',
                    'Media library access is needed to save photos.',
                    [{ text: 'OK', onPress: () => { } }]
                );
                return;
            }
        }

        if (capturedImage) {
            try {
                await MediaLibrary.saveToLibraryAsync(capturedImage);
                Alert.alert('Success', 'Photo saved to gallery!');
            } catch (error) {
                console.error('Save Error:', error);
                Alert.alert('Error', 'Failed to save photo');
            }
        }
    };

    if (capturedImage) {
        return (
            <View style={styles.container}>
                <Image
                    source={{ uri: capturedImage }}
                    style={styles.capturedImage}
                    resizeMode="contain"
                />
                <View style={styles.previewButtons}>
                    <TouchableOpacity
                        style={[styles.button, styles.retakeButton]}
                        onPress={retakePicture}
                    >
                        <Text style={styles.buttonText}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.proceedButton]}
                        onPress={saveImage}
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
                        style={[styles.button, styles.captureButton]}
                        onPress={takePicture}
                    >
                        <Text style={styles.buttonText}>Take Photo</Text>
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
    captureButton: {
        backgroundColor: 'red',
    },
    buttonText: {
        fontSize: 18,
        color: 'white',
    },
    capturedImage: {
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