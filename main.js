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
    drawCompositionFrame({ previewThreshold: true });
});
document.getElementById('strokeRange').addEventListener('input', (e) => updateLabel('strokeVal', e.target.value));
document.getElementById('stepRange').addEventListener('input', (e) => updateLabel('stepVal', e.target.value));
document.getElementById('smoothRange').addEventListener('input', (e) => updateLabel('smoothVal', e.target.value));
document.getElementById('blurRange').addEventListener('input', (e) => updateLabel('blurVal', e.target.value));
document.getElementById('colorBrushRange').addEventListener('input', (e) => updateLabel('colorBrushVal', e.target.value));

document.getElementById('handScaleRange').addEventListener('input', (e) => {
    updateLabel('handScaleVal', e.target.value);
    drawCompositionFrame();
});

document.getElementById('handSmoothRange').addEventListener('input', (e) => {
    updateLabel('handSmoothVal', e.target.value);
});

document.getElementById('handFadeRange').addEventListener('input', (e) => {
    updateLabel('handFadeVal', e.target.value);
    updateProcessedHand();
    drawCompositionFrame();
});

// --- Core Logic (Migrated from V2) ---

// Elements
const imageAInput = document.getElementById('imageAInput');
const previewACanvas = document.getElementById('previewACanvas');
const uploadAZone = document.getElementById('uploadAZone');
const imageACard = document.getElementById('imageACard');
const imageBInput = document.getElementById('imageBInput');
const previewBCanvas = document.getElementById('previewBCanvas');
const uploadBZone = document.getElementById('uploadBZone');
const penPreviewWrapper = document.getElementById('penPreviewWrapper');
const imageBCard = document.getElementById('imageBCard');
const detailModeToggle = document.getElementById('detailModeToggle');
const smoothRow = document.getElementById('smoothRow');
const blurRow = document.getElementById('blurRow');
const stepRow = document.getElementById('stepRow');
const colorBrushRow = document.getElementById('colorBrushRow');
const exportModeToggle = document.getElementById('exportModeToggle');
const tempOutlineRow = document.getElementById('tempOutlineRow');
const repairRow = document.getElementById('repairRow');
const durationRow = document.getElementById('durationRow');
const holdRow = document.getElementById('holdRow');
const orderRow = document.getElementById('orderRow');
const fpsRow = document.getElementById('fpsRow');
const tempOutlineStepIndex = document.getElementById('tempOutlineStepIndex');
const durationStepIndex = document.getElementById('durationStepIndex');
const colorFillStepIndex = document.getElementById('colorFillStepIndex');
const repairStepIndex = document.getElementById('repairStepIndex');
const holdStepIndex = document.getElementById('holdStepIndex');
const penTipMarker = document.getElementById('penTipMarker');
const renderCanvas = document.getElementById('renderCanvas');
const generateBtn = document.getElementById('generateBtn');
const testBtn = document.getElementById('testBtn');
const penRelocateBtn = document.getElementById('penRelocateBtn');
const drawTemplateBtn = document.getElementById('drawTemplateBtn');
const penTemplateBtn = document.getElementById('penTemplateBtn');
const clearImageABtn = document.getElementById('clearImageABtn');
const clearImageBBtn = document.getElementById('clearImageBBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const videoOverlay = document.getElementById('videoOverlay');
const resultVideo = document.getElementById('resultVideo');
const downloadLink = document.getElementById('downloadLink');
const templateModal = document.getElementById('templateModal');
const templateGrid = document.getElementById('templateGrid');
const templateModalTitle = document.getElementById('templateModalTitle');
const templateModalClose = document.getElementById('templateModalClose');
const colorFillCheck = document.getElementById('colorFillCheck');
const colorDurationInput = document.getElementById('colorDurationInput');
const colorFillRow = document.getElementById('colorFillRow');
const penTipModal = document.getElementById('penTipModal');
const penTipCancel = document.getElementById('penTipCancel');
const penTipConfirm = document.getElementById('penTipConfirm');
const penTipCanvas = document.getElementById('penTipCanvas');

// Theme Switcher Logic
const themeSwitchBtn = document.getElementById('themeSwitchBtn');
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');

const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
};

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

themeSwitchBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
});

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

