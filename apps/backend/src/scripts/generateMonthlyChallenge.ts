import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(__dirname, '../../.env.local') });
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { createAIChallenge } from '../services/graphql/challengeService';

const monthlyChallenges = [
  "Do 50 burpees",
  "Hold a handstand for 30 seconds",
  "Do a 30-second cold shower",
  "Memorize and recite a poem",
  "Do 100 sit-ups"
];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DGRAPH_ENDPOINT = process.env.DGRAPH_ENDPOINT || process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT;

export async function generateMonthlyChallenge() {
  try {
    const randomChallenge = monthlyChallenges[Math.floor(Math.random() * monthlyChallenges.length)];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Create challenging 30-second challenges. Monthly challenges should be the hardest but still completable in 30 seconds. Respond with JSON format: {\"title\": \"2-3 word catchy title\", \"description\": \"1-2 sentence description\"}."
        },
        {
          role: "user", 
          content: `Create a monthly challenge based on: ${randomChallenge}. Make it completable in 30 seconds but very challenging.`
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const challengeText = completion.choices[0]?.message?.content || '{"title": "Monthly Challenge", "description": "' + randomChallenge + '"}';
    
    let challengeTitle = "Monthly Challenge";
    let challengeDescription = randomChallenge;
    
    try {
      const parsed = JSON.parse(challengeText);
      challengeTitle = parsed.title || "Monthly Challenge";
      challengeDescription = parsed.description || randomChallenge;
    } catch (error) {
      challengeDescription = challengeText;
    }
    
    const challengeData = {
      id: uuidv4(),
      title: challengeTitle,
      description: challengeDescription,
      frequency: "monthly",
      reward: 2500,
      createdAt: new Date().toISOString(),
      isActive: true,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    };

    if (DGRAPH_ENDPOINT) {
      const success = await createAIChallenge(challengeData);
      
      if (success) {
        // Challenge saved successfully
      } else {
        throw new Error('Failed to save challenge to database');
      }
    }
    
  } catch (error) {
    console.error('❌ Error generating monthly challenge:', error);
    throw error;
  }
}
