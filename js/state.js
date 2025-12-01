export const state = {
    currentPresentation: null,
    currentSlideIndex: 0,
    presentations: []
};

export function setCurrentPresentation(presentation) {
    state.currentPresentation = presentation;
}

export function setCurrentSlideIndex(index) {
    state.currentSlideIndex = index;
}

export function setPresentations(presentations) {
    state.presentations = presentations;
}

export function resetState() {
    state.currentPresentation = null;
    state.currentSlideIndex = 0;
}