function openTemplateModal(type) {
    templateModalTitle.textContent = type === 'draw' ? '选择模板图' : '选择画笔图';
    templateGrid.innerHTML = '';
    const basePath = type === 'draw' ? 'resources/drawPictures/' : 'resources/penPictures/';
    const prefixes = type === 'draw' ? ['bLine', 'color'] : ['pen'];
    const maxIndex = 20;
    prefixes.forEach((prefix) => {
        for (let i = 1; i <= maxIndex; i++) {
            const src = `${basePath}${prefix}${i}.png`;
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'template-item';
            const img = document.createElement('img');
            img.src = src;
            img.addEventListener('error', () => {
                if (item.parentNode) item.parentNode.removeChild(item);
            });
            item.appendChild(img);
            item.addEventListener('click', () => {
                if (type === 'draw') {
                    setImageAFromUrl(src);
                } else {
                    setImageBFromUrl(src);
                }
                closeTemplateModal();
            });
            templateGrid.appendChild(item);
        }
    });
    templateModal.classList.add('active');
}

function closeTemplateModal() {
    templateModal.classList.remove('active');
}

templateModalClose.addEventListener('click', closeTemplateModal);
templateModal.addEventListener('click', (e) => {
    if (e.target === templateModal) closeTemplateModal();
});
if (drawTemplateBtn) {
    drawTemplateBtn.addEventListener('click', () => openTemplateModal('draw'));
}
if (penTemplateBtn) {
    penTemplateBtn.addEventListener('click', () => openTemplateModal('pen'));
}
if (detailModeToggle) {
    const applyDetailMode = (mode) => {
        const isAdvanced = mode === 'advanced';
        if (smoothRow) smoothRow.style.display = isAdvanced ? '' : 'none';
        if (blurRow) blurRow.style.display = isAdvanced ? '' : 'none';
        if (stepRow) stepRow.style.display = isAdvanced ? '' : 'none';
        if (colorBrushRow) colorBrushRow.style.display = isAdvanced ? '' : 'none';
        detailModeToggle.textContent = isAdvanced ? '高级模式' : '简易模式';
    };
    detailModeToggle.addEventListener('click', () => {
        const nextMode = detailModeToggle.textContent === '简易模式' ? 'advanced' : 'simple';
        applyDetailMode(nextMode);
    });
    applyDetailMode('simple');
}
if (exportModeToggle) {
    const applyExportMode = (mode) => {
        const isAdvanced = mode === 'advanced';
        if (tempOutlineRow) tempOutlineRow.style.display = isAdvanced ? '' : 'none';
        if (colorFillRow) colorFillRow.style.display = isAdvanced ? '' : 'none';
        if (repairRow) repairRow.style.display = isAdvanced ? '' : 'none';
        if (durationRow) durationRow.style.display = '';
        if (holdRow) holdRow.style.display = '';
        if (fpsRow) fpsRow.style.display = '';
        if (orderRow) orderRow.style.display = isAdvanced ? '' : 'none';
        if (tempOutlineStepIndex) {
            tempOutlineStepIndex.textContent = isAdvanced ? '第1步' : '';
        }
        if (durationStepIndex) {
            durationStepIndex.textContent = isAdvanced ? '第2步' : '第1步';
        }
        if (colorFillStepIndex) {
            colorFillStepIndex.textContent = isAdvanced ? '第3步' : '';
        }
        if (repairStepIndex) {
            repairStepIndex.textContent = isAdvanced ? '第4步' : '';
        }
        if (holdStepIndex) {
            holdStepIndex.textContent = isAdvanced ? '第5步' : '第2步';
        }
        exportModeToggle.textContent = isAdvanced ? '高级模式' : '简易模式';
    };
    exportModeToggle.addEventListener('click', () => {
        const nextMode = exportModeToggle.textContent === '简易模式' ? 'advanced' : 'simple';
        applyExportMode(nextMode);
    });
    applyExportMode('simple');
}
if (uploadAZone) {
    uploadAZone.addEventListener('click', () => imageAInput.click());
}
if (uploadBZone) {
    uploadBZone.addEventListener('click', () => imageBInput.click());
}
if (colorFillCheck) {
    const updateColorFillUI = () => {
        const enabled = colorFillCheck.checked;
        if (colorDurationInput) colorDurationInput.disabled = !enabled;
        if (colorFillRow) colorFillRow.classList.toggle('disabled', !enabled);
    };
    colorFillCheck.addEventListener('change', updateColorFillUI);
    updateColorFillUI();
}
function renderPenTipModalCanvas() {
    if (!penTipCanvas || !imgB) return;
    const maxW = 360;
    const maxH = 260;
    const scale = Math.min(maxW / imgB.width, maxH / imgB.height, 1);
    const w = Math.max(1, Math.round(imgB.width * scale));
    const h = Math.max(1, Math.round(imgB.height * scale));
    penTipCanvas.width = w;
    penTipCanvas.height = h;
    const ctx = penTipCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(imgB, 0, 0, w, h);

    const markerX = penTip.x * scale;
    const markerY = penTip.y * scale;
    ctx.beginPath();
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.arc(markerX, markerY, 6, 0, Math.PI * 2);
    ctx.moveTo(markerX - 12, markerY);
    ctx.lineTo(markerX + 12, markerY);
    ctx.moveTo(markerX, markerY - 12);
    ctx.lineTo(markerX, markerY + 12);
    ctx.stroke();
}

