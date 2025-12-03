// Модуль для рисования пером на слайдах

const drawingState = {
    mode: 'pen', // 'pen', 'eraser', 'line', 'highlight'
    color: '#ff0000', // красный по умолчанию
    lineWidth: 5, // средняя толщина по умолчанию
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    lineStartX: 0,
    lineStartY: 0,
    canvases: new Map(), // хранит canvas для каждого слайда
    tempCanvases: new Map() // временные canvas для предпросмотра линий
};

// Цвета
const COLORS = {
    red: '#ff0000',
    green: '#00ff00',
    blue: '#00ffff',
    yellow: '#ffff00'
};

// Толщины
const LINE_WIDTHS = {
    small: 3,
    medium: 5,
    large: 8
};

// Конвертация hex цвета в rgba с прозрачностью
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function initDrawing() {
    // Инициализация будет вызвана после рендеринга слайдов
}

export function setupCanvasForSlide(slideIndex) {
    const slideElement = document.getElementById(`slide-${slideIndex}`);
    if (!slideElement) return;

    // Проверяем, есть ли уже canvas
    let canvas = slideElement.querySelector('.drawing-canvas');
    let tempCanvas = slideElement.querySelector('.drawing-temp-canvas');

    // Создаем основной canvas для рисования
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'drawing-canvas';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'auto';
        canvas.style.zIndex = '10';
        
        slideElement.style.position = 'relative';
        slideElement.appendChild(canvas);
        
        // Сохраняем контекст
        const ctx = canvas.getContext('2d');
        drawingState.canvases.set(slideIndex, { canvas, ctx });
        
        // Устанавливаем размеры после добавления в DOM
        updateCanvasSize(canvas, slideElement);
        
        // Восстанавливаем сохраненное изображение, если есть
        restoreCanvasState(slideIndex);
    } else {
        // Обновляем размеры существующего canvas
        updateCanvasSize(canvas, slideElement);
    }

    // Создаем временный canvas для предпросмотра линий
    if (!tempCanvas) {
        tempCanvas = document.createElement('canvas');
        tempCanvas.className = 'drawing-temp-canvas';
        tempCanvas.style.position = 'absolute';
        tempCanvas.style.top = '0';
        tempCanvas.style.left = '0';
        tempCanvas.style.width = '100%';
        tempCanvas.style.height = '100%';
        tempCanvas.style.pointerEvents = 'none';
        tempCanvas.style.zIndex = '11';
        
        slideElement.appendChild(tempCanvas);
        
        const tempCtx = tempCanvas.getContext('2d');
        drawingState.tempCanvases.set(slideIndex, { canvas: tempCanvas, ctx: tempCtx });
        
        // Устанавливаем размеры
        updateCanvasSize(tempCanvas, slideElement);
    } else {
        // Обновляем размеры существующего временного canvas
        updateCanvasSize(tempCanvas, slideElement);
    }

    // Настраиваем обработчики событий (только если еще не настроены)
    if (!canvas.dataset.handlersAttached) {
        setupCanvasEventHandlers(canvas, slideIndex);
        canvas.dataset.handlersAttached = 'true';
    }
}

function updateCanvasSize(canvas, slideElement) {
    const rect = slideElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    const isMainCanvas = canvas.classList.contains('drawing-canvas');
    const isTempCanvas = canvas.classList.contains('drawing-temp-canvas');
    
    // Сохраняем текущее изображение перед изменением размера (только для основного canvas)
    const slideIndex = parseInt(slideElement.id.match(/slide-(\d+)/)[1]);
    let savedImage = null;
    
    if (isMainCanvas && canvas.width > 0 && canvas.height > 0) {
        const canvasData = drawingState.canvases.get(slideIndex);
        if (canvasData) {
            savedImage = canvas.toDataURL();
        }
    }
    
    // Устанавливаем размеры с учетом devicePixelRatio для четкости
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    // Восстанавливаем изображение только для основного canvas
    if (isMainCanvas) {
        if (savedImage) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, rect.width, rect.height);
                ctx.drawImage(img, 0, 0, rect.width, rect.height);
            };
            img.src = savedImage;
        } else {
            // Пытаемся восстановить из сохраненного состояния
            restoreCanvasState(slideIndex);
        }
    } else if (isTempCanvas) {
        // Для временного canvas просто очищаем
        ctx.clearRect(0, 0, rect.width, rect.height);
    }
}

