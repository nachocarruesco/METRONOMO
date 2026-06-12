//js/presets.js
//Aquí es donde puedes crear fácilmente nuevos ritmos en modo texto usando las etiquetas 

// RITMOS (r=rumba, b=buleria, t=tangos, a=alegrias)
const presets = {
    "rumba_abierta": {
        name: "Rumba Abierta", tag: "r", subdivisions: 8,
        marks: { 0: "grave", 3: "agudo", 6: "agudo" },
        labels: [{ text: "1", step: 0 }, { text: "2", step: 2 }, { text: "3", step: 4 }, { text: "4", step: 6 }]
    },
    "rumba_cerrada": {
        name: "Rumba Cerrada", tag: "r", subdivisions: 8,
        marks: { 0: "grave", 2: "agudo", 4: "grave", 6: "agudo" },
        labels: [{ text: "1", step: 0 }, { text: "2", step: 2 }, { text: "3", step: 4 }, { text: "4", step: 6 }]
    },
    "tangos": {
        name: "Tangos Flamencos", tag: "t", subdivisions: 8,
        marks: { 2: "grave", 4: "agudo", 6: "agudo" },
        labels: [{ text: "1", step: 0 }, { text: "2", step: 2 }, { text: "3", step: 4 }, { text: "4", step: 6 }]
    },
    "bulerias al 12": {
        name: "Bulerías al 12", tag: "b", subdivisions: 24,
        marks: { 4: "agudo", 10: "agudo", 14: "grave", 18: "grave", 22: "grave" },
        labels: [
            { text: "12", step: 0 }, { text: "1", step: 2 }, { text: "2", step: 4 },
            { text: "3", step: 6 },  { text: "4", step: 8 }, { text: "5", step: 10 },
            { text: "6", step: 12 }, { text: "7", step: 14 }, { text: "8", step: 16 },
            { text: "9", step: 18 }, { text: "10", step: 20 }, { text: "11", step: 22 }
        ]
    },
    "bulerias de jerez": {
        name: "Bulerías Jerez", tag: "b", subdivisions: 24,
        marks: { 0: "grave", 2: "agudo", 3: "agudo", 4: "agudo", 6: "agudo", 12: "grave", 14: "agudo", 15: "agudo", 16: "agudo" },
        labels: [
            { text: "6", step: 0 }, { text: "1", step: 2 }, { text: "2", step: 4 },
            { text: "3", step: 6 },  { text: "4", step: 8 }, { text: "5", step: 10 },
            { text: "6", step: 12 }, { text: "1", step: 14 }, { text: "2", step: 16 },
            { text: "3", step: 18 }, { text: "4", step: 20 }, { text: "5", step: 22 }
        ]
    },
    "alegrias": {
        name: "Alegrías (24 Sub.)", tag: "a", subdivisions: 24,
        marks: { 4: "grave", 10: "grave", 14: "agudo", 18: "agudo", 22: "agudo" },
        labels: [
            { text: "12", step: 0 }, { text: "1", step: 2 }, { text: "2", step: 4 },
            { text: "3", step: 6 },  { text: "4", step: 8 }, { text: "5", step: 10 },
            { text: "6", step: 12 }, { text: "7", step: 14 }, { text: "8", step: 16 },
            { text: "9", step: 18 }, { text: "10", step: 20 }, { text: "11", step: 22 }
        ]
    }
};

// CIERRES AUTOMÁTICOS ASOCIADOS POR TAG
const cierrePresets = {
    "cierre_rumba": {
        name: "Cierre Rumbas", tag: "r", subdivisions: 8,
        marks: { 0: "grave", 4: "agudo", 6: "agudo" },
        labels: [{ text: "1", step: 0 }, { text: "2", step: 2 }, { text: "3", step: 4 }, { text: "4", step: 6 }]
    },
    "cierre_tangos": {
        name: "Cierre Tangos", tag: "t", subdivisions: 8,
        marks: { 0: "grave", 2: "grave", 4: "agudo" },
        labels: [{ text: "1", step: 0 }, { text: "2", step: 2 }, { text: "3", step: 4 }, { text: "4", step: 6 }]
    },
    "cierre_buleria": {
        name: "Cierre Bulerías", tag: "b", subdivisions: 24,
        marks: { 2: "agudo", 6: "grave", 10: "agudo", 14: "grave", 18: "agudo", 22: "grave" },
        labels: [
            { text: "12", step: 0 }, { text: "1", step: 2 }, { text: "2", step: 4 },
            { text: "3", step: 6 },  { text: "4", step: 8 }, { text: "5", step: 10 },
            { text: "6", step: 12 }, { text: "7", step: 14 }, { text: "8", step: 16 },
            { text: "9", step: 18 }, { text: "10", step: 20 }, { text: "11", step: 22 }
        ]
    },
    "cierre_alegrias": {
        name: "Cierre Alegrías", tag: "a", subdivisions: 24,
        marks: { 0: "grave", 4: "grave", 12: "agudo", 14: "agudo" },
        labels: [
            { text: "12", step: 0 }, { text: "1", step: 2 }, { text: "2", step: 4 },
            { text: "3", step: 6 },  { text: "4", step: 8 }, { text: "5", step: 10 },
            { text: "6", step: 12 }, { text: "7", step: 14 }, { text: "8", step: 16 },
            { text: "9", step: 18 }, { text: "10", step: 20 }, { text: "11", step: 22 }
        ]
    }
};
