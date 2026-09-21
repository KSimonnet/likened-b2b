/**
 * @description Animates a stat counter from zero to its data target.
 *
 * @param {HTMLElement} element - Counter element with data-target and optional data-suffix attributes.
 * @param {number} [duration=1500] - Animation duration in milliseconds.
 *
 * @returns {void} Does not return a value.
 *
 * @pre element.dataset.target is a parseable integer.
 * @post element text equals the target value when the animation completes.
 *
 * @throws {TypeError} If element is not an HTMLElement.
 */
export function animateStatCounter(element, duration = 1500) {
  if (!(element instanceof HTMLElement)) {
    throw new TypeError("element must be an HTMLElement.");
  }

  const target = Number.parseInt(element.dataset.target, 10);
  const suffix = element.dataset.suffix || "";
  const start_time = performance.now();

  function updateCounter(timestamp) {
    const progress = Math.min((timestamp - start_time) / duration, 1);
    const value = Math.floor(progress * target);
    element.textContent = `${value.toLocaleString()}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
      return;
    }

    element.textContent = `${target.toLocaleString()}${suffix}`;
  }

  requestAnimationFrame(updateCounter);
}
