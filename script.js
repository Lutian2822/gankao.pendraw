// --- UI Logic ---
const updateLabel = (id, val) => document.getElementById(id).textContent = val;

document.getElementById('contrastRange').addEventListener('input', (e) => {
    updateLabel('contrastVal', e.target.value);
    updatePreviewA();
    drawCompositionFrame();
});
document.getElementById('scaleRange').addEventListener('input', (e) => {
    updateLabel('scaleVal', e.target.value);
    drawCompositionFrame();
});
document.getElementById('thresholdRange').addEventListener('input', (e) => {
    updateLabel('threshVal', e.target.value);
    updatePreviewA(); // Update preview to show threshold effect
});
document.getElementById('strokeRange').addEventListener('input', (e) => updateLabel('strokeVal', e.target.value));
document.getElementById('stepRange').addEventListener('input', (e) => updateLabel('stepVal', e.target.value));
document.getElementById('smoothRange').addEventListener('input', (e) => updateLabel('smoothVal', e.target.value));
document.getElementById('blurRange').addEventListener('input', (e) => updateLabel('blurVal', e.target.value));

document.getElementById('handScaleRange').addEventListener('input', (e) => {
    updateLabel('handScaleVal', e.target.value);
    drawCompositionFrame();
});

document.getElementById('handFadeRange').addEventListener('input', (e) => {
    updateLabel('handFadeVal', e.target.value);
    updateProcessedHand();
    drawCompositionFrame();
});

// Mode Switching
const modeRadios = document.querySelectorAll('input[name="drawMode"]');
const modeDesc = document.getElementById('modeDesc');
const colorDurationRow = document.getElementById('colorDurationRow');

modeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'color') {
            modeDesc.textContent = "适合彩色图片，先绘制黑线轮廓，再进行彩色涂抹。";
            colorDurationRow.style.display = 'block';
        } else {
            modeDesc.textContent = "适合白底黑线的简笔画，仅绘制线条。";
            colorDurationRow.style.display = 'none';
        }
    });
});

// --- Core Logic (Migrated from V2) ---

