/**
 * Adaptador: localStorage. Implementa StoragePort y nunca lanza excepciones
 * (modo incógnito, almacenamiento bloqueado, etc.).
 */
export function createLocalStorageAdapter() {
  function get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (error) {
      /* sin persistencia disponible: se ignora */
    }
  }

  return { get, set };
}
