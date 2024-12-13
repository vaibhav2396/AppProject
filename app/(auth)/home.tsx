import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useAuth } from '@clerk/clerk-expo';
import CircularProgress from 'react-native-circular-progress-indicator';
import { fetchStepsForToday, saveStepsToFirebase, fetchLast7DaysData } from '../utils/firebaseUtils';
import { getDatabase, ref, onValue } from 'firebase/database';
import firebaseApp from '../../firebaseConfig';
import { LineChart } from 'react-native-chart-kit';

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
      let lastStepCount = 0;

      const subscription = Pedometer.watchStepCount((result) => {
        if (result && result.steps !== undefined) {
          const newSteps = result.steps - lastStepCount;
          lastStepCount = result.steps;

          saveStepsToFirebase(userId, newSteps, setStepCount, setCalories, userData.stepGoal);
        } else {
          console.error('Invalid step count result:', result);
        }
      });

      return () => subscription.remove();
    } else {
      console.error('User ID is not available');
    }
  }, [userData, userId]);

  const processedData = last7DaysData.map((item) => ({
    date: item.date.slice(-2), // Check if this format works
    steps: typeof item.steps === 'number' && !isNaN(item.steps) ? item.steps : 0,
    calories: typeof item.calories === 'number' && !isNaN(item.calories) ? item.calories : 0,
  })).sort((a, b) => {
    // Type assertion to ensure the date string is treated as a valid date
    return new Date(a.date).getTime() - new Date(b.date).getTime(); // Use getTime() to compare dates
  });

  const labels = processedData.map((item) => item.date);
  const stepsData = processedData.map((item) => (typeof item.steps === 'number' && !isNaN(item.steps) ? item.steps : 0));
  const stepGoalArray = Array(processedData.length).fill(userData.stepGoal);

  return (
    <FlatList
      data={last7DaysData}
      keyExtractor={(item) => item.date}
      ListHeaderComponent={() => (
        <View style={styles.container}>
          <View style={styles.progressContainer}>
            <CircularProgress
              value={Math.min((stepCount / userData.stepGoal) * 100, 100)} 
              radius={80}
              maxValue={100}
              showProgressValue={false}
              activeStrokeWidth={20}
              inActiveStrokeWidth={20}
              inActiveStrokeColor="#d3d3d3"
              activeStrokeColor="#4caf50"
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

          <View style={styles.graphContainer}>
            <Text style={styles.graphTitle}>Weekly Progress</Text>
            {labels.length > 0 && stepsData.length > 0 && stepGoalArray.length > 0 ? (
              <LineChart
                data={{
                  labels: labels,
                  datasets: [
                    {
                      data: stepsData,
                      color: () => '#4caf50',
                    },
                    {
                      data: stepGoalArray,
                      color: () => '#ff0000', 
                      withDots: false,
                    },
                  ],
                }}
                width={Dimensions.get('window').width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#f5f5f5',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#e0e0e0',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                style={{
                  marginVertical: 20,
                  borderRadius: 16,
                }}
              />
            ) : (
              <Text style={styles.noDataText}>No data available for chart</Text>
            )}
          </View>
          <Text style={styles.graphTitle}>Past 7 Days</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.weeklyItem}>
          <Text style={styles.weeklyDay}>{item.date}</Text>
          <Text style={styles.weeklySteps}>{item.steps} steps</Text>
          <Text style={styles.weeklyCalories}>{item.calories} kcal</Text>
        </View>
      )}
    />
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  caloriesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  graphContainer: {
    marginVertical: 20,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  weeklyItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  weeklySteps: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    textAlign: 'center',
  },
  weeklyCalories: {
    fontSize: 14,
    color: '#555',
    flex: 1, 
    textAlign: 'right',
  },
});

export default Home;