function setupCanvasEventHandlers(canvas, slideIndex) {
    const canvasData = drawingState.canvases.get(slideIndex);
    const tempCanvasData = drawingState.tempCanvases.get(slideIndex);
    
    if (!canvasData || !tempCanvasData) return;
    
    const ctx = canvasData.ctx;
    const tempCtx = tempCanvasData.ctx;
    const tempCanvas = tempCanvasData.canvas;

    function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        // Координаты уже масштабированы через ctx.scale, поэтому используем реальные размеры
        return {
            x: (e.clientX - rect.left),
            y: (e.clientY - rect.top)
        };
    }

    function startDrawing(e) {
        // Проверяем, что это перо (не мышь и не тачскрин)
        if (e.pointerType !== 'pen') return;
        
        e.preventDefault();
        const coords = getCanvasCoordinates(e);
        drawingState.isDrawing = true;
        drawingState.lastX = coords.x;
        drawingState.lastY = coords.y;
        drawingState.lineStartX = coords.x;
        drawingState.lineStartY = coords.y;

        if (drawingState.mode === 'line' || drawingState.mode === 'highlight') {
            // Для режима линий и выделения начинаем рисовать на временном canvas
            const rect = tempCanvas.getBoundingClientRect();
            tempCtx.clearRect(0, 0, rect.width, rect.height);
            
            if (drawingState.mode === 'highlight') {
                // Для выделения: увеличенная толщина и прозрачность
                const highlightColor = hexToRgba(drawingState.color, 0.3);
                tempCtx.strokeStyle = highlightColor;
                tempCtx.lineWidth = drawingState.lineWidth * 5;
            } else {
                tempCtx.strokeStyle = drawingState.color;
                tempCtx.lineWidth = drawingState.lineWidth;
            }
            
            tempCtx.lineCap = 'round';
            tempCtx.beginPath();
            tempCtx.moveTo(coords.x, coords.y);
        } else if (drawingState.mode === 'pen') {
            ctx.strokeStyle = drawingState.color;
            ctx.lineWidth = drawingState.lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
        } else if (drawingState.mode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = drawingState.lineWidth * 10; // ластик чуть больше
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
        }
    }

    function draw(e) {
        // Проверяем, что это перо
        if (e.pointerType !== 'pen') return;
        if (!drawingState.isDrawing) return;
        
        e.preventDefault();
        const coords = getCanvasCoordinates(e);

        if (drawingState.mode === 'line' || drawingState.mode === 'highlight') {
            // Для линий и выделения рисуем на временном canvas
            const rect = tempCanvas.getBoundingClientRect();
            tempCtx.clearRect(0, 0, rect.width, rect.height);
            
            if (drawingState.mode === 'highlight') {
                // Для выделения: увеличенная толщина и прозрачность
                const highlightColor = hexToRgba(drawingState.color, 0.3);
                tempCtx.strokeStyle = highlightColor;
                tempCtx.lineWidth = drawingState.lineWidth * 5;
            } else {
                tempCtx.strokeStyle = drawingState.color;
                tempCtx.lineWidth = drawingState.lineWidth;
            }
            
            tempCtx.lineCap = 'round';
            tempCtx.beginPath();
            
            // Определяем, горизонтальная или вертикальная линия
            const deltaX = Math.abs(coords.x - drawingState.lineStartX);
            const deltaY = Math.abs(coords.y - drawingState.lineStartY);
            
            if (deltaX > deltaY) {
                // Горизонтальная линия
                tempCtx.moveTo(drawingState.lineStartX, drawingState.lineStartY);
                tempCtx.lineTo(coords.x, drawingState.lineStartY);
            } else {
                // Вертикальная линия
                tempCtx.moveTo(drawingState.lineStartX, drawingState.lineStartY);
                tempCtx.lineTo(drawingState.lineStartX, coords.y);
            }
            tempCtx.stroke();
        } else {
            // Для пера и ластика рисуем на основном canvas
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
            drawingState.lastX = coords.x;
            drawingState.lastY = coords.y;
        }
    }

    function stopDrawing(e) {
        // Проверяем, что это перо
        if (e.pointerType !== 'pen') return;
        if (!drawingState.isDrawing) return;
        
        e.preventDefault();
        const coords = getCanvasCoordinates(e);

        if (drawingState.mode === 'line' || drawingState.mode === 'highlight') {
            // Переносим линию с временного canvas на основной
            const deltaX = Math.abs(coords.x - drawingState.lineStartX);
            const deltaY = Math.abs(coords.y - drawingState.lineStartY);
            
            if (drawingState.mode === 'highlight') {
                // Для выделения: увеличенная толщина и прозрачность
                const highlightColor = hexToRgba(drawingState.color, 0.3);
                ctx.strokeStyle = highlightColor;
                ctx.lineWidth = drawingState.lineWidth * 5;
            } else {
                ctx.strokeStyle = drawingState.color;
                ctx.lineWidth = drawingState.lineWidth;
            }
            
            ctx.lineCap = 'round';
            ctx.beginPath();
            
            if (deltaX > deltaY) {
                // Горизонтальная линия
                ctx.moveTo(drawingState.lineStartX, drawingState.lineStartY);
                ctx.lineTo(coords.x, drawingState.lineStartY);
            } else {
                // Вертикальная линия
                ctx.moveTo(drawingState.lineStartX, drawingState.lineStartY);
                ctx.lineTo(drawingState.lineStartX, coords.y);
            }
            ctx.stroke();
            
            // Очищаем временный canvas
            const rect = tempCanvas.getBoundingClientRect();
            tempCtx.clearRect(0, 0, rect.width, rect.height);
        } else if (drawingState.mode === 'eraser') {
            ctx.globalCompositeOperation = 'source-over'; // возвращаем нормальный режим
        }

        drawingState.isDrawing = false;
        saveCanvasState(slideIndex);
    }

    canvas.addEventListener('pointerdown', startDrawing);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointerleave', stopDrawing);
}

