import { state } from './state.js';
import { loadPresentation } from './presentation.js';
import { goToSlide, updateNavigationButtons } from './navigation.js';

export function renderHomePage() {
    const grid = document.getElementById('presentationsGrid');
    grid.innerHTML = '';

    state.presentations.forEach((pres) => {
        const card = document.createElement('div');
        card.className = 'presentation-card';
        card.onclick = () => loadPresentation(pres.file);
        
        const title = document.createElement('div');
        title.className = 'presentation-title';
        title.textContent = pres.title || pres.file.replace('.json', '');
        
        const info = document.createElement('div');
        info.className = 'presentation-info';
        info.textContent = pres.file;
        
        card.appendChild(title);
        card.appendChild(info);
        grid.appendChild(card);
    });

    document.getElementById('homePage').classList.remove('hidden');
    document.getElementById('presentationPage').classList.add('hidden');
    document.getElementById('slideIndicators').innerHTML = '';
    document.getElementById('slideCounter').textContent = '';
}

export function renderPresentation() {
    if (!state.currentPresentation || !state.currentPresentation.slides) return;

    const container = document.getElementById('slidesContainer');
    container.innerHTML = '';

    // Создание индикаторов слайдов
    const indicators = document.getElementById('slideIndicators');
    indicators.innerHTML = '';
    state.currentPresentation.slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `slide-dot ${index === state.currentSlideIndex ? 'active' : ''}`;
        dot.onclick = () => goToSlide(index);
        indicators.appendChild(dot);
    });

    // Обновление счетчика
    document.getElementById('slideCounter').textContent = 
        `${state.currentSlideIndex + 1} / ${state.currentPresentation.slides.length}`;

    // Создание слайдов
    state.currentPresentation.slides.forEach((slide, index) => {
        const slideElement = document.createElement('div');
        slideElement.className = `slide ${index === state.currentSlideIndex ? 'active' : ''}`;
        slideElement.id = `slide-${index}`;

        // Заголовок
        const title = document.createElement('div');
        title.className = 'slide-title';
        title.textContent = slide.title || 'Без названия';
        slideElement.appendChild(title);

        // Подзаголовок
        if (slide.sub_title) {
            const subtitle = document.createElement('div');
            subtitle.className = 'slide-subtitle';
            subtitle.textContent = slide.sub_title;
            slideElement.appendChild(subtitle);
        }

        // Контент
        const content = document.createElement('div');
        
        // Проверяем, есть ли контент без колонок
        if (slide.content && Array.isArray(slide.content) && slide.content.length > 0) {
            // Режим без колонок
            content.className = 'slide-content slide-content-single';
            slide.content.forEach(item => {
                content.appendChild(createContentItem(item));
            });
        } else {
            // Режим с колонками
            content.className = 'slide-content';
            
            // Левый столбец
            if (slide.left_column && slide.left_column.length > 0) {
                const leftCol = document.createElement('div');
                leftCol.className = 'column';
                slide.left_column.forEach(item => {
                    leftCol.appendChild(createContentItem(item));
                });
                content.appendChild(leftCol);
            }

            // Правый столбец
            if (slide.right_column && slide.right_column.length > 0) {
                const rightCol = document.createElement('div');
                rightCol.className = 'column';
                slide.right_column.forEach(item => {
                    rightCol.appendChild(createContentItem(item));
                });
                content.appendChild(rightCol);
            }
        }

        slideElement.appendChild(content);
        container.appendChild(slideElement);
    });

    // Обновление кнопок навигации
    updateNavigationButtons();
}

function createContentItem(item) {
    const wrapper = document.createElement('div');
    wrapper.className = 'content-item';

    if (item.type === 'text') {
        const text = document.createElement('div');
        text.className = 'content-text';
        text.textContent = item.content || '';
        wrapper.appendChild(text);
    } else if (item.type === 'code') {
        const codeBlock = document.createElement('div');
        codeBlock.className = 'content-code';
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.className = item.language ? `language-${item.language}` : '';
        code.textContent = item.content || '';
        pre.appendChild(code);
        codeBlock.appendChild(pre);
        wrapper.appendChild(codeBlock);
        // Подсветка синтаксиса
        setTimeout(() => {
            if (window.hljs) {
                hljs.highlightElement(code);
            }
        }, 0);
    } else if (item.type === 'list') {
        const list = document.createElement('div');
        list.className = 'content-list';
        const ul = document.createElement('ul');
        if (item.items && Array.isArray(item.items)) {
            item.items.forEach(itemText => {
                const li = document.createElement('li');
                li.textContent = itemText;
                ul.appendChild(li);
            });
        }
        list.appendChild(ul);
        wrapper.appendChild(list);
    }

    return wrapper;
}

