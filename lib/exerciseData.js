// lib/exerciseData.js
/**
 * Comprehensive exercise data structure for 1HP Troubleshooter
 * 
 * This file serves as the central source of truth for all exercise data
 * used throughout the application.
 */

/**
 * Complete exercise library with all metadata
 * 
 * Each exercise contains:
 * - id: Unique identifier
 * - name: Display name (may include * for free exercises)
 * - category: Type of exercise (stretches, isometrics, strength, neural)
 * - painRegions: Array of pain regions this exercise is used for
 * - instructions: Exercise instructions
 * - imageUrl: Path to exercise image
 * - videoUrl: Path to exercise video (if available)
 * - isFree: Whether this exercise is available in free tier
 * - weightType: Type of weight used (lbs, kg, band, bodyweight, none)
 * - defaultWeight: Default starting weight
 * - weightUnit: Unit to display (lbs, kg, RB for rubber band)
 * - specialScaling: Boolean indicating if this needs custom scaling logic
 * - measurementType: How exercise is measured (reps, duration, sets)
 * - targetSets: Target number of sets (for stretches, isometrics)
 * - targetDuration: Target duration per rep (for isometrics, stretches)
 * - targetReps: Target repetitions (for strength exercises)
 * - associatedTest: Endurance test associated with this exercise
 * - restPeriod: Recommended rest period between sets
 */
