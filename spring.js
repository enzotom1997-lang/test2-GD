(function () {
  /**
   * Shared spring animator used across the app.
   * Exposed as window.createSpringAnimator so both classic and module scripts can use it.
   */
  function createSpringAnimator(el, options = {}) {
    const targetGrow = options.grow ?? 1.20;
    const restScale = 1.0;
    const stiffness = options.stiffness ?? 1600;
    const damping = options.damping ?? 18;
    const mass = options.mass ?? 0.7;
    const baseTransform = options.baseTransform ? options.baseTransform + ' ' : '';
    const shrinkBehavior = !!options.shrink;
    const perBounceDecay = options.perBounceDecay ?? 0.6;

    let animationId = null;
    let velocity = 0;
    let scale = restScale;
    let target = restScale;
    let delayedTimer = null;
    let prevVelocity = 0;

    function apply() {
      const dt = 1 / 60;
      const force = -stiffness * (scale - target);
      const accel = force / mass;
      velocity += accel * dt;
      velocity *= Math.exp(-damping * dt);

      if (prevVelocity !== 0 && prevVelocity * velocity < 0) {
        velocity *= perBounceDecay;
      }
      prevVelocity = velocity;

      scale += velocity * dt;
      el.style.transform = `${baseTransform}translateZ(0) scale(${scale})`;

      if (
        animationId &&
        Math.abs(scale - target) < 0.0015 &&
        Math.abs(velocity) < 0.0015
      ) {
        cancelAnimationFrame(animationId);
        animationId = null;
        velocity = 0;
        scale = target;
        el.style.transform = `${baseTransform}translateZ(0) scale(${scale})`;
        return;
      }

      animationId = requestAnimationFrame(apply);
    }

    return {
      press() {
        if (delayedTimer) {
          clearTimeout(delayedTimer);
          delayedTimer = null;
        }

        if (shrinkBehavior) {
          target = restScale * 0.94;
          if (!animationId) animationId = requestAnimationFrame(apply);

          delayedTimer = setTimeout(() => {
            target = restScale * (targetGrow * 0.82);
            delayedTimer = null;
            if (!animationId) animationId = requestAnimationFrame(apply);
          }, 36);
        } else {
          target = restScale * 1.04;
          if (!animationId) animationId = requestAnimationFrame(apply);

          delayedTimer = setTimeout(() => {
            target = targetGrow;
            delayedTimer = null;
            if (!animationId) animationId = requestAnimationFrame(apply);
          }, 36);
        }
      },
      release() {
        if (delayedTimer) {
          clearTimeout(delayedTimer);
          delayedTimer = null;
        }
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        velocity = 0;
        scale = restScale;
        target = restScale;
        el.style.transform = `${baseTransform}translateZ(0) scale(${restScale})`;
      },
      stopImmediate() {
        if (delayedTimer) {
          clearTimeout(delayedTimer);
          delayedTimer = null;
        }
        if (animationId) cancelAnimationFrame(animationId);
        animationId = null;
        velocity = 0;
        scale = restScale;
        target = restScale;
        el.style.transform = '';
      }
    };
  }

  // Expose globally for main.js and any other scripts
  window.createSpringAnimator = createSpringAnimator;
})();