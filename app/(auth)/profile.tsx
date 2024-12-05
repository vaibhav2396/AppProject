import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { useAuth } from '@clerk/clerk-expo';
import firebaseApp from '../../firebaseConfig'

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

      const handleInputChange = (e:any) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
      };
    
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

    return (
        <View style={styles.container}>
        {isEditing || isInitialSetup ? (
            <View>
            <TextInput
                style={styles.inputField}
                placeholder="First Name"
                value={userData.firstName}
                onChangeText={(text) => setUserData({ ...userData, firstName: text })}
            />
            <TextInput
                style={styles.inputField}
                placeholder="Last Name"
                value={userData.lastName}
                onChangeText={(text) => setUserData({ ...userData, lastName: text })}
            />
            <TextInput
                style={styles.inputField}
                placeholder="height"
                value={userData.height}
                onChangeText={(text) => setUserData({ ...userData, height: text })}
            />
            <TextInput
                style={styles.inputField}
                placeholder="weight"
                value={userData.weight}
                onChangeText={(text) => setUserData({ ...userData, weight: text })}
            />
            <TextInput
                style={styles.inputField}
                placeholder="weight Goal"
                value={userData.weightGoal}
                onChangeText={(text) => setUserData({ ...userData, weightGoal: text })}
            />
            <TextInput
                style={styles.inputField}
                placeholder="step Goal"
                value={userData.stepGoal}
                onChangeText={(text) => setUserData({ ...userData, stepGoal: text })}
            />
            
            <Button title="Save" onPress={handleSave} />
            </View>
        ) : (
            <View>
            <Text style={styles.inputField}>First Name: {userData.firstName}</Text>
            <Text style={styles.inputField}>Last Name: {userData.lastName}</Text>
            <Text style={styles.inputField}>Height: {userData.height}</Text>
            <Text style={styles.inputField}>Weight: {userData.weight}</Text>
            <Text style={styles.inputField}>Weight Goal: {userData.weightGoal}</Text>
            <Text style={styles.inputField}>Step Goal: {userData.stepGoal}</Text>
            
            {/* ... other fields ... */}
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
      padding: 20,
    },
    inputField: {
      marginVertical: 4,
      height: 50,
      borderWidth: 1,
      borderColor: '#6c47ff',
      borderRadius: 4,
      padding: 10,
      backgroundColor: '#fff',
    },
    button: {
      margin: 8,
      alignItems: 'center',
    },
  });

export default Profile;