export const exerciseLibrary = {
  // WRIST FLEXOR EXERCISES
  "wristExtensorStretch": {
    id: "wristExtensorStretch",
    name: "Wrist Extensor Stretch",
    category: "stretches",
    painRegions: ["wristFlexors", "wristExtensors", "thumbFlexors", "thumbExtensors", "ulnarSideExtensors", "fingers"],
    instructions: "With your elbow straight, use your opposite hand to bend your wrist downward until you feel a stretch on the top of your forearm. Hold for 20-30 seconds.",
    imageUrl: "/images/exercises/wrist-extensor-stretch.jpg",
    isFree: false,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 30, // seconds
    targetReps: null,
    associatedTest: "wristFlexorsTest",
    displayText: "3 Sets of 20-30 Seconds"
  },
  "wristFlexorStretch": {
    id: "wristFlexorStretch",
    name: "Wrist Flexor Stretch*",
    category: "stretches",
    painRegions: ["wristExtensors", "wristFlexors", "thumbFlexors", "ulnarSideExtensors", "ulnarSideFlexors", "pinkyFlexors", "fingers"],
    instructions: "With your elbow straight, use your opposite hand to bend your wrist upward until you feel a stretch on the bottom of your forearm. Hold for 20-30 seconds.",
    imageUrl: "/images/exercises/wrist-flexor-stretch.jpg",
    isFree: true,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 30, // seconds
    targetReps: null,
    associatedTest: "wristExtensorsTest",
    displayText: "3 Sets of 20-30 Seconds"
  },
  "dbWristFlexion": {
    id: "dbWristFlexion",
    name: "DB Wrist Flexion*",
    category: "strength",
    painRegions: ["wristFlexors", "ulnarSideFlexors", "pinkyFlexors", "fingers"],
    instructions: "Sit with your forearm resting on a table, palm facing up, with wrist at the edge. Hold a dumbbell and lower it down, then curl it up using only your wrist.",
    imageUrl: "/images/exercises/db-wrist-flexion.jpg",
    isFree: true,
    weightType: "weight",
    defaultWeight: 4,
    weightUnit: "lbs",
    specialScaling: false,
    measurementType: "reps",
    targetSets: 3,
    targetDuration: null,
    targetReps: {min: 15, max: 20},
    associatedTest: "wristFlexorsTest"
  },
  "dbWristExtension": {
    id: "dbWristExtension",
    name: "DB Wrist Extension*",
    category: "strength",
    painRegions: ["wristExtensors", "thumbExtensors", "ulnarSideExtensors", "fingers"],
    instructions: "Sit with your forearm resting on a table, palm facing down, with wrist at the edge. Hold a dumbbell and lower it down, then lift it up using only your wrist.",
    imageUrl: "/images/exercises/db-wrist-extension.jpg",
    isFree: true,
    weightType: "weight",
    defaultWeight: 4,
    weightUnit: "lbs",
    specialScaling: false,
    measurementType: "reps",
    targetSets: 3,
    targetDuration: null,
    targetReps: {min: 15, max: 20},
    associatedTest: "wristExtensorsTest"
  },
  "tennisBallSqueeze": {
    id: "tennisBallSqueeze",
    name: "Tennis Ball Squeeze",
    category: "strength",
    painRegions: ["wristFlexors", "thumbFlexors", "ulnarSideFlexors", "pinkyFlexors", "fingers"],
    instructions: "Hold a tennis ball in your palm and squeeze firmly, then release. Repeat for the recommended repetitions.",
    imageUrl: "/images/exercises/tennis-ball-squeeze.jpg",
    isFree: false,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "reps",
    targetSets: 3,
    targetDuration: null,
    targetReps: {min: 15, max: 20},
    associatedTest: "wristFlexorsTest"
  },
  "isometricWristFlexion": {
    id: "isometricWristFlexion",
    name: "Isometric Wrist Flexion*",
    category: "isometrics",
    painRegions: ["wristFlexors", "fingers"],
    instructions: "Place your palm against a stable surface. Push into the surface without moving your wrist, creating tension in your flexor muscles.",
    imageUrl: "/images/exercises/isometric-wrist-flexion.jpg",
    isFree: true,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 45, // seconds
    targetReps: null,
    associatedTest: "wristFlexorsTest",
    restPeriod: 30, // seconds
    displayText: "3 Sets of 45 Seconds",
    restText: "Rest 30 Seconds Between Sets"
  },
  "isometricWristExtension": {
    id: "isometricWristExtension",
    name: "Isometric Wrist Extension*",
    category: "isometrics",
    painRegions: ["wristExtensors","fingers"],
    instructions: "Place the back of your hand against a stable surface. Push into the surface without moving your wrist, creating tension in your extensor muscles.",
    imageUrl: "/images/exercises/isometric-wrist-extension.jpg",
    isFree: true,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 45, // seconds
    targetReps: null,
    associatedTest: "wristExtensorsTest",
    restPeriod: 30, // seconds
    displayText: "3 Sets of 45 Seconds",
    restText: "Rest 30 Seconds Between Sets"
  },
  "isometricThumbExtension": {
    id: "isometricThumbExtension",
    name: "Isometric Thumb Extension*",
    category: "isometrics",
    painRegions: ["thumbExtensors"],
    instructions: "Press the back of your thumb against a stable surface. Apply pressure without moving, engaging the extensor muscles.",
    imageUrl: "/images/exercises/isometric-thumb-extension.jpg",
    isFree: true,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 45, // seconds
    targetReps: null,
    associatedTest: "thumbExtensorsTest",
    restPeriod: 30, // seconds
    displayText: "3 Sets of 45 Seconds",
    restText: "Rest 30 Seconds Between Sets"
  },
  "fingerExtensionWithBand": {
    id: "fingerExtensionWithBand",
    name: "Finger Extension With Band",
    category: "strength",
    painRegions: ["wristExtensors", "fingers"],
    instructions: "Place a rubber band around your fingers and thumb. Spread your fingers apart against the resistance of the band, then slowly bring them back together.",
    imageUrl: "/images/exercises/finger-extension-band.jpg",
    isFree: false,
    weightType: "band",
    defaultWeight: 1,
    weightUnit: "RB",
    specialScaling: true,
    measurementType: "reps",
    targetSets: 3,
    targetDuration: null,
    targetReps: {min: 15, max: 20},
    associatedTest: "wristExtensorsTest"
  },
  "thumbFlexorStretch": {
    id: "thumbFlexorStretch",
    name: "Thumb Flexor Stretch*",
    category: "stretches",
    painRegions: ["thumbFlexors"],
    instructions: "Gently pull your thumb backward with your other hand until you feel a stretch at the base of your thumb and the side of your wrist. Hold for 20-30 seconds.",
    imageUrl: "/images/exercises/thumb-flexor-stretch.jpg",
    isFree: true,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 30, // seconds
    targetReps: null,
    associatedTest: "thumbFlexorsTest",
    displayText: "3 Sets of 20-30 Seconds"
  },
  "isometricThumbFlexion": {
    id: "isometricThumbFlexion",
    name: "Isometric Thumb Flexion*",
    category: "isometrics",
    painRegions: ["thumbFlexors"],
    instructions: "Press the pad of your thumb against the side of your index finger. Apply pressure without moving.",
    imageUrl: "/images/exercises/isometric-thumb-flexion.jpg",
    isFree: true,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 45, // seconds
    targetReps: null,
    associatedTest: "thumbFlexorsTest",
    restPeriod: 30, // seconds
    displayText: "3 Sets of 45 Seconds",
    restText: "Rest 30 Seconds Between Sets"
  },
  "thumbFlexionWithBand": {
    id: "thumbFlexionWithBand",
    name: "Thumb Flexion With Band*",
    category: "strength",
    painRegions: ["thumbFlexors"],
    instructions: "Place a rubber band around your extended thumb and fingers. Move your thumb across your palm against the resistance, then return to the starting position.",
    imageUrl: "/images/exercises/thumb-flexion-band.jpg",
    isFree: true,
    weightType: "band",
    defaultWeight: 1,
    weightUnit: "RB",
    specialScaling: true,
    measurementType: "reps",
    targetSets: 3,
    targetDuration: null,
    targetReps: {min: 15, max: 20},
    associatedTest: "thumbFlexorsTest"
  },
  "thumbExtensorStretch": {
    id: "thumbExtensorStretch",
    name: "Thumb Extensor Stretch*",
    category: "stretches",
    painRegions: ["thumbExtensors"],
    instructions: "Gently fold your thumb into your palm and bend your wrist slightly until you feel a stretch along the back of your thumb and wrist. Hold for 20-30 seconds.",
    imageUrl: "/images/exercises/thumb-extensor-stretch.jpg",
    isFree: true,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 30, // seconds
    targetReps: null,
    associatedTest: "thumbExtensorsTest",
    displayText: "3 Sets of 20-30 Seconds"
  },
  "isometricWristRadialDeviation": {
    id: "isometricWristRadialDeviation",
    name: "Isometric Wrist Radial Deviation",
    category: "isometrics",
    painRegions: ["thumbExtensors"],
    instructions: "Press the thumb-side of your hand against a stable surface. Apply pressure without moving your wrist.",
    imageUrl: "/images/exercises/isometric-wrist-radial-deviation.jpg",
    isFree: false,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 45, // seconds
    targetReps: null,
    associatedTest: "thumbExtensorsTest",
    restPeriod: 30, // seconds
    displayText: "3 Sets of 45 Seconds",
    restText: "Rest 30 Seconds Between Sets"
  },
  "dbRadialDeviation": {
    id: "dbRadialDeviation",
    name: "DB Radial Deviation*",
    category: "strength",
    painRegions: ["thumbExtensors"],
    instructions: "Rest your forearm on a table with your hand off the edge, thumb facing up. Hold a dumbbell and lift your hand up toward your thumb side, then lower back down.",
    imageUrl: "/images/exercises/db-radial-deviation.jpg",
    isFree: true,
    weightType: "weight",
    defaultWeight: 2,
    weightUnit: "lbs",
    specialScaling: true,
    measurementType: "reps",
    targetSets: 3,
    targetDuration: null,
    targetReps: {min: 15, max: 20},
    associatedTest: "thumbExtensorsTest"
  },
  "thumbExtensionWithBand": {
    id: "thumbExtensionWithBand",
    name: "Thumb Extension With Band",
    category: "strength",
    painRegions: ["thumbExtensors"],
    instructions: "Place your hand flat on a table with a rubber band around your thumb. Lift your thumb up against the band resistance, then return to starting position.",
    imageUrl: "/images/exercises/thumb-extension-band.jpg",
    isFree: false,
    weightType: "band",
    defaultWeight: 1,
    weightUnit: "RB",
    specialScaling: true,
    measurementType: "reps",
    targetSets: 3,
    targetDuration: null,
    targetReps: {min: 15, max: 20},
    associatedTest: "thumbExtensorsTest"
  },
  "ulnarDeviatorStretch": {
    id: "ulnarDeviatorStretch",
    name: "Ulnar Deviator Stretch",
    category: "stretches",
    painRegions: ["ulnarSideExtensors", "ulnarSideFlexors"],
    instructions: "With your elbow bent, use your opposite hand to bend your wrist toward the thumb side until you feel a stretch along the pinky side of your forearm. Hold for 20-30 seconds.",
    imageUrl: "/images/exercises/ulnar-deviator-stretch.jpg",
    isFree: false,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 30, // seconds
    targetReps: null,
    associatedTest: "wristExtensorsTest",
    displayText: "3 Sets of 20-30 Seconds"
  },
  "isometricUlnarDeviation": {
    id: "isometricUlnarDeviation",
    name: "Isometric Ulnar Deviation*",
    category: "isometrics",
    painRegions: ["ulnarSideExtensors","ulnarSideFlexors"],
    instructions: "Press the pinky-side of your hand against a stable surface. Apply pressure without moving your wrist.",
    imageUrl: "/images/exercises/isometric-ulnar-deviation.jpg",
    isFree: true,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 45, // seconds
    targetReps: null,
    associatedTest: "wristExtensorsTest",
    restPeriod: 30, // seconds
    displayText: "3 Sets of 45 Seconds",
    restText: "Rest 30 Seconds Between Sets"
  },
  "dbUlnarDeviation": {
    id: "dbUlnarDeviation",
    name: "Dumbell Ulnar Deviation*",
    category: "strength",
    painRegions: ["ulnarSideExtensors","ulnarSideFlexors"],
    instructions: "Rest your forearm on a table with your hand off the edge, thumb facing up. Hold a dumbbell and lift your hand up toward your pinky side, then lower back down.",
    imageUrl: "/images/exercises/db-ulnar-deviation.jpg",
    isFree: true,
    weightType: "weight",
    defaultWeight: 2,
    weightUnit: "lbs",
    specialScaling: true,
    measurementType: "reps",
    targetSets: 3,
    targetDuration: null,
    targetReps: {min: 15, max: 20},
    associatedTest: "wristExtensorsTest"
  },
  "interosseiStretch": {
    id: "interosseiStretch",
    name: "Interossei Stretch",
    category: "stretches",
    painRegions: ["pinkyFlexors", "fingers"],
    instructions: "Place your hand flat on a table. Use your other hand to gently spread your fingers apart, then hold.",
    imageUrl: "/images/exercises/interossei-stretch.jpg",
    isFree: false,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 30, // seconds
    targetReps: null,
    associatedTest: "wristFlexorsTest",
    displayText: "3 Sets of 20-30 Seconds"
  },
  "lumbricalStretch": {
    id: "lumbricalStretch",
    name: "Lumbrical Stretch",
    category: "stretches",
    painRegions: ["pinkyFlexors", "fingers"],
    instructions: "With your fingers extended, use your other hand to gently push your fingers backward until you feel a stretch in the palm of your hand.",
    imageUrl: "/images/exercises/lumbrical-stretch.jpg",
    isFree: false,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "duration",
    targetSets: 3,
    targetDuration: 30, // seconds
    targetReps: null,
    associatedTest: "wristFlexorsTest",
    displayText: "3 Sets of 20-30 Seconds"
  },

  // NEURAL MOBILITY EXERCISES
  "ulnarNerveGlideLevel1": {
    id: "ulnarNerveGlideLevel1",
    name: "Ulnar Nerve Glide (Level 1)",
    category: "neural",
    painRegions: ["wristFlexors", "ulnarSideFlexors", "pinkyFlexors"],
    instructions: "With your elbow bent and close to your body, gently tilt your hand from side to side, keeping your wrist straight. This is a gentler version for more sensitive symptoms.",
    imageUrl: "/images/exercises/ulnar-nerve-glide-1.jpg",
    isFree: false,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "reps",
    targetSets: 2,
    targetDuration: null,
    targetReps: {min: 10, max: 10},
    nerveType: "ulnar",
    symptomLevel: "severe",
    displayText: "2 Sets of 10 Stretches"
  },
  "ulnarNerveGlideLevel2": {
    id: "ulnarNerveGlideLevel2",
    name: "Ulnar Nerve Glide (Level 2)",
    category: "neural",
    painRegions: ["wristFlexors", "ulnarSideFlexors", "pinkyFlexors"],
    instructions: "Start with your arm out to the side, elbow bent at 90°. Slowly straighten your elbow while gently tilting your head to the opposite side. Hold for 2 seconds, then return to the starting position.",
    imageUrl: "/images/exercises/ulnar-nerve-glide-2.jpg",
    isFree: false,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "reps",
    targetSets: 2,
    targetDuration: null,
    targetReps: {min: 10, max: 10},
    nerveType: "ulnar",
    symptomLevel: "mild",
    displayText: "2 Sets of 10 Stretches"
  },
  "radialNerveGlideLevel1": {
    id: "radialNerveGlideLevel1",
    name: "Radial Nerve Glide (Level 1)",
    category: "neural",
    painRegions: ["wristExtensors", "thumbExtensors"],
    instructions: "With your arm at your side and elbow bent, gently rotate your forearm so your palm faces up, then down. This is a gentler version for more sensitive symptoms.",
    imageUrl: "/images/exercises/radial-nerve-glide-1.jpg",
    isFree: false,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "reps",
    targetSets: 2,
    targetDuration: null,
    targetReps: {min: 10, max: 10},
    nerveType: "radial",
    symptomLevel: "severe",
    displayText: "2 Sets of 10 Stretches"
  },
  "radialNerveGlideLevel2": {
    id: "radialNerveGlideLevel2",
    name: "Radial Nerve Glide (Level 2)",
    category: "neural",
    painRegions: ["wristExtensors", "thumbExtensors"],
    instructions: "Extend your arm with your palm facing down. Bend your wrist down, then slowly turn your head away from your arm. Hold for 2 seconds, then return to neutral.",
    imageUrl: "/images/exercises/radial-nerve-glide-2.jpg",
    isFree: false,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "reps",
    targetSets: 2,
    targetDuration: null,
    targetReps: {min: 10, max: 10},
    nerveType: "radial",
    symptomLevel: "mild",
    displayText: "2 Sets of 10 Stretches"
  },
  "medianNerveGlideLevel1": {
    id: "medianNerveGlideLevel1",
    name: "Median Nerve Glide (Level 1)",
    category: "neural",
    painRegions: ["wristFlexors", "thumbFlexors"],
    instructions: "With your elbow bent and close to your body, gently extend and flex your wrist while keeping your fingers relaxed. This is a gentler version for more sensitive symptoms.",
    imageUrl: "/images/exercises/median-nerve-glide-1.jpg",
    isFree: false,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "reps",
    targetSets: 2,
    targetDuration: null,
    targetReps: {min: 10, max: 10},
    nerveType: "median",
    symptomLevel: "severe",
    displayText: "2 Sets of 10 Stretches"
  },
  "medianNerveGlideLevel2": {
    id: "medianNerveGlideLevel2",
    name: "Median Nerve Glide (Level 2)",
    category: "neural",
    painRegions: ["wristFlexors", "thumbFlexors"],
    instructions: "Extend your arm with palm up. Gently pull your thumb down and out, while extending your wrist backward. Hold for 2 seconds, then return to neutral.",
    imageUrl: "/images/exercises/median-nerve-glide-2.jpg",
    isFree: false,
    weightType: "none",
    defaultWeight: 0,
    weightUnit: "",
    specialScaling: false,
    measurementType: "reps",
    targetSets: 2,
    targetDuration: null,
    targetReps: {min: 10, max: 10},
    nerveType: "median",
    symptomLevel: "mild",
    displayText: "2 Sets of 10 Stretches"
  }
};

