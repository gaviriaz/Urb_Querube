/**
 * AntiGeleo class
 * Monitors frame rendering times to detect stuttering (geleo).
 * If frame rate drops below 30 FPS, it dispatches an event to reduce graphics quality.
 */
export class AntiGeleo {
  constructor() {
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;
    this.isGeleo = false;
    this.consecutiveGeleoFrames = 0;
  }

  static getInstance() {
    if (!AntiGeleo.instance) {
      AntiGeleo.instance = new AntiGeleo();
    }
    return AntiGeleo.instance;
  }

  /**
   * Checks the current frame rendering speed
   * Call this in the requestAnimationFrame loop or periodic check
   */
  checkFrame() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.frameCount++;

    // Calculate instantaneous FPS
    if (delta > 0) {
      const currentFps = 1000 / delta;
      
      // Calculate a running average for FPS to avoid jumpy values
      this.fps = this.fps * 0.9 + currentFps * 0.1;
    }

    // Every 30 frames, assess if there is stuttering
    if (this.frameCount >= 30) {
      this.frameCount = 0;
      
      // If FPS average is below 32, detect as geleo
      const oldIsGeleo = this.isGeleo;
      this.isGeleo = this.fps < 32;

      if (this.isGeleo) {
        this.consecutiveGeleoFrames++;
        // If we get persistent geleo (e.g. over 2 checks = ~60 frames), trigger quality reduction
        if (this.consecutiveGeleoFrames >= 2) {
          console.warn('⚠️ AntiGeleo detected persistent stutter. Current FPS:', Math.round(this.fps));
          this.triggerQualityReduction();
          this.consecutiveGeleoFrames = 0;
        }
      } else {
        this.consecutiveGeleoFrames = 0;
      }
    }

    return { fps: Math.round(this.fps), isGeleo: this.isGeleo };
  }

  triggerQualityReduction() {
    // Dispatch custom event to notify React / App component to reduce graphics
    const event = new CustomEvent('anti-geleo-trigger', {
      detail: { fps: this.fps }
    });
    window.dispatchEvent(event);
  }

  getFPS() {
    return Math.round(this.fps);
  }
}

AntiGeleo.instance = null;