// Сохранение состояния canvas
function saveCanvasState(slideIndex) {
    const canvasData = drawingState.canvases.get(slideIndex);
    if (canvasData) {
        const imageData = canvasData.canvas.toDataURL();
        if (!drawingState.canvasStates) {
            drawingState.canvasStates = new Map();
        }
        drawingState.canvasStates.set(slideIndex, imageData);
    }
}

// Восстановление состояния canvas
function restoreCanvasState(slideIndex) {
    if (!drawingState.canvasStates) return;
    
    const imageData = drawingState.canvasStates.get(slideIndex);
    if (imageData) {
        const canvasData = drawingState.canvases.get(slideIndex);
        if (canvasData && canvasData.canvas.width > 0 && canvasData.canvas.height > 0) {
            const slideElement = document.getElementById(`slide-${slideIndex}`);
            if (slideElement) {
                const rect = slideElement.getBoundingClientRect();
                const img = new Image();
                img.onload = () => {
                    canvasData.ctx.clearRect(0, 0, rect.width, rect.height);
                    canvasData.ctx.drawImage(img, 0, 0, rect.width, rect.height);
                };
                img.src = imageData;
            }
        }
    }
}

// Инициализация canvas для всех слайдов
export function initAllCanvases() {
    if (!drawingState.canvasStates) {
        drawingState.canvasStates = new Map();
    }
    
    // Находим все слайды
    const slides = document.querySelectorAll('.slide');
    slides.forEach((slide, index) => {
        setupCanvasForSlide(index);
    });
    
    // Добавляем обработчик изменения размера окна
    if (!drawingState.resizeHandlerAttached) {
        window.addEventListener('resize', () => {
            // Обновляем размеры всех canvas при изменении размера окна
            setTimeout(() => {
                const slides = document.querySelectorAll('.slide');
                slides.forEach((slide) => {
                    const index = parseInt(slide.id.match(/slide-(\d+)/)[1]);
                    setupCanvasForSlide(index);
                });
            }, 100);
        });
        drawingState.resizeHandlerAttached = true;
    }
}

