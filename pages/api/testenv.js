export default function handler(req, res) {
  res.json({
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
    PINECONE_INDEX: process.env.PINECONE_INDEX,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  });
} 