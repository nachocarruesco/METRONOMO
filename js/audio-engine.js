//js/audio-engine.js
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
    if (audioInitialized) return;
    
    const statusDiv = document.getElementById("loadingStatus");
    
    try {
        // Crear contexto de audio
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Cargar todas las muestras de audio
        const loadPromises = Object.keys(soundFiles).map(async (key) => {
            try {
                const response = await fetch(soundFiles[key]);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                audioBuffers[key] = await audioCtx.decodeAudioData(arrayBuffer);
                return true;
            } catch (error) {
                console.error("Fallo al cargar audio en: " + soundFiles[key], error);
                // Crear un sonido sintético como fallback
                audioBuffers[key] = null;
                return false;
            }
        });
        
        await Promise.all(loadPromises);
        
        // Suspendemos el contexto inicialmente (necesario para iOS)
        await audioCtx.suspend();
        
        statusDiv.textContent = "¡Muestras de audio listas!";
        statusDiv.style.color = "#00ff88";
        document.getElementById("start").disabled = false;
        audioInitialized = true;
        
        return true;
    } catch (error) {
        console.error("Error inicializando audio:", error);
        statusDiv.textContent = "Error cargando audio. Usando sonidos sintéticos.";
        statusDiv.style.color = "#ffaa00";
        document.getElementById("start").disabled = false;
        // Continuar sin muestras de audio (usar síntesis)
        audioInitialized = true;
        return false;
    }
}

function playSound(type, mode) {
    if (!audioCtx) return;
    
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
            playSyntheticSound(type, mode); // Fallback a síntesis
        }
    } else {
        playSyntheticSound(type, mode); // Fallback a síntesis
    }
}

// Sonidos sintéticos de respaldo (en caso de que fallen los WAV)
function playSyntheticSound(type, mode) {
    if (!audioCtx) return;
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (mode === "cajon") {
        if (type === "grave") {
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(400, now);
            osc.type = "sine";
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(65, now + 0.2);
            gain.gain.setValueAtTime(0.85, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        } else if (type === "agudo") {
            filter.type = "highpass";
            filter.frequency.setValueAtTime(800, now);
            osc.type = "square";
            osc.frequency.setValueAtTime(450, now);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        } else if (type === "click") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(800, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        }
    } else if (mode === "palmas") {
        if (type === "grave") {
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(500, now);
            osc.type = "triangle";
            osc.frequency.setValueAtTime(200, now);
            gain.gain.setValueAtTime(0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        } else if (type === "agudo") {
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(1200, now);
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(700, now);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        } else if (type === "click") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(1200, now);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        }
    }
    
    osc.start(now);
    osc.stop(now + 0.25);
}

// Exponer funciones globalmente
window.initAudio = initAudio;
window.audioCtx = () => audioCtx;
