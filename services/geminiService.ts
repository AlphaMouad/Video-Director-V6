import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { ReferenceAnalysis, ScriptSegmentation, ScriptScene, EngineeredScene } from '../types';

let userApiKey: string | null = null;

export const setApiKey = (key: string) => {
  userApiKey = key;
};

const getAI = () => {
  if (!userApiKey) {
    throw new Error("API Key not set. Please provide your Google Gemini API Key.");
  }
  return new GoogleGenAI({ apiKey: userApiKey });
};

const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
};

// ============================================================
// Function #1: Analyze Reference Video
// ============================================================
export const analyzeReferenceVideo = async (videoFile: File): Promise<ReferenceAnalysis> => {
  const base64Data = await fileToBase64(videoFile);
  
  const prompt = `
You are an Elite Hollywood Acting Coach, Master Behavioral Profiler, and Cinematic Intelligence Engine.

Your task is to deconstruct this performer's "Source Code" to absolute world-class standards. Do not just describe what they do; analyze WHY their performance is magnetically persuasive. We need to extract the subtle, sub-perceptual signals, elite presentation skills, and Hollywood-caliber delivery mechanics that create irresistible AUTHORITY, CHARISMA, and TRUST.

=== DEEP DIVE EXTRACTION PROTOCOL ===

1. CHARACTER PERFORMANCE DNA (The "Micro-Signal" Layer)
   Study the signals that are barely visible but highly felt. Deconstruct the performance like an A-List Hollywood Director.

   PHYSICAL IDENTITY:
   - Precise biological details (Skin texture, bone structure, hairline).
   - Wardrobe material analysis (Wool weight, collar stiffness, fabric drape).

   VOICE DNA & DYNAMIC RANGE (If audio exists):
   - Analyze the "Silence": Identify masterful dramatic pauses. How long do they hold tension before delivering a critical payload?
   - The "Drop": Capture the "Authority Drop" — the exact moment they lower pitch to anchor a statement in absolute certainty.
   - Vocal Resonance & Cadence: Map the breath control and rhythmic variations that create a hypnotic speaking cadence.

   ACTING DNA — THE "TRUTH" LAYER:
   - **Masterful Micro-Expressions:** Identify the subtle, authentic emotional leaks. The tightening of the jaw, a brief micro-smirk, the precise activation of the orbicularis oculi (Duchenne marker).
   - **Blink Rate & Gaze Dynamics:** Do they use the "Predator Gaze" (sustained, unblinking focus) or "Processing Blinks"?
   - **High-Status Stillness:** Analyze how they command the frame without unnecessary movement. Does the head remain perfectly anchored during critical delivery?
   - **The "Thought Process":** How do they visibly process information? (e.g., "Eyes shift slightly left, breath held for 0.2s, creating the illusion of real-time realization").
   - **Fluid Hand-Eye Coordination:** Do gestures precede the word (indicating authentic thought) or hit precisely on the beat?

   DELIVERY PATTERNS & ELITE PRESENTATION SKILLS:
   - **The Hook:** The physical and vocal mechanism of capturing immediate attention (e.g., the subtle lean-in, the sharp intake of breath).
   - **Value Delivery (Pacing):** How do they modulate speed? Do they slow down to make complex data land, and speed up for storytelling momentum?
   - **The "Trust Anchor":** What specific physical action signals unshakeable conviction? (e.g., Open palms, eyebrows raised, a grounded nod).

2. VISUAL STYLE DNA (The "Director of Photography" Layer)
   - **Lighting Ratios:** Estimate the Key-to-Fill ratio (e.g., 4:1 High Contrast vs 2:1 Flat).
   - **Lens Choice:** Estimate the focal length (e.g., 35mm vs 85mm).
   - **Texture Density:** Describe the sharpness of details (pores, fabric, background blur).

3. FRAME LIBRARY (The "Gold Standard" Moments)
   Select 15-25 frames that define the performer's range.
   CRITICAL: Differentiate between "Active Speaking" frames and "Listening/Thinking" frames.
   - 5x HIGH AUTHORITY (The "Closer")
   - 5x WARM EMPATHY (The "Advisor")
   - 5x INTELLECTUAL PROCESSING (The "Analyst")
   - 5x TRANSITIONAL MOVEMENT (The "Bridge")

4. PERFORMANCE SUMMARY
   A concise psychological profile of the performer's persuasion style.

OUTPUT: Return a complete JSON object matching this exact structure:
{
  "video_title": "String",
  "video_summary": "String",
  "total_duration": "String",
  "character": {
    "appearance": "String",
    "wardrobe": "String",
    "age_range": "String",
    "gender": "String",
    "build": "String",
    "hair": "String",
    "skin_tone": "String",
    "distinguishing_features": ["String"],
    "voice": {
      "texture": "String",
      "pitch": "String",
      "pace_range": "String",
      "energy_baseline": "String",
      "accent": "String",
      "qualities": ["String"]
    },
    "acting_style": {
      "persona_summary": "String",
      "default_expression": "String",
      "mannerisms": ["String"],
      "signature_gestures": ["String"],
      "eye_behavior": "String",
      "body_language_patterns": ["String"],
      "emotional_range": "String",
      "transition_style": "String"
    },
    "delivery_patterns": {
      "hook_technique": "String",
      "value_delivery_technique": "String",
      "cta_technique": "String",
      "pause_patterns": ["String"],
      "emphasis_method": "String",
      "pacing_strategy": "String"
    }
  },
  "visual_style": {
    "primary_location": "String",
    "lighting": {
      "key_light": "String",
      "fill_light": "String",
      "color_temperature": "String",
      "shadows": "String",
      "mood": "String"
    },
    "color_palette": "String",
    "background": "String",
    "props": ["String"],
    "atmosphere": "String",
    "camera_language": {
      "preferred_framings": ["String"],
      "movement_style": "String",
      "lens_characteristics": "String",
      "angle_tendency": "String"
    },
    "visual_style_summary": "String"
  },
  "frame_library": [
    {
      "timestamp": "MM:SS.S",
      "description": "String",
      "expression": "String",
      "energy_level": Number,
      "body_position": "String",
      "suitability_tags": ["String"]
    }
  ],
  "performance_summary": "String"
}
`;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: videoFile.type, data: base64Data } }] }],
    config: { responseMimeType: "application/json", thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
  });

  const responseText = response.text || "{}";
  const json = JSON.parse(responseText);
  
  if (!json.character && json.referenceAnalysis?.character) {
      return json.referenceAnalysis;
  }
  
  return json;
};