function openPenTipModal() {
    if (!penTipModal) return;
    penTipModal.classList.add('active');
    renderPenTipModalCanvas();
}
function closePenTipModal() {
    if (!penTipModal) return;
    penTipModal.classList.remove('active');
}
if (penTipCancel) penTipCancel.addEventListener('click', closePenTipModal);
if (penTipConfirm) penTipConfirm.addEventListener('click', closePenTipModal);
if (penTipModal) {
    penTipModal.addEventListener('click', (e) => {
        if (e.target === penTipModal) closePenTipModal();
    });
}
if (penRelocateBtn) {
    penRelocateBtn.addEventListener('click', () => {
        if (!imgB) return;
        penTip = { x: imgB.width / 2, y: imgB.height / 2 };
        updatePreviewB();
        openPenTipModal();
    });
}
if (clearImageABtn) {
    clearImageABtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearImageA();
    });
}
if (clearImageBBtn) {
    clearImageBBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearImageB();
    });
}
if (penTipCanvas) {
    const handleModalTipInput = (e) => {
        if (!imgB) return;
        e.preventDefault();
        const rect = penTipCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const scaleX = imgB.width / rect.width;
        const scaleY = imgB.height / rect.height;
        let imgX = x * scaleX;
        let imgY = y * scaleY;
        imgX = Math.max(0, Math.min(imgB.width, imgX));
        imgY = Math.max(0, Math.min(imgB.height, imgY));
        penTip.x = imgX;
        penTip.y = imgY;
        updatePreviewB();
        renderPenTipModalCanvas();
    };
    penTipCanvas.addEventListener('mousedown', handleModalTipInput);
    penTipCanvas.addEventListener('touchstart', handleModalTipInput, { passive: false });
}

function handleImageAFile(file) {
    if (animationId) cancelAnimationFrame(animationId);
    const reader = new FileReader();
    reader.onload = (event) => {
        imgA = new Image();
        imgA.onload = () => {
            updatePreviewA();
            drawCompositionFrame();
            if (uploadAZone) uploadAZone.classList.add('has-image');
        };
        imgA.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function handleImageBFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        imgB = new Image();
        imgB.onload = () => {
            penTip = { x: imgB.width / 2, y: imgB.height / 2 };
            updateProcessedHand();
            updatePreviewB();
            drawCompositionFrame();
            if (uploadBZone) uploadBZone.classList.add('has-image');
            if (penPreviewWrapper) penPreviewWrapper.classList.add('has-image');
            openPenTipModal();
        };
        imgB.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function clearImageA() {
    imgA = null;
    if (imageAInput) imageAInput.value = '';
    if (previewACanvas) {
        previewACanvas.width = 1;
        previewACanvas.height = 1;
    }
    if (uploadAZone) uploadAZone.classList.remove('has-image');
    drawCompositionFrame();
}

function clearImageB() {
    imgB = null;
    processedHandCanvas = null;
    penTip = { x: 0, y: 0 };
    if (imageBInput) imageBInput.value = '';
    if (previewBCanvas) {
        previewBCanvas.width = 1;
        previewBCanvas.height = 1;
    }
    if (penTipCanvas) {
        penTipCanvas.width = 1;
        penTipCanvas.height = 1;
    }
    if (uploadBZone) uploadBZone.classList.remove('has-image');
    if (penPreviewWrapper) penPreviewWrapper.classList.remove('has-image');
    drawCompositionFrame();
}

function setImageAFromUrl(src) {
    const image = new Image();
    image.onload = () => {
        imgA = image;
        updatePreviewA();
        drawCompositionFrame();
        if (uploadAZone) uploadAZone.classList.add('has-image');
    };
    image.src = src;
}

function setImageBFromUrl(src) {
    const image = new Image();
    image.onload = () => {
        imgB = image;
        penTip = { x: image.width / 2, y: image.height / 2 };
        updateProcessedHand();
        updatePreviewB();
        drawCompositionFrame();
        if (uploadBZone) uploadBZone.classList.add('has-image');
        if (penPreviewWrapper) penPreviewWrapper.classList.add('has-image');
        openPenTipModal();
    };
    image.src = src;
}

function setupDropZone(card, onFile) {
    let depth = 0;
    card.addEventListener('dragenter', (e) => {
        e.preventDefault();
        depth += 1;
        card.classList.add('drag-active');
    });
    card.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    card.addEventListener('dragleave', (e) => {
        e.preventDefault();
        depth -= 1;
        if (depth <= 0) {
            depth = 0;
            card.classList.remove('drag-active');
        }
    });
    card.addEventListener('drop', (e) => {
        e.preventDefault();
        depth = 0;
        card.classList.remove('drag-active');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            onFile(file);
        }
    });
}

if (imageACard) setupDropZone(imageACard, handleImageAFile);
if (imageBCard) setupDropZone(imageBCard, handleImageBFile);

// --- Image A ---
imageAInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleImageAFile(file);
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
    if (uploadAZone) uploadAZone.classList.add('has-image');
}

