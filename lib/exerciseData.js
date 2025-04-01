// lib/exerciseData.js
// Exercise database based on pain regions with free exercises marked
export const exerciseLibrary = {
    wristFlexors: [
      { 
        id: 'wristExtensorStretch', 
        name: 'Wrist Extensor Stretch',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow straight, use your opposite hand to bend your wrist downward until you feel a stretch on the top of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/wrist-extensor-stretch.jpg',
        isFree: false
      },
      { 
        id: 'wristFlexorStretch', 
        name: 'Wrist Flexor Stretch*',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow straight, use your opposite hand to bend your wrist upward until you feel a stretch on the bottom of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/wrist-flexor-stretch.jpg',
        isFree: true
      },
      { 
        id: 'dbWristFlexion', 
        name: 'DB Wrist Flexion*',
        category: 'strength',
        instructions: 'Sit with your forearm resting on a table, palm facing up, with wrist at the edge. Hold a dumbbell and lower it down, then curl it up using only your wrist.',
        imageUrl: '/exercises/db-wrist-flexion.jpg',
        isFree: true
      },
      { 
        id: 'dbWristExtension', 
        name: 'DB Wrist Extension',
        category: 'strength',
        instructions: 'Sit with your forearm resting on a table, palm facing down, with wrist at the edge. Hold a dumbbell and lower it down, then lift it up using only your wrist.',
        imageUrl: '/exercises/db-wrist-extension.jpg',
        isFree: false
      },
      { 
        id: 'tennisBallSqueeze', 
        name: 'Tennis Ball Squeeze',
        category: 'strength',
        instructions: 'Hold a tennis ball in your palm and squeeze firmly, then release. Repeat for the recommended repetitions.',
        imageUrl: '/exercises/tennis-ball-squeeze.jpg',
        isFree: false
      },
      { 
        id: 'isometricWristFlexion', 
        name: 'Isometric Wrist Flexion*',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Place your palm against a stable surface. Push into the surface without moving your wrist, creating tension in your flexor muscles.',
        imageUrl: '/exercises/isometric-wrist-flexion.jpg',
        isFree: true
      },
    ],
    wristExtensors: [
      { 
        id: 'wristExtensorStretch', 
        name: 'Wrist Extensor Stretch*',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow straight, use your opposite hand to bend your wrist downward until you feel a stretch on the top of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/wrist-extensor-stretch.jpg',
        isFree: true
      },
      { 
        id: 'wristFlexorStretch', 
        name: 'Wrist Flexor Stretch',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow straight, use your opposite hand to bend your wrist upward until you feel a stretch on the bottom of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/wrist-flexor-stretch.jpg',
        isFree: false
      },
      { 
        id: 'isometricWristExtension', 
        name: 'Isometric Wrist Extension*',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Place the back of your hand against a stable surface. Push into the surface without moving your wrist, creating tension in your extensor muscles.',
        imageUrl: '/exercises/isometric-wrist-extension.jpg',
        isFree: true
      },
      { 
        id: 'isometricThumbExtension', 
        name: 'Isometric Thumb Extension',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Press the back of your thumb against a stable surface. Apply pressure without moving, engaging the extensor muscles.',
        imageUrl: '/exercises/isometric-thumb-extension.jpg',
        isFree: false
      },
      { 
        id: 'dbWristExtension', 
        name: 'DB Wrist Extension*',
        category: 'strength',
        instructions: 'Sit with your forearm resting on a table, palm facing down, with wrist at the edge. Hold a dumbbell and lower it down, then lift it up using only your wrist.',
        imageUrl: '/exercises/db-wrist-extension.jpg',
        isFree: true
      },
      { 
        id: 'dbWristFlexion', 
        name: 'DB Wrist Flexion',
        category: 'strength',
        instructions: 'Sit with your forearm resting on a table, palm facing up, with wrist at the edge. Hold a dumbbell and lower it down, then curl it up using only your wrist.',
        imageUrl: '/exercises/db-wrist-flexion.jpg',
        isFree: false
      },
      { 
        id: 'fingerExtensionWithBand', 
        name: 'Finger Extension With Band',
        category: 'strength',
        instructions: 'Place a rubber band around your fingers and thumb. Spread your fingers apart against the resistance of the band, then slowly bring them back together.',
        imageUrl: '/exercises/finger-extension-band.jpg',
        isFree: false
      },
    ],
    thumbFlexors: [
      { 
        id: 'wristExtensorStretch', 
        name: 'Wrist Extensor Stretch',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow straight, use your opposite hand to bend your wrist downward until you feel a stretch on the top of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/wrist-extensor-stretch.jpg',
        isFree: false
      },
      { 
        id: 'wristFlexorStretch', 
        name: 'Wrist Flexor Stretch',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow straight, use your opposite hand to bend your wrist upward until you feel a stretch on the bottom of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/wrist-flexor-stretch.jpg',
        isFree: false
      },
      { 
        id: 'thumbFlexorStretch', 
        name: 'Thumb Flexor Stretch*',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'Gently pull your thumb backward with your other hand until you feel a stretch at the base of your thumb and the side of your wrist. Hold for 20-30 seconds.',
        imageUrl: '/exercises/thumb-flexor-stretch.jpg',
        isFree: true
      },
      { 
        id: 'isometricThumbFlexion', 
        name: 'Isometric Thumb Flexion*',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Press the pad of your thumb against the side of your index finger. Apply pressure without moving.',
        imageUrl: '/exercises/isometric-thumb-flexion.jpg',
        isFree: true
      },
      { 
        id: 'thumbFlexionWithBand', 
        name: 'Thumb Flexion With Band*',
        category: 'strength',
        instructions: 'Place a rubber band around your extended thumb and fingers. Move your thumb across your palm against the resistance, then return to the starting position.',
        imageUrl: '/exercises/thumb-flexion-band.jpg',
        isFree: true
      },
      { 
        id: 'dbWristFlexion', 
        name: 'DB Wrist Flexion',
        category: 'strength',
        instructions: 'Sit with your forearm resting on a table, palm facing up, with wrist at the edge. Hold a dumbbell and lower it down, then curl it up using only your wrist.',
        imageUrl: '/exercises/db-wrist-flexion.jpg',
        isFree: false
      },
      { 
        id: 'tennisBallSqueeze', 
        name: 'Tennis Ball Squeeze',
        category: 'strength',
        instructions: 'Hold a tennis ball in your palm and squeeze firmly, then release. Repeat for the recommended repetitions.',
        imageUrl: '/exercises/tennis-ball-squeeze.jpg',
        isFree: false
      },
    ],
    thumbExtensors: [
      { 
        id: 'wristExtensorStretch', 
        name: 'Wrist Extensor Stretch',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow straight, use your opposite hand to bend your wrist downward until you feel a stretch on the top of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/wrist-extensor-stretch.jpg',
        isFree: false
      },
      { 
        id: 'thumbExtensorStretch', 
        name: 'Thumb Extensor Stretch*',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'Gently fold your thumb into your palm and bend your wrist slightly until you feel a stretch along the back of your thumb and wrist. Hold for 20-30 seconds.',
        imageUrl: '/exercises/thumb-extensor-stretch.jpg',
        isFree: true
      },
      { 
        id: 'isometricWristRadialDeviation', 
        name: 'Isometric Wrist Radial Deviation',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Press the thumb-side of your hand against a stable surface. Apply pressure without moving your wrist.',
        imageUrl: '/exercises/isometric-wrist-radial-deviation.jpg',
        isFree: false
      },
      { 
        id: 'isometricThumbExtension', 
        name: 'Isometric Thumb Extension*',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Press the back of your thumb against a stable surface. Apply pressure without moving, engaging the extensor muscles.',
        imageUrl: '/exercises/isometric-thumb-extension.jpg',
        isFree: true
      },
      { 
        id: 'dbWristExtension', 
        name: 'DB Wrist Extension',
        category: 'strength',
        instructions: 'Sit with your forearm resting on a table, palm facing down, with wrist at the edge. Hold a dumbbell and lower it down, then lift it up using only your wrist.',
        imageUrl: '/exercises/db-wrist-extension.jpg',
        isFree: false
      },
      { 
        id: 'dbRadialDeviation', 
        name: 'DB Radial Deviation*',
        category: 'strength',
        instructions: 'Rest your forearm on a table with your hand off the edge, thumb facing up. Hold a dumbbell and lift your hand up toward your thumb side, then lower back down.',
        imageUrl: '/exercises/db-radial-deviation.jpg',
        isFree: true
      },
      { 
        id: 'thumbExtensionWithBand', 
        name: 'Thumb Extension With Band',
        category: 'strength',
        instructions: 'Place your hand flat on a table with a rubber band around your thumb. Lift your thumb up against the band resistance, then return to starting position.',
        imageUrl: '/exercises/thumb-extension-band.jpg',
        isFree: false
      },
    ],
    ulnarSideExtensors: [
      { 
        id: 'wristExtensorStretch', 
        name: 'Wrist Extensor Stretch*',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow straight, use your opposite hand to bend your wrist downward until you feel a stretch on the top of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/wrist-extensor-stretch.jpg',
        isFree: true
      },
      { 
        id: 'ulnarDeviatorStretch', 
        name: 'Ulnar Deviator Stretch',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow bent, use your opposite hand to bend your wrist toward the thumb side until you feel a stretch along the pinky side of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/ulnar-deviator-stretch.jpg',
        isFree: false
      },
      { 
        id: 'isometricUlnarDeviation', 
        name: 'Isometric Ulnar Deviation*',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Press the pinky-side of your hand against a stable surface. Apply pressure without moving your wrist.',
        imageUrl: '/exercises/isometric-ulnar-deviation.jpg',
        isFree: true
      },
      { 
        id: 'isometricWristExtension', 
        name: 'Isometric Wrist Extension',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Place the back of your hand against a stable surface. Push into the surface without moving your wrist, creating tension in your extensor muscles.',
        imageUrl: '/exercises/isometric-wrist-extension.jpg',
        isFree: false
      },
      { 
        id: 'dbWristExtension', 
        name: 'DB Wrist Extension',
        category: 'strength',
        instructions: 'Sit with your forearm resting on a table, palm facing down, with wrist at the edge. Hold a dumbbell and lower it down, then lift it up using only your wrist.',
        imageUrl: '/exercises/db-wrist-extension.jpg',
        isFree: false
      },
      { 
        id: 'dbUlnarDeviation', 
        name: 'DB Ulnar Deviation*',
        category: 'strength',
        instructions: 'Rest your forearm on a table with your hand off the edge, thumb facing up. Hold a dumbbell and lift your hand up toward your pinky side, then lower back down.',
        imageUrl: '/exercises/db-ulnar-deviation.jpg',
        isFree: true
      },
      { 
        id: 'fingerExtensionBands', 
        name: 'Finger Extension Bands',
        category: 'strength',
        instructions: 'Place a rubber band around your fingers. Spread your fingers apart against the resistance of the band, then slowly bring them back together.',
        imageUrl: '/exercises/finger-extension-bands.jpg',
        isFree: false
      },
    ],
    ulnarSideFlexors: [
      { 
        id: 'wristFlexorStretch', 
        name: 'Wrist Flexor Stretch*',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow straight, use your opposite hand to bend your wrist upward until you feel a stretch on the bottom of your forearm. Hold for 20-30 seconds.',
        imageUrl: 'images/exercises/wrist-flexor-stretch.jpg',
        isFree: true
      },
      { 
        id: 'ulnarDeviatorStretch', 
        name: 'Ulnar Deviator Stretch',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow bent, use your opposite hand to bend your wrist toward the thumb side until you feel a stretch along the pinky side of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/ulnar-deviator-stretch.jpg',
        isFree: false
      },
      { 
        id: 'isometricWristFlexion', 
        name: 'Isometric Wrist Flexion',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Place your palm against a stable surface. Push into the surface without moving your wrist, creating tension in your flexor muscles.',
        imageUrl: '/exercises/isometric-wrist-flexion.jpg',
        isFree: false
      },
      { 
        id: 'isometricWristUlnarDeviation', 
        name: 'Isometric Wrist Ulnar Deviation*',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Press the pinky-side of your hand against a stable surface. Apply pressure without moving your wrist.',
        imageUrl: '/exercises/isometric-wrist-ulnar-deviation.jpg',
        isFree: true
      },
      { 
        id: 'dbWristUlnarDeviation', 
        name: 'DB Wrist Ulnar Deviation',
        category: 'strength',
        instructions: 'Rest your forearm on a table with your hand off the edge, thumb facing up. Hold a dumbbell and lift your hand up toward your pinky side, then lower back down.',
        imageUrl: '/exercises/db-wrist-ulnar-deviation.jpg',
        isFree: false
      },
      { 
        id: 'dbWristFlexion', 
        name: 'DB Wrist Flexion*',
        category: 'strength',
        instructions: 'Sit with your forearm resting on a table, palm facing up, with wrist at the edge. Hold a dumbbell and lower it down, then curl it up using only your wrist.',
        imageUrl: '/exercises/db-wrist-flexion.jpg',
        isFree: true
      },
      { 
        id: 'tennisBallSqueeze', 
        name: 'Tennis Ball Squeeze',
        category: 'strength',
        instructions: 'Hold a tennis ball in your palm and squeeze firmly, then release. Repeat for the recommended repetitions.',
        imageUrl: '/exercises/tennis-ball-squeeze.jpg',
        isFree: false
      },
    ],
    pinkyFlexors: [
      { 
        id: 'wristFlexorStretch', 
        name: 'Wrist Flexor Stretch*',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow straight, use your opposite hand to bend your wrist upward until you feel a stretch on the bottom of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/wrist-flexor-stretch.jpg',
        isFree: true
      },
      { 
        id: 'interosseiStretch', 
        name: 'Interossei Stretch',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'Place your hand flat on a table. Use your other hand to gently spread your fingers apart, then hold.',
        imageUrl: '/exercises/interossei-stretch.jpg',
        isFree: false
      },
      { 
        id: 'lumbricalStretch', 
        name: 'Lumbrical Stretch',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your fingers extended, use your other hand to gently push your fingers backward until you feel a stretch in the palm of your hand.',
        imageUrl: '/exercises/lumbrical-stretch.jpg',
        isFree: false
      },
      { 
        id: 'isometricWristFlexionFingers', 
        name: 'Isometric Wrist Flexion (Fingers)*',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Press your fingertips into a stable surface. Apply pressure without moving your fingers.',
        imageUrl: '/exercises/isometric-wrist-flexion-fingers.jpg',
        isFree: true
      },
      { 
        id: 'dbWristFlexion', 
        name: 'DB Wrist Flexion',
        category: 'strength',
        instructions: 'Sit with your forearm resting on a table, palm facing up, with wrist at the edge. Hold a dumbbell and lower it down, then curl it up using only your wrist.',
        imageUrl: '/exercises/db-wrist-flexion.jpg',
        isFree: false
      },
      { 
        id: 'tennisBallSqueeze', 
        name: 'Tennis Ball Squeeze*',
        category: 'strength',
        instructions: 'Hold a tennis ball in your palm and squeeze firmly, then release. Repeat for the recommended repetitions.',
        imageUrl: '/exercises/tennis-ball-squeeze.jpg',
        isFree: true
      },
      { 
        id: 'rubberBandExtensions', 
        name: 'Rubber Band Extensions',
        category: 'strength',
        instructions: 'Place a rubber band around your fingers. Spread your fingers apart against the resistance of the band, then slowly bring them back together.',
        imageUrl: '/exercises/rubber-band-extensions.jpg',
        isFree: false
      },
    ],
    fingers: [
      { 
        id: 'wristFlexorStretch', 
        name: 'Wrist Flexor Stretch*',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow straight, use your opposite hand to bend your wrist upward until you feel a stretch on the bottom of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/wrist-flexor-stretch.jpg',
        isFree: true
      },
      { 
        id: 'wristExtensorStretch', 
        name: 'Wrist Extensor Stretch*',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your elbow straight, use your opposite hand to bend your wrist downward until you feel a stretch on the top of your forearm. Hold for 20-30 seconds.',
        imageUrl: '/exercises/wrist-extensor-stretch.jpg',
        isFree: true
      },
      { 
        id: 'interosseiStretch', 
        name: 'Interossei Stretch',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'Place your hand flat on a table. Use your other hand to gently spread your fingers apart, then hold.',
        imageUrl: '/exercises/interossei-stretch.jpg',
        isFree: false
      },
      { 
        id: 'lumbricalStretch', 
        name: 'Lumbrical Stretch',
        category: 'stretches',
        sets: '3 Sets of 20-30 Seconds',
        instructions: 'With your fingers extended, use your other hand to gently push your fingers backward until you feel a stretch in the palm of your hand.',
        imageUrl: '/exercises/lumbrical-stretch.jpg',
        isFree: false
      },
      { 
        id: 'isometricWristFlexionFingers', 
        name: 'Isometric Wrist Flexion (Fingers)',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Press your fingertips into a stable surface. Apply pressure without moving your fingers.',
        imageUrl: '/exercises/isometric-wrist-flexion-fingers.jpg',
        isFree: false
      },
      { 
        id: 'isometricWristExtensionFingers', 
        name: 'Isometric Wrist Extension (Fingers)',
        category: 'isometrics',
        duration: '3 Sets of 45 Seconds',
        rest: 'Rest 30 Seconds Between Sets',
        instructions: 'Place the backs of your fingers against a stable surface. Push into the surface without moving your fingers.',
        imageUrl: '/exercises/isometric-wrist-extension-fingers.jpg',
        isFree: false
      },
      { 
        id: 'dbWristFlexion', 
        name: 'DB Wrist Flexion*',
        category: 'strength',
        instructions: 'Sit with your forearm resting on a table, palm facing up, with wrist at the edge. Hold a dumbbell and lower it down, then curl it up using only your wrist.',
        imageUrl: '/exercises/db-wrist-flexion.jpg',
        isFree: true
      },
      { 
        id: 'dbWristExtension', 
        name: 'DB Wrist Extension*',
        category: 'strength',
        instructions: 'Sit with your forearm resting on a table, palm facing down, with wrist at the edge. Hold a dumbbell and lower it down, then lift it up using only your wrist.',
        imageUrl: '/exercises/db-wrist-extension.jpg',
        isFree: true
      },
      { 
        id: 'tennisBallSqueeze', 
        name: 'Tennis Ball Squeeze',
        category: 'strength',
        instructions: 'Hold a tennis ball in your palm and squeeze firmly, then release. Repeat for the recommended repetitions.',
        imageUrl: '/exercises/tennis-ball-squeeze.jpg',
        isFree: false
      },
      { 
        id: 'rubberBandExtensions', 
        name: 'Rubber Band Extensions',
        category: 'strength',
        instructions: 'Place a rubber band around your fingers. Spread your fingers apart against the resistance of the band, then slowly bring them back together.',
        imageUrl: '/exercises/rubber-band-extensions.jpg',
        isFree: false
      },
    ]
  };
  
  // Maps pain regions to the corresponding endurance tests
  export const painRegionToTestMapping = {
    wristFlexors: 'wristFlexorsTest',
    wristExtensors: 'wristExtensorsTest',
    thumbFlexors: 'thumbFlexorsTest',
    thumbExtensors: 'thumbExtensorsTest',
    ulnarSideExtensors: 'wristExtensorsTest',
    ulnarSideFlexors: 'wristFlexorsTest',
    pinkyFlexors: 'wristFlexorsTest',
    fingers: ['wristFlexorsTest', 'wristExtensorsTest']
  };