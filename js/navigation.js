import { state, setCurrentSlideIndex, resetState } from './state.js';
import { renderPresentation, renderHomePage } from './render.js';

export function goToSlide(index) {
    if (!state.currentPresentation || index < 0 || index >= state.currentPresentation.slides.length) return;
    
    setCurrentSlideIndex(index);
    renderPresentation();
}

export function nextSlide() {
    if (state.currentPresentation && state.currentSlideIndex < state.currentPresentation.slides.length - 1) {
        goToSlide(state.currentSlideIndex + 1);
    }
}

export function previousSlide() {
    if (state.currentSlideIndex > 0) {
        goToSlide(state.currentSlideIndex - 1);
    }
}

export function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn && nextBtn && state.currentPresentation) {
        prevBtn.disabled = state.currentSlideIndex === 0;
        nextBtn.disabled = state.currentSlideIndex === state.currentPresentation.slides.length - 1;
    }
}

export function goHome() {
    resetState();
    renderHomePage();
}

