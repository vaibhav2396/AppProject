import React from "react";
import { View, Text, StyleSheet,FlatList } from "react-native";
import CircularProgress from "react-native-circular-progress-indicator";

const Home = () => {
  const dailySteps = 8000; // Replace with actual steps
  const stepGoal = 10000;
  const stepPercentage = (dailySteps / stepGoal) * 100;

  const caloriesBurned = 350; // Calories burned today
  const weeklyData = [
    { day: "Mon", steps: 5000, calories: 200 },
    { day: "Tue", steps: 7000, calories: 300 },
    { day: "Wed", steps: 8000, calories: 350 },
    { day: "Thu", steps: 6000, calories: 250 },
    { day: "Fri", steps: 10000, calories: 400 },
    { day: "Sat", steps: 9000, calories: 370 },
    { day: "Sun", steps: 7500, calories: 320 },
  ];


  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
      <CircularProgress
          value={stepPercentage}
          radius={80}
          maxValue={100}
          showProgressValue={false} // Hide the percentage value
          activeStrokeWidth={20}
          inActiveStrokeWidth={20}
          inActiveStrokeColor="#d3d3d3"
          activeStrokeColor="#4caf50"
        />
        {/* Overlay Step Count */}
        <View style={styles.overlay}>
          <Text style={styles.stepCount}>{dailySteps}</Text>
          <Text style={styles.stepCount}>Steps</Text>
        </View>
      </View>
      <Text style={styles.stepGoal}>Goal: {stepGoal} steps</Text>

      {/* Calories Burned */}
      <View style={styles.caloriesContainer}>
        <Text style={styles.caloriesText}>
          Calories Burned Today: {caloriesBurned} kcal
        </Text>
      </View>

      {/* Weekly Data */}
      <Text style={styles.weeklyHeader}>Last 7 Days</Text>
      <FlatList
        data={weeklyData}
        keyExtractor={(item) => item.day}
        renderItem={({ item }) => (
          <View style={styles.weeklyItem}>
            <Text style={styles.weeklyDay}>{item.day}</Text>
            <Text style={styles.weeklySteps}>{item.steps} steps</Text>
            <Text style={styles.weeklyCalories}>{item.calories} kcal</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
  },
  overlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  progressValue: {
    fontSize: 16,
    color: "#4caf50",
    fontWeight: "bold",
  },
  stepCount: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  stepGoal: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 10,
  },
  caloriesContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  caloriesText: {
    fontSize: 18,
    color: "#ff5722",
  },
  weeklyHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  weeklyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  weeklyDay: {
    fontSize: 16,
    color: "#333",
  },
  weeklySteps: {
    fontSize: 16,
    color: "#4caf50",
  },
  weeklyCalories: {
    fontSize: 16,
    color: "#ff5722",
  },
});

export default Home;
