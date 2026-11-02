import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface CategorizationRequestItem {
  id: string;
  description: string;
  amount: number;
  flowType: string;
}

export interface CategorizationResponseItem {
  id: string;
  category: string;
  confidence: number;
}

export class OpenRouterService {
  private static apiKey = process.env.OPENROUTER_API_KEY || '';
  private static baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  private static model = process.env.OPENROUTER_MODEL || '';

  /**
   * Check if OpenRouter is configured.
   */
  static isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  /**
   * Categorize a batch of transactions using OpenRouter.
   * Only sends sanitized fields (id, description, amount, flowType).
   */
  static async categorizeBatch(
    items: CategorizationRequestItem[]
  ): Promise<Map<string, { category: string; confidence: number }>> {
    const resultMap = new Map<string, { category: string; confidence: number }>();
    if (!this.isConfigured() || items.length === 0) {
      return resultMap;
    }

    const categoriesList = [
      'Food & Dining',
      'Groceries',
      'Shopping',
      'Transportation',
      'Housing & Rent',
      'Utilities & Bills',
      'Healthcare',
      'Entertainment & Subscriptions',
      'Travel',
      'Education',
      'Fuel & Automotive',
      'Salary & Income',
      'Freelance Income',
      'Bank Interest',
      'Transfers',
      'Debt Payments',
      'Other'
    ];

    const prompt = `You are a specialized financial transaction categorizer.
Categorize each of the following bank transactions into exactly ONE of these categories:
${categoriesList.join(', ')}

Transactions to categorize:
${JSON.stringify(items, null, 2)}

Requirements:
1. Return valid JSON only. An array of objects with schema:
[
  {
    "id": "item_id",
    "category": "One of the allowed categories exactly",
    "confidence": 0.0 to 1.0
  }
]
2. Do not invent categories.
3. Food & Dining is for restaurants, cafes, fast food, food delivery (e.g., Talabat, Buffalo Burger, Cilantro, Costa).
4. Groceries is for supermarkets, markets (e.g., Kazyon, Metro Market, Carrefour, Gourmet Egypt, Spinneys, Seoudi).
5. Transportation is for ridesharing, taxis, public transport (e.g., Uber, Careem).
6. Fuel & Automotive is for gas stations, car repair (e.g., Mobil Autocare, TotalEnergies, Watanya).
7. Utilities & Bills is for electricity, gas, water, telco/internet (e.g., Vodafone, Town Gas, South Cairo Electricity, Cairo Water Authority, WE Internet, Orange, Fawry).
8. Housing & Rent is for apartment rent, property costs.
9. Travel is for flights, hotels (e.g., EgyptAir).
10. Entertainment & Subscriptions is for streaming services (e.g., Netflix, Spotify, Anghami).
11. Shopping is for retail stores, electronics, apparel (e.g., B.Tech, Virgin Megastore, Decathlon, Amazon, Noon).
12. Healthcare is for pharmacies, clinics (e.g., El Ezaby).
13. Output pure JSON without markdown code fences.`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an accurate financial transaction categorization engine. Always output pure JSON arrays.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://localhost:3000',
            'X-Title': 'BankIQ'
          },
          timeout: 25000
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) return resultMap;

      // Extract JSON from output
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed: CategorizationResponseItem[] = JSON.parse(cleanJson);

      for (const item of parsed) {
        if (item.id && item.category) {
          const matchedCategory = categoriesList.find(
            (c) => c.toLowerCase() === item.category.trim().toLowerCase()
          ) || 'Other';

          const conf = typeof item.confidence === 'number' ? Math.min(Math.max(item.confidence, 0), 1) : 0.85;

          resultMap.set(item.id, {
            category: matchedCategory,
            confidence: conf
          });
        }
      }
    } catch (err: any) {
      console.warn(`[OpenRouterService] Batch categorization failed: ${err.message}. Falling back to rule/keyword categorizer.`);
    }

    return resultMap;
  }

  /**
   * Generate natural language insights based on computed financial metrics.
   */
  static async generateInsights(metricsContext: any): Promise<string[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const prompt = `You are a financial analyst reviewing a bank statement report.
Below are the pre-computed metrics for the user's accounts:
${JSON.stringify(metricsContext, null, 2)}

Instructions:
1. Provide between 5 to 8 concise, high-value financial observations and recommendations.
2. IMPORTANT: NEVER invent financial figures. NEVER recalculate totals independently. Base all insights strictly on the supplied metrics.
3. Clearly distinguish factual observations (e.g. "Rent and groceries account for X% of spending") from recommendations (e.g. "Consider setting a budget for dining out").
4. Highlight spending patterns, recurring expenses, salary vs freelance split, and credit card usage.
5. Avoid making unsupported financial advice.
6. Return a valid JSON array of strings: ["insight 1", "insight 2", ...] without markdown fences.`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional financial analyst. Return pure JSON array of strings.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://localhost:3000',
            'X-Title': 'BankIQ'
          },
          timeout: 25000
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) return [];

      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim());
      }
    } catch (err: any) {
      console.warn(`[OpenRouterService] Insights generation failed: ${err.message}.`);
    }

    return [];
  }
}
