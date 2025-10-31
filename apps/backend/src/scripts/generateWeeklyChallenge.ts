import { config } from 'dotenv';
config({ path: '.env.local' });
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { createAIChallenge } from '../services/graphql/challengeService';

const weeklyChallenges = [
  "Do 20 push-ups",
  "Write down 3 things you're grateful for",
  "Take a photo of something beautiful",
  "Send an encouraging text to a friend",
  "Do a 30-second plank"
];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DGRAPH_ENDPOINT = process.env.DGRAPH_ENDPOINT || process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

async function generateWeeklyChallenge() {
  try {
    console.log('🚀 Generating weekly challenge...');
    
    const randomChallenge = weeklyChallenges[Math.floor(Math.random() * weeklyChallenges.length)];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Create 30-second challenges. Weekly challenges should be moderately difficult but doable in 30 seconds. Respond with JSON format: {\"title\": \"2-3 word catchy title\", \"description\": \"1 sentence description\"}."
        },
        {
          role: "user", 
          content: `Create a weekly challenge based on: ${randomChallenge}. Make it completable in 30 seconds and moderately challenging.`
        }
      ],
      max_tokens: 80,
      temperature: 0.7,
    });

    const challengeText = completion.choices[0]?.message?.content || '{"title": "Weekly Challenge", "description": "' + randomChallenge + '"}';
    
    let challengeTitle = "Weekly Challenge";
    let challengeDescription = randomChallenge;
    
    try {
      const parsed = JSON.parse(challengeText);
      challengeTitle = parsed.title || "Weekly Challenge";
      challengeDescription = parsed.description || randomChallenge;
    } catch (error) {
      challengeDescription = challengeText;
    }
    
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const daysSinceStart = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const weekOfYear = Math.floor(daysSinceStart / 7) + 1;
    
    const challengeData = {
      id: uuidv4(),
      title: challengeTitle,
      description: challengeDescription,
      frequency: "weekly",
      reward: 150,
      createdAt: now.toISOString(),
      isActive: true,
      week: weekOfYear,
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };

    console.log('✅ Weekly challenge generated');
    console.log('🏷️ Title:', challengeData.title);
    console.log('📝 Description:', challengeData.description);
    
    if (DGRAPH_ENDPOINT) {
      const success = await createAIChallenge(challengeData);
      
      if (success) {
        console.log('💾 Challenge saved to database');
      } else {
        throw new Error('Failed to save challenge to database');
      }
    }
    
  } catch (error) {
    console.error('❌ Error generating weekly challenge:', error);
    throw error;
  }
}

generateWeeklyChallenge().catch(console.error);
