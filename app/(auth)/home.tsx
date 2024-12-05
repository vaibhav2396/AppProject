
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { getDatabase, ref, set, update, get } from 'firebase/database';
import { format } from 'date-fns'; // To format the date in 'YYYY-MM-DD'
import { useAuth } from '@clerk/clerk-expo';
import firebaseApp from '../../firebaseConfig';

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

  // Calculate calories burned
  const calculateCalories = (steps:any) => steps * 0.04;

  // Fetch the step count for the current day from Firebase
  const fetchStepsForToday = async () => {
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const userStepsRef = ref(db, `steps/${userId}/${currentDate}`);

    try {
      const snapshot = await get(userStepsRef);
      const data = snapshot.val();
      if (data && data.steps) {
        setStepCount(data.steps); // Resume from saved steps
        setCalories(data.calories); // Set calories if needed
        console.log(`Fetched steps for today: ${data.steps}`);
      } else {
        setStepCount(0); // Start fresh if no data exists
        console.log('No steps data for today, starting fresh.');
      }
    } catch (error) {
      console.error('Error fetching steps for today:', error);
    }
  };

  // Save today's step and calorie data to Firebase
  const saveStepsToFirebase = (newSteps:any) => {
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const totalSteps = stepCount + newSteps; // Add new steps to the current count
    const totalCalories = calculateCalories(totalSteps);

    const userStepsRef = ref(db, `steps/${userId}/${currentDate}`);
    update(userStepsRef, { steps: totalSteps, calories: totalCalories })
      .then(() => {
        console.log(`Updated steps in Firebase: ${totalSteps}`);
        setStepCount(totalSteps); // Update the local state
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
  }, [stepCount]); // Dependency array ensures the latest step count is used

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
        const sortedDates = Object.keys(data).sort();
        const last7Days = sortedDates.slice(-7).map((date) => ({
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

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Dashboard</Text>

      {/* Circular Progress Bar */}
      <View>
        <Text>Step Count: {stepCount}</Text>
        <Text>Calories Burned: {calories}</Text>
      </View>

      {/* Display past 7 days data */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Past 7 Days</Text>
        {last7DaysData.length === 0 ? (
          <Text>No data available for the last 7 days.</Text>
        ) : (
          last7DaysData.map((dayData) => (
            <View key={dayData.date}>
              <Text>{`Date: ${dayData.date}`}</Text>
              <Text>{`Steps: ${dayData.steps}`}</Text>
              <Text>{`Calories: ${dayData.calories}`}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export default Home;
