// Wait for the HTML to be fully loaded before running
document.addEventListener('DOMContentLoaded', () => {

  const menuBtn = document.getElementById('menu-toggle-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  function toggleSidebar() {
    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', isOpen);
  }

  // Toggle sidebar on button click
  menuBtn.addEventListener('click', toggleSidebar);

  // Close sidebar on overlay click
  overlay.addEventListener('click', toggleSidebar);

});
