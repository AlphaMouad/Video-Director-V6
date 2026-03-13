import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { ScriptSegmentation, ScriptScene, EngineeredScene } from '../types';
import { YOUTUBE_DIRECTING_BIBLE, YOUTUBE_INFLUENCER_ACTING_BIBLE } from './bibles';

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
// Multi-Agent Pipeline: Architect Script (Directing & Acting)
// ============================================================
export const architectScript = async (newScript: string): Promise<ScriptSegmentation> => {
  const ai = getAI();

  // --- PASS 1: The A-List Directing Agent ---
  const directingPrompt = `
You are an A-List Hollywood Showrunner and Elite Cinematic Director.
Your task is to take the provided script and segment it into VEO 3.1 scenes (4.0 - 8.0 seconds each) using the absolute world-class logic found in the YOUTUBE DIRECTING BIBLE.

=== YOUTUBE DIRECTING BIBLE ===
${YOUTUBE_DIRECTING_BIBLE}

=== DIRECTING MANDATES ===
1. Dynamic Pacing Matrix: Use the pacing rules (110-145+ WPM) to determine exactly how many words fit into a 4 to 8-second window.
2. The Dramatic Beat Cut: Cut on emotional shifts, the crest of a thought, or right before a revelation. NEVER cut randomly in the middle of a flowing idea.
3. Visual Architecture: Assign precise framing (Wide, Medium, Close-Up, Handheld) based on the psychological need of the scene.
4. Lighting Mood: Define the lighting ratio (e.g., 4:1 Moody, 2:1 Corporate) based on the scene's intent.
5. Frame Descriptions: Write a highly detailed, cinematic prompt for generating the EXACT visual frame for the start (inframe_prompt) and the end (outframe_prompt) of each scene. Describe the posture, lighting, and camera angle vividly.

SCRIPT TO DIRECT:
"""${newScript}"""

OUTPUT EXACTLY THIS JSON STRUCTURE:
{
  "total_scenes": Number,
  "narrative_arc": "String",
  "scenes": [
    {
      "scene_number": Number,
      "role": "SceneRole",
      "title": "String",
      "duration_seconds": Number (4.0-8.0),
      "script_text": "String",
      "split_logic": "String",
      "emotional_tone": "String",
      "energy_level": Number (1-10),
      "directing_notes": {
        "framing": "String",
        "camera_angle": "String",
        "lighting_mood": "String",
        "pacing_strategy": "String",
        "visual_business": "String"
      },
      "frame_descriptions": {
        "inframe_prompt": "String",
        "outframe_prompt": "String"
      },
      "continuity": {
        "enters_from": "String",
        "exits_to": "String"
      }
    }
  ]
}
`;

  const directingResponse = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [{ role: 'user', parts: [{ text: directingPrompt }] }],
    config: { responseMimeType: "application/json", thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
  });

  const directedScript = JSON.parse(directingResponse.text || "{}");

  // --- PASS 2: The Elite Acting Agent ---
  const actingPrompt = `
You are the world's most elite Hollywood Acting Coach specializing in Solo-Creator performances.
You have received a scene-by-scene directed script. Your task is to layer the "Acting Notes" onto each scene, utilizing the absolute world-class psychology from the YOUTUBE INFLUENCER ACTING BIBLE.

=== YOUTUBE INFLUENCER ACTING BIBLE ===
${YOUTUBE_INFLUENCER_ACTING_BIBLE}

=== ACTING MANDATES ===
For each scene provided, analyze the script text and the director's notes, then generate the corresponding "acting_notes".
1. Vocal Delivery: Specify the exact vocal gear, pitch, and pacing shifts.
2. Emphasis & Pauses: Identify the exact words to hit, and where to deploy the "Authority Drop" or "Pregnant Pause".
3. Posture & Body: Specify the exact physical lean, groundedness, and fluidity of gestures.
4. Micro-expressions: Detail the subtextual eye movements (e.g., "Predator Gaze", "Duchenne marker").

DIRECTED SCRIPT:
${JSON.stringify(directedScript, null, 2)}

OUTPUT EXACTLY THIS JSON STRUCTURE (return the FULL script, but add the "acting_notes" to every scene):
{
  "total_scenes": Number,
  "narrative_arc": "String",
  "scenes": [
    {
      "scene_number": Number,
      "role": "SceneRole",
      "title": "String",
      "duration_seconds": Number,
      "script_text": "String",
      "split_logic": "String",
      "emotional_tone": "String",
      "energy_level": Number,
      "directing_notes": { ... },
      "acting_notes": {
        "intention": "String",
        "subtext": "String",
        "vocal_delivery": "String",
        "emphasis_and_pauses": "String",
        "posture_and_body": "String",
        "micro_expressions": "String"
      },
      "frame_descriptions": { ... },
      "continuity": { ... }
    }
  ]
}
`;

  const actingResponse = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [{ role: 'user', parts: [{ text: actingPrompt }] }],
    config: { responseMimeType: "application/json", thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
  });

  return JSON.parse(actingResponse.text || "{}");
};

