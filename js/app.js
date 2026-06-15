//js/app.js

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const cx = canvas.width / 2;
const cy = canvas.height / 2;
const radius = 210;

let currentPreset = JSON.parse(JSON.stringify(presets["rumba"]));
let originalPreset = JSON.parse(JSON.stringify(presets["rumba"]));
let currentStep = 0;
let timer = null;
let pointCoordinates = [];

let currentLap = 1;
let lastStepWasZero = false;
let cierresActive = false;
let isCierreMode = false;

// Variable para controlar si el audio está inicializado
let isAudioInitialized = false;

function updateLapDisplay() {
    const lapDiv = document.getElementById("lapCounter");
    lapDiv.textContent = currentLap;
    lapDiv.style.color = (currentLap === 4 && cierresActive) ? "#ff4444" : "#00ff88";
}

function getCierreByTag(tagToFind) {
    for (let key in cierrePresets) {
        if (cierrePresets[key].tag === tagToFind) return cierrePresets[key];
    }
    return null;
}

function getSelectedCierre() {
    const selected = document.getElementById("cierreSelect").value;
    if (selected && cierrePresets[selected]) {
        return cierrePresets[selected];
    }
    for (let key in cierrePresets) {
        if (cierrePresets[key].tag === originalPreset.tag) {
            return cierrePresets[key];
        }
    }
    return null;
}

function updatePresetByLap() {
    if (!cierresActive) {
        if (isCierreMode) {
            currentPreset = JSON.parse(JSON.stringify(originalPreset));
            isCierreMode = false;
        }
    } else {
        if (currentLap === 4) {
            if (!isCierreMode) {
                const matchingCierre = getSelectedCierre();
                if (matchingCierre) {
                    currentPreset = JSON.parse(JSON.stringify(matchingCierre));
                    isCierreMode = true;
                }
            }
        } else {
            if (isCierreMode) {
                currentPreset = JSON.parse(JSON.stringify(originalPreset));
                isCierreMode = false;
            }
        }
    }
    if (currentStep >= currentPreset.subdivisions) currentStep = 0;
    draw();
}

function incrementLap() {
    currentLap = (currentLap === 4) ? 1 : currentLap + 1;
    updateLapDisplay();
    updatePresetByLap();
}

function getStepAngle(step, totalSubs) {
    return -Math.PI / 2 + (step * 2 * Math.PI / totalSubs);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pointCoordinates = [];

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#aaa";
    ctx.font = currentPreset.subdivisions > 12 ? "bold 20px Arial" : "bold 26px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (currentPreset.labels) {
        currentPreset.labels.forEach(l => {
            const a = getStepAngle(l.step, currentPreset.subdivisions);
            const offset = currentPreset.subdivisions > 12 ? 35 : 40;
            const x = cx + Math.cos(a) * (radius + offset);
            const y = cy + Math.sin(a) * (radius + offset);
            ctx.fillStyle = (currentStep === l.step) ? "#00ff88" : "#fff";
            ctx.fillText(l.text, x, y);
        });
    }

    for (let i = 0; i < currentPreset.subdivisions; i++) {
        const a = getStepAngle(i, currentPreset.subdivisions);
        const x = cx + Math.cos(a) * radius;
        const y = cy + Math.sin(a) * radius;

        pointCoordinates.push({ x: x, y: y, step: i });
        const isActive = (i === currentStep);
        const mark = currentPreset.marks[i];

        ctx.strokeStyle = ctx.fillStyle = isActive ? "#ffcc00" : "#666";
        ctx.lineWidth = currentPreset.subdivisions > 12 ? 3 : 4;

        if (mark === "grave") {
            ctx.beginPath();
            ctx.arc(x, y, currentPreset.subdivisions > 12 ? 10 : 14, 0, Math.PI * 2);
            ctx.stroke();
        } else if (mark === "agudo") {
            const size = currentPreset.subdivisions > 12 ? 6 : 10;
            ctx.beginPath();
            ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size);
            ctx.moveTo(x + size, y - size); ctx.lineTo(x - size, y + size);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(x, y, currentPreset.subdivisions > 12 ? 5 : 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const needleAngle = getStepAngle(currentStep, currentPreset.subdivisions);
    const ax = cx + Math.cos(needleAngle) * (radius - 20);
    const ay = cy + Math.sin(needleAngle) * (radius - 20);

    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(ax, ay);
    ctx.strokeStyle = "#00ff88"; ctx.lineWidth = 4; ctx.stroke();

    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#00ff88"; ctx.fill();
}

// CORRECCIÓN DE BPM: El tiempo entre subdivisiones es (60/BPM) / (subdivisiones/4)
// Para 8 subdivisiones (corcheas) en un compás de 4/4: intervalo = 60/BPM segundos entre negras,
// pero como vamos subdivisión por subdivisión: tiempo entre subdivisiones = (60/BPM) / (subdivisiones/4)
function getIntervalMs() {
    const bpm = parseInt(document.getElementById("bpm").value) || 120;
    const beatsPerMeasure = 4; // Compás de 4/4
    const intervalSeconds = (60 / bpm) / (currentPreset.subdivisions / beatsPerMeasure);
    return intervalSeconds * 1000; // Convertir a milisegundos
}

function tick() {
    const soundMode = document.getElementById("soundMode").value;
    const metronomeCheck = document.getElementById("metronomeCheck").checked;
    const mark = currentPreset.marks[currentStep];
    const isStepZero = (currentStep === 0);
    
    if (mark) playSound(mark, soundMode);
    
    if (metronomeCheck) {
        if (currentPreset.subdivisions === 8 && (currentStep === 0 || currentStep === 4)) {
            playSound("click", soundMode);
        } else if (currentPreset.subdivisions === 24 && [0,6,12,18].includes(currentStep)) {
            playSound("click", soundMode);
        }
    }

    if (isStepZero && !lastStepWasZero && timer !== null) {
        incrementLap();
    }
    
    lastStepWasZero = isStepZero;
    draw();
    currentStep = (currentStep + 1) % currentPreset.subdivisions;
}

async function start() {
    if (timer) return;
    
    // Para iOS: asegurar que el audio está inicializado y el contexto está en estado 'running'
    if (!isAudioInitialized) {
        await initAudio();
    }
    
    if (audioCtx && audioCtx.state === "suspended") {
        await audioCtx.resume();
    }

    currentLap = 1;
    lastStepWasZero = false;
    updateLapDisplay();
    updatePresetByLap();
    currentStep = 0;
    
    // Usar la nueva función de intervalo corregido
    const intervalMs = getIntervalMs();
    
    draw(); // Dibujar el estado inicial
    tick(); // Ejecutar el primer tick inmediatamente
    timer = setInterval(tick, intervalMs);
}

function stop() {
    if (timer) { 
        clearInterval(timer); 
        timer = null; 
    }
    currentStep = 0;
    draw();
    document.getElementById("stop").blur();
}

// Función para manejar el audio en iOS - debe llamarse desde un gesto del usuario
async function initAudioForIOS() {
    if (audioCtx && audioCtx.state === "suspended") {
        await audioCtx.resume();
    }
}

// Detectar el primer toque en cualquier lugar de la pantalla para activar el audio en iOS
function setupIOSAudioActivation() {
    const resumeAudio = async () => {
        if (audioCtx && audioCtx.state === "suspended") {
            await audioCtx.resume();
        }
        // Remover los event listeners después de la primera activación
        document.body.removeEventListener('touchstart', resumeAudio);
        document.body.removeEventListener('click', resumeAudio);
    };
    
    document.body.addEventListener('touchstart', resumeAudio);
    document.body.addEventListener('click', resumeAudio);
}

// Función para actualizar el intervalo cuando cambia el BPM o el preset
function updateInterval() {
    if (timer) {
        stop();
        start();
    }
}

// Eventos del canvas con soporte táctil mejorado
canvas.addEventListener("click", canvasTapHandler);
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mouseX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
    handleCanvasTap(mouseX, mouseY);
});