// ============================================================
// Function #2: Segment Script
// ============================================================
export const segmentScript = async (newScript: string, referenceAnalysis: ReferenceAnalysis): Promise<ScriptSegmentation> => {
  const prompt = `
You are a Master Dramaturg, World-Class Script Supervisor, and A-List Cinematic Editor.

Your task is to segment a script into Elite VEO 3.1 scenes using absolute world-class scene segmentation logic.

=== INPUT ANALYSIS ===
The "NEW SCRIPT" below may be provided in one of two formats:
1. **Raw Text:** Just the dialogue.
2. **The Elite Blueprint:** A structured document with [SCENE START], [VISUAL], [ACTING], and SPEAKER: tags.

=== INSTRUCTIONS FOR BLUEPRINT FORMAT ===
If the input contains bracketed directives like [VISUAL] or [ACTING]:
1. **Preserve Masterful Intent:** You MUST extract the specific acting directions and visual cues provided in the brackets and map them perfectly to the \`acting_blueprint\` and \`camera_direction\` fields.
2. **Subtextual Layering:** Extract parenthetical tone indicators (e.g., "(Tone: Low, warm, dangerous...)") into a profound \`acting_blueprint.subtext\` or \`emotional_tone\`.
3. **Scene Boundaries:** Use the [SCENE START] or [ACTING] breaks as natural scene delimiters, BUT you must still ensure no scene is less than 4 seconds or exceeds 8 seconds. If a Blueprint block is too long, split it gracefully while preserving the emotional arc and carrying over the acting notes.

=== WORLD-CLASS SEGMENTATION LOGIC (FOR RAW TEXT) ===
1. **Dynamic Pacing Matrix (The Hollywood Flow):**
   - Do NOT use a rigid WPM rule. A master orator varies pacing.
   - **Data & Value Delivery:** ~110-120 WPM (slow, measured, authoritative).
   - **Hooks & Excitement:** ~130-140 WPM (sharp, engaging, urgent).
   - **Storytelling / Bridge:** ~145+ WPM (fluid, conversational momentum).
2. **Target Duration:** Precisely 4.0 to 8.0 seconds per chunk.
3. **Target Word Count:** Calculate based on the specific pacing of the scene's emotional tone (roughly 8 to 20 words).
4. **The "Dramatic Beat Cut":** Do not simply cut on periods and commas. Cut on profound emotional shifts, the crest of a thought, or immediately before a massive revelation. Use the edit to build subconscious tension. A cut is a breath; engineer the breathing of the video.

=== FRAME SELECTION STRATEGY (CRITICAL) ===
- **In-Frame:** Must perfectly match the STARTING energy, posture, and micro-expression of this specific scene's intent.
- **Out-Frame:** Must perfectly match the ENDING energy and expression of this scene.
- You MUST select these timestamps ONLY from the provided FRAME LIBRARY.

=== INPUTS ===
NEW SCRIPT: """${newScript}"""
PERFORMER DNA: ${JSON.stringify(referenceAnalysis?.character || {}, null, 2)}
FRAME LIBRARY: ${JSON.stringify(referenceAnalysis?.frame_library || [], null, 2)}

=== OUTPUT ===
Return a complete JSON object:
{
  "total_scenes": Number,
  "narrative_arc": "String",
  "scenes": [
    {
      "scene_number": Number,
      "role": "SceneRole",
      "title": "String",
      "duration_seconds": Number (5.0-8.0),
      "script_text": "String (11-17 words)",
      "split_logic": "String",
      "emotional_tone": "String",
      "energy_level": Number (1-10),
      "acting_blueprint": {
        "intention": "String",
        "subtext": "String",
        "delivery_pace_wpm": 130,
        "emphasis_words": ["String"],
        "pause_map": ["String"],
        "energy_arc": "String",
        "mapped_mannerisms": ["String"],
        "mapped_gestures": ["String"],
        "expression_direction": "String",
        "body_direction": "String"
      },
      "recommended_inframe": {
        "timestamp": "String",
        "rationale": "String"
      },
      "recommended_outframe": {
        "timestamp": "String",
        "rationale": "String"
      },
      "camera_direction": {
        "framing": "String",
        "movement": "String",
        "angle": "String",
        "lens": "String",
        "depth_of_field": "String"
      },
      "continuity": {
        "enters_from": "String",
        "exits_to": "String"
      }
    }
  ]
}
`;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
  });

  const responseText = response.text || "{}";
  return JSON.parse(responseText);
};

