import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sparkles, Music, Activity, AlertCircle } from 'lucide-react';

// --- 配置常量 ---
// const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; // 替换为你的 API Key
const GEMINI_API_KEY = ""; // 替换为你的 API Key
const GAME_ITEMS = ['🍬', '⭐', '🚀', '💎', '🔥', '🤖'];
const NEON_COLORS = ['#0ff', '#f0f', '#ff0', '#0f0'];

// --- 类型定义 ---
type GameItem = { id: number; x: number; y: number; emoji: string; size: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const NeonPulseApp = () => {
  // --- Refs & State ---
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // 游戏状态 (使用 Ref 避免重渲染)
  const gameState = useRef({
    items: [] as GameItem[],
    particles: [] as Particle[],
    nosePos: { x: 0, y: 0 },
    beatScale: 1,
    lastGeminiCall: 0,
    score: 0,
    isPlaying: false
  });

  // UI 状态
  const [score, setScore] = useState(0);
  const [aiComment, setAiComment] = useState("准备好开始了吗？");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<string | null>(null);

  // --- Gemini AI 集成 ---
  const fetchAIComment = async (currentScore: number) => {
    if (!GEMINI_API_KEY) return;
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `User is playing a motion game. Score: ${currentScore}. 
      Give a VERY short (max 6 words), energetic, cyberpunk-style compliment in Chinese.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiComment(response.text());
    } catch (err) {
      console.error("AI Error:", err);
    }
  };

  // --- 游戏逻辑核心 ---
  const spawnItem = (width: number, height: number) => {
    if (gameState.current.items.length < 5 && Math.random() < 0.02) {
      gameState.current.items.push({
        id: Date.now() + Math.random(),
        x: Math.random() * width,
        y: Math.random() * height,
        emoji: GAME_ITEMS[Math.floor(Math.random() * GAME_ITEMS.length)],
        size: 40 + Math.random() * 20
      });
    }
  };

  const createExplosion = (x: number, y: number) => {
    for (let i = 0; i < 15; i++) {
      gameState.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)]
      });
    }
  };

  const checkCollision = (width: number, height: number) => {
    const nose = gameState.current.nosePos;
    // 转换归一化坐标到像素坐标
    const noseX = (1 - nose.x) * width; // 镜像处理
    const noseY = nose.y * height;

    gameState.current.items = gameState.current.items.filter(item => {
      const dist = Math.hypot(noseX - item.x, noseY - item.y);
      if (dist < item.size) {
        // 碰撞发生！
        createExplosion(item.x, item.y);
        gameState.current.score += 10;
        setScore(gameState.current.score);
        
        // 触发 AI (每50分)
        if (gameState.current.score > 0 && gameState.current.score % 50 === 0) {
          fetchAIComment(gameState.current.score);
        }
        return false; // 移除物品
      }
      return true;
    });
  };

  // --- MediaPipe 绘制与处理 ---
  const onResults = useCallback((results: any) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. 清除画布
    ctx.clearRect(0, 0, width, height);

    // 2. 音频分析
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
      gameState.current.beatScale = 1 + (avg / 256); // 1.0 ~ 2.0
    }

    // 3. 绘制骨架 (Neon Style)
    if (results.poseLandmarks) {
      // 更新鼻尖位置 (Landmark 0)
      gameState.current.nosePos = results.poseLandmarks[0];

      // 绘制连接线
      const lineWidth = 4 * gameState.current.beatScale;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      
      // 遍历连接并绘制
      POSE_CONNECTIONS.forEach(([start, end]) => {
        const p1 = results.poseLandmarks[start];
        const p2 = results.poseLandmarks[end];
        
        // 简单的彩虹渐变逻辑
        const gradient = ctx.createLinearGradient(
          (1 - p1.x) * width, p1.y * height, 
          (1 - p2.x) * width, p2.y * height
        );
        gradient.addColorStop(0, '#00f2ff'); // Cyan
        gradient.addColorStop(1, '#ff00ff'); // Magenta
        
        ctx.strokeStyle = gradient;
        ctx.shadowBlur = 15 * gameState.current.beatScale;
        ctx.shadowColor = '#00f2ff';
        
        ctx.beginPath();
        ctx.moveTo((1 - p1.x) * width, p1.y * height); // 镜像X
        ctx.lineTo((1 - p2.x) * width, p2.y * height);
        ctx.stroke();
      });
    }

    if (!gameState.current.isPlaying) return;

    // 4. 游戏逻辑更新
    spawnItem(width, height);
    checkCollision(width, height);

    // 5. 绘制物品
    ctx.shadowBlur = 0;
    gameState.current.items.forEach(item => {
      ctx.font = `${item.size}px serif`;
      ctx.fillText(item.emoji, item.x - item.size/2, item.y + item.size/2);
    });

    // 6. 绘制粒子
    gameState.current.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      
      if (p.life > 0) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 * gameState.current.beatScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      } else {
        gameState.current.particles.splice(i, 1);
      }
    });
    
  }, []);

  // --- 初始化与副作用 ---
  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => {
        // 使用 CDN 加载模型文件
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onResults);

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video) {
            await pose.send({ image: webcamRef.current.video });
          }
        },
        width: 1280,
        height: 720
      });
      camera.start()
        .then(() => setLoading(false))
        .catch(err => setError("摄像头启动失败，请检查权限。"));
    }

    return () => {
      pose.close();
    };
  }, [onResults]);

  // --- 音频处理 ---
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(url);
    }
  };

  const toggleGame = async () => {
    // 初始化 AudioContext (必须由用户手势触发)
    if (!audioCtxRef.current && audioFile) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
      const audio = new Audio(audioFile);
      audio.loop = true;
      audio.play();

      const source = audioCtxRef.current.createMediaElementSource(audio);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    }
    
    gameState.current.isPlaying = !gameState.current.isPlaying;
    // 强制 UI 更新
    setScore(gameState.current.score); 
  };

  // --- 渲染 ---
  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-mono">
      {/* 1. Webcam (隐藏，作为源) */}
      <Webcam
        ref={webcamRef}
        className="absolute opacity-0"
        width={1280}
        height={720}
        mirrored
      />

      {/* 2. 游戏画布 */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1]" // CSS 镜像
      />

      {/* 3. 加载层 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-cyan-400 text-2xl animate-pulse">系统正在初始化视觉模块...</div>
        </div>
      )}

      {/* 4. Glassmorphism HUD (UI 层) */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-40">
        
        {/* 左侧：得分板 */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl shadow-[0_0_15px_rgba(0,242,255,0.3)]">
          <div className="text-sm text-gray-400 mb-1">CURRENT SCORE</div>
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
            {score.toString().padStart(4, '0')}
          </div>
        </div>

        {/* 中间：AI 评论 */}
        <div className="mt-4 flex flex-col items-center">
           <div className="backdrop-blur-lg bg-black/40 px-6 py-2 rounded-full border border-fuchsia-500/30 text-fuchsia-300 text-lg flex items-center gap-2 animate-bounce">
              <Sparkles size={20} />
              <span>AI: "{aiComment}"</span>
           </div>
        </div>

        {/* 右侧：控制面板 */}
        <div className="pointer-events-auto backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-4 w-64">
           
           <div className="flex items-center gap-2 text-cyan-400 mb-2">
             <Activity size={20} />
             <span className="font-bold">SYSTEM STATUS</span>
           </div>

           {/* 音频选择 */}
           <div className="relative">
             <input 
               type="file" 
               accept="audio/*" 
               onChange={handleAudioUpload}
               className="hidden" 
               id="audio-upload"
             />
             <label 
                htmlFor="audio-upload"
                className="flex items-center gap-2 cursor-pointer bg-white/10 hover:bg-white/20 p-2 rounded text-sm text-gray-200 transition"
             >
               <Music size={16} />
               {audioFile ? "已加载音频轨" : "上传背景音乐 (MP3)"}
             </label>
           </div>

           {/* 开始/暂停按钮 */}
           <button 
             onClick={toggleGame}
             disabled={!audioFile || loading}
             className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2 px-4 rounded shadow-[0_0_10px_rgba(0,255,255,0.5)] transition disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {gameState.current.isPlaying ? "PAUSE SIMULATION" : "INITIATE LINK"}
           </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-900/80 text-red-200 px-6 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle /> {error}
        </div>
      )}
      
      {/* 背景光晕装饰 */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-cyan-900/20 to-transparent mix-blend-screen" />
    </div>
  );
};

export default NeonPulseApp;