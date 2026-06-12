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

async function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const loadPromises = Object.keys(soundFiles).map(async (key) => {
        try {
            const response = await fetch(soundFiles[key]);
            const arrayBuffer = await response.arrayBuffer();
            audioBuffers[key] = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error("Fallo al cargar audio en: " + soundFiles[key], error);
        }
    });

    await Promise.all(loadPromises);
    
    const statusDiv = document.getElementById("loadingStatus");
    statusDiv.textContent = "¡Muestras de audio listas!";
    statusDiv.style.color = "#00ff88";
    document.getElementById("start").disabled = false;
}

function playSound(type, mode) {
    if (!audioCtx) return;
    const bufferKey = `${mode}_${type}`;
    const buffer = audioBuffers[bufferKey];
    
    if (buffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(audioCtx.currentTime);
    }
}

window.addEventListener('DOMContentLoaded', initAudio);