// ============================================================
// Function #3: Extract Frame (Client-Side)
// ============================================================
export const extractFrameFromVideo = (videoFile: File, timestamp: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    video.preload = 'auto';
    video.muted = true;

    const parts = timestamp.split(':');
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    } else if (parts.length === 3) {
       seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    } else {
        seconds = parseFloat(timestamp);
    }
    
    if (isNaN(seconds)) seconds = 0;

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = seconds;
    };

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Frame extraction failed'));
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.95);
    };

    video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Video load failed'));
    };
    
    video.src = URL.createObjectURL(videoFile);
  });
};

// ============================================================
// Function #3.5: Generate Character Frame (Identity Transfer)
// ============================================================
export const generateCharacterFrame = async (
  referenceFrame: Blob, 
  targetCharacter: File, 
  role: string, 
  emotion: string
): Promise<Blob> => {
  const refBase64 = await fileToBase64(referenceFrame);
  const targetBase64 = await fileToBase64(targetCharacter);
  
  const prompt = `
  Generate a hyper-realistic, 8k cinematic portrait.
  
  INSTRUCTIONS:
  1. POSE & COMPOSITION: Strictly match the camera angle, framing, head tilt, and facial expression of the FIRST image (Reference Frame).
  2. IDENTITY: Strictly match the facial features, age, hair, and skin tone of the SECOND image (Target Character).
  3. STYLE: Cinematic Corporate Chiaroscuro. High-end commercial production value. 85mm Lens.
  4. CONTEXT: The character is performing the role of '${role}' with an emotional tone of '${emotion}'.
  
  Output a single photorealistic image.
  `;

  const ai = getAI();

  // ATTEMPT 1: Elite Model (Nano Banana Pro)
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { data: refBase64, mimeType: referenceFrame.type || 'image/jpeg' } },
          { inlineData: { data: targetBase64, mimeType: targetCharacter.type || 'image/jpeg' } },
          { text: prompt },
        ],
      },
      config: { imageConfig: { imageSize: "2K" } }
    });

    const blob = extractImageFromResponse(response);
    if (blob) return blob;

  } catch (error: any) {
    console.warn("Elite frame generation failed (likely 403 or quota), attempting fallback to Flash...", error);
    
    // ATTEMPT 2: Fallback Model (Nano Banana)
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: refBase64, mimeType: referenceFrame.type || 'image/jpeg' } },
            { inlineData: { data: targetBase64, mimeType: targetCharacter.type || 'image/jpeg' } },
            { text: prompt },
          ],
        },
      });

      const blob = extractImageFromResponse(fallbackResponse);
      if (blob) return blob;

    } catch (fallbackError) {
      console.error("Fallback frame generation also failed:", fallbackError);
    }
  }

  // Fallback to original if everything fails
  return referenceFrame;
};

