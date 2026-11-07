// トップアプリバー: スクロール時に surface-container へ切り替え（M3 の on-scroll 状態）
(function () {
  const bar = document.querySelector('.top-app-bar');
  if (!bar) return;
  const update = () => bar.classList.toggle('scrolled', window.scrollY > 4);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
