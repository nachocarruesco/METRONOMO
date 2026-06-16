//js/audio-engine.js - Sin inicialización automática

const soundFiles = {
    "cajon_grave": "audio/cajon_grave.wav",
    "cajon_agudo": "audio/cajon_agudo.wav",
    "cajon_click": "audio/cajon_click.wav",
    "palmas_grave": "audio/palmas_grave.wav",
    "palmas_agudo": "audio/palmas_agudo.wav",
    "palmas_click": "audio/palmas_click.wav"
};

let audioCtx = null;
const audioBuffers = {};
let audioInitialized = false;

async function initAudio() {
    const statusDiv = document.getElementById("loadingStatus");
    
    // Si ya está inicializado, solo reanudar si está suspendido
    if (audioInitialized) {
        if (audioCtx && audioCtx.state === "suspended") {
            await audioCtx.resume();
        }
        return true;
    }
    
    try {
        // 🔥 Crear el contexto de audio SOLO cuando se llama desde un gesto de usuario
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        statusDiv.textContent = "Cargando muestras de audio...";
        
        // Cargar todas las muestras de audio
        const loadPromises = Object.keys(soundFiles).map(async (key) => {
            try {
                const response = await fetch(soundFiles[key]);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${soundFiles[key]}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                audioBuffers[key] = await audioCtx.decodeAudioData(arrayBuffer);
                console.log(`✅ Cargado: ${soundFiles[key]}`);
                return true;
            } catch (error) {
                console.error(`❌ Error cargando ${soundFiles[key]}:`, error);
                audioBuffers[key] = null;
                return false;
            }
        });
        
        await Promise.all(loadPromises);
        
        // Verificar si al menos algunos archivos se cargaron
        const loadedCount = Object.values(audioBuffers).filter(b => b !== null).length;
        
        if (loadedCount > 0) {
            statusDiv.textContent = `✅ ${loadedCount}/6 muestras cargadas!`;
            statusDiv.style.color = "#00ff88";
            audioInitialized = true;
            
            // Reanudar el contexto (estamos en un gesto de usuario)
            if (audioCtx && audioCtx.state === "suspended") {
                await audioCtx.resume();
            }
            
            return true;
        } else {
            statusDiv.textContent = "⚠️ No se pudieron cargar los audios. Verifica la carpeta 'audio/'";
            statusDiv.style.color = "#ffaa00";
            return false;
        }
    } catch (error) {
        console.error("Error inicializando audio:", error);
        statusDiv.textContent = "❌ Error de audio. Usando sonidos sintéticos.";
        statusDiv.style.color = "#ffaa00";
        return false;
    }
}

function playSound(type, mode) {
    if (!audioCtx) return;
    
    // Si el contexto está suspendido, intentar reanudar
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
        return;
    }
    
    if (audioCtx.state !== "running") return;
    
    const bufferKey = `${mode}_${type}`;
    const buffer = audioBuffers[bufferKey];
    
    if (buffer) {
        try {
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.start(audioCtx.currentTime);
        } catch (e) {
            console.warn("Error reproduciendo audio:", e);
            playSyntheticFallback(type, mode);
        }
    } else {
        // Fallback a sonido sintético si el archivo no existe
        playSyntheticFallback(type, mode);
    }
}

// Sonido sintético de respaldo
function playSyntheticFallback(type, mode) {
    if (!audioCtx || audioCtx.state !== "running") return;
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = "sine";
    
    if (type === "grave") {
        osc.frequency.value = 100;
        gain.gain.value = 0.5;
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else if (type === "agudo") {
        osc.frequency.value = 600;
        gain.gain.value = 0.3;
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    } else {
        osc.frequency.value = 800;
        gain.gain.value = 0.2;
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    }
    
    osc.start(now);
    osc.stop(now + 0.2);
}

// 🔥 IMPORTANTE: Eliminar cualquier inicialización automática
// NO añadir: document.addEventListener('DOMContentLoaded', ...)

// Exponer funciones y variables globalmente
window.initAudio = initAudio;
window.audioCtx = audioCtx;
window.audioBuffers = audioBuffers;
window.audioInitialized = audioInitialized;
