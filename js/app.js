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
    if (lapDiv) {
        lapDiv.textContent = currentLap;
        lapDiv.style.color = (currentLap === 4 && cierresActive) ? "#ff4444" : "#00ff88";
    }
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

function populateCierreSelector() {
    const cierreSelect = document.getElementById("cierreSelect");
    cierreSelect.innerHTML = "";
    const autoOption = document.createElement("option");
    autoOption.value = "";
    autoOption.textContent = "Automático";
    cierreSelect.appendChild(autoOption);
    for (let key in cierrePresets) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = cierrePresets[key].name;
        cierreSelect.appendChild(option);
    }
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

        // Color blanco para todos los marcadores, amarillo para el activo
        ctx.strokeStyle = isActive ? "#ffcc00" : "#ffffff";
        ctx.fillStyle = isActive ? "#ffcc00" : "#ffffff";
        ctx.lineWidth = currentPreset.subdivisions > 12 ? 4 : 5;

        if (mark === "grave") {
            const graveRadius = currentPreset.subdivisions > 12 ? 14 : 18;
            ctx.beginPath();
            ctx.arc(x, y, graveRadius, 0, Math.PI * 2);
            ctx.stroke();
            // Relleno semi-transparente para mejor visibilidad
            if (!isActive) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
                ctx.fill();
            }
        } else if (mark === "agudo") {
            const size = currentPreset.subdivisions > 12 ? 10 : 14;
            ctx.beginPath();
            ctx.moveTo(x - size, y - size); 
            ctx.lineTo(x + size, y + size);
            ctx.moveTo(x + size, y - size); 
            ctx.lineTo(x - size, y + size);
            ctx.stroke();
        } else {
            const dotRadius = currentPreset.subdivisions > 12 ? 6 : 9;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const needleAngle = getStepAngle(currentStep, currentPreset.subdivisions);
    const ax = cx + Math.cos(needleAngle) * (radius - 20);
    const ay = cy + Math.sin(needleAngle) * (radius - 20);

    ctx.beginPath();
    ctx.moveTo(cx, cy); 
    ctx.lineTo(ax, ay);
    ctx.strokeStyle = "#00ff88"; 
    ctx.lineWidth = 4; 
    ctx.stroke();

    ctx.beginPath(); 
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#00ff88"; 
    ctx.fill();
}

function getIntervalMs() {
    const bpm = parseInt(document.getElementById("bpm").value) || 120;
    
    // Detectar automáticamente el tipo de compás según las subdivisiones
    let beatsPerMeasure = 4; // Default: 4/4
    
    if (currentPreset.subdivisions === 24) {
        // Para bulerías, alegrías y otros compases de 12/8
        beatsPerMeasure = 12; // 12 pulsos por compás en 12/8
    } else if (currentPreset.subdivisions === 16) {
        beatsPerMeasure = 4; // 4/4 con semicorcheas
    } else if (currentPreset.subdivisions === 12) {
        beatsPerMeasure = 4; // 3/4 o 6/8 dependiendo
    }
    // Para subdivisions === 8 (rumba, tangos): beatsPerMeasure = 4 (correcto)
    
    const intervalSeconds = (60 / bpm) / (currentPreset.subdivisions / beatsPerMeasure);
    return intervalSeconds * 1000;
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
    
    // Inicializar audio si no está inicializado
    if (!isAudioInitialized) {
        await initAudio();
        isAudioInitialized = true;
    }
    
    // Reanudar el contexto de audio (importante para iOS y después de carga)
    if (audioCtx) {
        await audioCtx.resume();
    }

    currentLap = 1;
    lastStepWasZero = false;
    updateLapDisplay();
    updatePresetByLap();
    currentStep = 0;
    
    const intervalMs = getIntervalMs();
    
    draw();
    tick();
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

async function initAudioForIOS() {
    if (audioCtx && audioCtx.state === "suspended") {
        await audioCtx.resume();
    }
}

function setupIOSAudioActivation() {
    const resumeAudio = async () => {
        if (audioCtx && audioCtx.state === "suspended") {
            await audioCtx.resume();
        }
        document.body.removeEventListener('touchstart', resumeAudio);
        document.body.removeEventListener('click', resumeAudio);
    };
    
    document.body.addEventListener('touchstart', resumeAudio);
    document.body.addEventListener('click', resumeAudio);
}

function updateInterval() {
    if (timer) {
        stop();
        start();
    }
}

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

function initializeSelectors() {
    const presetSelect = document.getElementById("presetSelect");
    if (presetSelect) {
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
            updateInterval();
            draw();
        });
    }
    
    const cierreSelect = document.getElementById("cierreSelect");
    if (cierreSelect) {
        cierreSelect.addEventListener("change", function() {
            if (currentLap === 4 && cierresActive) {
                updatePresetByLap();
            }
        });
    }
    
    const bpmInput = document.getElementById("bpm");
    if (bpmInput) {
        bpmInput.addEventListener("input", function() {
            updateInterval();
        });
    }
    
    const cierresCheck = document.getElementById("cierresCheck");
    if (cierresCheck) {
        cierresCheck.addEventListener("change", function(e) {
            cierresActive = e.target.checked;
            updatePresetByLap();
        });
    }
    
    const startBtn = document.getElementById("start");
    if (startBtn) startBtn.addEventListener("click", start);
    
    const stopBtn = document.getElementById("stop");
    if (stopBtn) stopBtn.addEventListener("click", stop);
}

// Eventos del canvas
canvas.addEventListener("click", canvasTapHandler);
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mouseX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
    handleCanvasTap(mouseX, mouseY);
});

async function init() {
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }
    
    initializeSelectors();
    populateCierreSelector();
    updateLapDisplay();
    draw();
    setupIOSAudioActivation();
}

// Iniciar la aplicación
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(init, 100);
    });
} else {
    setTimeout(init, 100);
}
