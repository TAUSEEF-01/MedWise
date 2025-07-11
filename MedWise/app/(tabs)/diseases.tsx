import React, { useState, useEffect } from "react";
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Disease } from "@/types/medical";
import '../../global.css';

const sampleDiseases: Disease[] = [
  // Cardiovascular Diseases (10)
  {
    id: "1",
    name: "Hypertension",
    description: "High blood pressure is a common condition where blood flows through blood vessels with more force than normal.",
    symptoms: ["Headaches", "Shortness of breath", "Nosebleeds", "Chest pain"],
    additionalSymptoms: ["Dizziness", "Fatigue", "Vision problems", "Irregular heartbeat", "Confusion"],
    causes: ["Poor diet", "Lack of exercise", "Stress", "Genetics"],
    treatments: ["Lifestyle changes", "Blood pressure medications", "Regular monitoring"],
    severity: "medium",
    category: "Cardiovascular",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/high-blood-pressure/symptoms-causes/syc-20373410",
  },
  {
    id: "2",
    name: "Coronary Artery Disease",
    description: "A condition where plaque builds up in the coronary arteries that supply blood to the heart muscle.",
    symptoms: ["Chest pain", "Shortness of breath", "Fatigue", "Heart palpitations"],
    additionalSymptoms: ["Jaw pain", "Arm pain", "Nausea", "Sweating", "Weakness"],
    causes: ["High cholesterol", "Smoking", "Diabetes", "High blood pressure", "Genetics"],
    treatments: ["Medications", "Lifestyle changes", "Angioplasty", "Bypass surgery"],
    severity: "high",
    category: "Cardiovascular",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/coronary-artery-disease/symptoms-causes/syc-20350613",
  },
  {
    id: "3",
    name: "Heart Failure",
    description: "A condition where the heart cannot pump blood as well as it should.",
    symptoms: ["Shortness of breath", "Fatigue", "Swelling", "Rapid heartbeat"],
    additionalSymptoms: ["Persistent cough", "Nausea", "Confusion", "Chest pain", "Reduced exercise ability"],
    causes: ["Coronary artery disease", "High blood pressure", "Diabetes", "Obesity"],
    treatments: ["Medications", "Lifestyle changes", "Device therapy", "Surgery"],
    severity: "high",
    category: "Cardiovascular",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/heart-failure/symptoms-causes/syc-20373142",
  },
  {
    id: "4",
    name: "Atrial Fibrillation",
    description: "An irregular and often rapid heart rate that can increase risk of stroke and heart failure.",
    symptoms: ["Heart palpitations", "Weakness", "Fatigue", "Lightheadedness"],
    additionalSymptoms: ["Chest pain", "Shortness of breath", "Confusion", "Reduced exercise capacity"],
    causes: ["Age", "Heart disease", "High blood pressure", "Hyperthyroidism"],
    treatments: ["Medications", "Cardioversion", "Ablation", "Pacemaker"],
    severity: "medium",
    category: "Cardiovascular",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/atrial-fibrillation/symptoms-causes/syc-20350624",
  },
  {
    id: "5",
    name: "Stroke",
    description: "A condition where blood supply to part of the brain is interrupted or reduced.",
    symptoms: ["Sudden numbness", "Confusion", "Trouble speaking", "Severe headache"],
    additionalSymptoms: ["Vision problems", "Difficulty walking", "Dizziness", "Loss of coordination"],
    causes: ["Blood clots", "Bleeding", "High blood pressure", "Smoking"],
    treatments: ["Emergency treatment", "Medications", "Surgery", "Rehabilitation"],
    severity: "high",
    category: "Cardiovascular",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/stroke/symptoms-causes/syc-20350113",
  },
  {
    id: "6",
    name: "Peripheral Artery Disease",
    description: "A condition where narrowed arteries reduce blood flow to limbs.",
    symptoms: ["Leg pain when walking", "Leg numbness", "Coldness in legs", "Slow-healing wounds"],
    additionalSymptoms: ["Hair loss on legs", "Shiny skin", "Weak pulse", "Erectile dysfunction"],
    causes: ["Atherosclerosis", "Smoking", "Diabetes", "High blood pressure"],
    treatments: ["Lifestyle changes", "Medications", "Angioplasty", "Surgery"],
    severity: "medium",
    category: "Cardiovascular",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/peripheral-artery-disease/symptoms-causes/syc-20350557",
  },
  {
    id: "7",
    name: "Deep Vein Thrombosis",
    description: "A blood clot that forms in a deep vein, usually in the legs.",
    symptoms: ["Leg swelling", "Leg pain", "Red skin", "Warmth in affected area"],
    additionalSymptoms: ["Cramping", "Tenderness", "Skin discoloration", "Prominent veins"],
    causes: ["Prolonged sitting", "Surgery", "Injury", "Genetics", "Pregnancy"],
    treatments: ["Blood thinners", "Compression stockings", "Filters", "Surgery"],
    severity: "high",
    category: "Cardiovascular",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/deep-vein-thrombosis/symptoms-causes/syc-20352557",
  },
  {
    id: "8",
    name: "Aortic Aneurysm",
    description: "A bulge in the wall of the aorta, the body's main artery.",
    symptoms: ["Back pain", "Abdominal pain", "Pulsing feeling", "Clammy skin"],
    additionalSymptoms: ["Nausea", "Vomiting", "Dizziness", "Rapid pulse", "Shock"],
    causes: ["Atherosclerosis", "High blood pressure", "Genetic disorders", "Infection"],
    treatments: ["Monitoring", "Medications", "Surgery", "Endovascular repair"],
    severity: "high",
    category: "Cardiovascular",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/aortic-aneurysm/symptoms-causes/syc-20369472",
  },
  {
    id: "9",
    name: "Cardiomyopathy",
    description: "A disease of the heart muscle that makes it harder for the heart to pump blood.",
    symptoms: ["Shortness of breath", "Fatigue", "Swelling", "Irregular heartbeat"],
    additionalSymptoms: ["Chest pain", "Dizziness", "Fainting", "Bloating", "Cough"],
    causes: ["Genetics", "Heart attack", "High blood pressure", "Infections"],
    treatments: ["Medications", "Lifestyle changes", "Implanted devices", "Surgery"],
    severity: "high",
    category: "Cardiovascular",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/cardiomyopathy/symptoms-causes/syc-20370709",
  },
  {
    id: "10",
    name: "Pericarditis",
    description: "Inflammation of the pericardium, the thin sac-like tissue surrounding the heart.",
    symptoms: ["Sharp chest pain", "Shortness of breath", "Heart palpitations", "Fatigue"],
    additionalSymptoms: ["Fever", "Weakness", "Cough", "Abdominal swelling", "Leg swelling"],
    causes: ["Viral infection", "Bacterial infection", "Autoimmune disorders", "Cancer"],
    treatments: ["Anti-inflammatory drugs", "Colchicine", "Corticosteroids", "Drainage"],
    severity: "medium",
    category: "Cardiovascular",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/pericarditis/symptoms-causes/syc-20352510",
  },

  // Respiratory Diseases (10)
  {
    id: "11",
    name: "Common Cold",
    description: "A viral infection of your nose and throat (upper respiratory tract).",
    symptoms: ["Runny nose", "Sore throat", "Cough", "Congestion", "Body aches"],
    additionalSymptoms: ["Low-grade fever", "Sneezing", "Watery eyes", "Mild headache", "Loss of appetite"],
    causes: ["Viral infection", "Weakened immune system", "Close contact with infected person"],
    treatments: ["Rest", "Fluids", "Over-the-counter medications", "Throat lozenges"],
    severity: "low",
    category: "Respiratory",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/common-cold/symptoms-causes/syc-20351605",
  },
  {
    id: "12",
    name: "Asthma",
    description: "A condition where airways narrow and swell, producing extra mucus.",
    symptoms: ["Shortness of breath", "Chest tightness", "Wheezing", "Coughing"],
    additionalSymptoms: ["Fatigue", "Anxiety", "Trouble sleeping", "Rapid breathing", "Sweating"],
    causes: ["Allergies", "Respiratory infections", "Physical activity", "Weather changes"],
    treatments: ["Inhalers", "Oral medications", "Allergy shots", "Breathing exercises"],
    severity: "medium",
    category: "Respiratory",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/asthma/symptoms-causes/syc-20369653",
  },
  {
    id: "13",
    name: "Chronic Obstructive Pulmonary Disease (COPD)",
    description: "A group of lung diseases that block airflow and make it difficult to breathe.",
    symptoms: ["Shortness of breath", "Chronic cough", "Mucus production", "Wheezing"],
    additionalSymptoms: ["Fatigue", "Weight loss", "Swelling in ankles", "Chest tightness"],
    causes: ["Smoking", "Air pollution", "Chemical exposure", "Genetics"],
    treatments: ["Bronchodilators", "Steroids", "Oxygen therapy", "Pulmonary rehabilitation"],
    severity: "high",
    category: "Respiratory",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/copd/symptoms-causes/syc-20353679",
  },
  {
    id: "14",
    name: "Pneumonia",
    description: "An infection that inflames air sacs in one or both lungs.",
    symptoms: ["Chest pain", "Cough with phlegm", "Fever", "Shortness of breath"],
    additionalSymptoms: ["Nausea", "Vomiting", "Diarrhea", "Confusion", "Fatigue"],
    causes: ["Bacteria", "Viruses", "Fungi", "Weakened immune system"],
    treatments: ["Antibiotics", "Antiviral drugs", "Fever reducers", "Cough medicine"],
    severity: "medium",
    category: "Respiratory",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/pneumonia/symptoms-causes/syc-20354204",
  },
  {
    id: "15",
    name: "Tuberculosis",
    description: "A potentially serious infectious disease that mainly affects the lungs.",
    symptoms: ["Cough lasting 3+ weeks", "Chest pain", "Coughing up blood", "Weakness"],
    additionalSymptoms: ["Fever", "Night sweats", "Loss of appetite", "Weight loss", "Chills"],
    causes: ["Mycobacterium tuberculosis", "Weakened immune system", "Close contact"],
    treatments: ["Antibiotics", "Directly observed therapy", "Isolation", "Supportive care"],
    severity: "high",
    category: "Respiratory",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/tuberculosis/symptoms-causes/syc-20351250",
  },
  {
    id: "16",
    name: "Bronchitis",
    description: "Inflammation of the lining of bronchial tubes, which carry air to and from lungs.",
    symptoms: ["Cough", "Mucus production", "Fatigue", "Shortness of breath"],
    additionalSymptoms: ["Slight fever", "Chills", "Chest discomfort", "Sore throat"],
    causes: ["Viral infection", "Bacterial infection", "Smoking", "Air pollution"],
    treatments: ["Rest", "Fluids", "Humidifier", "Cough medicine", "Antibiotics"],
    severity: "low",
    category: "Respiratory",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/bronchitis/symptoms-causes/syc-20355566",
  },
  {
    id: "17",
    name: "Influenza (Flu)",
    description: "A common viral infection that can be deadly, especially in high-risk groups.",
    symptoms: ["Fever", "Aches", "Chills", "Fatigue", "Cough"],
    additionalSymptoms: ["Sore throat", "Runny nose", "Headache", "Vomiting", "Diarrhea"],
    causes: ["Influenza viruses", "Seasonal outbreaks", "Close contact", "Contaminated surfaces"],
    treatments: ["Antiviral drugs", "Rest", "Fluids", "Pain relievers", "Fever reducers"],
    severity: "medium",
    category: "Respiratory",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/flu/symptoms-causes/syc-20351719",
  },
  {
    id: "18",
    name: "Pulmonary Embolism",
    description: "A blockage in one of the pulmonary arteries in your lungs.",
    symptoms: ["Shortness of breath", "Chest pain", "Cough", "Rapid heart rate"],
    additionalSymptoms: ["Excessive sweating", "Fever", "Leg pain", "Clammy skin", "Dizziness"],
    causes: ["Blood clots", "Prolonged immobility", "Surgery", "Cancer", "Pregnancy"],
    treatments: ["Blood thinners", "Clot dissolvers", "Filters", "Surgery"],
    severity: "high",
    category: "Respiratory",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/pulmonary-embolism/symptoms-causes/syc-20354647",
  },
  {
    id: "19",
    name: "Sleep Apnea",
    description: "A serious sleep disorder where breathing repeatedly stops and starts during sleep.",
    symptoms: ["Loud snoring", "Gasping for air", "Insomnia", "Hypersomnia"],
    additionalSymptoms: ["Morning headache", "Difficulty concentrating", "Irritability", "High blood pressure"],
    causes: ["Obesity", "Neck circumference", "Narrowed airway", "Family history"],
    treatments: ["CPAP machine", "Oral appliances", "Surgery", "Lifestyle changes"],
    severity: "medium",
    category: "Respiratory",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/sleep-apnea/symptoms-causes/syc-20377631",
  },
  {
    id: "20",
    name: "Lung Cancer",
    description: "A type of cancer that begins in the lungs and may spread to other parts of the body.",
    symptoms: ["Persistent cough", "Coughing up blood", "Shortness of breath", "Chest pain"],
    additionalSymptoms: ["Hoarseness", "Weight loss", "Bone pain", "Headache", "Weakness"],
    causes: ["Smoking", "Secondhand smoke", "Radon exposure", "Asbestos exposure"],
    treatments: ["Surgery", "Chemotherapy", "Radiation therapy", "Targeted therapy"],
    severity: "high",
    category: "Respiratory",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/lung-cancer/symptoms-causes/syc-20374620",
  },

  // Endocrine Diseases (10)
  {
    id: "21",
    name: "Type 2 Diabetes",
    description: "A chronic condition that affects how your body processes blood sugar (glucose).",
    symptoms: ["Increased thirst", "Frequent urination", "Increased hunger", "Fatigue", "Blurred vision"],
    additionalSymptoms: ["Slow healing wounds", "Numbness in hands/feet", "Recurring infections", "Dark skin patches", "Unexplained weight loss"],
    causes: ["Insulin resistance", "Genetics", "Obesity", "Sedentary lifestyle"],
    treatments: ["Diet modification", "Exercise", "Medications", "Blood sugar monitoring"],
    severity: "high",
    category: "Endocrine",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/type-2-diabetes/symptoms-causes/syc-20351193",
  },
  {
    id: "22",
    name: "Type 1 Diabetes",
    description: "A chronic condition where the pancreas produces little or no insulin.",
    symptoms: ["Increased thirst", "Frequent urination", "Hunger", "Unintended weight loss"],
    additionalSymptoms: ["Fatigue", "Irritability", "Blurred vision", "Slow-healing sores", "Frequent infections"],
    causes: ["Autoimmune destruction", "Genetics", "Environmental factors", "Viruses"],
    treatments: ["Insulin therapy", "Blood sugar monitoring", "Carb counting", "Healthy eating"],
    severity: "high",
    category: "Endocrine",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/type-1-diabetes/symptoms-causes/syc-20353011",
  },
  {
    id: "23",
    name: "Hypothyroidism",
    description: "A condition where the thyroid gland doesn't produce enough thyroid hormones.",
    symptoms: ["Fatigue", "Weight gain", "Cold intolerance", "Dry skin"],
    additionalSymptoms: ["Hair loss", "Memory problems", "Depression", "Constipation", "Muscle weakness"],
    causes: ["Autoimmune disease", "Thyroid surgery", "Radiation therapy", "Medications"],
    treatments: ["Thyroid hormone replacement", "Regular monitoring", "Lifestyle changes"],
    severity: "medium",
    category: "Endocrine",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/hypothyroidism/symptoms-causes/syc-20350284",
  },
  {
    id: "24",
    name: "Hyperthyroidism",
    description: "A condition where the thyroid gland produces too much thyroid hormone.",
    symptoms: ["Rapid heartbeat", "Weight loss", "Increased appetite", "Nervousness"],
    additionalSymptoms: ["Tremor", "Sweating", "Heat intolerance", "Fatigue", "Difficulty sleeping"],
    causes: ["Graves' disease", "Thyroid nodules", "Thyroiditis", "Excess iodine"],
    treatments: ["Antithyroid medications", "Radioactive iodine", "Surgery", "Beta blockers"],
    severity: "medium",
    category: "Endocrine",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/hyperthyroidism/symptoms-causes/syc-20373659",
  },
  {
    id: "25",
    name: "Polycystic Ovary Syndrome (PCOS)",
    description: "A hormonal disorder causing enlarged ovaries with small cysts on the outer edges.",
    symptoms: ["Irregular periods", "Excess androgen", "Polycystic ovaries", "Weight gain"],
    additionalSymptoms: ["Acne", "Male-pattern baldness", "Skin darkening", "Mood changes"],
    causes: ["Insulin resistance", "Genetics", "Inflammation", "Excess androgen"],
    treatments: ["Birth control pills", "Diabetes medication", "Fertility medications", "Lifestyle changes"],
    severity: "medium",
    category: "Endocrine",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/pcos/symptoms-causes/syc-20353439",
  },
  {
    id: "26",
    name: "Addison's Disease",
    description: "A disorder where the adrenal glands don't produce enough hormones.",
    symptoms: ["Fatigue", "Weight loss", "Low blood pressure", "Salt craving"],
    additionalSymptoms: ["Nausea", "Vomiting", "Diarrhea", "Abdominal pain", "Muscle weakness"],
    causes: ["Autoimmune disease", "Tuberculosis", "Cancer", "Genetic disorders"],
    treatments: ["Hormone replacement therapy", "Dietary changes", "Stress management"],
    severity: "high",
    category: "Endocrine",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/addisons-disease/symptoms-causes/syc-20350293",
  },
  {
    id: "27",
    name: "Cushing's Syndrome",
    description: "A disorder caused by prolonged exposure to high levels of cortisol.",
    symptoms: ["Weight gain", "Purple stretch marks", "Easy bruising", "High blood pressure"],
    additionalSymptoms: ["Fatigue", "Muscle weakness", "Depression", "Anxiety", "Irregular periods"],
    causes: ["Pituitary tumors", "Adrenal tumors", "Medications", "Genetic factors"],
    treatments: ["Surgery", "Radiation therapy", "Medications", "Lifestyle changes"],
    severity: "high",
    category: "Endocrine",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/cushings-syndrome/symptoms-causes/syc-20351310",
  },
  {
    id: "28",
    name: "Gestational Diabetes",
    description: "A type of diabetes that develops during pregnancy.",
    symptoms: ["Increased thirst", "Frequent urination", "Fatigue", "Nausea"],
    additionalSymptoms: ["Blurred vision", "Frequent infections", "Sugar in urine"],
    causes: ["Hormonal changes", "Genetics", "Obesity", "Previous gestational diabetes"],
    treatments: ["Diet changes", "Exercise", "Blood sugar monitoring", "Insulin therapy"],
    severity: "medium",
    category: "Endocrine",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/gestational-diabetes/symptoms-causes/syc-20355339",
  },
  {
    id: "29",
    name: "Metabolic Syndrome",
    description: "A cluster of conditions that occur together, increasing risk of heart disease and diabetes.",
    symptoms: ["Large waist circumference", "High blood pressure", "High blood sugar", "High triglycerides"],
    additionalSymptoms: ["Fatigue", "Difficulty losing weight", "Increased hunger", "Sleep problems"],
    causes: ["Insulin resistance", "Genetics", "Sedentary lifestyle", "Poor diet"],
    treatments: ["Lifestyle changes", "Weight loss", "Exercise", "Medications"],
    severity: "medium",
    category: "Endocrine",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/metabolic-syndrome/symptoms-causes/syc-20351916",
  },
  {
    id: "30",
    name: "Osteoporosis",
    description: "A condition where bones become weak and brittle from loss of tissue.",
    symptoms: ["Back pain", "Loss of height", "Stooped posture", "Bone fractures"],
    additionalSymptoms: ["Tooth loss", "Grip strength loss", "Brittle fingernails"],
    causes: ["Aging", "Hormonal changes", "Low calcium", "Medications", "Genetics"],
    treatments: ["Calcium supplements", "Vitamin D", "Exercise", "Medications"],
    severity: "medium",
    category: "Endocrine",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/osteoporosis/symptoms-causes/syc-20351968",
  },

  // Neurological Diseases (10)
  {
    id: "31",
    name: "Migraine",
    description: "A neurological condition characterized by intense, debilitating headaches.",
    symptoms: ["Severe headache", "Nausea", "Sensitivity to light", "Visual disturbances"],
    additionalSymptoms: ["Vomiting", "Sensitivity to sound", "Tingling in face", "Difficulty speaking", "Mood changes"],
    causes: ["Genetics", "Hormonal changes", "Stress", "Certain foods"],
    treatments: ["Pain medications", "Preventive medications", "Lifestyle changes", "Rest"],
    severity: "medium",
    category: "Neurological",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/migraine-headache/symptoms-causes/syc-20360201",
  },
  {
    id: "32",
    name: "Epilepsy",
    description: "A neurological disorder marked by sudden recurrent episodes of sensory disturbance.",
    symptoms: ["Seizures", "Temporary confusion", "Staring spells", "Uncontrollable jerking"],
    additionalSymptoms: ["Loss of consciousness", "Fear", "Anxiety", "Déjà vu"],
    causes: ["Genetics", "Head trauma", "Brain infections", "Stroke"],
    treatments: ["Anti-seizure medications", "Surgery", "Dietary therapy", "Devices"],
    severity: "high",
    category: "Neurological",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/epilepsy/symptoms-causes/syc-20350093",
  },
  {
    id: "33",
    name: "Parkinson's Disease",
    description: "A progressive nervous system disorder that affects movement.",
    symptoms: ["Tremor", "Slowness of movement", "Rigid muscles", "Impaired posture"],
    additionalSymptoms: ["Speech changes", "Writing changes", "Loss of automatic movements", "Sleep problems"],
    causes: ["Genetics", "Environmental factors", "Age", "Gender"],
    treatments: ["Medications", "Physical therapy", "Surgery", "Lifestyle changes"],
    severity: "high",
    category: "Neurological",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/parkinsons-disease/symptoms-causes/syc-20376055",
  },
  {
    id: "34",
    name: "Alzheimer's Disease",
    description: "A progressive neurological disorder that causes memory loss and cognitive decline.",
    symptoms: ["Memory loss", "Difficulty thinking", "Confusion", "Behavioral changes"],
    additionalSymptoms: ["Mood swings", "Disorientation", "Language problems", "Poor judgment"],
    causes: ["Genetics", "Age", "Head injuries", "Lifestyle factors"],
    treatments: ["Medications", "Cognitive therapy", "Supportive care", "Lifestyle changes"],
    severity: "high",
    category: "Neurological",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/alzheimers-disease/symptoms-causes/syc-20350447",
  },
  {
    id: "35",
    name: "Multiple Sclerosis",
    description: "A disease where the immune system attacks the protective sheath of nerves.",
    symptoms: ["Numbness", "Weakness", "Vision problems", "Fatigue"],
    additionalSymptoms: ["Tremor", "Slurred speech", "Dizziness", "Pain", "Cognitive issues"],
    causes: ["Autoimmune response", "Genetics", "Environmental factors", "Infections"],
    treatments: ["Immunotherapy", "Medications", "Physical therapy", "Lifestyle changes"],
    severity: "high",
    category: "Neurological",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/multiple-sclerosis/symptoms-causes/syc-20350269",
  },
  {
    id: "36",
    name: "Amyotrophic Lateral Sclerosis (ALS)",
    description: "A progressive disease that affects nerve cells in the brain and spinal cord.",
    symptoms: ["Muscle weakness", "Twitching", "Difficulty speaking", "Difficulty swallowing"],
    additionalSymptoms: ["Muscle cramps", "Slurred speech", "Breathing problems", "Fatigue"],
    causes: ["Genetics", "Environmental factors", "Unknown causes"],
    treatments: ["Medications", "Physical therapy", "Speech therapy", "Supportive care"],
    severity: "high",
    category: "Neurological",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/amyotrophic-lateral-sclerosis/symptoms-causes/syc-20354022",
  },
  {
    id: "37",
    name: "Huntington's Disease",
    description: "A genetic disorder causing progressive breakdown of nerve cells in the brain.",
    symptoms: ["Involuntary movements", "Cognitive decline", "Mood changes", "Difficulty walking"],
    additionalSymptoms: ["Depression", "Memory lapses", "Irritability", "Speech difficulties"],
    causes: ["Genetic mutation", "Family history"],
    treatments: ["Medications", "Physical therapy", "Counseling", "Supportive care"],
    severity: "high",
    category: "Neurological",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/huntingtons-disease/symptoms-causes/syc-20356117",
  },
  {
    id: "38",
    name: "Neuropathy",
    description: "Damage or dysfunction of one or more nerves, causing numbness or weakness.",
    symptoms: ["Numbness", "Tingling", "Burning pain", "Muscle weakness"],
    additionalSymptoms: ["Sensitivity to touch", "Loss of reflexes", "Balance problems", "Cramps"],
    causes: ["Diabetes", "Infections", "Trauma", "Autoimmune diseases"],
    treatments: ["Pain medications", "Physical therapy", "Nerve stimulation", "Lifestyle changes"],
    severity: "medium",
    category: "Neurological",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/peripheral-neuropathy/symptoms-causes/syc-20352061",
  },

  // Digestive Diseases (5)
  {
    id: "39",
    name: "Gastroesophageal Reflux Disease (GERD)",
    description: "A chronic condition where stomach acid flows back into the esophagus.",
    symptoms: ["Heartburn", "Regurgitation", "Chest pain", "Difficulty swallowing"],
    additionalSymptoms: ["Sore throat", "Cough", "Hoarseness", "Bloating"],
    causes: ["Hiatal hernia", "Obesity", "Dietary triggers", "Pregnancy"],
    treatments: ["Antacids", "Proton pump inhibitors", "Lifestyle changes", "Surgery"],
    severity: "medium",
    category: "Digestive",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/gerd/symptoms-causes/syc-20361940",
  },
  {
    id: "40",
    name: "Irritable Bowel Syndrome (IBS)",
    description: "A disorder affecting the large intestine, causing cramping and changes in bowel habits.",
    symptoms: ["Abdominal pain", "Bloating", "Diarrhea", "Constipation"],
    additionalSymptoms: ["Gas", "Mucus in stool", "Fatigue", "Nausea"],
    causes: ["Gut-brain axis issues", "Food sensitivities", "Stress", "Infections"],
    treatments: ["Dietary changes", "Medications", "Stress management", "Probiotics"],
    severity: "medium",
    category: "Digestive",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/irritable-bowel-syndrome/symptoms-causes/syc-20360016",
  },
  {
    id: "41",
    name: "Crohn's Disease",
    description: "A type of inflammatory bowel disease causing inflammation of the digestive tract.",
    symptoms: ["Abdominal pain", "Diarrhea", "Weight loss", "Fatigue"],
    additionalSymptoms: ["Fever", "Mouth sores", "Blood in stool", "Joint pain"],
    causes: ["Autoimmune response", "Genetics", "Environmental factors", "Infections"],
    treatments: ["Anti-inflammatory drugs", "Immunosuppressants", "Surgery", "Diet changes"],
    severity: "high",
    category: "Digestive",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/crohns-disease/symptoms-causes/syc-20353304",
  },
  {
    id: "42",
    name: "Ulcerative Colitis",
    description: "A chronic disease causing inflammation and ulcers in the colon and rectum.",
    symptoms: ["Diarrhea", "Abdominal pain", "Rectal bleeding", "Urgency to defecate"],
    additionalSymptoms: ["Weight loss", "Fever", "Fatigue", "Joint pain"],
    causes: ["Autoimmune response", "Genetics", "Environmental factors", "Stress"],
    treatments: ["Anti-inflammatory drugs", "Immunosuppressants", "Surgery", "Diet changes"],
    severity: "high",
    category: "Digestive",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/ulcerative-colitis/symptoms-causes/syc-20353326",
  },
  {
    id: "43",
    name: "Celiac Disease",
    description: "An autoimmune disorder where gluten ingestion damages the small intestine.",
    symptoms: ["Diarrhea", "Bloating", "Fatigue", "Abdominal pain"],
    additionalSymptoms: ["Weight loss", "Anemia", "Joint pain", "Skin rash"],
    causes: ["Gluten intolerance", "Genetics", "Autoimmune response"],
    treatments: ["Gluten-free diet", "Nutritional supplements", "Medications"],
    severity: "medium",
    category: "Digestive",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/celiac-disease/symptoms-causes/syc-20352220",
  },

  // Musculoskeletal Diseases (5)
  {
    id: "44",
    name: "Rheumatoid Arthritis",
    description: "An autoimmune disorder causing joint inflammation and pain.",
    symptoms: ["Joint pain", "Stiffness", "Swelling", "Fatigue"],
    additionalSymptoms: ["Fever", "Weight loss", "Nodules under skin", "Joint deformity"],
    causes: ["Autoimmune response", "Genetics", "Environmental factors"],
    treatments: ["Anti-inflammatory drugs", "DMARDs", "Physical therapy", "Surgery"],
    severity: "high",
    category: "Musculoskeletal",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/rheumatoid-arthritis/symptoms-causes/syc-20353648",
  },
  {
    id: "45",
    name: "Osteoarthritis",
    description: "A degenerative joint disease causing cartilage breakdown.",
    symptoms: ["Joint pain", "Stiffness", "Swelling", "Reduced range of motion"],
    additionalSymptoms: ["Crepitus", "Bone spurs", "Weakness", "Fatigue"],
    causes: ["Aging", "Joint injury", "Obesity", "Genetics"],
    treatments: ["Pain relievers", "Physical therapy", "Surgery", "Lifestyle changes"],
    severity: "medium",
    category: "Musculoskeletal",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/osteoarthritis/symptoms-causes/syc-20351925",
  },
  {
    id: "46",
    name: "Gout",
    description: "A form of arthritis caused by excess uric acid forming crystals in joints.",
    symptoms: ["Sudden joint pain", "Swelling", "Redness", "Heat in joint"],
    additionalSymptoms: ["Fever", "Tophi", "Fatigue", "Limited motion"],
    causes: ["High uric acid", "Diet", "Genetics", "Obesity"],
    treatments: ["Anti-inflammatory drugs", "Uric acid-lowering drugs", "Diet changes"],
    severity: "medium",
    category: "Musculoskeletal",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/gout/symptoms-causes/syc-20372858",
  },
  {
    id: "47",
    name: "Fibromyalgia",
    description: "A disorder characterized by widespread musculoskeletal pain and fatigue.",
    symptoms: ["Widespread pain", "Fatigue", "Sleep disturbances", "Cognitive issues"],
    additionalSymptoms: ["Headaches", "Depression", "Anxiety", "Numbness"],
    causes: ["Genetics", "Infections", "Physical trauma", "Stress"],
    treatments: ["Medications", "Physical therapy", "Counseling", "Lifestyle changes"],
    severity: "medium",
    category: "Musculoskeletal",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/fibromyalgia/symptoms-causes/syc-20354780",
  },
  {
    id: "48",
    name: "Ankylosing Spondylitis",
    description: "An inflammatory disease affecting the spine and large joints.",
    symptoms: ["Back pain", "Stiffness", "Fatigue", "Neck pain"],
    additionalSymptoms: ["Eye inflammation", "Hip pain", "Difficulty breathing", "Loss of appetite"],
    causes: ["Genetics", "Autoimmune response", "Environmental factors"],
    treatments: ["Anti-inflammatory drugs", "Physical therapy", "Surgery", "Exercise"],
    severity: "high",
    category: "Musculoskeletal",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/ankylosing-spondylitis/symptoms-causes/syc-20354808",
  },

  // Infectious Diseases (5)
  {
    id: "49",
    name: "Hepatitis B",
    description: "A viral infection that attacks the liver and can cause acute or chronic disease.",
    symptoms: ["Fatigue", "Jaundice", "Abdominal pain", "Nausea"],
    additionalSymptoms: ["Dark urine", "Fever", "Joint pain", "Loss of appetite"],
    causes: ["Hepatitis B virus", "Blood contact", "Sexual transmission", "Mother-to-child"],
    treatments: ["Antiviral medications", "Monitoring", "Liver transplant", "Vaccination"],
    severity: "high",
    category: "Infectious",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/hepatitis-b/symptoms-causes/syc-20366802",
  },
  {
    id: "50",
    name: "Malaria",
    description: "A mosquito-borne disease caused by a parasite, affecting red blood cells.",
    symptoms: ["Fever", "Chills", "Headache", "Fatigue"],
    additionalSymptoms: ["Sweating", "Nausea", "Vomiting", "Muscle pain"],
    causes: ["Plasmodium parasite", "Mosquito bites", "Travel to endemic areas"],
    treatments: ["Antimalarial drugs", "Supportive care", "Prevention measures"],
    severity: "high",
    category: "Infectious",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/malaria/symptoms-causes/syc-20351184",
  },
  {
    id: "51",
    name: "Dengue Fever",
    description: "A mosquito-borne viral infection causing flu-like symptoms.",
    symptoms: ["High fever", "Severe headache", "Muscle pain", "Rash"],
    additionalSymptoms: ["Joint pain", "Nausea", "Vomiting", "Fatigue"],
    causes: ["Dengue virus", "Mosquito bites", "Travel to endemic areas"],
    treatments: ["Supportive care", "Fluid replacement", "Pain relievers"],
    severity: "medium",
    category: "Infectious",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/dengue-fever/symptoms-causes/syc-20353078",
  },
  {
    id: "52",
    name: "Lyme Disease",
    description: "A bacterial infection spread by tick bites, affecting multiple systems.",
    symptoms: ["Rash", "Fever", "Fatigue", "Joint pain"],
    additionalSymptoms: ["Headache", "Muscle aches", "Heart palpitations", "Neurological issues"],
    causes: ["Borrelia bacteria", "Tick bites", "Outdoor exposure"],
    treatments: ["Antibiotics", "Pain relievers", "Supportive care"],
    severity: "medium",
    category: "Infectious",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/lyme-disease/symptoms-causes/syc-20374651",
  },
  {
    id: "53",
    name: "HIV/AIDS",
    description: "A viral infection that weakens the immune system over time.",
    symptoms: ["Fever", "Fatigue", "Swollen lymph nodes", "Weight loss"],
    additionalSymptoms: ["Night sweats", "Chronic diarrhea", "Skin rashes", "Recurrent infections"],
    causes: ["HIV virus", "Blood contact", "Sexual transmission", "Mother-to-child"],
    treatments: ["Antiretroviral therapy", "Supportive care", "Lifestyle changes"],
    severity: "high",
    category: "Infectious",
    learnMoreUrl: "https://www.mayoclinic.org/diseases-conditions/hiv-aids/symptoms-causes/syc-20373524",
  }
];

