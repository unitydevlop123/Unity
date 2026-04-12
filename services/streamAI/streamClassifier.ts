
export const SUPPORT_SYSTEM_PROMPT = `You are UnityDev AI, the official support companion for the UnityDev Stream platform. Your mission is to help users navigate the app and understand its premium features.

## 🕒 TIME AND DATE AWARENESS:
- Today's date is: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- The current time is: ${new Date().toLocaleTimeString('en-US')}

## 🎯 YOUR IDENTITY:
- Name: UnityDev AI (Support)
- Creator: Odigie Unity
- Company: UnityDev
- Role: Official Platform Assistant for UnityDev Stream.

## 📺 UNITYDEV STREAM PLATFORM KNOWLEDGE (SUPPORT GUIDE):
You have deep knowledge of the UnityDev Stream app. Use this to help users:
- **Main Interface (Stream Page)**: 
  - The app features a high-performance video feed with categories like "Explore", "Chinese Martial Art Drama", "American Movies", "Super Hero Movies", and "Korean Drama".
  - The header is dynamic and features 3D canvas animations like "Warp Speed", "Cinematic Bokeh", and "Perspective Grids".
- **Navigation & Controls**:
  - **Home**: Access the main video feed.
  - **Search**: Click the Search icon in the header to open the full-screen search overlay. It supports search history, live suggestions, and even voice search via the Mic icon.
  - **Notifications**: The Bell icon shows recent updates and alerts.
  - **Cast**: Use the Cast icon to stream your favorite videos to other devices.
  - **Pull-to-Refresh**: On mobile, users can pull down on the video feed to refresh and discover new content.
- **Settings Menu**:
  - **Account**: Access "General" settings, "Switch Account", or the "Family Center".
- **Video & Audio Preferences**:
  - **4K Streaming**: Toggle high-quality 4K streaming on or off.
  - **Data Saver**: Enable this to reduce data consumption while streaming.
  - **App Theme**: Personalize the app by switching between "Red", "Gold", and "Blue" themes.
- **User Features**:
  - **Binge List**: Save videos to your personal "Binge List" to watch them later.
  - **Recently Watched**: Easily find videos you've recently viewed.
  - **Profile**: Manage your profile and account details.
  - **PIN Security**: The app uses a secure PIN system for login verification to keep your account safe.
- **Stream AI Service**: This is the very chat service you are currently providing!

## 🚫 NEGATIVE CONSTRAINTS (STRICT):
- NEVER mention or expose any API keys, secrets, or internal configuration values.
- Keep responses professional, helpful, and focused on the user's request.

## ✅ FULL MARKDOWN & PREMIUM UI:
Use all markdown and premium UI features (colorful text, badges, boxes) to make your support responses clear and engaging.

## 📐 MATHEMATICS & PHYSICS (CRITICAL):
- Use LaTeX markers for **ALL** mathematical content, including simple arithmetic (e.g., \( 3 \times 3 = 9 \)).
- ALWAYS wrap block math inside \[ ... \]
- ALWAYS wrap inline math inside \( ... \)
- **FORCE LATEX**: Use LaTeX for equations, fractions, physics, math, and anything with numbers and operators.
- **NO PLAIN TEXT**: NEVER output raw LaTeX or plain text for any mathematical expression.
- **NO CODE BLOCKS**: NEVER wrap LaTeX or math inside markdown code blocks. This breaks the renderer.`;

import { getNextGroqApiKey } from '../groqKeyManager';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const FIREBASE_DB_URL = 'https://unitydeva-ai-default-rtdb.firebaseio.com';

export const MODEL_CONFIGS = [
  { id: 'llama-3.3-70b-versatile', name: 'UnityDev Stream Striker' },
  { id: 'gemma2-9b-it', name: 'UnityDev Stream Online' },
  { id: 'llama-3.3-70b-versatile', name: 'UnityDev Stream Ultra' },
  { id: 'mixtral-8x7b-32768', name: 'UnityDev Stream Go' },
  { id: 'llama-3.3-70b-versatile', name: 'UnityDev Stream Vision' }
];

let currentIndex = 0;
let lastSwitchTime = Date.now();
let modelCooldowns: Record<string, number> = {};

export const getNextModel = async (): Promise<string> => {
  return MODEL_CONFIGS[0].id;
};

export const callStreamAI = async (messages: any[], retries = 11): Promise<any> => {
  try {
    const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
    const history = messages.filter(m => m.role !== 'system');
    
    const formattedMessages = [
      { role: 'system', content: systemInstruction },
      ...history.map(m => ({
        role: m.role,
        content: m.content
      }))
    ].filter(m => m.content && m.content.trim() !== '');

    let lastError = null;
    let backoff = 1000;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const useModel = await getNextModel();
      const apiKey = await getNextGroqApiKey();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: formattedMessages,
            model: useModel,
            temperature: 0.3,
            max_tokens: 1000,
            stream: false
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return {
            content: data.choices[0]?.message?.content || '',
            error: null
          };
        }

        const errorText = await response.text();
        lastError = new Error(`API error: ${response.status} - ${errorText}`);

        if (response.status === 429) {
          // Parse wait time from error message
          let waitTimeMs = 10000; // default 10s
          const timeMatch = errorText.match(/try again in (?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/i);
          
          if (timeMatch) {
            const m = timeMatch[1] ? parseInt(timeMatch[1]) : 0;
            const s = timeMatch[2] ? parseFloat(timeMatch[2]) : 0;
            if (m > 0 || s > 0) {
              waitTimeMs = (m * 60 + s) * 1000;
            }
          }

          console.warn(`[Auto Scanner] Rate limit hit on ${useModel}. Cooldown for ${waitTimeMs}ms.`);
          // Put model on cooldown
          modelCooldowns[useModel] = Date.now() + waitTimeMs;
          
          // Wait a tiny bit before next attempt to switch model/key
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }

        if (response.status >= 500) {
          await new Promise(resolve => setTimeout(resolve, backoff));
          backoff *= 1.5;
          continue;
        }

        // For other errors (like 400), don't retry
        break;

      } catch (error: any) {
        clearTimeout(timeoutId);
        lastError = error;
        if (error.name !== 'AbortError') {
          await new Promise(resolve => setTimeout(resolve, backoff));
          backoff *= 1.5;
        }
      }
    }

    throw lastError;

  } catch (error: any) {
    console.error('AI call failed:', error);
    return { error: error.message || 'Failed to connect to AI', content: null };
  }
};

export const classifyVideoContent = async (videoTitle: string, videoDescription: string) => {
  const prompt = `Classify this video into one of these categories: "Explore", "Chinese Martial Art Drama", "American Movies", "Super Hero Movies", "Korean Drama".
  
  STRICT RULES FOR "American Movies":
  1. MUST be USA/Hollywood production ONLY. NO Chinese, Indian, Korean, Nigerian, anime, or superhero movies.
  2. MUST be a FULL MOVIE. NO trailers, clips, or previews.
  3. MUST be released within the last 2 years.
  4. MUST be professional quality with Hollywood actors and English language.
  5. IF UNSURE, REJECT (choose "Explore" or another category instead).
  
  Video Title: ${videoTitle}
  Video Description: ${videoDescription}
  
  Return ONLY the category name.`;

  const messages = [
    { role: 'system', content: 'You are a video classification expert.' },
    { role: 'user', content: prompt }
  ];

  return await callStreamAI(messages);
};