// Export an array of exercises grouped by categories
export const exercisesByCategory = {
  stretches: Object.values(exerciseLibrary).filter(ex => ex.category === "stretches"),
  isometrics: Object.values(exerciseLibrary).filter(ex => ex.category === "isometrics"),
  strength: Object.values(exerciseLibrary).filter(ex => ex.category === "strength"),
  neural: Object.values(exerciseLibrary).filter(ex => ex.category === "neural")
};

// Export an array of exercises grouped by pain region
export const exercisesByPainRegion = {
  wristFlexors: Object.values(exerciseLibrary).filter(ex => 
    ex.painRegions && ex.painRegions.includes("wristFlexors")
  ),
  wristExtensors: Object.values(exerciseLibrary).filter(ex => 
    ex.painRegions && ex.painRegions.includes("wristExtensors")
  ),
  thumbFlexors: Object.values(exerciseLibrary).filter(ex => 
    ex.painRegions && ex.painRegions.includes("thumbFlexors")
  ),
  thumbExtensors: Object.values(exerciseLibrary).filter(ex => 
    ex.painRegions && ex.painRegions.includes("thumbExtensors")
  ),
  ulnarSideExtensors: Object.values(exerciseLibrary).filter(ex => 
    ex.painRegions && ex.painRegions.includes("ulnarSideExtensors")
  ),
  ulnarSideFlexors: Object.values(exerciseLibrary).filter(ex => 
    ex.painRegions && ex.painRegions.includes("ulnarSideFlexors")
  ),
  pinkyFlexors: Object.values(exerciseLibrary).filter(ex => 
    ex.painRegions && ex.painRegions.includes("pinkyFlexors")
  ),
  fingers: Object.values(exerciseLibrary).filter(ex => 
    ex.painRegions && ex.painRegions.includes("fingers")
  )
};

