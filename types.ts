// ============================================================
// SCENE ROLES
// ============================================================
export type SceneRole =
  | 'Hook' | 'Pattern Interrupt' | 'Value Delivery' | 'Social Proof' | 'Bridge'
  | 'Call to Action' | 'Storytelling' | 'Demonstration' | 'Objection Handler'
  | 'Open Loop' | 'Closing';

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

  // Directing Agent Notes
  directing_notes: {
    framing: string;                  // "Medium Shot", "Close-Up"
    camera_angle: string;             // "Eye level", "Slight low angle"
    lighting_mood: string;            // "High contrast 4:1 ratio", "Bright 2:1 ratio"
    pacing_strategy: string;          // "Anchor pattern", "Rapid B-roll intercutting"
    visual_business: string;          // "Subject leans into desk", "Subject adjusts watch"
  };

  // Acting Agent Notes
  acting_notes: {
    intention: string;                // "Establish authority and create curiosity"
    subtext: string;                  // "I know something you don't — and it will change everything"
    vocal_delivery: string;           // "Gear 4 urgency", "Conversational chest voice"
    emphasis_and_pauses: string;      // "Pregnant pause before 'secret'", "Authority drop on final word"
    posture_and_body: string;         // "10% forward lean", "Relaxed open posture"
    micro_expressions: string;        // "Piercing eye contact", "Subtle knowing smirk"
  };

  // Visual Prompts for Frame Generation
  frame_descriptions: {
    inframe_prompt: string;           // Cinematic description of the opening frame
    outframe_prompt: string;          // Cinematic description of the closing frame
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
  step: 'upload' | 'architecting' | 'scenes';

  // Phase 1: Upload
  targetCharacter: File | null;         // User uploads the character they want to generate
  contextImages: File[];                // Up to 5 context images for wardrobe/environment
  newScript: string;                    // The full new script text

  // Phase 2: Script Segmentation (Directing & Acting Passes)
  scriptSegmentation: ScriptSegmentation | null;

  // Phase 3: Scene Engineering
  selectedSceneIndex: number | null;
  sceneProcessing: 'idle' | 'engineering' | 'complete';
  sceneProcessingStatus: string;
  currentPrompt: string | null;
  completedScenes: EngineeredScene[];

  // Frame Selection State (per scene)
  inframeImage: File | null;            // Auto-generated or user-uploaded
  outframeImage: File | null;           // Auto-generated or user-uploaded
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