function canvasTapHandler(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    handleCanvasTap(mouseX, mouseY);
}

function handleCanvasTap(mouseX, mouseY) {
    const clickedPoint = pointCoordinates.find(p => {
        const distance = Math.sqrt((mouseX - p.x)**2 + (mouseY - p.y)**2);
        return distance < 22;
    });

    if (clickedPoint !== undefined) {
        const step = clickedPoint.step;
        const currentMark = currentPreset.marks[step];

        if (!currentMark) currentPreset.marks[step] = "grave";
        else if (currentMark === "grave") currentPreset.marks[step] = "agudo";
        else delete currentPreset.marks[step];
        
        if (!isCierreMode) originalPreset = JSON.parse(JSON.stringify(currentPreset));
        draw();
    }
}

// Inicializar Selectores
function initializeSelectors() {
    const presetSelect = document.getElementById("presetSelect");
    for (let key in presets) {
        let option = document.createElement("option");
        option.value = key;
        option.innerText = presets[key].name;
        presetSelect.appendChild(option);
    }

    presetSelect.addEventListener("change", function(e) {
        stop();
        originalPreset = JSON.parse(JSON.stringify(presets[e.target.value]));
        if (!cierresActive || currentLap !== 4) {
            currentPreset = JSON.parse(JSON.stringify(originalPreset));
            isCierreMode = false;
        } else if (cierresActive && currentLap === 4) {
            const matchingCierre = getSelectedCierre();
            if (matchingCierre) {
                currentPreset = JSON.parse(JSON.stringify(matchingCierre));
                isCierreMode = true;
            }
        }
        currentStep = 0;
        updateInterval(); // Actualizar intervalo cuando cambia el preset
        draw();
    });
    
    document.getElementById("cierreSelect").addEventListener("change", function() {
        if (currentLap === 4 && cierresActive) {
            updatePresetByLap();
        }
    });
    
    document.getElementById("bpm").addEventListener("input", function() {
        updateInterval(); // Actualizar intervalo cuando cambia el BPM
    });
    
    document.getElementById("cierresCheck").addEventListener("change", function(e) {
        cierresActive = e.target.checked;
        updatePresetByLap();
    });
    
    document.getElementById("start").addEventListener("click", start);
    document.getElementById("stop").addEventListener("click", stop);
}

// Carga Inicial
async function init() {
    initializeSelectors();
    populateCierreSelector();
    updateLapDisplay();
    draw();
    setupIOSAudioActivation();
}

// Esperar a que el audio-engine.js cargue las muestras
window.addEventListener('DOMContentLoaded', () => {
    // Esperar un momento para que audio-engine.js se inicialice
    setTimeout(() => {
        init();
    }, 100);
});
