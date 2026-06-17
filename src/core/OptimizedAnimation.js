/**
 * OptimizedAnimation class
 * Runs high-performance animations using requestAnimationFrame instead of setTimeout/setInterval.
 * Prevents UI stutter (geleo) by aligning updates with the browser's refresh rate.
 */
export class OptimizedAnimation {
  constructor() {
    this.frameId = null;
    this.startTime = 0;
    this.duration = 0;
    this.onUpdate = null;
    this.onComplete = null;
  }

  /**
   * Starts the animation
   * @param {number} duration - Duration in milliseconds
   * @param {function} onUpdate - Callback on each frame: (progress, elapsedTime) => void
   * @param {function} [onComplete] - Optional completion callback
   */
  start(duration, onUpdate, onComplete = null) {
    this.stop(); // Ensure any previous animation is stopped
    
    this.duration = duration;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.startTime = performance.now();
    this.frameId = null;

    this.animate();
  }

  animate = () => {
    const now = performance.now();
    const elapsedTime = now - this.startTime;
    const progress = Math.min(elapsedTime / this.duration, 1);

    if (this.onUpdate) {
      this.onUpdate(progress, elapsedTime);
    }

    if (progress < 1) {
      this.frameId = requestAnimationFrame(this.animate);
    } else {
      this.frameId = null;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  };

  /**
   * Stops the active animation
   */
  stop() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.onUpdate = null;
    this.onComplete = null;
  }

  /**
   * Checks if animation is currently active
   * @returns {boolean}
   */
  isAnimating() {
    return this.frameId !== null;
  }
}