// Очистка canvas текущего слайда
export function clearCurrentSlide() {
    const slideIndex = getCurrentSlideIndex();
    if (slideIndex === null) return;
    
    const canvasData = drawingState.canvases.get(slideIndex);
    const tempCanvasData = drawingState.tempCanvases.get(slideIndex);
    
    if (canvasData) {
        canvasData.ctx.clearRect(0, 0, canvasData.canvas.width, canvasData.canvas.height);
        saveCanvasState(slideIndex);
    }
    
    if (tempCanvasData) {
        tempCanvasData.ctx.clearRect(0, 0, tempCanvasData.canvas.width, tempCanvasData.canvas.height);
    }
}

function getCurrentSlideIndex() {
    const activeSlide = document.querySelector('.slide.active');
    if (!activeSlide) return null;
    
    const id = activeSlide.id;
    const match = id.match(/slide-(\d+)/);
    return match ? parseInt(match[1]) : null;
}

// Установка цвета
export function setColor(color) {
    drawingState.color = COLORS[color] || COLORS.red;
    updateColorButtons();
}

// Установка толщины
export function setLineWidth(size) {
    drawingState.lineWidth = LINE_WIDTHS[size] || LINE_WIDTHS.medium;
    updateLineWidthButtons();
}

// Установка режима
export function setMode(mode) {
    drawingState.mode = mode;
    updateModeButtons();
}

// Обновление UI кнопок
function updateColorButtons() {
    const buttons = document.querySelectorAll('.draw-color-btn');
    buttons.forEach(btn => {
        const color = btn.dataset.color;
        if (COLORS[color] === drawingState.color) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function updateLineWidthButtons() {
    const buttons = document.querySelectorAll('.draw-width-btn');
    buttons.forEach(btn => {
        const size = btn.dataset.size;
        if (LINE_WIDTHS[size] === drawingState.lineWidth) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function updateModeButtons() {
    const penBtn = document.getElementById('drawPenBtn');
    const eraserBtn = document.getElementById('drawEraserBtn');
    const lineBtn = document.getElementById('drawLineBtn');
    const highlightBtn = document.getElementById('drawHighlightBtn');
    
    if (penBtn) penBtn.classList.toggle('active', drawingState.mode === 'pen');
    if (eraserBtn) eraserBtn.classList.toggle('active', drawingState.mode === 'eraser');
    if (lineBtn) lineBtn.classList.toggle('active', drawingState.mode === 'line');
    if (highlightBtn) highlightBtn.classList.toggle('active', drawingState.mode === 'highlight');
}

// Инициализация UI кнопок
export function initDrawingUI() {
    // Кнопки цветов
    document.querySelectorAll('.draw-color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setColor(btn.dataset.color);
        });
    });

    // Кнопки толщины
    document.querySelectorAll('.draw-width-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setLineWidth(btn.dataset.size);
        });
    });

    // Кнопка ластика
    const eraserBtn = document.getElementById('drawEraserBtn');
    if (eraserBtn) {
        eraserBtn.addEventListener('click', () => {
            setMode('eraser');
        });
    }

    // Кнопка пера
    const penBtn = document.getElementById('drawPenBtn');
    if (penBtn) {
        penBtn.addEventListener('click', () => {
            setMode('pen');
        });
    }

    // Кнопка линий
    const lineBtn = document.getElementById('drawLineBtn');
    if (lineBtn) {
        lineBtn.addEventListener('click', () => {
            setMode('line');
        });
    }

    // Кнопка выделения
    const highlightBtn = document.getElementById('drawHighlightBtn');
    if (highlightBtn) {
        highlightBtn.addEventListener('click', () => {
            setMode('highlight');
        });
    }

    // Кнопка очистки
    const clearBtn = document.getElementById('drawClearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearCurrentSlide();
        });
    }

    // Устанавливаем начальные состояния
    updateColorButtons();
    updateLineWidthButtons();
    updateModeButtons();
}

