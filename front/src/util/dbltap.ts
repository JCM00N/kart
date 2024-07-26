const SPREAD = 20;
let lastTap = 0, x = 0, y = 0;

export default function doubletap(node: HTMLElement) {
  const onTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    const { clientX, clientY } = e.changedTouches[0];
    
    if (tapLength < 500 && Math.abs(clientX - x) < SPREAD && Math.abs(clientY - y) < SPREAD)
      node.dispatchEvent(new CustomEvent('dbltap', { detail: { x, y } }));  
  
    x = clientX; y = clientY; lastTap = currentTime;
  }
  
  node.addEventListener('touchend', onTouchEnd);
  return { destroy: () => node.removeEventListener('touchend', onTouchEnd) };
}
