// Puter.js Service pour GPT-4o

/**
 * Service pour interagir avec l'API GPT-4o via puter.js
 */
const puterService = {
  /**
   * Vérifie si puter.js est disponible et fonctionnel
   * @returns {Promise<boolean>} - true si puter.js est disponible, false sinon
   */
  checkAvailability: async () => {
    try {
      // Vérifie si puter.js est chargé dans l'objet window
      if (typeof window.puter === 'undefined') {
        console.error('Puter.js n\'est pas disponible');
        return false;
      }

      // Vérifie si l'API AI est disponible
      if (!window.puter.ai || !window.puter.ai.chat) {
        console.error('L\'API AI de puter.js n\'est pas disponible');
        return false;
      }

      // Essaie un appel simple pour vérifier que l'API répond
      const testResult = await window.puter.ai.chat("Test connection", {
        model: 'gpt-4o',
        temperature: 0.1,
        max_tokens: 10
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification de puter.js:', error);
      return false;
    }
  },

  /**
   * Génère une réponse à partir de l'API GPT-4o via puter.js
   * @param {string} prompt - Le prompt à envoyer à l'API
   * @param {Object} userData - Les données utilisateur à inclure dans la requête
   * @param {Object} options - Options supplémentaires pour la requête
   * @returns {Promise<string>} - La réponse de l'API
   */
  generateCompletion: async (prompt, userData = {}, options = {}) => {
    try {
      // Vérifie si puter.js est disponible
      if (typeof window.puter === 'undefined') {
        throw new Error('Puter.js n\'est pas disponible');
      }

      // Vérifie si l'API AI est disponible
      if (!window.puter.ai || !window.puter.ai.chat) {
        throw new Error('L\'API AI de puter.js n\'est pas disponible');
      }

      console.log('Appel à GPT-4o via puter.js...');
      
      // Appel à l'API avec les paramètres par défaut ou personnalisés
      const result = await window.puter.ai.chat(prompt, {
        model: options.model || 'gpt-4o',
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        user: JSON.stringify(userData)
      });

      console.log('Réponse de GPT-4o reçue');

      // Vérifie si la réponse est valide
      if (result && result.message && result.message.content) {
        return result.message.content;
      } else {
        throw new Error('Format de réponse AI invalide');
      }
    } catch (error) {
      console.error('Erreur lors de l\'appel à l\'API GPT-4o:', error);
      throw new Error('Impossible de générer une réponse. Veuillez réessayer plus tard.');
    }
  }
};

export default puterService;