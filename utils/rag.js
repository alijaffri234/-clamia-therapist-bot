console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY);
console.log('PINECONE_ENVIRONMENT:', process.env.PINECONE_ENVIRONMENT);
console.log('PINECONE_INDEX:', process.env.PINECONE_INDEX);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// Initialize OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Initialize text splitter
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

// Initialize Pinecone (new SDK style)
export function initializePinecone() {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });
  return pinecone.index(process.env.PINECONE_INDEX);
}

// Store documents in Pinecone
export async function storeDocuments(documents) {
  const index = initializePinecone();
  const docs = await textSplitter.createDocuments(documents);
  
  const vectors = await Promise.all(
    docs.map(async (doc) => {
      const embedding = await embeddings.embedQuery(doc.pageContent);
      return {
        id: Math.random().toString(36).substring(7),
        values: embedding,
        metadata: {
          text: doc.pageContent,
          ...doc.metadata,
        },
      };
    })
  );

  await index.upsert({ vectors });
}

// Retrieve relevant context
export async function retrieveContext(query, k = 3) {
  const index = initializePinecone();
  const queryEmbedding = await embeddings.embedQuery(query);
  
  const searchResponse = await index.query({
    vector: queryEmbedding,
    topK: k,
    includeMetadata: true,
  });

  return searchResponse.matches.map(match => match.metadata.text);
}

// Add therapy-specific content to the knowledge base
export const therapyContent = [
  // Anxiety Management
  {
    content: "When dealing with anxiety, it's important to practice deep breathing exercises. Inhale for 4 counts, hold for 4, and exhale for 4. This helps activate the parasympathetic nervous system and reduce physical symptoms of anxiety.",
    metadata: { type: "anxiety", technique: "breathing" }
  },
  {
    content: "Grounding techniques can help manage anxiety in the moment. The 5-4-3-2-1 technique involves identifying 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste.",
    metadata: { type: "anxiety", technique: "grounding" }
  },
  {
    content: "Progressive muscle relaxation is an effective anxiety management technique. Systematically tense and relax different muscle groups, starting from your toes and moving up to your head.",
    metadata: { type: "anxiety", technique: "relaxation" }
  },

  // Depression Support
  {
    content: "For depression, maintaining a regular sleep schedule and engaging in physical activity can help improve mood. Even a 10-minute walk can release endorphins and improve your mental state.",
    metadata: { type: "depression", technique: "lifestyle" }
  },
  {
    content: "Behavioral activation is a key technique for depression. Break down daily activities into small, manageable steps and gradually increase engagement in pleasurable activities.",
    metadata: { type: "depression", technique: "behavioral" }
  },
  {
    content: "Cognitive restructuring helps with depression by identifying and challenging negative thought patterns. Ask yourself: 'Is this thought helpful? Is it based on facts? What's a more balanced way to look at this?'",
    metadata: { type: "depression", technique: "cognitive" }
  },

  // Relationship Counseling
  {
    content: "In relationship counseling, active listening involves giving full attention, reflecting back what you hear, and asking clarifying questions. This helps build understanding and trust between partners.",
    metadata: { type: "relationships", technique: "communication" }
  },
  {
    content: "The 'I' statement technique helps express feelings without blaming: 'I feel [emotion] when [specific situation] because [reason].' This promotes constructive dialogue and reduces defensiveness.",
    metadata: { type: "relationships", technique: "communication" }
  },
  {
    content: "Setting healthy boundaries in relationships involves clearly communicating your needs, limits, and expectations. It's important to be consistent and respectful when enforcing boundaries.",
    metadata: { type: "relationships", technique: "boundaries" }
  },

  // Stress Management
  {
    content: "Time management is crucial for stress reduction. Use the Eisenhower Matrix to prioritize tasks: urgent and important, important but not urgent, urgent but not important, and neither urgent nor important.",
    metadata: { type: "stress", technique: "management" }
  },
  {
    content: "Mindfulness meditation can reduce stress by bringing attention to the present moment. Start with just 5 minutes daily, focusing on your breath and gently bringing your mind back when it wanders.",
    metadata: { type: "stress", technique: "mindfulness" }
  },
  {
    content: "Self-care is essential for stress management. Create a daily routine that includes adequate sleep, healthy eating, regular exercise, and activities you enjoy.",
    metadata: { type: "stress", technique: "self-care" }
  },

  // Grief Support
  {
    content: "The grieving process is unique to each person. Allow yourself to feel all emotions without judgment. There's no 'right' way to grieve, and healing takes time.",
    metadata: { type: "grief", technique: "emotional" }
  },
  {
    content: "Creating rituals can help process grief. This might include writing letters to your loved one, creating a memory book, or establishing new traditions to honor their memory.",
    metadata: { type: "grief", technique: "ritual" }
  },
  {
    content: "Self-compassion is crucial during grief. Treat yourself with the same kindness you would offer a friend, acknowledging that grief is a natural response to loss.",
    metadata: { type: "grief", technique: "self-compassion" }
  },

  // Self-Esteem Building
  {
    content: "Challenge negative self-talk by identifying cognitive distortions like all-or-nothing thinking, overgeneralization, and mental filtering. Replace them with more balanced thoughts.",
    metadata: { type: "self-esteem", technique: "cognitive" }
  },
  {
    content: "Practice self-compassion by treating yourself with the same kindness you'd show a friend. Acknowledge your struggles without judgment and recognize that imperfection is part of being human.",
    metadata: { type: "self-esteem", technique: "self-compassion" }
  },
  {
    content: "Set realistic goals and celebrate small achievements. Break larger goals into manageable steps and acknowledge your progress, no matter how small.",
    metadata: { type: "self-esteem", technique: "goal-setting" }
  },

  // Crisis Support
  {
    content: "If someone expresses thoughts of self-harm, stay calm and listen without judgment. Ask directly about their intentions and ensure they're safe. Connect them with emergency services if needed.",
    metadata: { type: "crisis", technique: "intervention" }
  },
  {
    content: "During a panic attack, help the person focus on their breathing. Guide them through slow, deep breaths and remind them that the attack will pass. Stay present and offer reassurance.",
    metadata: { type: "crisis", technique: "support" }
  },
  {
    content: "For acute stress, use the STOP technique: Stop, Take a step back, Observe your thoughts and feelings, Proceed mindfully. This helps create space between the stressor and your response.",
    metadata: { type: "crisis", technique: "coping" }
  }
];

// Initialize the knowledge base
export async function initializeKnowledgeBase() {
  await storeDocuments(therapyContent.map(item => item.content));
} 