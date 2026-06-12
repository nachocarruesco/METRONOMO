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

function start() {
    if (timer) return;
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

    currentLap = 1;
    lastStepWasZero = false;
    updateLapDisplay();
    updatePresetByLap();
    currentStep = 0;
    
    const bpm = parseInt(document.getElementById("bpm").value) || 120;
    let intervalMs = (60000 / bpm) / 2;

    tick();
    timer = setInterval(tick, intervalMs);
}

function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    currentStep = 0;
    draw();
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

canvas.addEventListener("click", function(event) {
    const rect = canvas.getBoundingClientRect();
    // Soporte para escalado responsive del canvas en móvil
    const mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;

    const clickedPoint = pointCoordinates.find(p => {
        const distance = Math.sqrt((mouseX - p.x)**2 + (mouseY - p.y)**2);
        return distance < 22; // Radio de detección un poco más grande para dedos en móvil
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
});

// Inicializar Selectores
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
    draw();
});
document.getElementById("cierreSelect").addEventListener("change", function() {

    if (currentLap === 4 && cierresActive) {
        updatePresetByLap();
    }
});
document.getElementById("bpm").addEventListener("input", function() {
    if (timer) { stop(); start(); }
});

document.getElementById("cierresCheck").addEventListener("change", function(e) {
    cierresActive = e.target.checked;
    updatePresetByLap();
});

document.getElementById("start").addEventListener("click", start);
document.getElementById("stop").addEventListener("click", stop);

// Carga Inicial Estática
populateCierreSelector();
updateLapDisplay();
draw();
