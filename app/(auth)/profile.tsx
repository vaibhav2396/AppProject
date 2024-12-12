import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { getDatabase, ref, onValue, update, set } from 'firebase/database';
import { useAuth } from '@clerk/clerk-expo';
import firebaseApp from '../../firebaseConfig';

function Profile() {
    const { userId } = useAuth();
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        height: '',
        weight: '',
        weightGoal: '',
        stepGoal: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isInitialSetup, setIsInitialSetup] = useState(true);

    useEffect(() => {
        const db = getDatabase(firebaseApp);
        const userRef = ref(db, `users/${userId}`);
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setUserData(snapshot.val());
                setIsInitialSetup(false);
            } else {
                setIsInitialSetup(true);
            }
        });
    }, [userId]);

    const handleSave = async () => {
        const db = getDatabase(firebaseApp);
        const userRef = ref(db, `users/${userId}`);
        update(userRef, userData);
        setIsEditing(false);
    };

    const handleInitialSave = async () => {
        const db = getDatabase(firebaseApp);
        const userRef = ref(db, `users/${userId}`);
        set(userRef, userData);
        setIsInitialSetup(false);
    };

    const userKeys: (keyof typeof userData)[] = [
        'firstName',
        'lastName',
        'height',
        'weight',
        'weightGoal',
        'stepGoal'
    ];

    return (
        <View style={styles.container}>
            {isEditing || isInitialSetup ? (
                <View style={styles.editContainer}>
                    {userKeys.map((key) => (
                        <View key={key} style={styles.inputWrapper}>
                            <Text style={styles.editLabel}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</Text>
                            <TextInput
                                style={styles.inputField}
                                placeholder={key.replace(/([A-Z])/g, ' $1')}
                                value={userData[key]}
                                onChangeText={(text) => setUserData({ ...userData, [key]: text })}
                            />
                        </View>
                    ))}
                    <Button
                        title={isInitialSetup ? "Save" : "Update"}
                        onPress={isInitialSetup ? handleInitialSave : handleSave}
                    />
                </View>
            ) : (
                <View style={styles.viewContainer}>
                    {userKeys.map((key) => (
                        <View key={key} style={styles.infoCard}>
                            <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</Text>
                            <Text style={styles.value}>
                                {key === 'height'
                                    ? `${userData[key]} cm`
                                    : key === 'weight' || key === 'weightGoal'
                                    ? `${userData[key]} kg`
                                    : userData[key]}
                            </Text>
                        </View>
                    ))}
                    <Button title="Edit" onPress={() => setIsEditing(true)} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    editContainer: {
        width: '100%',
        alignItems: 'center',
    },
    viewContainer: {
        width: '100%',
        alignItems: 'center',
    },
    inputWrapper: {
        width: '100%',
        marginBottom: 10,
    },
    inputField: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#6c47ff',
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    editLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    infoCard: {
        width: '80%',
        marginVertical: 10,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        textAlign: 'center',
    },
    value: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});

export default Profile;