const extractImageFromResponse = (response: any): Blob | null => {
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      const byteCharacters = atob(base64EncodeString);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: 'image/jpeg' });
    }
  }
  return null;
};

// ============================================================
// Function #4: Engineer Scene Prompt
// ============================================================
export const engineerScenePrompt = async (
  scene: ScriptScene, 
  referenceAnalysis: ReferenceAnalysis, 
  inframeImage: File, 
  outframeImage: File, 
  targetCharacterImage: File,
  completedScenes: EngineeredScene[]
): Promise<string> => {
  const inframeB64 = await fileToBase64(inframeImage);
  const outframeB64 = await fileToBase64(outframeImage);
  const targetCharB64 = await fileToBase64(targetCharacterImage);

  const consistencyContext = completedScenes.length === 0
  ? "This is the PRIMARY ANCHOR SCENE. Define the 'World Physics', Lighting Temperature, Camera Framing, and Skin Texture that must be locked in and maintained for the entire project."
  : `MAINTAIN PERFECT CONTINUITY with the previous scenes. The lighting, skin tone, background bokeh, and exact camera framing must be mathematically identical to ensure a seamless cut.\n\n${completedScenes.map(s => `SCENE ${s.scene_number} PROMPT:\n${s.veo_prompt}`).join('\n\n')}`;

  const prompt = `
ROLE:
You are an Elite AI Video Director and World-Class Hollywood Acting Coach. Your objective is to take a sliced script chunk, Target Character visuals, and Reference Acting data, and generate a highly technical, 4-section cinematic prompt for AI video models (like Google Veo). Your goal is Hyper-Realism, magnetic charisma, "Quiet Luxury," and the absolute eradication of the AI uncanny valley. The performance MUST meet Oscar-caliber standards of authenticity and magnetism.

TARGET AUDIENCE OPTIMIZATION:
The output must be specifically engineered as an **Absolute Best Elite Pitch (VSL, High-End YouTube, Investor Briefing)**. The tone must be Professional, Confident, and Dangerously Effective—zero hesitation, absolute competence, magnetic authority.

YOUR DIRECTIVES:
Output exactly ONE prompt strictly adhering to the following 4-Section Format. Do not use markdown bolding within the sections.

FORMAT STRUCTURE:

Visuals: [Detailed cinematic description of the subject, wardrobe, environment, lighting, and camera lens].
Action & Performance: [Detailed Hollywood-caliber acting instructions, magnetic micro-movements, hypnotic eye contact, fluid gestures, and subtextual facial expressions].
Audio Style: [Strict audio engineering rules, voice description, and masterful pacing/delivery mechanics].
Script: "[The exact script text]"

CONTENT REQUIREMENTS:

1. Visuals (ELITE PRODUCTION VALUE & STATIC CAMERA):
- **LOCKED-OFF CAMERA (CRITICAL):** Absolutely NO camera panning, tilting, tracking, or zooming. The camera must remain completely static on a heavy-duty tripod. The only movement in the frame must come from the subject's natural breathing and micro-expressions.
- **A-LIST CINEMATOGRAPHY:** Shot on ARRI Alexa 65, 85mm Zeiss Master Prime lens at f/1.4. Cinematic 8k resolution. Flawless color grading (Kodak Vision3 500T 5219 film stock emulation).
- **IDENTITY SOURCE:** Use the [Target Character Image] as the ABSOLUTE SOURCE OF TRUTH for the character's physical identity (face, hair, age, skin texture).
- **POSE/LIGHTING SOURCE:** Use the [In-Frame Image] and [Out-Frame Image] as the reference for the character's pose, lighting environment, and camera framing.
- Focus on material physics: "matte skin finish with subtle pores," "unstructured bespoke suit in deep espresso or midnight navy," "heavy-weight white cotton shirt with a fluid natural drape."
- Lighting: "Warm Institutional" - Highly diffused cinematic Rembrandt lighting. Soft shadows. A very subtle amber rim light on the shoulder.
- Environment: "Lived-in Luxury" - Softly blurred dark charcoal marble background or an executive suite at 5:00 PM. Give the speaker an inch or two of natural "breathing room" in the frame to feel relaxed and unbothered.

2. Action & Performance (HOLLYWOOD DIRECTING & SCENE PURPOSE):
- **SCENE PURPOSE OPTIMIZATION:** This scene's role is '${scene.role}'. Engineer the micro-expressions, posture, and magnetic presence to flawlessly execute this specific psychological purpose.
- **DYNAMIC & ADAPTIVE (THE MASTERCLASS):** The performance must adapt to the Energy Level (${scene.energy_level}/10) and Intention ("${scene.acting_blueprint.intention}").
  - **Low Energy (1-3):** High-status stillness, hypnotic minimal movement, "The Godfather" presence. Command the room by doing nothing.
  - **Medium Energy (4-7):** Controlled, fluid, deliberate gestures. The "Advisor." Leaning in slightly to emphasize massive value, active, penetrating listening.
  - **High Energy (8-10):** High-octane conviction, sharp but fluid and decisive hand movements, intense forward engagement. The "Closer." Absolute certainty.
- **Scene-Specific Hollywood Direction:**
  - Intention: "${scene.acting_blueprint.intention}"
  - Subtext (The Secret): "${scene.acting_blueprint.subtext}"
  - Expression: "${scene.acting_blueprint.expression_direction}"
  - Body Direction: "${scene.acting_blueprint.body_direction}"
- **Magnetic Micro-Expression Engineering (The "Fluid Anchor"):** Explicitly prompt for "subtle chest breathing, authentic micro-movements of the head while speaking, slightly asymmetrical grounded posture, and soft, natural, deliberate blinks." The gaze must be sustained, relaxed, and piercing—never darting away to search for words.
- **Elite Presentation Skills:** Use deliberate, highly charismatic gestures (e.g., "a subtle, authoritative nod," "a slight lean-in to share a secret," "open palms to signal absolute truth") to drive the point home. True power is fluid; it is entirely at ease, yet impossible to ignore.

3. Audio Style (THE SOUND OF INFLUENCE):
- **Speaker Label:** @elite_financial_narrator (Maintain this exact label for 100% voice consistency across all generated clips).
- **Language:** English (United States) - Spoken.
- **Quality:** Studio Master. Pure, raw, bone-dry vocal track. Near-field proximity effect. Zero noise floor.
- ABSOLUTELY NO background music, NO sound effects, NO room reverb, NO ambient noise.
- Voice Profile: ${JSON.stringify(referenceAnalysis.character.voice)}.
- Accent: Standard American English broadcast accent (unless Voice DNA specifies otherwise).
- **Masterful Delivery & Pacing:** Implement absolute world-class vocal control. Glide through the setup naturally with conversational momentum. Implement strategic, dramatic pauses before massive revelations. End critical sentences with the "Authority Drop" (a slight downward inflection) to anchor the statement in absolute gravity and unquestionable truth. Vary the cadence to hypnotize the listener.

4. Script:
- Exact text: "${scene.script_text}"

=== CONSISTENCY DATA ===
${consistencyContext}

Generate the Prompt:
`;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { mimeType: targetCharacterImage.type, data: targetCharB64 } },
        { inlineData: { mimeType: inframeImage.type, data: inframeB64 } },
        { inlineData: { mimeType: outframeImage.type, data: outframeB64 } }
      ]
    }],
    config: { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
  });

  return response.text || '';
};
