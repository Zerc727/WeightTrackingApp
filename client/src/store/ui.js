import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const darkMode = ref(false);

  function initTheme() {
    const stored = localStorage.getItem('darkMode');
    darkMode.value = stored === 'true';
    applyTheme();
  }

  function applyTheme() {
    if (darkMode.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleTheme() {
    darkMode.value = !darkMode.value;
    localStorage.setItem('darkMode', darkMode.value);
    applyTheme();
  }

  return { darkMode, initTheme, toggleTheme };
});
