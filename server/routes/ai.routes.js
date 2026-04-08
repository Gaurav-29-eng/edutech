import express from 'express';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// AI Tutor endpoint - Get AI-generated answer to student question
router.post('/ask', protect, async (req, res) => {
  try {
    const { question, context } = req.body;
    
    // Validation
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ message: 'Question is required' });
    }
    
    if (question.length > 1000) {
      return res.status(400).json({ message: 'Question too long (max 1000 characters)' });
    }
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('AI API key not configured');
      return res.status(503).json({ 
        message: 'AI tutor is temporarily unavailable. Please try again later.',
        fallback: true
      });
    }
    
    // Prepare the prompt
    const systemPrompt = `You are an educational AI tutor for an online learning platform called EduTech. 
Your role is to help students understand concepts, solve problems, and learn effectively.

Guidelines:
- Provide clear, concise explanations suitable for the student's level
- Use examples when helpful
- If the question is about a specific course topic, relate your answer to that context
- Encourage critical thinking rather than just giving direct answers
- Keep responses under 500 words when possible
- If you're unsure about something, acknowledge it honestly

${context ? `Context: This question is related to: ${context}` : ''}`;

    let aiResponse;
    
    // Try Gemini API first
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: systemPrompt },
                  { text: `Student question: ${question}` }
                ]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
                topP: 0.9,
              }
            })
          }
        );
        
        if (!geminiResponse.ok) {
          throw new Error(`Gemini API error: ${geminiResponse.status}`);
        }
        
        const geminiData = await geminiResponse.json();
        aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiResponse) {
          throw new Error('Empty response from Gemini');
        }
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError);
        // Fall through to OpenAI if configured
      }
    }
    
    // Fallback to OpenAI if Gemini failed or not configured
    if (!aiResponse && process.env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: question }
            ],
            temperature: 0.7,
            max_tokens: 800
          })
        });
        
        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }
        
        const openaiData = await openaiResponse.json();
        aiResponse = openaiData.choices?.[0]?.message?.content;
        
        if (!aiResponse) {
          throw new Error('Empty response from OpenAI');
        }
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
      }
    }
    
    // If no AI response generated, provide helpful fallback
    if (!aiResponse) {
      return res.status(503).json({
        message: 'AI tutor is temporarily unavailable. Here are some suggestions:\n\n' +
          '1. Try rephrasing your question\n' +
          '2. Check the course materials and lecture notes\n' +
          '3. Post your question in the course discussion forum\n' +
          '4. Contact your instructor directly\n\n' +
          'We apologize for the inconvenience.',
        fallback: true
      });
    }
    
    res.json({
      answer: aiResponse,
      question: question.trim(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI route error:', error);
    res.status(500).json({ 
      message: 'Failed to get AI response. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get chat history (placeholder - can be extended with database storage)
router.get('/history', protect, async (req, res) => {
  try {
    // For now, return empty array - can be extended to store chat history in DB
    res.json({ 
      history: [],
      message: 'Chat history feature coming soon'
    });
  } catch (error) {
    console.error('AI route error:', error);
    res.status(500).json({ message: 'Server error fetching chat history' });
  }
});

export default router;
