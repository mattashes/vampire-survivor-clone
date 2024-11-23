export class InputManager {
    constructor() {
        this.mousePosition = { x: 0, y: 0 };
        this.initializeListeners();
    }

    initializeListeners() {
        // Mouse events
        window.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        });
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }
}
