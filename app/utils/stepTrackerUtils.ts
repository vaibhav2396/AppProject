export const calculateCalories = (steps: number, weight: number, height: number) => {
    const caloriesPerStep = weight * 0.0005;
    const totalCalories = steps * caloriesPerStep;
    return totalCalories;
};