// Function to get neural mobility exercises based on nerve type and symptom level
export function getNeuralMobilityExercise(nerveType, symptomLevel) {
  if (!nerveType || symptomLevel === "none") {
    return null;
  }
  
  return Object.values(exerciseLibrary).find(ex => 
    ex.category === "neural" && 
    ex.nerveType === nerveType && 
    ex.symptomLevel === symptomLevel
  ) || null;
}

// Maps pain regions to the corresponding endurance tests
export const painRegionToTestMapping = {
  wristFlexors: "wristFlexorsTest",
  wristExtensors: "wristExtensorsTest",
  thumbFlexors: "thumbFlexorsTest",
  thumbExtensors: "thumbExtensorsTest",
  ulnarSideExtensors: "wristExtensorsTest",
  ulnarSideFlexors: "wristFlexorsTest",
  pinkyFlexors: "wristFlexorsTest",
  fingers: ["wristFlexorsTest", "wristExtensorsTest"]
};

// Describes the endurance tests
export const enduranceTests = {
  wristFlexorsTest: {
    id: 'wristFlexorsTest',
    name: 'Wrist Flexors Endurance Test',
    description: 'This is a test for your wrist flexor muscles. Use a 4# Dumbbell.',
    instructions: [
      'Turn your volume up and listen to the metronome',
      'Sit as shown, follow the metronome to perform the movement',
      'Two beeps is one repetition. One beep at the top and one at the bottom',
      'Maintain control throughout the entire repetition',
      'Repeat until failure & enter your repetitions below'
    ],
    defaultWeight: 4,
    weightUnit: "lbs"
  },
  wristExtensorsTest: {
    id: 'wristExtensorsTest',
    name: 'Wrist Extensors Endurance Test',
    description: 'This is a test for your wrist extensor muscles. Use a 4# Dumbbell.',
    instructions: [
      'Turn your volume up and listen to the metronome',
      'Sit as shown, follow the metronome to perform the movement',
      'Two beeps is one repetition. One beep at the top and one at the bottom',
      'Maintain control throughout the entire repetition',
      'Repeat until failure & enter your repetitions below'
    ],
    defaultWeight: 4,
    weightUnit: "lbs"
  },
  thumbFlexorsTest: {
    id: 'thumbFlexorsTest',
    name: 'Thumb Flexors Endurance Test',
    description: 'This is a test for your thumb flexor muscles. Use a resistive band.',
    instructions: [
      'Turn your volume up and listen to the metronome',
      'Position as shown, with the band around your thumb',
      'Two beeps is one repetition. One beep at flexion and one at extension',
      'Maintain control throughout the entire repetition',
      'Repeat until failure & enter your repetitions below'
    ],
    defaultWeight: 1,
    weightUnit: "RB"
  },
  thumbExtensorsTest: {
    id: 'thumbExtensorsTest',
    name: 'Thumb Extensors Endurance Test',
    description: 'This is a test for your thumb extensor muscles. Use a resistive band.',
    instructions: [
      'Turn your volume up and listen to the metronome',
      'Position as shown, with the band around your thumb',
      'Two beeps is one repetition. One beep at extension and one at flexion',
      'Maintain control throughout the entire repetition',
      'Repeat until failure & enter your repetitions below'
    ],
    defaultWeight: 1,
    weightUnit: "RB"
  }
};

