import React, { useState, useRef, useEffect } from 'react';
import { 
  architectScript,
  engineerScenePrompt, 
  generateSceneFrame,
  setApiKey
} from './services/geminiService';
import { AppState, EngineeredScene, ScriptScene } from './types';

export default function App() {
  const [state, setState] = useState<AppState>({
    step: 'upload',
    targetCharacter: null,
    contextImages: [],
    newScript: '',
    scriptSegmentation: null,
    selectedSceneIndex: null,
    sceneProcessing: 'idle',
    sceneProcessingStatus: '',
    currentPrompt: null,
    completedScenes: [],
    inframeImage: null,
    outframeImage: null,
    useCustomInframe: false,
    useCustomOutframe: false,
    showOptimizationModal: false,
    optimizationInframe: null,
    optimizationOutframe: null,
    isOptimizing: false,
    error: null,
    processingStatus: ''
  });

  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isKeySet, setIsKeySet] = useState<boolean>(false);
  const targetCharInputRef = useRef<HTMLInputElement>(null);
  const contextImagesInputRef = useRef<HTMLInputElement>(null);
  const inframeRef = useRef<HTMLInputElement>(null);
  const outframeRef = useRef<HTMLInputElement>(null);
  const customInframeRef = useRef<HTMLInputElement>(null);
  const customOutframeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setApiKeyState(storedKey);
      setIsKeySet(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (!apiKey.trim()) return;
    setApiKey(apiKey);
    localStorage.setItem('gemini_api_key', apiKey);
    setIsKeySet(true);
  };

  const handleError = (err: any) => {
    setState(s => ({
      ...s,
      error: err.message || 'An error occurred',
      processingStatus: '',
      sceneProcessing: (s.sceneProcessing === 'engineering') ? 'idle' : s.sceneProcessing,
      isOptimizing: false
    }));
  };

  const handleBeginAnalysis = async () => {
    if (!state.targetCharacter || !state.newScript.trim()) return;
    try {
      setState(s => ({ ...s, step: 'architecting', processingStatus: 'Deploying Director & Acting Agents...' }));
      const segmentation = await architectScript(state.newScript);

      setState(s => ({ ...s, step: 'scenes', scriptSegmentation: segmentation }));
    } catch (err) {
      handleError(err);
      setState(s => ({ ...s, step: 'upload' }));
    }
  };

  const selectScene = async (index: number) => {
    if (!state.scriptSegmentation) return;
    const scene = state.scriptSegmentation.scenes[index];
    const existing = state.completedScenes.find(c => c.scene_number === scene.scene_number);

    setState(s => ({
      ...s,
      selectedSceneIndex: index,
      inframeImage: null,
      outframeImage: null,
      useCustomInframe: false,
      useCustomOutframe: false,
      currentPrompt: existing ? existing.veo_prompt : null,
      sceneProcessing: existing ? 'complete' : 'idle',
      error: null
    }));

    // Auto-generate frames using Scene Prompts
    try {
      setState(s => ({ ...s, sceneProcessing: 'engineering', sceneProcessingStatus: 'Generating Cinematic Frames...' }));
      const [inBlob, outBlob] = await Promise.all([
        generateSceneFrame(scene.frame_descriptions.inframe_prompt, state.targetCharacter!, state.contextImages),
        generateSceneFrame(scene.frame_descriptions.outframe_prompt, state.targetCharacter!, state.contextImages)
      ]);

      const inFile = new File([inBlob], `inframe-scene-${scene.scene_number}.jpg`, { type: 'image/jpeg' });
      const outFile = new File([outBlob], `outframe-scene-${scene.scene_number}.jpg`, { type: 'image/jpeg' });

      setState(s => ({
        ...s,
        inframeImage: inFile,
        outframeImage: outFile,
        sceneProcessing: existing ? 'complete' : 'idle',
        sceneProcessingStatus: ''
      }));
    } catch {
      // Frame extraction failed — user can upload manually
      setState(s => ({ 
        ...s, 
        error: 'Auto frame generation failed. Please upload frames manually.',
        sceneProcessing: existing ? 'complete' : 'idle',
        sceneProcessingStatus: ''
      }));
    }
  };

  const handleEngineerScene = async () => {
    if (state.selectedSceneIndex === null || !state.scriptSegmentation) return;
    if (!state.inframeImage || !state.outframeImage) return;

    const scene = state.scriptSegmentation.scenes[state.selectedSceneIndex];

    try {
      setState(s => ({ ...s, sceneProcessing: 'engineering', sceneProcessingStatus: 'Engineering Elite VEO 3.1 Prompt...' }));

      const prompt = await engineerScenePrompt(
        scene,
        state.inframeImage,
        state.outframeImage,
        state.targetCharacter!,
        state.completedScenes,
        state.contextImages
      );

      const newEngineered: EngineeredScene = {
        scene_number: scene.scene_number,
        scene_title: scene.title,
        role: scene.role,
        duration_seconds: scene.duration_seconds,
        veo_prompt: prompt,
        timestamp: new Date().toISOString(),
        inframe_source: state.useCustomInframe ? 'custom' : 'auto',
        outframe_source: state.useCustomOutframe ? 'custom' : 'auto'
      };

      setState(s => ({
        ...s,
        sceneProcessing: 'complete',
        currentPrompt: prompt,
        completedScenes: [...s.completedScenes.filter(c => c.scene_number !== scene.scene_number), newEngineered]
      }));
    } catch (err) {
      handleError(err);
    }
  };

  const handleMergeNextScene = () => {
    if (state.selectedSceneIndex === null || !state.scriptSegmentation) return;
    const index = state.selectedSceneIndex;
    const scenes = [...state.scriptSegmentation.scenes];
    if (index >= scenes.length - 1) return;

    const current = scenes[index];
    const next = scenes[index + 1];

    const mergedScene: ScriptScene = {
      ...current,
      title: `${current.title} & ${next.title}`,
      duration_seconds: current.duration_seconds + next.duration_seconds,
      script_text: `${current.script_text} ${next.script_text}`,
      acting_blueprint: {
        ...current.acting_blueprint,
        intention: `${current.acting_blueprint.intention} -> ${next.acting_blueprint.intention}`,
        subtext: `${current.acting_blueprint.subtext} -> ${next.acting_blueprint.subtext}`,
        mapped_gestures: Array.from(new Set([...current.acting_blueprint.mapped_gestures, ...next.acting_blueprint.mapped_gestures])),
        mapped_mannerisms: Array.from(new Set([...current.acting_blueprint.mapped_mannerisms, ...next.acting_blueprint.mapped_mannerisms])),
        pause_map: [...current.acting_blueprint.pause_map, ...next.acting_blueprint.pause_map],
        emphasis_words: [...current.acting_blueprint.emphasis_words, ...next.acting_blueprint.emphasis_words],
      },
      recommended_outframe: next.recommended_outframe,
      continuity: {
        enters_from: current.continuity.enters_from,
        exits_to: next.continuity.exits_to
      }
    };

    scenes.splice(index, 2, mergedScene);
    
    for (let i = index + 1; i < scenes.length; i++) {
        scenes[i].scene_number = i + 1;
    }

    const newCompletedScenes = state.completedScenes.filter(
      c => c.scene_number !== current.scene_number && c.scene_number !== next.scene_number
    ).map(c => {
      if (c.scene_number > next.scene_number) {
        return { ...c, scene_number: c.scene_number - 1 };
      }
      return c;
    });

    setState(s => ({
      ...s,
      scriptSegmentation: {
        ...s.scriptSegmentation!,
        scenes,
        total_scenes: scenes.length
      },
      completedScenes: newCompletedScenes,
      selectedSceneIndex: null,
      sceneProcessing: 'idle',
      currentPrompt: null
    }));
  };

  const copyPrompt = () => {
    if (state.currentPrompt) {
      navigator.clipboard.writeText(state.currentPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'Hook': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Pattern Interrupt': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'Value Delivery': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Social Proof': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'Bridge': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      'Call to Action': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Storytelling': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Demonstration': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'Objection Handler': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      'Open Loop': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Closing': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    };
    return colors[role] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  if (!isKeySet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900/50 p-8 rounded-2xl border border-white/10">
          <h2 className="text-3xl font-serif italic text-gold">Enter Gemini API Key</h2>
          <p className="text-slate-400 text-sm">
            To use the Elite VEO 3.1 & Nano Banana Pro models, please provide your external Google Gemini API Key.
          </p>
          <div className="space-y-4">
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              placeholder="Paste your AIza... API Key here"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:border-gold/50 focus:outline-none font-mono text-sm"
            />
            <button 
              onClick={handleSaveKey}
              disabled={!apiKey.trim()}
              className="w-full py-3 bg-gold text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(202,138,4,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Authenticate & Start
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Your key is stored locally in your browser.
            <br/>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-slate-300 mt-2 inline-block">
              Get an API Key
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-gold/30 relative">
      {state.error && (
        <div className="bg-red-900/90 text-white p-3 text-center flex justify-between items-center px-6 fixed top-0 w-full z-50 backdrop-blur-md border-b border-red-700/50">
          <span>{state.error}</span>
          <button onClick={() => setState(s => ({ ...s, error: null }))} className="text-xl font-bold hover:text-red-200 transition-colors">&times;</button>
        </div>
      )}

      {/* VIEW 1: UPLOAD */}
      {state.step === 'upload' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617] overflow-y-auto">
          <div className="max-w-3xl w-full space-y-8 animate-in fade-in zoom-in duration-700 py-12">
            <div className="text-center space-y-2">
              <h1 className="font-serif italic text-6xl text-white text-glow">Elite VEO 3.1 Scene Director</h1>
              <p className="uppercase tracking-widest text-slate-500 text-sm font-semibold">Your script. Their presence.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Target Character Upload */}
              <div 
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer relative group ${state.targetCharacter ? 'border-gold/50 bg-gold/5' : 'border-slate-700 hover:border-gold/30 hover:bg-slate-900/50'}`} 
                onClick={() => targetCharInputRef.current?.click()}
              >
                <input type="file" ref={targetCharInputRef} className="hidden" accept="image/*" onChange={e => setState(s => ({ ...s, targetCharacter: e.target.files?.[0] || null }))} />
                <div className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${state.targetCharacter ? 'text-gold' : 'text-slate-600 group-hover:text-gold/60'}`}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                {state.targetCharacter ? (
                  <div>
                      <p className="text-white text-lg font-medium">{state.targetCharacter.name}</p>
                      <p className="text-xs text-gold uppercase mt-1">Target Character Loaded</p>
                  </div>
                ) : (
                  <div>
                      <p className="text-slate-300 group-hover:text-white transition-colors font-medium">Upload Target Character</p>
                      <p className="text-slate-500 text-sm mt-1">The face/look you want in the final video</p>
                  </div>
                )}
              </div>
            </div>

            {/* Context Images Upload */}
            <div
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer relative group ${state.contextImages.length > 0 ? 'border-gold/50 bg-gold/5' : 'border-slate-700 hover:border-gold/30 hover:bg-slate-900/50'}`}
              onClick={() => contextImagesInputRef.current?.click()}
            >
              <input
                type="file"
                ref={contextImagesInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={e => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files).slice(0, 5); // Max 5
                    setState(s => ({ ...s, contextImages: files }));
                  }
                }}
              />
              <div className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${state.contextImages.length > 0 ? 'text-gold' : 'text-slate-600 group-hover:text-gold/60'}`}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              {state.contextImages.length > 0 ? (
                <div>
                    <p className="text-white text-lg font-medium">{state.contextImages.length} Image(s) Selected</p>
                    <p className="text-xs text-gold uppercase mt-1">Context Loaded</p>
                </div>
              ) : (
                <div>
                    <p className="text-slate-300 group-hover:text-white transition-colors font-medium">Upload Context Images (Optional)</p>
                    <p className="text-slate-500 text-sm mt-1">Up to 5 images for environment & wardrobe references</p>
                </div>
              )}
            </div>

            {/* Script Textarea */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-gold/20 to-slate-800/50 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <textarea
                    value={state.newScript}
                    onChange={(e) => setState(s => ({ ...s, newScript: e.target.value }))}
                    placeholder="Paste your new video script here..."
                    className="relative w-full bg-[#0a0f1e] text-slate-300 p-6 rounded-xl border border-white/10 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none min-h-[200px] font-mono text-sm leading-relaxed resize-y placeholder:text-slate-600"
                />
                <div className="absolute bottom-4 right-4 text-xs text-slate-600 font-mono pointer-events-none">
                    {state.newScript.length} chars
                </div>
            </div>

            <button 
              disabled={!state.targetCharacter || !state.newScript.trim()}
              onClick={handleBeginAnalysis} 
              className="w-full py-4 bg-white text-black text-xl font-serif italic rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transform hover:scale-[1.01]"
            >
              Deploy Elite Directing & Acting Agents
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: LOADING (ARCHITECTING) */}
      {state.step === 'architecting' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 bg-[#020617]">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-t-gold/40 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_1.5s_linear_reverse]"></div>
          </div>
          <div className="text-center space-y-4">
            <h2 className="font-serif italic text-4xl text-white animate-pulse">
                Architecting Scene Sequence
            </h2>
            <p className="text-gold/60 tracking-wider text-sm font-mono uppercase">{state.processingStatus}</p>
          </div>
        </div>
      )}

      {/* VIEW 3: SCENES */}
      {state.step === 'scenes' && state.scriptSegmentation && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#020617]">
          {/* HEADER */}
          <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0 bg-slate-950/80 backdrop-blur-md z-20">
            <div className="flex items-center space-x-4">
              <h1 className="font-serif italic text-2xl text-white text-glow">AL-NOKHBA</h1>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 text-sm tracking-widest uppercase">Script Director V3.0</span>
            </div>
            <div className="flex items-center space-x-6">
               <div className="flex items-center space-x-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                  <span className="text-slate-400">Agents Deployed</span>
               </div>
              <span className="text-slate-400 text-sm font-mono">{state.completedScenes.length} / {state.scriptSegmentation.scenes.length} scenes</span>
              <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gold shadow-[0_0_10px_rgba(202,138,4,0.5)] transition-all duration-500 ease-out" style={{ width: `${(state.completedScenes.length / state.scriptSegmentation.scenes.length) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* SIDEBAR */}
            <div className="w-[420px] border-r border-white/5 overflow-y-auto bg-slate-950/50 p-4 space-y-3 shrink-0 custom-scrollbar">
              {state.scriptSegmentation.scenes.map((scene, idx) => {
                const isSelected = state.selectedSceneIndex === idx;
                const isDone = state.completedScenes.some(c => c.scene_number === scene.scene_number);
                const doneScene = state.completedScenes.find(c => c.scene_number === scene.scene_number);
                
                return (
                  <button 
                    key={idx} 
                    onClick={() => selectScene(idx)} 
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${isSelected ? 'border-gold/40 bg-gold/5 shadow-[inset_0_0_20px_rgba(202,138,4,0.05)]' : 'border-white/5 hover:border-white/20 bg-slate-950/40 hover:bg-slate-900'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono text-sm font-semibold ${isSelected ? 'text-gold' : 'text-slate-500'}`}>#{scene.scene_number}</span>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRoleColor(scene.role)}`}>{scene.role}</span>
                      </div>
                      {isDone && <span className="text-emerald-500 text-sm drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">✓</span>}
                    </div>
                    <h3 className={`font-serif italic text-xl mb-2 transition-colors ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{scene.title}</h3>
                    <p className="text-xs text-slate-500 mb-3 font-mono truncate opacity-60">"{scene.script_text.substring(0, 50)}..."</p>
                    
                    <div className="flex justify-between items-center text-xs text-slate-500 font-mono mb-2">
                      <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded font-bold ${scene.duration_seconds > 8 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'}`}>⏱ {scene.duration_seconds}s</span>
                         <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden" title={`Energy: ${scene.energy_level}/10`}>
                            <div className="h-full bg-slate-500" style={{width: `${scene.energy_level * 10}%`}}></div>
                         </div>
                      </div>
                      {isDone && (
                        <span className="text-[10px] text-slate-600 uppercase tracking-tight">
                            {doneScene?.inframe_source === 'auto' ? '🖼 Auto Frames' : '🖼 Custom Frames'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 overflow-y-auto p-8 relative custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/20 via-transparent to-transparent">
              {state.selectedSceneIndex === null ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none">
                  <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center mb-6 bg-white/5">
                    <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                  </div>
                  <p className="text-xl font-serif italic opacity-60">Select a scene to begin production</p>
                </div>
              ) : (
                <div className="max-w-5xl mx-auto space-y-8 pb-20">
                  {/* Scene Header */}
                  <div className="flex items-end justify-between border-b border-white/10 pb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border ${getRoleColor(state.scriptSegmentation.scenes[state.selectedSceneIndex].role)}`}>
                        {state.scriptSegmentation.scenes[state.selectedSceneIndex].role}
                      </span>
                      <h2 className="font-serif italic text-5xl text-white leading-tight">
                        {state.scriptSegmentation.scenes[state.selectedSceneIndex].title}
                      </h2>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="font-mono text-gold text-3xl">#{state.scriptSegmentation.scenes[state.selectedSceneIndex].scene_number}</p>
                      <p className={`font-mono mt-2 text-sm font-medium ${state.scriptSegmentation.scenes[state.selectedSceneIndex].duration_seconds > 8 ? 'text-red-400' : 'text-slate-400'}`}>
                        {state.scriptSegmentation.scenes[state.selectedSceneIndex].duration_seconds}s Duration
                      </p>
                      {state.selectedSceneIndex < state.scriptSegmentation.scenes.length - 1 && (
                        <button 
                          onClick={handleMergeNextScene}
                          className="mt-4 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-white/10 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                          Merge Next Scene
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CONTENT AREA */}
                  {state.sceneProcessing === 'idle' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      
                      {/* Section A: Script & Agent Notes */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="bg-black/40 border border-white/5 p-8 rounded-2xl relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30"></div>
                             <h4 className="text-blue-400 text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                Directing Agent
                             </h4>
                             <div className="space-y-4 text-sm">
                                <div><span className="text-slate-500 block text-xs uppercase">Framing & Angle</span><span className="text-slate-300">{state.scriptSegmentation.scenes[state.selectedSceneIndex].directing_notes.framing} / {state.scriptSegmentation.scenes[state.selectedSceneIndex].directing_notes.camera_angle}</span></div>
                                <div><span className="text-slate-500 block text-xs uppercase">Lighting Mood</span><span className="text-slate-300">{state.scriptSegmentation.scenes[state.selectedSceneIndex].directing_notes.lighting_mood}</span></div>
                                <div><span className="text-slate-500 block text-xs uppercase">Pacing Strategy</span><span className="text-slate-300">{state.scriptSegmentation.scenes[state.selectedSceneIndex].directing_notes.pacing_strategy}</span></div>
                                <div><span className="text-slate-500 block text-xs uppercase">Visual Business</span><span className="text-slate-300">{state.scriptSegmentation.scenes[state.selectedSceneIndex].directing_notes.visual_business}</span></div>
                             </div>
                          </div>

                          <div className="bg-black/40 border border-white/5 p-8 rounded-2xl relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/30"></div>
                             <h4 className="text-rose-400 text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Acting Agent
                             </h4>
                             <div className="space-y-4 text-sm">
                                <div><span className="text-slate-500 block text-xs uppercase">Intention</span><span className="text-slate-300">{state.scriptSegmentation.scenes[state.selectedSceneIndex].acting_notes.intention}</span></div>
                                <div><span className="text-slate-500 block text-xs uppercase">Vocal Delivery</span><span className="text-slate-300">{state.scriptSegmentation.scenes[state.selectedSceneIndex].acting_notes.vocal_delivery}</span></div>
                                <div><span className="text-slate-500 block text-xs uppercase">Posture & Body</span><span className="text-slate-300">{state.scriptSegmentation.scenes[state.selectedSceneIndex].acting_notes.posture_and_body}</span></div>
                                <div><span className="text-slate-500 block text-xs uppercase">Micro-Expressions</span><span className="text-slate-300">{state.scriptSegmentation.scenes[state.selectedSceneIndex].acting_notes.micro_expressions}</span></div>
                             </div>
                          </div>
                          
                          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-gold/30"></div>
                              <h4 className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-4">Script Segment</h4>
                              <p className="font-serif italic text-2xl text-white/90 leading-relaxed">
                                "{state.scriptSegmentation.scenes[state.selectedSceneIndex].script_text}"
                              </p>
                              <div className="mt-4 pt-4 border-t border-white/5">
                                 <span className="text-slate-500 block text-xs uppercase mb-1">Subtext (The Secret)</span>
                                 <span className="text-gold/80 italic text-sm">"{state.scriptSegmentation.scenes[state.selectedSceneIndex].acting_notes.subtext}"</span>
                              </div>
                          </div>
                      </div>

                      {/* Section B: Frame Selection Panel */}
                      <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-8">
                         <div className="flex justify-between items-center mb-6">
                            <h4 className="text-slate-500 text-xs font-bold tracking-widest uppercase">Reference Frames</h4>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-8">
                            {/* IN-FRAME */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span className="uppercase tracking-widest font-bold">In-Frame Gen</span>
                                </div>
                                <div className="aspect-video bg-black rounded-lg border border-white/10 overflow-hidden relative group">
                                    {state.inframeImage ? (
                                        <img src={URL.createObjectURL(state.inframeImage)} alt="In-frame" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">Loading Frame...</div>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed min-h-[40px]">
                                    {state.scriptSegmentation.scenes[state.selectedSceneIndex].frame_descriptions.inframe_prompt}
                                </p>
                                <div className="flex gap-4">
                                  {state.inframeImage && (
                                    <a 
                                      href={URL.createObjectURL(state.inframeImage)} 
                                      download={`inframe-scene-${state.scriptSegmentation.scenes[state.selectedSceneIndex].scene_number}.jpg`}
                                      className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                      Download Frame
                                    </a>
                                  )}
                                </div>
                            </div>

                            {/* OUT-FRAME */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span className="uppercase tracking-widest font-bold">Out-Frame Gen</span>
                                </div>
                                <div className="aspect-video bg-black rounded-lg border border-white/10 overflow-hidden relative group">
                                    {state.outframeImage ? (
                                        <img src={URL.createObjectURL(state.outframeImage)} alt="Out-frame" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">Loading Frame...</div>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed min-h-[40px]">
                                    {state.scriptSegmentation.scenes[state.selectedSceneIndex].frame_descriptions.outframe_prompt}
                                </p>
                                <div className="flex gap-4">
                                  {state.outframeImage && (
                                    <a 
                                      href={URL.createObjectURL(state.outframeImage)} 
                                      download={`outframe-scene-${state.scriptSegmentation.scenes[state.selectedSceneIndex].scene_number}.jpg`}
                                      className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                      Download Frame
                                    </a>
                                  )}
                                </div>
                            </div>
                         </div>
                      </div>

                      {/* Section C: Engineer Button */}
                      <button 
                        disabled={!state.inframeImage || !state.outframeImage} 
                        onClick={handleEngineerScene} 
                        className="w-full py-5 bg-white text-black text-xl font-serif italic rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                      >
                        Engineer Elite VEO 3.1 Prompt
                      </button>
                    </div>
                  )}

                  {state.sceneProcessing === 'engineering' && (
                    <div className="py-32 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
                      <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-3 border-4 border-t-gold/30 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_2s_linear_reverse]"></div>
                      </div>
                      <div className="text-center space-y-3">
                        <h3 className="font-serif italic text-3xl text-white animate-pulse">
                          Engineering VEO Prompt
                        </h3>
                        <p className="text-gold/60 font-mono text-sm tracking-wider uppercase">{state.sceneProcessingStatus}</p>
                      </div>
                    </div>
                  )}

                  {/* Section D: Result */}
                  {state.sceneProcessing === 'complete' && state.currentPrompt && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
                      <div className="flex items-center justify-between bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl">
                        <div className="flex items-center space-x-3 text-emerald-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
                          <span className="font-semibold tracking-wide uppercase text-sm">VEO 3.1 Prompt Ready</span>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={copyPrompt} 
                            className={`px-8 py-2.5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 ${copied ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-gold hover:bg-gold/90 text-black shadow-[0_0_15px_rgba(202,138,4,0.3)]'}`}
                          >
                            {copied ? 'COPIED' : 'COPY PROMPT'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-black/80 border border-white/10 rounded-2xl p-10 max-h-[600px] overflow-y-auto relative group custom-scrollbar shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-50"></div>
                        <p className="font-serif text-lg text-slate-200 leading-[2.0] whitespace-pre-wrap selection:bg-gold/30 font-light">
                          {state.currentPrompt}
                        </p>
                      </div>

                      <div className="flex space-x-4">
                        <button 
                          onClick={() => setState(s => ({ ...s, sceneProcessing: 'idle', currentPrompt: null }))} 
                          className="flex-1 py-4 border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 hover:text-white transition-all font-medium"
                        >
                          Re-Engineer Scene
                        </button>
                        <button 
                          onClick={() => { 
                            if (!state.scriptSegmentation) return;
                            const nextIdx = state.scriptSegmentation.scenes.findIndex((s, i) => i > (state.selectedSceneIndex || 0)); 
                            if (nextIdx !== -1) selectScene(nextIdx); 
                          }} 
                          className="flex-1 py-4 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] font-serif italic text-xl"
                        >
                          Proceed to Next Scene &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}