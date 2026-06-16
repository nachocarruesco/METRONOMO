//js/audio-engine.js - Versión con archivos WAV reales (con auto-inicio)

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
    
    if (audioInitialized) return true;
    
    try {
        // Crear contexto de audio
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Suspendemos inicialmente (necesario para iOS)
        await audioCtx.suspend();
        
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
            // Habilitar el botón de inicio
            const startBtn = document.getElementById("start");
            if (startBtn) startBtn.disabled = false;
            audioInitialized = true;
            return true;
        } else {
            statusDiv.textContent = "⚠️ No se pudieron cargar los audios. Verifica la carpeta 'audio/'";
            statusDiv.style.color = "#ffaa00";
            // Habilitar el botón igualmente (usará sonidos sintéticos)
            const startBtn = document.getElementById("start");
            if (startBtn) startBtn.disabled = false;
            return false;
        }
    } catch (error) {
        console.error("Error inicializando audio:", error);
        statusDiv.textContent = "❌ Error de audio. Usando sonidos sintéticos.";
        statusDiv.style.color = "#ffaa00";
        const startBtn = document.getElementById("start");
        if (startBtn) startBtn.disabled = false;
        return false;
    }
}

function playSound(type, mode) {
    if (!audioCtx) return;
    
    // Si el contexto está suspendido, no reproducir (se reanudará al hacer clic)
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

// Sonido sintético de respaldo (en caso de que falte algún archivo)
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

// Función para reanudar audio (se llama al hacer clic en Start)
async function resumeAudioContext() {
    if (audioCtx && audioCtx.state === "suspended") {
        await audioCtx.resume();
        console.log("✅ Audio context reanudado");
        return true;
    }
    return false;
}

// Exponer funciones globalmente
window.initAudio = initAudio;
window.resumeAudioContext = resumeAudioContext;

// 🔥 INICIALIZACIÓN AUTOMÁTICA: Cargar los audios al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log("🔊 Iniciando carga de audios...");
    // Iniciar la carga de audios inmediatamente
    initAudio().then(success => {
        if (success) {
            console.log("✅ Audios cargados correctamente");
        } else {
            console.log("⚠️ Algunos audios no se cargaron, usando síntesis");
        }
    });
});