// Helper functions to work with the exercise library

/**
 * Get a list of exercises for a specific pain region
 * @param {String} painRegion - The pain region ID
 * @returns {Array} - Array of exercises for that pain region
 */
export function getExercisesForPainRegion(painRegion) {
  return exercisesByPainRegion[painRegion] || [];
}

/**
 * Get the test associated with an exercise
 * @param {String} exerciseId - Exercise ID
 * @returns {String} - Associated test ID
 */
export function getTestForExercise(exerciseId) {
  const exercise = exerciseLibrary[exerciseId];
  if (!exercise) return null;
  
  return exercise.associatedTest;
}

/**
 * Check if an exercise needs special scaling (double the weight)
 * @param {String} exerciseId - Exercise ID
 * @returns {Boolean} - True if special scaling is needed
 */
export function needsSpecialScaling(exerciseId) {
  const exercise = exerciseLibrary[exerciseId];
  return exercise ? exercise.specialScaling : false;
}

/**
 * Get exercises from multiple pain regions without duplicates
 * @param {Array} painRegions - Array of pain region IDs
 * @returns {Array} - Unique exercises for all pain regions
 */
export function getExercisesForMultiplePainRegions(painRegions) {
  const exerciseMap = {};
  
  painRegions.forEach(region => {
    const exercises = getExercisesForPainRegion(region);
    exercises.forEach(exercise => {
      exerciseMap[exercise.id] = exercise;
    });
  });
  
  return Object.values(exerciseMap);
}

/**
 * Get a recommended exercise program based on selected pain regions
 * @param {Array} painRegions - Array of pain region IDs
 * @param {Boolean} proUser - Whether the user has pro access
 * @returns {Object} - Categorized exercise program
 */
export function getRecommendedExerciseProgram(painRegions, proUser = false) {
  const allExercises = getExercisesForMultiplePainRegions(painRegions);
  
  // Create categorized program
  const program = {
    stretches: [],
    isometrics: [],
    strength: [],
    neural: []
  };
  
  // Filter by category and pro status
  Object.keys(program).forEach(category => {
    const categoryExercises = allExercises.filter(ex => 
      ex.category === category && (proUser || ex.isFree)
    );
    
    // Limit to reasonable number for each category
    program[category] = categoryExercises.slice(0, category === 'stretches' ? 20 : 15);
  });
  
  return program;
}