export default function DiseasesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDiseases, setFilteredDiseases] = useState<Disease[]>(sampleDiseases);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const categories = [
    "All",
    "Cardiovascular",
    "Respiratory",
    "Endocrine",
    "Neurological",
    "Digestive",
    "Musculoskeletal",
    "Infectious"
  ];

  useEffect(() => {
    filterDiseases();
  }, [searchQuery, selectedCategory]);

  const filterDiseases = () => {
    let filtered = sampleDiseases;

    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (disease) => disease.category === selectedCategory
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (disease) =>
          disease.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          disease.symptoms.some((symptom) =>
            symptom.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          disease.additionalSymptoms?.some((symptom) =>
            symptom.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    setFilteredDiseases(filtered);
  };

  const toggleCardExpansion = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const openLearnMore = (url: string) => {
    Linking.openURL(url);
  };

  const getSeverityColor = (severity: Disease["severity"]) => {
    switch (severity) {
      case "low":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityIcon = (severity: Disease["severity"]) => {
    switch (severity) {
      case "low":
        return "info";
      case "medium":
        return "warning";
      case "high":
        return "error";
      default:
        return "info";
    }
  };

  const renderDiseaseCard = ({ item }: { item: Disease }) => {
    const isExpanded = expandedCards.has(item.id);
    
    return (
      <TouchableOpacity
        style={{ backgroundColor: "#d5deef" }}
        className="rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
        onPress={() => toggleCardExpansion(item.id)}
      >
        {/* Title and Category */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900 mb-1">{item.name}</Text>
            <Text className="text-xs text-gray-600 uppercase tracking-wider">{item.category}</Text>
          </View>
          <View className="flex-row items-center">
            <View
              className={`w-7 h-7 rounded-full items-center justify-center mr-2 ${getSeverityColor(
                item.severity
              )}`}
            >
              <MaterialIcons
                name={getSeverityIcon(item.severity)}
                size={16}
                color="white"
              />
            </View>
            <MaterialIcons
              name={isExpanded ? "expand-less" : "expand-more"}
              size={24}
              color="#6b7280"
            />
          </View>
        </View>
    
        {/* Description */}
        <Text className="text-sm text-gray-800 leading-5 mb-3" numberOfLines={isExpanded ? undefined : 2}>
          {item.description}
        </Text>
    
        {/* Symptoms */}
        <View>
          <Text className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
            Common Symptoms:
          </Text>
          <View className="flex-row flex-wrap">
            {item.symptoms.slice(0, isExpanded ? item.symptoms.length : 3).map((symptom, index) => (
              <View
                key={index}
                className="bg-blue-100 px-2 py-1 rounded-lg mr-2 mb-1"
              >
                <Text className="text-xs text-blue-800 font-medium">{symptom}</Text>
              </View>
            ))}
            {!isExpanded && item.symptoms.length > 3 && (
              <Text className="text-xs text-gray-600 italic self-center">
                +{item.symptoms.length - 3} more
              </Text>
            )}
          </View>
        </View>

        {/* Additional Symptoms - Only shown when expanded */}
        {isExpanded && item.additionalSymptoms && (
          <View className="mt-3">
            <Text className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              Additional Symptoms:
            </Text>
            <View className="flex-row flex-wrap">
              {item.additionalSymptoms.map((symptom, index) => (
                <View
                  key={index}
                  className="bg-orange-100 px-2 py-1 rounded-lg mr-2 mb-1"
                >
                  <Text className="text-xs text-orange-800 font-medium">{symptom}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Causes and Treatments - Only shown when expanded */}
        {isExpanded && (
          <>
            <View className="mt-3">
              <Text className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Common Causes:
              </Text>
              <View className="flex-row flex-wrap">
                {item.causes.map((cause, index) => (
                  <View
                    key={index}
                    className="bg-red-100 px-2 py-1 rounded-lg mr-2 mb-1"
                  >
                    <Text className="text-xs text-red-800 font-medium">{cause}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Treatments:
              </Text>
              <View className="flex-row flex-wrap">
                {item.treatments.map((treatment, index) => (
                  <View
                    key={index}
                    className="bg-green-100 px-2 py-1 rounded-lg mr-2 mb-1"
                  >
                    <Text className="text-xs text-green-800 font-medium">{treatment}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Learn More Button */}
            <TouchableOpacity
  style={{ backgroundColor: '#395886' }}
  className="mt-4 rounded-lg py-2 px-4 flex-row items-center justify-center"
  onPress={() => openLearnMore(item.learnMoreUrl)}
>
  <MaterialIcons name="open-in-new" size={16} color="white" />
  <Text className="text-white font-medium ml-2">Learn More</Text>
</TouchableOpacity>

          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Section */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3">
          <MaterialIcons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 py-3 px-2 text-base"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search diseases or symptoms..."
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Categories Section */}
      <View className="bg-white border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={isSelected ? { backgroundColor: "#395886", borderColor: "#395886" } : {}}
                className={`px-4 py-2 rounded-full mr-2 border ${
                  isSelected ? "" : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? "text-white" : "text-gray-700"
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View className="bg-white px-4 py-2 border-b border-gray-200">
        <Text className="text-sm text-gray-600">
          {filteredDiseases.length} {filteredDiseases.length === 1 ? 'result' : 'results'} found
        </Text>
      </View>

      {/* Diseases List */}
      <FlatList
        data={filteredDiseases}
        renderItem={renderDiseaseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <MaterialIcons name="search-off" size={48} color="#9ca3af" />
            <Text className="text-gray-500 text-lg font-medium mt-4">No diseases found</Text>
            <Text className="text-gray-400 text-center mt-2 px-8">
              Try adjusting your search terms or category filter
            </Text>
          </View>
        }
      />
    </View>
  );
}