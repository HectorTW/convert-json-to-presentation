import { setCurrentPresentation, setCurrentSlideIndex } from './state.js';
import { renderPresentation } from './render.js';
import { loadPresentation as loadPresentationData } from './load.js';

export async function loadPresentation(filename) {
    try {
        const data = await loadPresentationData(filename);
        setCurrentPresentation(data);
        setCurrentSlideIndex(0);
        renderPresentation();
        document.getElementById('homePage').classList.add('hidden');
        document.getElementById('presentationPage').classList.remove('hidden');
    } catch (error) {
        console.error('Ошибка загрузки презентации:', error);
        alert('Не удалось загрузить презентацию');
    }
}

