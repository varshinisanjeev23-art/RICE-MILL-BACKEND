const Product = require('../models/Product');

/**
 * Groq Chat Controller
 * Proxies requests to Groq Cloud API for secure integration
 */
exports.handleChat = async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ message: 'GROQ_API_KEY is not configured on the server.' });
        }

        // Fetch product info to provide context to the AI
        const products = await Product.find({ status: { $ne: 'inactive' } }).select('name ratePerKg category description');
        const productContext = products.map(p => `- ${p.name}: ₹${p.ratePerKg}/kg (${p.category})`).join('\n');

        const systemMessage = {
            role: 'system',
            content: `You are the Rice Mart (NRM) Assistant. You help customers with their rice and grain purchases. 
            
            Current Product List & Prices:
            ${productContext}
            
            Our Policies:
            - Free shipping on orders above ₹699.
            - We deliver premium organic rice, dals, and oils.
            - We are located in Erode, Tamil Nadu.
            
            Keep responses helpful, concise, and focused on our products. If asked about something unrelated to rice mart, politely redirect the conversation back to our services.`
        };

        const fetchResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [systemMessage, ...messages],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json().catch(() => ({}));
            console.error('Groq API Error Response:', errorData);
            return res.status(fetchResponse.status).json({ 
                message: errorData.error?.message || 'Groq AI Service error' 
            });
        }

        const data = await fetchResponse.json();
        res.json(data.choices[0].message);
    } catch (err) {
        console.error('Chat processing error details:', err);
        res.status(500).json({ message: 'Internal Server Error: ' + err.message });
    }
};
