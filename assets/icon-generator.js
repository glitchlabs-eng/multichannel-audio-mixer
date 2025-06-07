const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a 512x512 canvas for the icon
const canvas = createCanvas(512, 512);
const ctx = canvas.getContext('2d');

// Create professional audio mixer icon
function createIcon() {
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#2a2a2a');
    gradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Outer ring
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(256, 256, 200, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Inner circle
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(256, 256, 180, 0, 2 * Math.PI);
    ctx.fill();
    
    // Mixer faders (vertical lines)
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 12;
    
    // Draw 5 faders
    for (let i = 0; i < 5; i++) {
        const x = 150 + (i * 50);
        
        // Fader track
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x, 180);
        ctx.lineTo(x, 330);
        ctx.stroke();
        
        // Fader handle
        ctx.fillStyle = '#4CAF50';
        const handleY = 200 + (i * 20); // Different positions
        ctx.fillRect(x - 15, handleY, 30, 20);
        
        // Knob above fader
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, 150, 15, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Knob indicator
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 150);
        ctx.lineTo(x + 10, 140);
        ctx.stroke();
    }
    
    // Sound waves
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    
    // Top sound waves
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(256, 100, 30 + (i * 15), 0, Math.PI);
        ctx.stroke();
    }
    
    // Bottom sound waves
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(256, 412, 30 + (i * 15), Math.PI, 2 * Math.PI);
        ctx.stroke();
    }
    
    // Center logo - musical note
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(256, 256, 25, 0, 2 * Math.PI);
    ctx.fill();
    
    // Note stem
    ctx.fillStyle = '#fff';
    ctx.fillRect(275, 200, 4, 60);
    
    // Note flag
    ctx.beginPath();
    ctx.moveTo(279, 200);
    ctx.quadraticCurveTo(300, 190, 295, 220);
    ctx.quadraticCurveTo(285, 210, 279, 215);
    ctx.fill();
}

// Create the icon
createIcon();

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('assets/icon.png', buffer);

console.log('Icon created: assets/icon.png');
