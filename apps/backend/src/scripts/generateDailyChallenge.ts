import { config } from 'dotenv';
config({ path: '.env.local' });
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const dailyChallenges = [
  "Smile at yourself in the mirror",
  "Do 10 jumping jacks",
  "Take 5 deep breaths",
  "Write down one positive thought",
  "Stretch your arms above your head"
];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DGRAPH_ENDPOINT = process.env.DGRAPH_ENDPOINT || process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

async function generateDailyChallenge() {
  try {
    console.log('🚀 Generating daily challenge...');
    
    const randomChallenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Create simple 30-second challenges. Daily challenges should be very easy and quick. Respond with JSON format: {\"title\": \"2-3 word catchy title\", \"description\": \"1 sentence description\"}."
        },
        {
          role: "user", 
          content: `Create a daily challenge based on: ${randomChallenge}. Make it completable in 30 seconds and very easy.`
        }
      ],
      max_tokens: 80,
      temperature: 0.7,
    });

    const challengeText = completion.choices[0]?.message?.content || '{"title": "Daily Challenge", "description": "' + randomChallenge + '"}';
    
    let challengeTitle = "Daily Challenge";
    let challengeDescription = randomChallenge;
    
    try {
      const parsed = JSON.parse(challengeText);
      challengeTitle = parsed.title || "Daily Challenge";
      challengeDescription = parsed.description || randomChallenge;
    } catch (error) {
      challengeDescription = challengeText;
    }
    
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const challengeData = {
      id: uuidv4(),
      title: challengeTitle,
      description: challengeDescription,
      frequency: "daily",
      reward: 50,
      createdAt: now.toISOString(),
      isActive: true,
      day: dayOfYear,
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };

    console.log('✅ Daily challenge generated');
    console.log('🏷️ Title:', challengeData.title);
    console.log('📝 Description:', challengeData.description);
    
    if (DGRAPH_ENDPOINT) {
      const mutation = `
        mutation AddDailyChallenge($challenge: AddAIChallengeInput!) {
          addAIChallenge(input: [$challenge]) {
            aIChallenge {
              id
              title
            }
          }
        }
      `;
      
      await axios.post(DGRAPH_ENDPOINT, {
        query: mutation,
        variables: { challenge: challengeData }
      });
      
      console.log('💾 Challenge saved to database');
    }
    
  } catch (error) {
    console.error('❌ Error generating daily challenge:', error);
    throw error;
  }
}

generateDailyChallenge().catch(console.error);