// --- Image B ---
imageBInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleImageBFile(file);
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
    if (uploadBZone) uploadBZone.classList.add('has-image');
    if (penPreviewWrapper) penPreviewWrapper.classList.add('has-image');
    if (penTipModal && penTipModal.classList.contains('active')) {
        renderPenTipModalCanvas();
    }
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
function drawCompositionFrame(options = {}) {
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

        if (options.previewThreshold === true) {
            const threshold = parseInt(document.getElementById('thresholdRange').value);
            const ix = Math.max(0, Math.round(x));
            const iy = Math.max(0, Math.round(y));
            const iw = Math.max(1, Math.round(w));
            const ih = Math.max(1, Math.round(h));
            const imageData = ctx.getImageData(ix, iy, iw, ih);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
                if (brightness < threshold) {
                    data[i] = 0;
                    data[i+1] = 0;
                    data[i+2] = 0;
                } else {
                    data[i] = 255;
                    data[i+1] = 255;
                    data[i+2] = 255;
                }
            }
            ctx.putImageData(imageData, ix, iy);
        }
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
function splitIntoComponents(points, step, refPoint) {
    const pointMap = new Map();
    points.forEach((p, index) => {
        pointMap.set(`${p.x},${p.y}`, index);
    });
    const visited = new Array(points.length).fill(false);
    const components = [];
    const offsets = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx !== 0 || dy !== 0) offsets.push([dx * step, dy * step]);
        }
    }
    for (let i = 0; i < points.length; i++) {
        if (visited[i]) continue;
        const queue = [i];
        visited[i] = true;
        const component = [];
        let minX = Infinity;
        let minY = Infinity;
        let sumX = 0;
        let sumY = 0;
        while (queue.length) {
            const idx = queue.pop();
            const p = points[idx];
            component.push({ x: p.x, y: p.y, v: false });
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            sumX += p.x;
            sumY += p.y;
            for (const [ox, oy] of offsets) {
                const nx = p.x + ox;
                const ny = p.y + oy;
                const key = `${nx},${ny}`;
                const nIdx = pointMap.get(key);
                if (nIdx !== undefined && !visited[nIdx]) {
                    visited[nIdx] = true;
                    queue.push(nIdx);
                }
            }
        }
        const count = component.length || 1;
        components.push({ points: component, minX, minY, centerX: sumX / count, centerY: sumY / count });
    }
    components.sort((a, b) => (a.centerX - b.centerX) || (a.centerY - b.centerY));
    return components.map(c => c.points);
}