// Elements
const imageAInput = document.getElementById('imageAInput');
const previewACanvas = document.getElementById('previewACanvas');
const imageBInput = document.getElementById('imageBInput');
const previewBCanvas = document.getElementById('previewBCanvas');
const penTipMarker = document.getElementById('penTipMarker');
const renderCanvas = document.getElementById('renderCanvas');
const generateBtn = document.getElementById('generateBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const videoOverlay = document.getElementById('videoOverlay');
const resultVideo = document.getElementById('resultVideo');
const downloadLink = document.getElementById('downloadLink');

// State
let imgA = null;
let imgB = null;
let processedHandCanvas = null;
let penTip = { x: 0, y: 0 };
let animationId = null;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1600;

function showStatus(msg) {
    statusText.textContent = msg;
    statusIndicator.classList.add('visible');
}

function hideStatus() {
    statusIndicator.classList.remove('visible');
}

function closeOverlay() {
    videoOverlay.classList.remove('active');
}

// --- Image A ---
imageAInput.addEventListener('change', (e) => {
    if (animationId) cancelAnimationFrame(animationId);
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        imgA = new Image();
        imgA.onload = () => {
            updatePreviewA();
            drawCompositionFrame();
        };
        imgA.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

function updatePreviewA() {
    if (!imgA) return;
    const ctx = previewACanvas.getContext('2d');
    const contrast = parseInt(document.getElementById('contrastRange').value);
    const threshold = parseInt(document.getElementById('thresholdRange').value);
    
    // Fit to container
    const aspect = imgA.height / imgA.width;
    previewACanvas.width = 300;
    previewACanvas.height = 300 * aspect;

    ctx.filter = `contrast(${100 + contrast}%)`;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, previewACanvas.width, previewACanvas.height);
    ctx.drawImage(imgA, 0, 0, previewACanvas.width, previewACanvas.height);
    ctx.filter = 'none';

    // Visualize Threshold (Binary View)
    // This helps user understand what will be drawn
    const imageData = ctx.getImageData(0, 0, previewACanvas.width, previewACanvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
        if (brightness < threshold) {
            data[i] = 0; data[i+1] = 0; data[i+2] = 0; // Black
        } else {
            data[i] = 255; data[i+1] = 255; data[i+2] = 255; // White
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

// --- Image B ---
imageBInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        imgB = new Image();
        imgB.onload = () => {
            penTip = { x: 0, y: imgB.height }; // Default tip
            updateProcessedHand();
            updatePreviewB();
            drawCompositionFrame();
        };
        imgB.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

function updateProcessedHand() {
    if (!imgB) return;
    const fadePercent = parseInt(document.getElementById('handFadeRange').value);
    
    processedHandCanvas = document.createElement('canvas');
    processedHandCanvas.width = imgB.width;
    processedHandCanvas.height = imgB.height;
    const ctx = processedHandCanvas.getContext('2d');
    
    ctx.drawImage(imgB, 0, 0);
    
    if (fadePercent > 0) {
        ctx.globalCompositeOperation = 'destination-in';
        
        const fadeH = imgB.height * (fadePercent / 100);
        const startY = imgB.height;
        const endY = imgB.height - fadeH;
        
        const gradient = ctx.createLinearGradient(0, startY, 0, endY);
        gradient.addColorStop(0, "rgba(0,0,0,0)"); // Transparent at bottom
        gradient.addColorStop(1, "rgba(0,0,0,1)"); // Opaque at top of fade
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, imgB.width, imgB.height);
    }
}

function updatePreviewB() {
    if (!imgB) return;
    const ctx = previewBCanvas.getContext('2d');
    
    // Fit to container
    let displayWidth = 300;
    let scale = displayWidth / imgB.width;
    let displayHeight = imgB.height * scale;
    
    previewBCanvas.width = displayWidth;
    previewBCanvas.height = displayHeight;
    
    ctx.drawImage(imgB, 0, 0, displayWidth, displayHeight);
    
    const markerX = penTip.x * scale;
    const markerY = penTip.y * scale;
    
    // Draw Marker on Canvas
    ctx.beginPath();
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
    ctx.moveTo(markerX - 10, markerY);
    ctx.lineTo(markerX + 10, markerY);
    ctx.moveTo(markerX, markerY - 10);
    ctx.lineTo(markerX, markerY + 10);
    ctx.stroke();
    
    // Text
    ctx.font = '12px Roboto Mono';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText("TIP", markerX + 8, markerY - 8);
}

// Pen Tip Interaction (Drag & Click)
let isDraggingTip = false;

function handlePenTipInput(e) {
    if (!imgB) return;
    e.preventDefault(); 
    
    const rect = previewBCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Use rect dimensions for scale to handle CSS resizing
    const scaleX = imgB.width / rect.width;
    const scaleY = imgB.height / rect.height;
    
    let imgX = x * scaleX;
    let imgY = y * scaleY;
    
    // Clamp
    imgX = Math.max(0, Math.min(imgB.width, imgX));
    imgY = Math.max(0, Math.min(imgB.height, imgY));
    
    penTip.x = imgX;
    penTip.y = imgY;
    
    updatePreviewB();
}

previewBCanvas.addEventListener('mousedown', (e) => {
    isDraggingTip = true;
    handlePenTipInput(e);
});

window.addEventListener('mousemove', (e) => {
    if (isDraggingTip) handlePenTipInput(e);
});

window.addEventListener('mouseup', () => {
    isDraggingTip = false;
});

// Touch support
previewBCanvas.addEventListener('touchstart', (e) => {
    isDraggingTip = true;
    handlePenTipInput(e);
}, {passive: false});

window.addEventListener('touchmove', (e) => {
    if (isDraggingTip) handlePenTipInput(e);
}, {passive: false});

window.addEventListener('touchend', () => {
    isDraggingTip = false;
});

// --- Composition ---
function drawCompositionFrame() {
    const ctx = renderCanvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over'; // Reset composite operation to avoid state pollution
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (imgA) {
        const scale = parseFloat(document.getElementById('scaleRange').value);
        const fitScale = Math.min(CANVAS_WIDTH / imgA.width, CANVAS_HEIGHT / imgA.height) * 0.8;
        const finalScale = fitScale * scale;
        
        const w = imgA.width * finalScale;
        const h = imgA.height * finalScale;
        const x = (CANVAS_WIDTH - w) / 2;
        const y = (CANVAS_HEIGHT - h) / 2;
        
        const contrast = parseInt(document.getElementById('contrastRange').value);
        ctx.filter = `contrast(${100 + contrast}%)`;
        ctx.drawImage(imgA, x, y, w, h);
        ctx.filter = 'none';
    }

    if (processedHandCanvas) {
        const handScalePercent = parseInt(document.getElementById('handScaleRange').value);
        const handW = CANVAS_WIDTH * (handScalePercent / 100);
        const scaleFactor = handW / processedHandCanvas.width;
        const handH = processedHandCanvas.height * scaleFactor;
        
        // Position: Tip at center of canvas
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        
        const tipX = penTip.x * scaleFactor;
        const tipY = penTip.y * scaleFactor;
        
        const drawX = centerX - tipX;
        const drawY = centerY - tipY;
        
        ctx.drawImage(processedHandCanvas, drawX, drawY, handW, handH);
    }
}

// --- Path Finding & Smoothing (Optimized V2 Logic) ---
function getDrawingPath(ctx, width, height, threshold, step) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const points = [];
    
    for (let y = 0; y < height; y += step) { 
        for (let x = 0; x < width; x += step) {
            const i = (y * width + x) * 4;
            const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
            if (brightness < threshold) {
                points.push({x, y, v: false});
            }
        }
    }
    
    if (points.length === 0) return [];

    const sortedPath = [];
    let current = points[0];
    current.v = true;
    current.jump = true; // First point is a jump
    sortedPath.push(current);
    
    const bucketSize = 50;
    const grid = {};
    points.forEach(p => {
        const key = `${Math.floor(p.x/bucketSize)},${Math.floor(p.y/bucketSize)}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push(p);
    });
    
    let count = 0;
    const total = points.length;
    let lastScanIndex = 0; // Optimization for linear scan
    
    while (count < total - 1) {
        let minDist = Infinity;
        let nextPoint = null;
        let found = false;
        
        const gx = Math.floor(current.x / bucketSize);
        const gy = Math.floor(current.y / bucketSize);
        
        // Search in expanding rings
        for (let r = 0; r <= 2; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const key = `${gx+dx},${gy+dy}`;
                    if (grid[key]) {
                        const bucket = grid[key];
                        for (let i = 0; i < bucket.length; i++) {
                            const p = bucket[i];
                            if (!p.v) {
                                const dist = (p.x - current.x)**2 + (p.y - current.y)**2;
                                if (dist < minDist) {
                                    minDist = dist;
                                    nextPoint = p;
                                    found = true;
                                }
                            }
                        }
                    }
                }
            }
            // If found in this ring, and it's reasonably close, stop searching outer rings
            if (found && minDist < 2500) break; 
        }
        
        if (nextPoint) {
            nextPoint.v = true;
            nextPoint.jump = false; // Connected
            sortedPath.push(nextPoint);
            current = nextPoint;
            count++;
        } else {
            let jumpFound = false;
            // Optimized scan starting from last known position
            for (let i = lastScanIndex; i < points.length; i++) {
                 if (!points[i].v) {
                     current = points[i];
                     current.v = true;
                     current.jump = true; // Jumped
                     sortedPath.push(current);
                     count++;
                     jumpFound = true;
                     lastScanIndex = i + 1; // Update scan index
                     break;
                 }
            }
            
            // If not found from lastScanIndex, wrap around (just in case, though logically shouldn't happen if sorted)
            if (!jumpFound && lastScanIndex > 0) {
                 for (let i = 0; i < lastScanIndex; i++) {
                     if (!points[i].v) {
                         current = points[i];
                         current.v = true;
                         current.jump = true;
                         sortedPath.push(current);
                         count++;
                         jumpFound = true;
                         lastScanIndex = i + 1;
                         break;
                     }
                 }
            }

            if (!jumpFound) break;
        }
    }
    return sortedPath;
}

function smoothPath(path, iterations) {
    if (iterations <= 0 || path.length < 3) return path;
    let currentPath = path.map(p => ({...p}));
    for (let it = 0; it < iterations; it++) {
        const newPath = [];
        newPath.push(currentPath[0]);
        for (let i = 1; i < currentPath.length - 1; i++) {
            const prev = currentPath[i-1];
            const curr = currentPath[i];
            const next = currentPath[i+1];
            newPath.push({
                x: (prev.x + curr.x + next.x) / 3,
                y: (prev.y + curr.y + next.y) / 3
            });
        }
        newPath.push(currentPath[currentPath.length - 1]);
        currentPath = newPath;
    }
    return currentPath;
}

function getColoringPath(ctx, width, height, step = 40) {
    // Zig-zag scan for non-white pixels
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const points = [];
    
    // Find bounding box of content
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasContent = false;
    
    for (let y = 0; y < height; y += 10) {
        for (let x = 0; x < width; x += 10) {
            const i = (y * width + x) * 4;
            // Check if not white (simple check)
            if (data[i] < 250 || data[i+1] < 250 || data[i+2] < 250) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
                hasContent = true;
            }
        }
    }
    
    if (!hasContent) return [];
    
    // Add padding
    minX = Math.max(0, minX - step);
    maxX = Math.min(width, maxX + step);
    minY = Math.max(0, minY - step);
    maxY = Math.min(height, maxY + step);
    
    // Generate zig-zag path
    const interpolateStep = 10; // Add points every 10px for smoother animation
    
    for (let y = minY; y <= maxY; y += step) {
        if (((y - minY) / step) % 2 === 0) {
            // Left to Right
            for (let x = minX; x <= maxX; x += interpolateStep) {
                points.push({x: x, y: y});
            }
            points.push({x: maxX, y: y}); // Ensure end point
        } else {
            // Right to Left
            for (let x = maxX; x >= minX; x -= interpolateStep) {
                points.push({x: x, y: y});
            }
            points.push({x: minX, y: y}); // Ensure end point
        }
    }
    
    return points;
}

// --- Generation ---
generateBtn.addEventListener('click', async () => {
    if (!imgA) { alert("请先上传目标图片"); return; }
    if (!imgB) { alert("请先上传手写笔图片"); return; }
    
    generateBtn.disabled = true;
    showStatus("正在计算绘制路径...");
    
    setTimeout(() => startGeneration(), 100);
});

async function startGeneration() {
    if (animationId) clearTimeout(animationId);
    const ctx = renderCanvas.getContext('2d');
    const width = renderCanvas.width;
    const height = renderCanvas.height;
    
    const threshold = parseInt(document.getElementById('thresholdRange').value);
    const strokeWidth = parseInt(document.getElementById('strokeRange').value);
    const step = parseInt(document.getElementById('stepRange').value);
    const smoothIterations = parseInt(document.getElementById('smoothRange').value);
    const blurAmount = parseInt(document.getElementById('blurRange').value);
    const drawMode = document.querySelector('input[name="drawMode"]:checked').value;
    
    // 1. Prepare
    drawCompositionFrame();
    
    // 2. Path Finding
    let path = getDrawingPath(ctx, width, height, threshold, step);
    let colorPath = [];
    
    if (path.length === 0) {
        showStatus("错误: 未检测到线条");
        alert("未检测到线条，请调整对比度或阈值");
        generateBtn.disabled = false;
        hideStatus();
        return;
    }

    if (smoothIterations > 0) {
        showStatus("正在平滑路径...");
        await new Promise(r => setTimeout(r, 10));
        path = smoothPath(path, smoothIterations);
    }
    
    if (drawMode === 'color') {
            showStatus("正在计算填充路径...");
            await new Promise(r => setTimeout(r, 10));
            colorPath = getColoringPath(ctx, width, height, 50); // 50px brush
    }

    // 3. Setup Animation
    const durationSec = parseInt(document.getElementById('durationInput').value);
    const fps = parseInt(document.getElementById('fpsSelect').value);
    const drawingFrames = durationSec * fps;
    
    let coloringFrames = 0;
    if (drawMode === 'color') {
            const colorDurationSec = parseInt(document.getElementById('colorDurationInput').value);
            coloringFrames = colorDurationSec * fps;
    }
    // Auto-Repair Logic (New Feature)
    const isAutoRepairEnabled = document.getElementById('repairCheck').checked && drawMode === 'line';
    let repairFrames = 0;
    if (isAutoRepairEnabled) {
        const repairDurationSec = parseFloat(document.getElementById('repairDurationInput').value) || 2;
        repairFrames = repairDurationSec * fps;
    }
    
    const holdDurationSec = parseFloat(document.getElementById('holdDurationInput').value);
    const holdFrames = holdDurationSec * fps;
    const totalFrames = drawingFrames + coloringFrames + repairFrames + holdFrames;
    const pointsPerFrame = Math.ceil(path.length / drawingFrames);
    const colorPointsPerFrame = colorPath.length > 0 ? Math.ceil(colorPath.length / coloringFrames) : 0;
    
    // Hand Scale Logic
    let handW, handH, tipX, tipY;
    if (processedHandCanvas) {
        const handScalePercent = parseInt(document.getElementById('handScaleRange').value);
        handW = width * (handScalePercent / 100);
        const scaleFactor = handW / processedHandCanvas.width;
        handH = processedHandCanvas.height * scaleFactor;
        tipX = penTip.x * scaleFactor;
        tipY = penTip.y * scaleFactor;
    }

    // Recorder
    const stream = renderCanvas.captureStream(fps);
    
    // Improved MimeType Selection for AE Compatibility
    let mimeType = "video/webm"; // Default fallback
    if (MediaRecorder.isTypeSupported("video/mp4; codecs=avc1.4d002a")) {
        mimeType = "video/mp4; codecs=avc1.4d002a"; // H.264 High Profile
    } else if (MediaRecorder.isTypeSupported("video/mp4; codecs=avc1.42E01E")) {
        mimeType = "video/mp4; codecs=avc1.42E01E"; // H.264 Baseline
    } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4"; // Generic MP4
    }

    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 5000000 // 5 Mbps
    });
    
    const chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        resultVideo.src = url;
        downloadLink.href = url;
        
        // Ensure correct extension based on actual mimeType
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        downloadLink.download = `drawing_animation.${ext}`;
        
        videoOverlay.classList.add('active');
        showStatus("生成完成");
        setTimeout(hideStatus, 2000);
        generateBtn.disabled = false;
    };
    
    mediaRecorder.start();
    
    // 4. Loop
    let frame = 0;
    let pathIndex = 0;
    let colorPathIndex = 0;
    
    // Hand Smoothing State
    let currentHandX = 0;
    let currentHandY = 0;
    let isFirstHandFrame = true;
    
    // Mask for Line Drawing
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    
    // Mask for Color Filling
    const colorMaskCanvas = document.createElement('canvas');
    colorMaskCanvas.width = width;
    colorMaskCanvas.height = height;
    const colorMaskCtx = colorMaskCanvas.getContext('2d');
    
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = width;
    targetCanvas.height = height;
    const tCtx = targetCanvas.getContext('2d');
    
    // Draw target to offscreen
    tCtx.fillStyle = "white";
    tCtx.fillRect(0, 0, width, height);
    
    // Create Line Art Canvas (for Phase 1 of Color Mode)
    const lineArtCanvas = document.createElement('canvas');
    lineArtCanvas.width = width;
    lineArtCanvas.height = height;
    const lCtx = lineArtCanvas.getContext('2d');
    lCtx.fillStyle = "white";
    lCtx.fillRect(0, 0, width, height);
    
    if (imgA) {
        const scale = parseFloat(document.getElementById('scaleRange').value);
        const fitScale = Math.min(width / imgA.width, height / imgA.height) * 0.8;
        const finalScale = fitScale * scale;
        const w = imgA.width * finalScale;
        const h = imgA.height * finalScale;
        const x = (width - w) / 2;
        const y = (height - h) / 2;
        const contrast = parseInt(document.getElementById('contrastRange').value);
        
        // Draw Full Color Target
        tCtx.filter = `contrast(${100 + contrast}%)`;
        tCtx.drawImage(imgA, x, y, w, h);
        tCtx.filter = 'none';
        
        // Draw Line Art Target
        lCtx.drawImage(imgA, x, y, w, h);
        
        if (drawMode === 'color') {
            const imgData = lCtx.getImageData(0, 0, width, height);
            const data = imgData.data;
            const saturationThreshold = 30; 
            const brightnessThreshold = 200; 
            
            for(let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const saturation = max - min;
                const brightness = (r + g + b) / 3;
                
                if (saturation > saturationThreshold) {
                        // Color -> White
                        data[i] = 255; data[i+1] = 255; data[i+2] = 255;
                } else {
                    // Grayscale
                    if (brightness > brightnessThreshold) {
                            // White/Light -> White
                            data[i] = 255; data[i+1] = 255; data[i+2] = 255;
                    } else {
                            // Dark -> Dark
                            const darkVal = brightness < 100 ? 0 : brightness;
                            data[i] = darkVal; data[i+1] = darkVal; data[i+2] = darkVal;
                    }
                }
            }
            lCtx.putImageData(imgData, 0, 0);
        } else {
                lCtx.filter = `contrast(${100 + contrast}%)`;
                lCtx.drawImage(imgA, x, y, w, h);
                lCtx.filter = 'none';
        }
    }

    function renderFrame() {
        if (frame >= totalFrames) {
            mediaRecorder.stop();
            ctx.globalCompositeOperation = 'source-over';
            return;
        }
        
        const isDrawingPhase = frame < drawingFrames;
        const isColoringPhase = !isDrawingPhase && frame < (drawingFrames + coloringFrames);
        const isRepairPhase = !isDrawingPhase && !isColoringPhase && frame < (drawingFrames + coloringFrames + repairFrames);
        
        if (isDrawingPhase) {
            showStatus(`正在生成线条: ${Math.round((frame/drawingFrames)*100)}%`);
            
            let endIndex = Math.min(pathIndex + pointsPerFrame, path.length);
            
            // Force completion on last drawing frame to ensure 100% lines
            if (frame === drawingFrames - 1) {
                endIndex = path.length;
            }
            
            maskCtx.lineCap = 'round';
            maskCtx.lineJoin = 'round';
            maskCtx.lineWidth = strokeWidth;
            maskCtx.strokeStyle = "black";
            
            if (blurAmount > 0) {
                maskCtx.shadowBlur = blurAmount;
                maskCtx.shadowColor = "black";
            } else {
                maskCtx.shadowBlur = 0;
            }

            maskCtx.beginPath();
            let startIndex = pathIndex;
            if (startIndex > 0) startIndex--; 
            
            if (path.length > 0 && startIndex < path.length) {
                    const startP = path[startIndex];
                    maskCtx.moveTo(startP.x, startP.y);
                    // Ensure start point is visible if it's isolated
                    maskCtx.lineTo(startP.x, startP.y);
            }

            for (let i = startIndex + 1; i < endIndex; i++) {
                const p = path[i];
                if (p.jump) {
                    maskCtx.stroke(); // Finish current stroke
                    maskCtx.beginPath(); // Start new stroke
                    maskCtx.moveTo(p.x, p.y);
                    // Ensure jump point is visible if it's isolated
                    maskCtx.lineTo(p.x, p.y);
                } else {
                    maskCtx.lineTo(p.x, p.y);
                }
            }
            maskCtx.stroke();
            
            pathIndex = endIndex;
        } else if (isColoringPhase) {
            showStatus(`正在填充颜色: ${Math.round(((frame - drawingFrames)/coloringFrames)*100)}%`);
            
            let endIndex = Math.min(colorPathIndex + colorPointsPerFrame, colorPath.length);
            
            // Force completion on last coloring frame
            if (frame === drawingFrames + coloringFrames - 1) {
                endIndex = colorPath.length;
            }
            
            // Draw to Color Mask
            colorMaskCtx.lineCap = 'round';
            colorMaskCtx.lineJoin = 'round';
            colorMaskCtx.lineWidth = 60; 
            colorMaskCtx.strokeStyle = "black"; 
            colorMaskCtx.shadowBlur = 20; 

            colorMaskCtx.beginPath();
            
            let startIndex = colorPathIndex;
            if (startIndex > 0) startIndex--;

            if (colorPath.length > 0 && startIndex < colorPath.length) {
                    const startP = colorPath[startIndex];
                    colorMaskCtx.moveTo(startP.x, startP.y);
            }

            for (let i = startIndex + 1; i < endIndex; i++) {
                const p = colorPath[i];
                colorMaskCtx.lineTo(p.x, p.y);
            }
            colorMaskCtx.stroke();
            
            colorPathIndex = endIndex;
        } else if (isRepairPhase) {
            showStatus(`正在补全细节...`);
            // Repair phase logic handled in Composition section
        } else {
            showStatus(`保持画面...`);
        }
        
        // Compose
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, width, height);
        
        if (drawMode === 'color') {
            // 1. Background
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, width, height);
            
            // 2. Draw Line Art (masked by Line Mask)
            const tempLine = document.createElement('canvas');
            tempLine.width = width; tempLine.height = height;
            const tlc = tempLine.getContext('2d');
            tlc.drawImage(maskCanvas, 0, 0);
            tlc.globalCompositeOperation = 'source-in';
            tlc.drawImage(lineArtCanvas, 0, 0);
            
            ctx.drawImage(tempLine, 0, 0);
            
            // 3. Draw Color Art (masked by Color Mask)
            const tempColor = document.createElement('canvas');
            tempColor.width = width; tempColor.height = height;
            const tcc = tempColor.getContext('2d');
            tcc.drawImage(colorMaskCanvas, 0, 0);
            tcc.globalCompositeOperation = 'source-in';
            tcc.drawImage(targetCanvas, 0, 0); // targetCanvas is full color
            
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(tempColor, 0, 0);
            
        } else {
            // Line Mode
            ctx.drawImage(maskCanvas, 0, 0);
            ctx.globalCompositeOperation = 'source-in';
            ctx.drawImage(targetCanvas, 0, 0);
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, width, height);
            
            // Auto-Repair Overlay (Fade In)
            if (isRepairPhase || (frame >= drawingFrames + coloringFrames + repairFrames)) {
                let alpha = 0;
                if (frame >= drawingFrames + coloringFrames + repairFrames) {
                    alpha = 1.0; // Fully visible in Hold phase if repair was enabled
                } else {
                    // Calculating alpha during repair phase
                    const repairProgress = (frame - drawingFrames - coloringFrames) / repairFrames;
                    alpha = repairProgress;
                }
                
                // Only apply if repair is enabled
                if (isAutoRepairEnabled && alpha > 0) {
                     ctx.globalCompositeOperation = 'source-over'; // Draw on top
                     ctx.globalAlpha = alpha;
                     // Draw the full target image (contrast enhanced) on top
                     // Note: targetCanvas has white background, so we use multiply or just normal blend if it's black on white?
                     // targetCanvas was created with white background at line 660 (via tCtx.fillRect)
                     // But wait, tCtx has imgA drawn on it.
                     // If we draw targetCanvas with alpha, it will fade white over white (no change) and black over white (fade to grey then black).
                     // This is exactly what we want: fade in the missing details.
                     ctx.drawImage(targetCanvas, 0, 0);
                     ctx.globalAlpha = 1.0;
                }
            }
        }
        
        // Draw Hand
        let currentP = null;
        
        if (isDrawingPhase && pathIndex > 0) {
                currentP = path[Math.min(pathIndex - 1, path.length - 1)];
        } else if (isColoringPhase && colorPathIndex > 0) {
                currentP = colorPath[Math.min(colorPathIndex - 1, colorPath.length - 1)];
        }
        
        if (currentP && processedHandCanvas) {
            // Smoothing Logic
            const smoothFactor = parseInt(document.getElementById('handSmoothRange').value);
            const targetHandX = currentP.x - tipX;
            const targetHandY = currentP.y - tipY;
            
            if (isFirstHandFrame) {
                currentHandX = targetHandX;
                currentHandY = targetHandY;
                isFirstHandFrame = false;
            } else {
                // Lower alpha = more smoothing (slower response)
                // If smoothFactor is 0 (min), alpha should be 1 (instant).
                // If smoothFactor is 50 (max), alpha should be small (e.g. 0.05).
                // Formula: alpha = 1 / (1 + factor * 0.5)
                const alpha = 1 / (1 + smoothFactor * 0.2); 
                currentHandX += (targetHandX - currentHandX) * alpha;
                currentHandY += (targetHandY - currentHandY) * alpha;
            }

            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(processedHandCanvas, currentHandX, currentHandY, handW, handH);
        }
        
        frame++;
        animationId = setTimeout(renderFrame, 1000 / fps);
    }
    
    renderFrame();
}

// --- Default Images Loading (New Feature) ---
function loadDefaultImages() {
    // Load default Image A
    const defaultImgA = new Image();
    defaultImgA.onload = () => {
        imgA = defaultImgA;
        updatePreviewA();
        drawCompositionFrame();
    };
    defaultImgA.onerror = () => {
        console.warn('Default image bLine1.png not found');
    };
    // Use the path provided in file listing
    defaultImgA.src = 'resources/drawPictures/bLine1.png';

    // Load default Image B
    const defaultImgB = new Image();
    defaultImgB.onload = () => {
        imgB = defaultImgB;
        // Default tip at bottom center or user defined default
        penTip = { x: 0, y: defaultImgB.height }; 
        updateProcessedHand();
        updatePreviewB();
        drawCompositionFrame();
    };
    defaultImgB.onerror = () => {
        console.warn('Default image pen1.png not found');
    };
    defaultImgB.src = 'resources/penPictures/pen1.png';
}

// Initialize
window.addEventListener('load', () => {
    loadDefaultImages();
});