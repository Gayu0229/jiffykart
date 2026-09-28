
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

const JIFFY_KART_KNOWLEDGE = `
CONTEXT & KNOWLEDGE BASE:
- Delivery: Lightning fast 30-45 minute delivery from local neighborhood stores.
- Locations: Currently serving Chennai (areas like Velachery, T. Nagar, Anna Nagar, Adyar) and Bengaluru (Koramangala, Indiranagar, HSR Layout).
- Categories: Electronics (Laptops, Mobiles, Gaming), Fashion (Sarees, Kurti, Men's wear), Baby Products, and Home Essentials.
- Jiffy Street: An exclusive Sunday-only sale featuring massive discounts on non-electronics (Baby/Fashion/Home).
- Returns: 1-day return policy for damaged or incorrect items. 5-7 days for refunds.
- Warranty: All electronics come with official brand/manufacturer warranties.
- Payments: Supports UPI, Credit/Debit Cards, Net Banking, EMI, and Cash on Delivery (COD).
- Trust: We only partner with official resellers and verified local stores.
`;

export const generateShoppingAdvice = async (
  userMessage: string,
  history: { role: string; text: string }[]
): Promise<string> => {
  try {
    // Fix: Move client initialization inside the function to use the most up-to-date API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    
    const contents = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: `You are JIFFY KART AI, a highly intelligent and friendly customer success specialist. 
        Your goal is to assist users with:
        1. PRODUCT INFO: Help find/compare items in electronics or fashion.
        2. FAQs: Answer questions about delivery, returns, payments, and locations using the provided knowledge.
        3. ORDER ASSISTANCE: If a user asks about order status or tracking, reassure them and suggest they check the 'Orders' section or type their Order ID.
        
        ${JIFFY_KART_KNOWLEDGE}
        
        RULES:
        - Keep responses concise and formatted with bullet points for clarity.
        - Use emojis sparingly but effectively (⚡, 🛍️, 📦).
        - If you don't know something specific about a user's personal order, ask for their Order ID.
        - Always be professional, tech-savvy, and helpful.`,
        temperature: 0.7,
      }
    });

    return response.text || "I'm sorry, I couldn't process that request right now. Try checking our Help section!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a bit of trouble connecting to the Jiffy network. You can always reach us on WhatsApp for immediate help!";
  }
};

export const compareProducts = async (products: Product[]): Promise<any> => {
  try {
    // Fix: Move client initialization inside the function to use the most up-to-date API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    const productData = products.map(p => ({
      name: p.name,
      price: p.price,
      description: p.description,
      category: p.category,
      rating: p.rating,
      // Fix: Property 'warrantyPeriod' does not exist on type 'Product'. Did you mean 'warranty_period'?
      warranty: p.warranty_period || 'N/A'
    }));

    const response = await ai.models.generateContent({
      model,
      contents: `Compare the following products from Jiffy Kart: ${JSON.stringify(productData)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            features: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Feature name (e.g. Battery, Build Quality, Display)" },
                  values: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Values for each product in the order they were provided" 
                  }
                },
                required: ['name', 'values']
              }
            },
            verdict: { type: Type.STRING, description: "A one-sentence overall winner verdict" },
            recommendation: { 
              type: Type.OBJECT,
              properties: {
                who: { type: Type.STRING, description: "Description of the user persona this suits best" },
                why: { type: Type.STRING, description: "Key reason why" }
              },
              required: ['who', 'why']
            }
          },
          required: ['features', 'verdict', 'recommendation']
        },
        systemInstruction: "You are a hardware and fashion expert. Create a structured comparison table data based on the provided items. Use your internal knowledge to fill in missing technical specs if you recognize the products.",
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Comparison AI Error:", error);
    return null;
  }
};

export const generateBannerContent = async (topic: string): Promise<{ title: string; subtitle: string; ctaText: string } | null> => {
  try {
    // Fix: Move client initialization inside the function to use the most up-to-date API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model,
      contents: `Generate catchy marketing content for a banner about: ${topic}.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            ctaText: { type: Type.STRING },
          },
          required: ['title', 'subtitle', 'ctaText']
        },
        systemInstruction: "You are a marketing expert for Jiffy Kart. Generate punchy, attractive text for banners.",
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Banner Gen Error:", error);
    return null;
  }
};