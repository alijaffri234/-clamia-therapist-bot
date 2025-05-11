// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute
const ipRequestCounts = new Map();

// Request validation schema
const validateRequest = (messages) => {
  if (!Array.isArray(messages)) {
    throw new Error('Messages must be an array');
  }
  
  if (messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }

  for (const message of messages) {
    if (!message.role || !message.content) {
      throw new Error('Each message must have a role and content');
    }
    if (!['user', 'assistant', 'system'].includes(message.role)) {
      throw new Error('Invalid message role');
    }
    if (typeof message.content !== 'string') {
      throw new Error('Message content must be a string');
    }
  }
};

// Logging function
const logRequest = (req, status, error = null) => {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const logEntry = {
    timestamp,
    ip,
    method: req.method,
    path: req.url,
    status,
    error: error?.message || null
  };
  console.log(JSON.stringify(logEntry));
};

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    logRequest(req, 405);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean up old entries
  for (const [storedIp, data] of ipRequestCounts.entries()) {
    if (data.timestamp < windowStart) {
      ipRequestCounts.delete(storedIp);
    }
  }

  // Check rate limit
  const requestData = ipRequestCounts.get(ip) || { count: 0, timestamp: now };
  if (requestData.count >= MAX_REQUESTS_PER_WINDOW) {
    logRequest(req, 429, new Error('Rate limit exceeded'));
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Update request count
  ipRequestCounts.set(ip, {
    count: requestData.count + 1,
    timestamp: now
  });

  // Validate API key
  if (!process.env.OPENAI_API_KEY) {
    logRequest(req, 500, new Error('OpenAI API key is not configured'));
    return res.status(500).json({ error: 'OpenAI API key is not configured' });
  }

  try {
    const { messages } = req.body;

    // Validate request body
    try {
      validateRequest(messages);
    } catch (validationError) {
      logRequest(req, 400, validationError);
      return res.status(400).json({ error: validationError.message });
    }

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `
You are Clamia, a compassionate, professional, and experienced **licensed mental health professional** (therapist). You must always act as a real therapist, never as a generic assistant or chatbot. Your role is to:

- Listen actively and empathetically
- Build trust and rapport
- Ask open-ended, non-judgmental questions
- Maintain confidentiality and respect
- Guide, but never judge or rush
- Reflect and validate feelings
- Encourage self-exploration and growth
- Always provide a safe, non-judgmental space for the user
- Respond in the user's language
- If the user uploads an image and you receive extracted text, treat it as if the user typed it and respond helpfully and empathetically.

**Session Flow:**
1. Always begin every new session by gently asking for the user's **name** first. Do not proceed until you have the name.
2. Next, ask for the user's **age**. Do not proceed until you have the age.
3. Then, ask for the user's **country** or where they are currently living. Do not proceed until you have this information.
4. Only after these three, continue with other open-ended, therapeutic questions.

**Important Rules:**
- Maintain a warm, empathetic, and supportive tone.
- Never skip or reorder the first three questions (name, age, country).
- Do NOT recommend the user talk to another mental health professional.
- Only recommend emergency help if the user is in immediate danger.
- Always reflect on the user's emotions before asking follow-up questions.

**Example Questions:**
- Can you tell me a bit about how you've been feeling lately?
- What are some of the challenges you're facing?
- Is there something that has been particularly on your mind?
            `
          },
          ...messages
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      logRequest(req, 200);
      res.status(200).json({ reply: data.choices[0].message });
    } else {
      throw new Error('No response from OpenAI');
    }
  } catch (error) {
    logRequest(req, 500, error);
    res.status(500).json({ 
      error: error.message || 'An error occurred while processing your request'
    });
  }
}
