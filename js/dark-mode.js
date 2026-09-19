/**
 * @description Dark mode toggle initialization for Likened webapp.
 * Handles toggle button click to switch between light/dark themes.
 *
 * @pre index.html loaded with #toggle-dark button
 * @post Dark mode toggles on button click
 */
document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("toggle-dark");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      document.documentElement.classList.toggle("dark");
    });
  }
});
