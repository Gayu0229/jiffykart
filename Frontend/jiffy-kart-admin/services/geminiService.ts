
import { GoogleGenAI, Type } from "@google/genai";
import { DashboardStats, Vendor, TicketMessage } from "../types";

/* Initialization: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY}); */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDashboardInsights = async (
  stats: DashboardStats,
  topVendors: Vendor[]
): Promise<string> => {
  const prompt = `
    You are an expert e-commerce business analyst.
    Analyze the following daily dashboard snapshot for an admin:

    Key Metrics:
    - Orders Today: ${stats.totalOrders}
    - Revenue Today: $${stats.totalRevenue}
    - Pending Vendor Approvals: ${stats.pendingVendors}
    - Pending Product Approvals: ${stats.pendingProducts}
    - Support Tickets: ${stats.supportTickets}

    Top Performing Vendor: ${topVendors[0].name} (${topVendors[0].orders} orders, ${topVendors[0].rating} stars)

    Please provide a concise response in Markdown format with:
    1. An "Executive Summary" (2-3 sentences).
    2. "Actionable Alerts" (bullet points) focusing on bottlenecks like pending approvals or tickets.
    3. A "Revenue Opportunity" observation based on the high volume vendors.

    Keep the tone professional, encouraging, and analytical.
  `;

  try {
    /* Use gemini-3-flash-preview for basic text tasks */
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    /* Extracting text output from GenerateContentResponse using .text property */
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Failed to generate insights at this time. Please try again later.";
  }
};

export const analyzeSupportTicket = async (
  subject: string,
  messages: TicketMessage[]
): Promise<{ category: string; priority: string; assignedTeam: string; summary: string } | null> => {
  // Prepare conversation text
  const conversation = messages.map(m => `${m.sender}: ${m.content}`).join('\n');

  const prompt = `
    You are a support ticket triage AI. Analyze this ticket:
    
    Subject: ${subject}
    
    Conversation History:
    ${conversation}

    Task:
    1. Categorize the issue (e.g., Payment, Order Issue, Technical, Account, Logistics, General Inquiry).
    2. Assess Priority (Low, Medium, High, Critical).
    3. Assign to a Team (Support, Finance, Tech, Operations, Sales).
    4. Provide a 1-sentence summary.

    Respond in JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            priority: { type: Type.STRING },
            assignedTeam: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
        },
      },
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Error analyzing ticket:", error);
    return null;
  }
};

export const generateProductMagic = async (
  productName: string,
  category: string
): Promise<{ shortDescription: string; description: string; metaTitle: string; metaDescription: string } | null> => {
  const prompt = `
    As a creative e-commerce copywriter, generate marketing content for a new product.
    Product Name: ${productName}
    Category: ${category}

    Please provide:
    1. A catchy short description (max 100 characters).
    2. A detailed product description (2 paragraphs).
    3. SEO Meta Title.
    4. SEO Meta Description (max 160 characters).

    Format the response as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortDescription: { type: Type.STRING },
            description: { type: Type.STRING },
            metaTitle: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
          },
        },
      },
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Magic generation failed:", error);
    return null;
  }
};
