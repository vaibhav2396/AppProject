import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { getDatabase, ref, update, get } from 'firebase/database';
import { format } from 'date-fns'; // To format the date in 'YYYY-MM-DD'
import { useAuth } from '@clerk/clerk-expo';
import firebaseApp from '../../firebaseConfig';
import CircularProgress from 'react-native-circular-progress-indicator';

interface Last7DaysData {
  date: string;
  steps: number;
  calories: number;
}

const Home = () => {
  const [stepCount, setStepCount] = useState(0); // Tracks local session steps
  const [calories, setCalories] = useState(0);
  const [last7DaysData, setLast7DaysData] = useState<Last7DaysData[]>([]);
  const { userId } = useAuth();
  const db = getDatabase(firebaseApp);
  const stepGoal = 10000; // Set your daily step goal

  // Calculate calories burned based on steps
  const calculateCalories = (steps: number) => steps * 0.04;

  // Fetch step count for the current day from Firebase
  const fetchStepsForToday = async () => {
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const userStepsRef = ref(db, `steps/${userId}/${currentDate}`);

    try {
      const snapshot = await get(userStepsRef);
      const data = snapshot.val();
      if (data && data.steps) {
        setStepCount(data.steps);
        setCalories(data.calories);
        console.log(`Fetched steps for today: ${data.steps}`);
      } else {
        setStepCount(0);
        console.log('No steps data for today, starting fresh.');
      }
    } catch (error) {
      console.error('Error fetching steps for today:', error);
    }
  };

  // Save steps and calories to Firebase
  const saveStepsToFirebase = (newSteps: number) => {
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const totalSteps = stepCount + newSteps;
    const totalCalories = calculateCalories(totalSteps);

    const userStepsRef = ref(db, `steps/${userId}/${currentDate}`);
    update(userStepsRef, { steps: totalSteps, calories: totalCalories })
      .then(() => {
        console.log(`Updated steps in Firebase: ${totalSteps}`);
        setStepCount(totalSteps);
        setCalories(totalCalories);
      })
      .catch((error) => {
        console.error('Error saving step data:', error);
      });
  };

  // Initialize step tracking
  useEffect(() => {
    const subscription = Pedometer.watchStepCount((result) => {
      if (result && result.steps !== undefined) {
        console.log('Step count result:', result);
        saveStepsToFirebase(result.steps); // Save the new steps
      } else {
        console.error('Invalid step count result:', result);
      }
    });

    return () => subscription.remove();
  }, [stepCount]); // Dependency ensures the latest step count is used

  // Fetch today's steps when the app loads
  useEffect(() => {
    if (userId) {
      fetchStepsForToday();
    }
  }, [userId]);

  // Fetch last 7 days of step and calorie data from Firebase
  const fetchLast7DaysData = async () => {
    const userStepsRef = ref(db, `steps/${userId}`);
    try {
      const snapshot = await get(userStepsRef);
      const data = snapshot.val();

      if (data) {
        const sortedDates = Object.keys(data).sort((a, b) => {
            // Sort the dates in descending order
            return new Date(b).getTime() - new Date(a).getTime();; // b - a for descending order
          });
        const last7Days = sortedDates.slice(0,7).map((date) => ({
          date,
          steps: data[date].steps,
          calories: data[date].calories,
        }));
        setLast7DaysData(last7Days);
      }
    } catch (error) {
      console.error('Error fetching last 7 days data:', error);
    }
  };

  // Call to fetch last 7 days of data when the component mounts
  useEffect(() => {
    fetchLast7DaysData();
  }, []);

  // Calculate the step percentage
  const stepPercentage = (stepCount / stepGoal) * 100;

  // Dynamic font size for step count text based on step count value
  const getStepCountFontSize = () => {
    return stepCount > 100 ? 18 : 24; // Adjust font size based on step count
  };

  return (
    <View style={styles.container}>
      {/* Progress Section */}
      <View style={styles.progressContainer}>
        <CircularProgress
          value={stepPercentage}
          radius={80}
          maxValue={100}
          showProgressValue={false}
          activeStrokeWidth={20}
          inActiveStrokeWidth={20}
          inActiveStrokeColor="#d3d3d3"
          activeStrokeColor="#4caf50"
        />
        {/* Overlay for Step Count */}
        <View style={styles.overlay}>
          <Text style={[styles.stepCount, { fontSize: getStepCountFontSize() }]}>
            {stepCount}
          </Text>
          <Text style={styles.stepLabel}>Steps</Text>
        </View>
      </View>
      <Text style={styles.stepGoal}>Goal: {stepGoal} steps</Text>

      {/* Calories Burned */}
      <View style={styles.caloriesContainer}>
        <Text style={styles.caloriesText}>
          Calories Burned Today: {calories.toFixed(2)} kcal
        </Text>
      </View>

      {/* Weekly Data */}
      <Text style={styles.weeklyHeader}>Last 7 Days</Text>
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
  weeklyHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 10,
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
