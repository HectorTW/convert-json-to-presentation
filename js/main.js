import { loadPresentations } from './load.js';
import { renderHomePage } from './render.js';
import { goHome, nextSlide, previousSlide } from './navigation.js';
import { state } from './state.js';

async function init() {
    // Загрузка списка презентаций
    await loadPresentations();
    
    // Отображение домашней страницы
    renderHomePage();
    
    // Привязка обработчиков событий к кнопкам
    initEventHandlers();
    
    // Инициализация клавиатурной навигации
    initKeyboardNavigation();
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (state.currentPresentation) {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                previousSlide();
            } else if (e.key === 'Home') {
                e.preventDefault();
                goHome();
            }
        }
    });
}
