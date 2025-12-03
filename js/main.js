import { loadPresentations } from './load.js';
import { renderHomePage } from './render.js';
import { goHome, nextSlide, previousSlide } from './navigation.js';
import { state } from './state.js';
import { initDrawingUI, setColor, setMode } from './drawing.js';

async function init() {
    // Загрузка списка презентаций
    await loadPresentations();
    
    // Отображение домашней страницы
    renderHomePage();
    
    // Привязка обработчиков событий к кнопкам
    initEventHandlers();
    
    // Инициализация клавиатурной навигации
    initKeyboardNavigation();
    
    // Инициализация UI для рисования
    initDrawingUI();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function initEventHandlers() {
    // Кнопка "Домой"
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', goHome);
    }
    
    // Кнопка "Предыдущий слайд"
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', previousSlide);
    }
    
    // Кнопка "Следующий слайд"
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }
}
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (state.currentPresentation) {
            console.log('e.key :>> ', e);
            if (e.key === 'ArrowRight' || e.key === ' ' || e.code === 'KeyD') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft' || e.code === 'KeyA') {
                e.preventDefault();
                previousSlide();
            } else if (e.key === 'Home') {
                e.preventDefault();
                goHome();
            } else if (e.code === 'Digit1'){
                setColor("red");
            } else if (e.code === 'Digit2'){
                setColor("green");
            } else if (e.code === 'Digit3'){
                setColor("blue");
            } else if (e.code === 'Digit4'){
                setColor("yellow");
            } else if (e.code === 'KeyQ'){
                setMode("highlight");
            } else if (e.code === 'KeyW'){
                setMode("line");
            } else if (e.code === 'KeyE'){
                setMode("eraser");
            } else if (e.code === 'KeyR'){
                setMode("pen");
            }
        }
    });
}
