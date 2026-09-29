import "@happy-dom/global-registrator/register.js";

// happy-dom has no layout, so every box measures 0×0. Base UI hides edge-aligned slider
// thumbs until it can measure a real size, which would hide them from role queries.
const box = { x: 0, y: 0, top: 0, left: 0, width: 100, height: 16, right: 100, bottom: 16 };
HTMLElement.prototype.getBoundingClientRect = () => DOMRect.fromRect(box);
