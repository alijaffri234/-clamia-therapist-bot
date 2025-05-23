const { initializeKnowledgeBase } = require('../utils/rag');

async function init() {
  try {
    await initializeKnowledgeBase();
    console.log('Knowledge base initialized successfully');
  } catch (error) {
    console.error('Error initializing knowledge base:', error);
  }
}

init();