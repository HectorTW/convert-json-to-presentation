import { setPresentations } from './state.js';

export async function loadPresentations() {
    try {
        const response = await fetch('presentations/list.json');
        const data = await response.json();
        const presentations = data.presentations || [];
        setPresentations(presentations);
        return presentations;
    } catch (error) {
        console.error('Ошибка загрузки списка презентаций:', error);
        // Если файл не найден, попробуем найти JSON файлы автоматически
        return await findPresentations();
    }
}

async function findPresentations() {
    const knownPresentations = ['example.json'];
    const presentations = knownPresentations.map(name => ({
        file: name,
        title: name.replace('.json', '').replace(/_/g, ' ')
    }));
    setPresentations(presentations);
    return presentations;
}

export async function loadPresentation(filename) {
    try {
        const response = await fetch(`presentations/${filename}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка загрузки презентации:', error);
        throw error;
    }
}