// ============================================================
// Frame Generation (Directly from Prompts + Identity + Context)
// ============================================================
export const generateSceneFrame = async (
  visualPrompt: string,
  targetCharacter: File, 
  contextImages: File[]
): Promise<Blob> => {
  const targetBase64 = await fileToBase64(targetCharacter);
  
  const contextParts = await Promise.all(
    contextImages.map(async (file) => ({
      inlineData: { mimeType: file.type, data: await fileToBase64(file) }
    }))
  );

  const prompt = `
  Generate a single hyper-realistic, 8k cinematic frame.
  
  SCENE VISUALS (Obey this framing and lighting strictly):
  "${visualPrompt}"

  INSTRUCTIONS:
  1. IDENTITY: Strictly match the facial features, age, hair, and skin tone of the PRIMARY IMAGE (Target Character).
  2. CONTEXT/WARDROBE: Carefully analyze the provided CONTEXT IMAGES (if any). The generated subject MUST be wearing the exact clothing/fabrics shown in the context images, and be situated in the exact environment shown in the context images. Do not hallucinate corporate suits unless shown.
  3. STYLE: Cinematic 8k. Master Prime 85mm. Perfect color grading.
  
  Output a single photorealistic image.
  `;

  const ai = getAI();
  const parts: any[] = [
    { inlineData: { data: targetBase64, mimeType: targetCharacter.type || 'image/jpeg' } },
    ...contextParts,
    { text: prompt }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { imageSize: "2K" } }
    });

    const blob = extractImageFromResponse(response);
    if (blob) return blob;
  } catch (error: any) {
    console.warn("Elite frame generation failed, fallback to Flash...", error);
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
      });
      const blob = extractImageFromResponse(fallbackResponse);
      if (blob) return blob;
    } catch (fallbackError) {
      console.error("Fallback frame generation failed:", fallbackError);
    }
  }

  throw new Error("Failed to generate scene frame.");
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
  inframeImage: File, 
  outframeImage: File, 
  targetCharacterImage: File,
  completedScenes: EngineeredScene[],
  contextImages: File[] = []
): Promise<string> => {
  const inframeB64 = await fileToBase64(inframeImage);
  const outframeB64 = await fileToBase64(outframeImage);
  const targetCharB64 = await fileToBase64(targetCharacterImage);

  // Convert all uploaded context images
  const contextImagesData = await Promise.all(
    contextImages.map(async (file) => ({
      mimeType: file.type,
      data: await fileToBase64(file)
    }))
  );

  const consistencyContext = completedScenes.length === 0
  ? "This is the PRIMARY ANCHOR SCENE. Define the 'World Physics', Lighting Temperature, Camera Framing, and Skin Texture that must be locked in and maintained for the entire project."
  : `MAINTAIN PERFECT CONTINUITY with the previous scenes. The lighting, skin tone, background bokeh, and exact camera framing must be mathematically identical to ensure a seamless cut.\n\n${completedScenes.map(s => `SCENE ${s.scene_number} PROMPT:\n${s.veo_prompt}`).join('\n\n')}`;

  const prompt = `
ROLE:
You are an Elite AI Video Director and World-Class Hollywood Acting Coach. Your objective is to take a sliced script chunk, Target Character visuals, and advanced Directing & Acting Notes, and generate a highly technical, 4-section cinematic prompt for AI video models (like Google Veo). Your goal is Hyper-Realism, magnetic charisma, and the absolute eradication of the AI uncanny valley. The performance MUST meet Oscar-caliber standards of authenticity and magnetism.

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

1. Visuals (ELITE PRODUCTION VALUE & CAMERA ARCHITECTURE):
- **LOCKED-OFF CAMERA:** Unless specified by the Director, the camera remains static on a heavy-duty tripod.
- **A-LIST CINEMATOGRAPHY:** Shot on ARRI Alexa 65, 85mm Zeiss Master Prime lens at f/1.4. Cinematic 8k resolution. Flawless color grading (Kodak Vision3 500T 5219 film stock emulation).
- **IDENTITY SOURCE:** Use the [Target Character Image] as the ABSOLUTE SOURCE OF TRUTH for the character's physical identity (face, hair, age, skin texture).
- **POSE/LIGHTING SOURCE:** Use the [In-Frame Image] and [Out-Frame Image] as the exact reference for the character's starting/ending pose, lighting environment, and camera framing.
- **WARDROBE & ENVIRONMENT CONFLICT RESOLUTION:** You MUST strictly analyze the provided Context Images (if any). Do NOT hallucinate standard "corporate suits" or generic backgrounds if the images show something else. The generated visual description must perfectly match the specific fabrics, colors, styles, and environment shown in the user's uploaded images.
- **DIRECTOR'S VISUAL NOTES:**
  - Framing: ${scene.directing_notes.framing}
  - Camera Angle: ${scene.directing_notes.camera_angle}
  - Lighting Mood: ${scene.directing_notes.lighting_mood}

2. Action & Performance (HOLLYWOOD DIRECTING & SCENE PURPOSE):
- **SCENE PURPOSE OPTIMIZATION:** This scene's role is '${scene.role}'.
- **DYNAMIC & ADAPTIVE:** The performance must adapt to the Energy Level (${scene.energy_level}/10).
- **ACTOR'S BLUEPRINT:**
  - Intention: "${scene.acting_notes.intention}"
  - Subtext: "${scene.acting_notes.subtext}"
  - Posture & Body: "${scene.acting_notes.posture_and_body}"
  - Micro-Expressions: "${scene.acting_notes.micro_expressions}"
  - Visual Business: "${scene.directing_notes.visual_business}"
- **Magnetic Micro-Expression Engineering:** Explicitly prompt for "subtle chest breathing, authentic micro-movements of the head while speaking, slightly asymmetrical grounded posture, and soft, natural, deliberate blinks." The gaze must be sustained, relaxed, and piercing.

3. Audio Style (THE SOUND OF INFLUENCE):
- **Speaker Label:** @elite_narrator
- **Language:** English (United States) - Spoken.
- **Quality:** Studio Master. Pure, raw, bone-dry vocal track. Zero noise floor.
- ABSOLUTELY NO background music, NO sound effects.
- **VOCAL MASTERCLASS:**
  - Delivery Style: ${scene.acting_notes.vocal_delivery}
  - Emphasis & Pauses: ${scene.acting_notes.emphasis_and_pauses}
  - Pacing Strategy: ${scene.directing_notes.pacing_strategy}

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
        { inlineData: { mimeType: outframeImage.type, data: outframeB64 } },
        ...contextImagesData.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } }))
      ]
    }],
    config: { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
  });

  return response.text || '';
};
