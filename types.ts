// ============================================================
// SCENE ROLES
// ============================================================
export type SceneRole =
  | 'Hook' | 'Pattern Interrupt' | 'Value Delivery' | 'Social Proof' | 'Bridge'
  | 'Call to Action' | 'Storytelling' | 'Demonstration' | 'Objection Handler'
  | 'Open Loop' | 'Closing';

// ============================================================
// REFERENCE VIDEO ANALYSIS — Performance DNA Extraction
// ============================================================
export interface CharacterPerformanceDNA {
  // Physical Identity
  appearance: string;
  wardrobe: string;
  age_range: string;
  gender: string;
  build: string;
  hair: string;
  skin_tone: string;
  distinguishing_features: string[];

  // Voice DNA
  voice: {
    texture: string;          // "Rich baritone with slight rasp"
    pitch: string;            // "Low-mid register"
    pace_range: string;       // "120-160 WPM, accelerates on value points"
    energy_baseline: string;  // "Controlled intensity, rarely shouts"
    accent: string;
    qualities: string[];      // ["Chest resonance", "Deliberate diction"]
  };

  // Acting DNA — HOW they perform
  acting_style: {
    persona_summary: string;          // "Confident authority figure who leads with certainty"
    default_expression: string;       // "Assured half-smile, intense eye contact"
    mannerisms: string[];             // ["Leans forward when making key points", "Uses index finger to punctuate"]
    signature_gestures: string[];     // ["Palm-down authority gesture", "Chin-tilt confidence pose"]
    eye_behavior: string;            // "Locks camera with unwavering direct gaze, breaks only on transitions"
    body_language_patterns: string[]; // ["High-status stillness", "Minimal fidgeting", "Occupies space confidently"]
    emotional_range: string;          // "Controlled spectrum: calm authority → passionate conviction → warm empathy"
    transition_style: string;         // "Smooth, no abrupt energy shifts — always motivated transitions"
  };

  // Delivery Patterns — HOW they speak
  delivery_patterns: {
    hook_technique: string;           // "Opens with provocative statement, 0.5s pause, then lean-in"
    value_delivery_technique: string; // "Slow-build, emphasis on key phrase, then exhale before next point"
    cta_technique: string;            // "Drops voice, narrows eyes, speaks slowly with weight"
    pause_patterns: string[];         // ["0.3s micro-pause before emphasis words", "0.8s breath pause between ideas"]
    emphasis_method: string;          // "Volume drop + lean-in rather than shouting"
    pacing_strategy: string;          // "Faster on setup, slower on payoff — rhythmic contrast"
  };
}

export interface VisualStyleDNA {
  primary_location: string;
  lighting: {
    key_light: string;
    fill_light: string;
    color_temperature: string;
    shadows: string;
    mood: string;
  };
  color_palette: string;
  background: string;
  props: string[];
  atmosphere: string;
  camera_language: {
    preferred_framings: string[];     // ["Medium close-up for value", "Wide establishing for hooks"]
    movement_style: string;          // "Minimal — mostly locked-off with subtle push-ins on emphasis"
    lens_characteristics: string;    // "50mm equivalent, shallow DOF, cinematic bokeh"
    angle_tendency: string;          // "Slightly below eye level — authority framing"
  };
  visual_style_summary: string;      // "Clean, premium studio look — dark backdrop, single key light, cinematic grade"
}

export interface ReferenceFrameMoment {
  timestamp: string;                  // "00:12.4"
  description: string;                // "Confident lean-in with direct gaze, right hand gesturing palm-down"
  expression: string;                 // "Intense focus, slight jaw clench"
  energy_level: number;               // 1-10
  body_position: string;              // "Leaning forward, shoulders squared"
  suitability_tags: SceneRole[];      // Which scene roles this frame suits
}

export interface ReferenceAnalysis {
  video_title: string;
  video_summary: string;
  total_duration: string;
  character: CharacterPerformanceDNA;
  visual_style: VisualStyleDNA;
  frame_library: ReferenceFrameMoment[];  // 15-25 key moments catalogued
  performance_summary: string;            // Overall assessment of the performer's style
}

