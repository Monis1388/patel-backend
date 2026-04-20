const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');

const getLocalFallbackResponse = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('shipping') || msg.includes('delivery')) {
        return "📦 **Shipping Info:** We offer free delivery on orders above ₹999. Standard shipping takes 3-5 business days across India.";
    }
    if (msg.includes('return') || msg.includes('refund') || msg.includes('exchange')) {
        return "🔄 **Returns:** We have a 7-day 'No Questions Asked' return policy for frames. Note: Custom power lenses are non-refundable.";
    }
    if (msg.includes('track') || msg.includes('order status')) {
        return "🔍 **Tracking:** You can track your order in the 'My Orders' section of your profile once you log in.";
    }
    if (msg.includes('power') || msg.includes('prescription') || msg.includes('lens')) {
        return "👓 **Prescription:** You can upload your prescription during checkout or send it via WhatsApp later. We offer Anti-glare, Blue-cut, and Photochromic lenses.";
    }
    if (msg.includes('contact') || msg.includes('human') || msg.includes('call') || msg.includes('support')) {
        return "📞 **Support:** You can reach our team at support@frameandsunglasses.com or via WhatsApp at +91 98765 43210.";
    }
    if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
        return "👋 Hello! I'm Specsy AI's lite version. My advanced brain is resting right now, but I can help with questions about **shipping, returns, prescriptions, or tracking**!";
    }
    return "I'm currently in 'Lite Mode' because my main server is busy. I can answer questions about shipping, returns, or lenses. For anything else, please contact our support team!";
};

// @desc    Get AI response for eyewear questions
// @route   POST /api/ai/chat
// @access  Public
const getAiResponse = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Use GEMINI_API_KEY if available, fallback to ANTHROPIC_API_KEY if needed (though we're switching logic)
        const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // If no key is set yet, immediately use fallback
            const fallbackReply = getLocalFallbackResponse(message);
            return res.json({ reply: fallbackReply, isFallback: true, error: 'NO_API_KEY' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
            },
        });

        // Fetch some products to give context to the AI
        const products = await Product.find({}).limit(10).select('name price description brand category gender');

        const systemPrompt = `
            You are "Specsy AI", a helpful eyewear expert for "Frame & Sunglasses" (Frame & Sunglasses store).
            You help customers find the right glasses, explain lens types, and provide style advice.
            
            Current Product Context (sample of available products):
            ${JSON.stringify(products)}
            
            Guidelines:
            1. Be professional, friendly, and stylish. Use emojis occasionally to be engaging.
            2. If asked about specific products, refer to the names and prices in the context above.
            3. Answer questions about: frame shapes for face types, lens coatings (anti-glare, blue light), care instructions, etc.
            4. If you don't know something, suggest contacting support at +91 98765 43210.
            5. Keep responses concise and formatted with markdown.
            6. Do NOT mention you are an AI or a language model unless asked. You are Specsy AI.
        `;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt + "\n\nUnderstood. I will act as Specsy AI." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Got it! I am Specsy AI, your eyewear expert. How can I help you today?" }],
                },
            ],
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        res.json({ reply: responseText });
    } catch (error) {
        console.error('AI Error:', error);

        // Return local fallback instead of erroring out
        const fallbackReply = getLocalFallbackResponse(req.body.message || '');

        res.json({
            reply: fallbackReply,
            isFallback: true,
            error: error.message
        });
    }
};

module.exports = { getAiResponse };
