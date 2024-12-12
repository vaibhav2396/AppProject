// firebaseUtils.ts
import { getDatabase, ref, update, get } from 'firebase/database';
import { format } from 'date-fns'; // To format the date in 'YYYY-MM-DD'
import firebaseApp from '../../firebaseConfig';
import { calculateCalories } from './stepTrackerUtils';
const db = getDatabase(firebaseApp);

interface StepData {
    date: string;
    steps: number;
    calories: number;
  }

  export const fetchLast7DaysData = async (userId: string): Promise<StepData[]> => {
    const userStepsRef = ref(db, `steps/${userId}`);
    try {
      const snapshot = await get(userStepsRef);
      const data = snapshot.val();
  
      if (data) {
        const sortedDates = Object.keys(data).sort((a, b) => {
          return new Date(b).getTime() - new Date(a).getTime(); // Sort descending by date
        });
        const last7Days = sortedDates.slice(0, 7).map((date) => ({
          date,
          steps: data[date].steps,
          calories: data[date].calories,
        }));
        return last7Days; // Ensure the return type is Promise<StepData[]>
      }
  
      return []; // Return an empty array if no data found
    } catch (error) {
      console.error('Error fetching last 7 days data:', error);
      return []; // Return an empty array in case of error
    }
  };


export const fetchUserData = async (userId: string) => {
  const userStepGoalRef = ref(db, `users/${userId}`);
  try {
    const snapshot = await get(userStepGoalRef);
    const data = snapshot.val();
    if (data) {
      return data; // Return the user data
    } else {
      console.log('No user Data found');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

export const fetchStepsForToday = async (userId: string) => {
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const userStepsRef = ref(db, `steps/${userId}/${currentDate}`);

  try {
    const snapshot = await get(userStepsRef);
    const data = snapshot.val();
    return data ? { steps: data.steps, calories: data.calories } : { steps: 0, calories: 0 };
  } catch (error) {
    console.error('Error fetching steps for today:', error);
    return { steps: 0, calories: 0 };
  }
};

export const saveStepsToFirebase = (
    userId: string,
    newSteps: number,
    setStepCount: React.Dispatch<React.SetStateAction<number>>,
    setCalories: React.Dispatch<React.SetStateAction<number>>,
    stepGoal: number
  ) => {
    const currentDate = new Date().toISOString().split('T')[0]; // Get 'yyyy-mm-dd' format
  
    // Fetch user data (weight and height) from the 'users' table
    const userRef = ref(db, `users/${userId}`);
  
    get(userRef).then(userSnapshot => {
      const userData = userSnapshot.val();
      
      // Ensure user data exists and contains weight and height
      if (userData && userData.weight && userData.height) {
        const weight = userData.weight; // Weight from the user's data
        const height = userData.height; // Height from the user's data
        
        // Fetch the current step count from the database
        const userStepsRef = ref(db, `steps/${userId}/${currentDate}`);
        
        get(userStepsRef).then(snapshot => {
          const existingData = snapshot.val();
          const currentStepCount = existingData ? existingData.steps : 0;
  
          const totalSteps = currentStepCount + newSteps; // Accumulate steps
          const totalCalories = calculateCalories(totalSteps, weight, height); // Use weight and height for calorie calculation
  
          // Update the database with accumulated steps and calories
          update(userStepsRef, { steps: totalSteps, calories: totalCalories })
            .then(() => {
              setStepCount(totalSteps);
              setCalories(totalCalories);
  
              // If the step goal is reached, log it
              if (totalSteps >= stepGoal) {
                console.log('You achieved your step goal for today');
              }
            })
            .catch((error) => {
              console.error('Error saving step data:', error);
            });
        }).catch((error) => {
          console.error('Error fetching current steps:', error);
        });
      } else {
        console.error('User data not found or missing weight/height');
      }
    }).catch((error) => {
      console.error('Error fetching user data:', error);
    });
  };
  