// ============================================================
// SCRIPT SEGMENTATION — New Script → VEO Scenes
// ============================================================
export interface ScriptScene {
  scene_number: number;
  role: SceneRole;
  title: string;
  duration_seconds: number;           // 4.0 - 8.0
  script_text: string;                // The new script segment for this scene
  split_logic: string;                // Why cut here
  emotional_tone: string;
  energy_level: number;               // 1-10

  // Acting Blueprint — HOW to perform THIS script segment
  acting_blueprint: {
    intention: string;                // "Establish authority and create curiosity"
    subtext: string;                  // "I know something you don't — and it will change everything"
    delivery_pace_wpm: number;        // Calculated to fit duration
    emphasis_words: string[];
    pause_map: string[];              // ["0.3s after 'listen'", "0.6s before final phrase"]
    energy_arc: string;               // "Start at 6/10, build to 8/10 on key phrase, settle to 7/10"
    mapped_mannerisms: string[];      // Which mannerisms from DNA to deploy here
    mapped_gestures: string[];        // Which signature gestures fit this moment
    expression_direction: string;     // "Start with knowing half-smile, shift to intense direct stare on key line"
    body_direction: string;           // "Begin centered, lean forward 15° on emphasis, return to neutral"
  };

  // Auto-Selected Reference Frames
  recommended_inframe: {
    timestamp: string;                // Best matching frame from reference video
    rationale: string;                // "This frame shows the exact energy level and expression needed for this scene's opening"
  };
  recommended_outframe: {
    timestamp: string;
    rationale: string;                // "Expression and posture match the exit energy of this scene"
  };

  // Camera Direction for this scene
  camera_direction: {
    framing: string;
    movement: string;
    angle: string;
    lens: string;
    depth_of_field: string;
  };

  // Continuity
  continuity: {
    enters_from: string;              // "Continuation of confident stance from Scene 2"
    exits_to: string;                 // "Slight lean-back creates natural pause before Scene 4's energy shift"
  };
}

export interface ScriptSegmentation {
  total_scenes: number;
  narrative_arc: string;              // How the new script flows as a story
  scenes: ScriptScene[];
}

// ============================================================
// ENGINEERED SCENE (output)
// ============================================================
export interface EngineeredScene {
  scene_number: number;
  scene_title: string;
  role: string;
  duration_seconds: number;
  veo_prompt: string;
  timestamp: string;
  // V3 additions
  inframe_source: 'auto' | 'custom';   // Whether user kept auto-selected or uploaded custom
  outframe_source: 'auto' | 'custom';
}

// ============================================================
// APP STATE
// ============================================================
export interface AppState {
  // Flow Control
  step: 'upload' | 'analyzing-reference' | 'segmenting' | 'scenes';

  // Phase 1: Dual Upload
  referenceVideo: File | null;
  targetCharacter: File | null;         // New: User uploads the character they want to generate
  newScript: string;                    // The full new script text

  // Phase 2: Reference Analysis
  referenceAnalysis: ReferenceAnalysis | null;

  // Phase 3: Script Segmentation
  scriptSegmentation: ScriptSegmentation | null;

  // Phase 4: Scene Engineering
  selectedSceneIndex: number | null;
  sceneProcessing: 'idle' | 'engineering' | 'complete';
  sceneProcessingStatus: string;
  currentPrompt: string | null;
  completedScenes: EngineeredScene[];

  // Frame Selection State (per scene)
  inframeImage: File | null;            // Auto-extracted or user-uploaded
  outframeImage: File | null;           // Auto-extracted or user-uploaded
  inframeTimestamp: string | null;       // For auto-extraction
  outframeTimestamp: string | null;      // For auto-extraction
  useCustomInframe: boolean;
  useCustomOutframe: boolean;

  // Optimization State
  showOptimizationModal: boolean;
  optimizationInframe: File | null;
  optimizationOutframe: File | null;
  isOptimizing: boolean;

  // General
  error: string | null;
  processingStatus: string;
}