function sortPointsNatural(points, step) {
    if (points.length === 0) return [];
    const maxNeighborDistSq = step * step * 2.25;
    let startIndex = 0;
    let minX = Infinity;
    let minY = Infinity;
    points.forEach((p, index) => {
        if (p.x < minX || (p.x === minX && p.y < minY)) {
            minX = p.x;
            minY = p.y;
            startIndex = index;
        }
    });
    const sortedPath = [];
    let current = points[startIndex];
    current.v = true;
    current.jump = true;
    sortedPath.push(current);
    
    const bucketSize = 50;
    const grid = {};
    points.forEach(p => {
        const key = `${Math.floor(p.x / bucketSize)},${Math.floor(p.y / bucketSize)}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push(p);
    });
    
    let count = 0;
    const total = points.length;
    let lastScanIndex = 0;
    
    while (count < total - 1) {
        let minDist = Infinity;
        let nextPoint = null;
        let found = false;
        
        const gx = Math.floor(current.x / bucketSize);
        const gy = Math.floor(current.y / bucketSize);
        
        for (let r = 0; r <= 2; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const key = `${gx + dx},${gy + dy}`;
                    if (grid[key]) {
                        const bucket = grid[key];
                        for (let i = 0; i < bucket.length; i++) {
                            const p = bucket[i];
                            if (!p.v) {
                                const dist = (p.x - current.x) ** 2 + (p.y - current.y) ** 2;
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
            if (found && minDist <= maxNeighborDistSq) break;
        }
        
        if (nextPoint && minDist <= maxNeighborDistSq) {
            nextPoint.v = true;
            nextPoint.jump = false;
            sortedPath.push(nextPoint);
            current = nextPoint;
            count++;
        } else {
            let jumpFound = false;
            for (let i = lastScanIndex; i < points.length; i++) {
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

function extractBoundaryPoints(points, step) {
    if (points.length === 0) return points;
    const set = new Set();
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        set.add(`${p.x},${p.y}`);
    }
    const boundary = [];
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const left = `${p.x - step},${p.y}`;
        const right = `${p.x + step},${p.y}`;
        const up = `${p.x},${p.y - step}`;
        const down = `${p.x},${p.y + step}`;
        const isBoundary = !set.has(left) || !set.has(right) || !set.has(up) || !set.has(down);
        if (isBoundary) boundary.push(p);
    }
    return boundary.length > 0 ? boundary : points;
}

function getDrawingPath(ctx, width, height, threshold, step, refPoint, order, suppressSolidInterior = false) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const points = [];
    
    for (let y = 0; y < height; y += step) { 
        for (let x = 0; x < width; x += step) {
            const i = (y * width + x) * 4;
            const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
            if (brightness < threshold) {
                points.push({x, y});
            }
        }
    }
    
    if (points.length === 0) return [];

    const rawComponents = splitIntoComponents(points, step, refPoint);
    const componentsWithCenter = rawComponents.map(pointsArr => {
        let sumX = 0;
        let sumY = 0;
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < pointsArr.length; i++) {
            const p = pointsArr[i];
            sumX += p.x;
            sumY += p.y;
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
        const count = pointsArr.length || 1;
        const centerX = sumX / count;
        const centerY = sumY / count;
        const bboxW = Math.max(step, maxX - minX + step);
        const bboxH = Math.max(step, maxY - minY + step);
        const approxArea = bboxW * bboxH;
        const coveredArea = count * step * step;
        const coverage = coveredArea / Math.max(1, approxArea);
        const isLargeSolid = suppressSolidInterior && approxArea > 15000 && coverage > 0.35;
        return { points: pointsArr, centerX, centerY, isLargeSolid };
    });
    let orderedComponents;
    if (order === 'tb') {
        orderedComponents = componentsWithCenter.slice().sort((a, b) => (a.centerY - b.centerY) || (a.centerX - b.centerX));
    } else if (order === 'random') {
        orderedComponents = [];
        const remaining = componentsWithCenter.slice();
        if (remaining.length > 0) {
            let currentIndex = Math.floor(Math.random() * remaining.length);
            let current = remaining.splice(currentIndex, 1)[0];
            orderedComponents.push(current);
            while (remaining.length > 0) {
                const lastPoints = current.points;
                const lastPoint = lastPoints[lastPoints.length - 1] || lastPoints[0];
                let bestIndex = 0;
                let bestDist = Infinity;
                for (let i = 0; i < remaining.length; i++) {
                    const c = remaining[i];
                    const dx = c.centerX - lastPoint.x;
                    const dy = c.centerY - lastPoint.y;
                    const dist = dx * dx + dy * dy;
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestIndex = i;
                    }
                }
                current = remaining.splice(bestIndex, 1)[0];
                orderedComponents.push(current);
            }
        }
    } else {
        orderedComponents = componentsWithCenter.slice().sort((a, b) => (a.centerX - b.centerX) || (a.centerY - b.centerY));
    }
    const mergedPath = [];
    orderedComponents.forEach((componentObj) => {
        let componentPoints = componentObj.points;
        if (componentObj.isLargeSolid) {
            componentPoints = extractBoundaryPoints(componentPoints, step);
        }
        const sorted = sortPointsNatural(componentPoints, step);
        if (sorted.length > 0) {
            sorted[0].jump = true;
        }
        mergedPath.push(...sorted);
    });
    return mergedPath;
}

function smoothSegment(segment, iterations) {
    if (iterations <= 0 || segment.length < 3) return segment;
    let currentPath = segment.map(p => ({ x: p.x, y: p.y, jump: p.jump }));
    for (let it = 0; it < iterations; it++) {
        const newPath = [];
        newPath.push(currentPath[0]);
        for (let i = 1; i < currentPath.length - 1; i++) {
            const prev = currentPath[i-1];
            const curr = currentPath[i];
            const next = currentPath[i+1];
            newPath.push({
                x: (prev.x + curr.x + next.x) / 3,
                y: (prev.y + curr.y + next.y) / 3,
                jump: false
            });
        }
        newPath.push(currentPath[currentPath.length - 1]);
        currentPath = newPath;
        currentPath[0].jump = segment[0].jump;
    }
    return currentPath;
}

function smoothPath(path, iterations) {
    if (iterations <= 0 || path.length < 3) return path;
    const segments = [];
    let current = [];
    path.forEach((p, index) => {
        if (index === 0 || p.jump) {
            if (current.length) segments.push(current);
            current = [{ x: p.x, y: p.y, jump: true }];
        } else {
            current.push({ x: p.x, y: p.y, jump: false });
        }
    });
    if (current.length) segments.push(current);
    const smoothed = [];
    segments.forEach(segment => {
        smoothed.push(...smoothSegment(segment, iterations));
    });
    return smoothed;
}

function getColoringPath(ctx, width, height, step = 40) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const points = [];
    function isColoredPixel(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max - min;
        const brightness = (r + g + b) / 3;
        if (brightness >= 252) return false;
        if (saturation > 10 && brightness < 250) return true;
        if (saturation > 5 && brightness < 245 && brightness > 40) return true;
        return false;
    }
    
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasContent = false;
    
    const scanStride = 2;
    for (let y = 0; y < height; y += scanStride) {
        for (let x = 0; x < width; x += scanStride) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            if (isColoredPixel(r, g, b)) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
                hasContent = true;
            }
        }
    }
    
    if (!hasContent) return [];
    
    const margin = Math.max(step * 1.5, 40);
    minX = Math.max(0, minX - margin);
    maxX = Math.min(width, maxX + margin);
    minY = Math.max(0, minY - margin);
    maxY = Math.min(height, maxY + margin);
    
    const areaW = Math.max(1, maxX - minX);
    const areaH = Math.max(1, maxY - minY);
    const rowStep = Math.min(step, Math.max(8, Math.round(Math.min(areaW, areaH) / 10)));
    const interpolateStep = Math.max(3, Math.round(rowStep / 4));
    
    for (let y = minY; y <= maxY; y += rowStep) {
        const forward = ((y - minY) / rowStep) % 2 === 0;
        const xStart = forward ? minX : maxX;
        const xEnd = forward ? maxX : minX;
        const xStep = forward ? interpolateStep : -interpolateStep;
        let inRun = false;
        let lastValidX = null;
        
        for (let x = xStart; forward ? x <= xEnd : x >= xEnd; x += xStep) {
            const xi = Math.max(0, Math.min(width - 1, Math.round(x)));
            const yi = Math.max(0, Math.min(height - 1, Math.round(y)));
            const i = (yi * width + xi) * 4;
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            const colored = isColoredPixel(r, g, b);
            if (colored) {
                points.push({x: xi, y: yi});
                inRun = true;
                lastValidX = xi;
            } else if (inRun && lastValidX !== null) {
                points.push({x: lastValidX, y: yi});
                inRun = false;
            }
        }
        if (inRun && lastValidX !== null) {
            points.push({x: lastValidX, y: Math.round(y)});
        }
    }
    
    return points;
}

function resamplePath(points, targetCount) {
    if (points.length <= 1 || points.length >= targetCount) return points;
    const result = [];
    const segments = points.length - 1;
    const extraTotal = targetCount - points.length;
    const baseExtra = Math.floor(extraTotal / segments);
    let remainder = extraTotal % segments;
    for (let i = 0; i < segments; i++) {
        const a = points[i];
        const b = points[i + 1];
        if (i === 0) result.push(a);
        let extra = baseExtra + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        for (let k = 0; k < extra; k++) {
            const t = (k + 1) / (extra + 1);
            result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        }
        result.push(b);
    }
    return result;
}

function applyTempOutlineToLineArt(ctx, width, height, originalData) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const outlineSaturationThreshold = 18;
    const edgeThreshold = 60;
    for (let yPos = 0; yPos < height - 1; yPos++) {
        for (let xPos = 0; xPos < width - 1; xPos++) {
            const i = (yPos * width + xPos) * 4;
            const r = originalData[i];
            const g = originalData[i + 1];
            const b = originalData[i + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max - min;
            const brightness = (r + g + b) / 3;
            if (saturation <= outlineSaturationThreshold || brightness >= 250) continue;
            const iRight = i + 4;
            const iDown = i + width * 4;
            const diffRight = Math.abs(r - originalData[iRight]) + Math.abs(g - originalData[iRight + 1]) + Math.abs(b - originalData[iRight + 2]);
            const diffDown = Math.abs(r - originalData[iDown]) + Math.abs(g - originalData[iDown + 1]) + Math.abs(b - originalData[iDown + 2]);
            if (Math.max(diffRight, diffDown) > edgeThreshold) {
                data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
            }
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

// --- Generation ---
generateBtn.addEventListener('click', async () => {
    if (!imgA) { alert("请先上传目标图片"); return; }
    if (!imgB) { alert("请先上传手写笔图片"); return; }
    
    generateBtn.disabled = true;
    testBtn.disabled = true;
    showStatus("正在计算绘制路径...");
    
    setTimeout(() => startGeneration({ record: true }), 100);
});

testBtn.addEventListener('click', async () => {
    if (!imgA) { alert("请先上传目标图片"); return; }
    if (!imgB) { alert("请先上传手写笔图片"); return; }

    generateBtn.disabled = true;
    testBtn.disabled = true;
    showStatus("正在预览动画...");

    setTimeout(() => startGeneration({ record: false }), 100);
});

async function startGeneration(options = {}) {
    if (animationId) clearTimeout(animationId);
    const record = options.record !== false;
    const ctx = renderCanvas.getContext('2d');
    const width = renderCanvas.width;
    const height = renderCanvas.height;
    
    const threshold = parseInt(document.getElementById('thresholdRange').value);
    const strokeWidth = parseInt(document.getElementById('strokeRange').value);
    const step = parseInt(document.getElementById('stepRange').value);
    const smoothIterations = parseInt(document.getElementById('smoothRange').value);
    const blurAmount = parseInt(document.getElementById('blurRange').value);
    const colorBrushWidth = parseInt(document.getElementById('colorBrushRange')?.value || '60');
    const colorFillEnabled = !!(colorFillCheck && colorFillCheck.checked);
    const tempOutlineEnabled = document.getElementById('tempOutlineCheck')?.checked === true;
    const drawMode = colorFillEnabled ? 'color' : 'line';
    const orderInput = document.querySelector('input[name="drawOrder"]:checked');
    const drawOrder = orderInput ? orderInput.value : 'lr';
    
    // 1. Prepare
    drawCompositionFrame();
    
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = width;
    targetCanvas.height = height;
    const tCtx = targetCanvas.getContext('2d');
    
    tCtx.fillStyle = "white";
    tCtx.fillRect(0, 0, width, height);
    
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
        
        tCtx.filter = `contrast(${100 + contrast}%)`;
        tCtx.drawImage(imgA, x, y, w, h);
        tCtx.filter = 'none';
        
        lCtx.drawImage(imgA, x, y, w, h);
        const originalImageData = lCtx.getImageData(0, 0, width, height);
        const originalData = originalImageData.data;
        
        if (drawMode === 'color' || tempOutlineEnabled) {
            const imgData = lCtx.getImageData(0, 0, width, height);
            const data = imgData.data;
            const originalDataCopy = new Uint8ClampedArray(originalData);
            const saturationThreshold = 30;
            const brightnessThreshold = 200;
            const outlineSaturationThreshold = 18;
            const edgeThreshold = 60;
            
            for (let yPos = 0; yPos < height; yPos++) {
                for (let xPos = 0; xPos < width; xPos++) {
                    const i = (yPos * width + xPos) * 4;
                    const r = originalDataCopy[i];
                    const g = originalDataCopy[i + 1];
                    const b = originalDataCopy[i + 2];
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const saturation = max - min;
                    const brightness = (r + g + b) / 3;
                    
                    let outline = false;
                    if (tempOutlineEnabled && xPos < width - 1 && yPos < height - 1) {
                        const iRight = i + 4;
                        const iDown = i + width * 4;
                        const diffRight = Math.abs(r - originalDataCopy[iRight]) + Math.abs(g - originalDataCopy[iRight + 1]) + Math.abs(b - originalDataCopy[iRight + 2]);
                        const diffDown = Math.abs(r - originalDataCopy[iDown]) + Math.abs(g - originalDataCopy[iDown + 1]) + Math.abs(b - originalDataCopy[iDown + 2]);
                        outline = Math.max(diffRight, diffDown) > edgeThreshold && saturation > outlineSaturationThreshold && brightness < 250;
                    }
                    
                    if (outline) {
                        data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
                    } else if (saturation > saturationThreshold || brightness > brightnessThreshold) {
                        data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
                    } else {
                        const darkVal = brightness < 100 ? 0 : brightness;
                        data[i] = darkVal; data[i + 1] = darkVal; data[i + 2] = darkVal;
                    }
                }
            }
            lCtx.putImageData(imgData, 0, 0);
        } else {
            lCtx.filter = `contrast(${100 + contrast}%)`;
            lCtx.clearRect(0, 0, width, height);
            lCtx.fillStyle = "white";
            lCtx.fillRect(0, 0, width, height);
            lCtx.drawImage(imgA, x, y, w, h);
            lCtx.filter = 'none';
        }
    }

    // 2. Path Finding
    const penOrigin = { x: width / 2, y: height / 2 };
    let path = getDrawingPath(lCtx, width, height, threshold, step, penOrigin, drawOrder, true);
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
        colorPath = getColoringPath(tCtx, width, height, 50);
    }

    // 3. Setup Animation
    const durationSec = parseInt(document.getElementById('durationInput').value);
    const fps = parseInt(document.getElementById('fpsSelect').value);
    const drawingFrames = durationSec * fps;
    
    let coloringFrames = 0;
    if (colorFillEnabled) {
        const colorDurationSec = parseInt(colorDurationInput ? colorDurationInput.value : 0);
        coloringFrames = colorDurationSec * fps;
    }
    // Auto-Repair Logic (New Feature)
    const isAutoRepairEnabled = document.getElementById('repairCheck').checked;
    let repairFrames = 0;
    if (isAutoRepairEnabled) {
        const repairDurationSec = 0.6;
        repairFrames = repairDurationSec * fps;
    }
    
    const holdDurationSec = parseFloat(document.getElementById('holdDurationInput').value);
    const holdFrames = holdDurationSec * fps;
    const totalFrames = drawingFrames + coloringFrames + repairFrames + holdFrames;
    const pointsPerFrame = Math.ceil(path.length / drawingFrames);
    let colorProgress = 0;
    let colorAdvance = 0;
    if (drawMode === 'color' && coloringFrames > 0 && colorPath.length > 0) {
        if (colorPath.length < coloringFrames) {
            colorPath = resamplePath(colorPath, coloringFrames);
        }
        colorAdvance = colorPath.length / coloringFrames;
    }
    
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
    let mediaRecorder = null;
    let mimeType = "video/webm";
    const chunks = [];
    if (record) {
        const stream = renderCanvas.captureStream(fps);
        if (MediaRecorder.isTypeSupported("video/mp4; codecs=avc1.4d002a")) {
            mimeType = "video/mp4; codecs=avc1.4d002a";
        } else if (MediaRecorder.isTypeSupported("video/mp4; codecs=avc1.42E01E")) {
            mimeType = "video/mp4; codecs=avc1.42E01E";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
            mimeType = "video/mp4";
        }

        mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: 5000000
        });
        
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            resultVideo.src = url;
            downloadLink.href = url;
            
            const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
            downloadLink.download = `drawing_animation.${ext}`;
            
            videoOverlay.classList.add('active');
            showStatus("生成完成");
            setTimeout(hideStatus, 2000);
            generateBtn.disabled = false;
            testBtn.disabled = false;
        };
        
        mediaRecorder.start();
    }
    
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
    
    function renderFrame() {
        if (frame >= totalFrames) {
            if (record && mediaRecorder) {
                mediaRecorder.stop();
            } else {
                showStatus("预览完成");
                setTimeout(hideStatus, 1200);
                generateBtn.disabled = false;
                testBtn.disabled = false;
            }
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
            
            colorProgress += colorAdvance;
            let endIndex = Math.min(Math.floor(colorProgress), colorPath.length);
            if (endIndex <= colorPathIndex && colorPathIndex < colorPath.length) {
                endIndex = colorPathIndex + 1;
            }
            
            // Force completion on last coloring frame
            if (frame === drawingFrames + coloringFrames - 1) {
                endIndex = colorPath.length;
            }
            
            // Draw to Color Mask
            colorMaskCtx.lineCap = 'round';
            colorMaskCtx.lineJoin = 'round';
            colorMaskCtx.lineWidth = colorBrushWidth; 
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
            
            if (isAutoRepairEnabled && (isRepairPhase || frame >= drawingFrames + coloringFrames + repairFrames)) {
                let alpha = 0;
                if (frame >= drawingFrames + coloringFrames + repairFrames) {
                    alpha = 1.0;
                } else {
                    const repairProgress = (frame - drawingFrames - coloringFrames) / repairFrames;
                    alpha = repairProgress;
                }
                if (alpha > 0) {
                    ctx.globalAlpha = alpha;
                    ctx.drawImage(targetCanvas, 0, 0);
                    ctx.globalAlpha = 1.0;
                }
            }
            
        } else {
            if (tempOutlineEnabled) {
                const tempLine = document.createElement('canvas');
                tempLine.width = width; tempLine.height = height;
                const tlc = tempLine.getContext('2d');
                tlc.drawImage(maskCanvas, 0, 0);
                tlc.globalCompositeOperation = 'source-in';
                tlc.drawImage(lineArtCanvas, 0, 0);
                ctx.drawImage(tempLine, 0, 0);
            } else {
                ctx.drawImage(maskCanvas, 0, 0);
                ctx.globalCompositeOperation = 'source-in';
                ctx.drawImage(targetCanvas, 0, 0);
            }
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
