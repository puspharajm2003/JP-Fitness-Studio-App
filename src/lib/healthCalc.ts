export const ageFromDob = (dob: string | null): number | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const bmi = (weight: number | null, height: number | null): number | null => {
  if (!weight || !height) return null;
  return parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
};

export const bmiCategory = (bmi: number | null): string => {
  if (!bmi) return "—";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

export const idealWeight = (gender: string | null, height: number | null): number | null => {
  if (!height) return null;
  // Devine Formula (1974)
  const heightInches = height / 2.54;
  const baseInches = 60;
  if (heightInches < baseInches) return null;
  
  const additionalInches = heightInches - baseInches;
  if (gender?.toLowerCase() === "male") {
    return parseFloat((50 + 2.3 * additionalInches).toFixed(1));
  } else {
    return parseFloat((45.5 + 2.3 * additionalInches).toFixed(1));
  }
};

export const bodyFatPct = (input: { gender?: string; dob?: string; height_cm?: number; weight_kg?: number | null }): number | null => {
  const b = bmi(input.weight_kg ?? null, input.height_cm ?? null);
  const age = ageFromDob(input.dob ?? null);
  if (!b || !age) return null;
  
  // Adult Body Fat % = (1.20 × BMI) + (0.23 × Age) − (10.8 × gender) − 5.4
  // Gender: Male = 1, Female = 0
  const genderVal = input.gender?.toLowerCase() === "male" ? 1 : 0;
  return parseFloat(((1.2 * b) + (0.23 * age) - (10.8 * genderVal) - 5.4).toFixed(1));
};

export const visceralFat = (input: any): number | null => {
  const b = bmi(input.weight_kg, input.height_cm);
  if (!b) return null;
  // Rough estimation based on BMI
  if (b < 18.5) return 4;
  if (b < 25) return 7;
  if (b < 30) return 11;
  return 15;
};

export const bodyAge = (input: any): number | null => {
  const age = ageFromDob(input.dob);
  const b = bmi(input.weight_kg, input.height_cm);
  if (!age || !b) return null;
  
  // Rough estimation: body age increases if BMI is outside normal range
  let diff = 0;
  if (b > 25) diff = (b - 25) * 1.5;
  else if (b < 18.5) diff = (18.5 - b) * 1.2;
  
  return Math.round(age + diff);
};

export const rmr = (input: any): number | null => {
  const age = ageFromDob(input.dob);
  if (!input.weight_kg || !input.height_cm || !age) return null;
  
  // Mifflin-St Jeor Equation
  if (input.gender?.toLowerCase() === "male") {
    return Math.round(10 * input.weight_kg + 6.25 * input.height_cm - 5 * age + 5);
  } else {
    return Math.round(10 * input.weight_kg + 6.25 * input.height_cm - 5 * age - 161);
  }
};

export const goalSuggestion = (input: any): string => {
  const b = bmi(input.weight_kg, input.height_cm);
  if (!b) return "—";
  if (b < 18.5) return "Muscle Gain";
  if (b < 25) return "Maintenance";
  if (b < 30) return "Weight Loss";
  return "Active Weight Loss";
};
