
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useAuth } from '@clerk/clerk-expo';
import CircularProgress from 'react-native-circular-progress-indicator';
import { fetchStepsForToday, saveStepsToFirebase, fetchLast7DaysData } from '../utils/firebaseUtils';
import { calculateCalories } from '../utils/stepTrackerUtils';
import { getDatabase, ref, onValue } from 'firebase/database';
import firebaseApp from '../../firebaseConfig';

interface Last7DaysData {
  date: string;
  steps: number;
  calories: number;
}

const Home = () => {
  const [stepCount, setStepCount] = useState(0);
  const [calories, setCalories] = useState(0);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    height: 0,
    weight: 0,
    stepGoal: 10,
    weightGoal: 0,
  });
  const [last7DaysData, setLast7DaysData] = useState<Last7DaysData[]>([]);
  const { userId } = useAuth();

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status: motionStatus } = await Pedometer.requestPermissionsAsync();
        if (motionStatus !== 'granted') {
          console.error('Sensor permission is mandatory to use the app!');
          throw new Error('Sensor permission is required to proceed.');
        }
      } catch (error) {
        console.error('Error checking or requesting permissions:', error);
      }
    };

    requestPermissions().catch((error) => {
      alert(error.message);
    });
  }, []);

  useEffect(() => {
    if (userId) {
      // Real-time listener for user data updates
      const db = getDatabase(firebaseApp);
      const userRef = ref(db, `users/${userId}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setUserData(snapshot.val());
        } else {
          console.log('No user data found.');
        }
      });

      return () => unsubscribe();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        const data = await fetchLast7DaysData(userId);
        setLast7DaysData(data);
      };
      fetchData();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchStepsForToday(userId).then((data) => {
        setStepCount(data.steps);
        setCalories(data.calories);
      });
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      const subscription = Pedometer.watchStepCount((result) => {
        if (result && result.steps !== undefined) {
          saveStepsToFirebase(userId, result.steps, setStepCount, setCalories, userData.stepGoal);
        } else {
          console.error('Invalid step count result:', result);
        }
      });

      return () => subscription.remove();
    } else {
      console.error('User ID is not available');
    }
  }, [userData, userId]);
  

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <CircularProgress
          value={Math.min((stepCount / userData.stepGoal) * 100, 100)} // Cap the value at 100%
          radius={80}
          maxValue={100}
          showProgressValue={false}
          activeStrokeWidth={20}
          inActiveStrokeWidth={20}
          inActiveStrokeColor="#d3d3d3"
          activeStrokeColor="#4caf50" // Always green after reaching the goal
        />
        <View style={styles.overlay}>
          <Text style={[styles.stepCount, { fontSize: stepCount > 100 ? 18 : 24 }]}>
            {stepCount}
          </Text>
          <Text style={styles.stepLabel}>Steps</Text>
        </View>
      </View>
      <Text style={styles.stepGoal}>Goal: {userData.stepGoal} steps</Text>
      <View style={styles.caloriesContainer}>
        <Text style={styles.caloriesText}>Calories Burned Today: {calories.toFixed(2)} kcal</Text>
      </View>
      <FlatList
        data={last7DaysData}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <View style={styles.weeklyItem}>
            <Text style={styles.weeklyDay}>{item.date}</Text>
            <Text style={styles.weeklySteps}>{item.steps} steps</Text>
            <Text style={styles.weeklyCalories}>{item.calories.toFixed(2)} kcal</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  overlay: {
    position: 'absolute',
    top: '48%',
    left: '50%',
    transform: [{ translateX: -22 }, { translateY: -20 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: {
    fontWeight: 'bold',
    color: '#4caf50',
  },
  stepLabel: {
    fontSize: 14,
    color: '#555',
  },
  stepGoal: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  caloriesContainer: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  caloriesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  weeklyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  weeklyDay: {
    fontSize: 14,
    color: '#555',
  },
  weeklySteps: {
    fontSize: 14,
    color: '#4caf50',
  },
  weeklyCalories: {
    fontSize: 14,
    color: '#ff9800',
  },
});

export default Home;
