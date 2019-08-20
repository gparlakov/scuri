Object.defineProperty(window, 'getComputedStyle', {
    value: () => ['-webkit-appearance'],
});

Element.prototype.scrollIntoView = jest.fn();
window.scrollBy = jest.fn();
