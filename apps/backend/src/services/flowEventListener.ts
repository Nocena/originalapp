import fs from 'fs/promises';
import path from 'path';
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client';
import dotenv from 'dotenv';

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// GraphQL client for database operations
const httpLink = createHttpLink({
  uri: process.env.DGRAPH_ENDPOINT || process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT,
});

const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

interface ChallengeEvent {
  type: 'daily' | 'weekly' | 'monthly';
  blockHeight: number;
  data?: any;
}

export class FlowEventListener {
  private contractAddress: string;
  private apolloClient: ApolloClient<any>;
  private isListening = false;
  private processedEvents = new Set<string>();

  constructor() {
    this.contractAddress = '7a6655221a6d9363';
    this.apolloClient = apolloClient;
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('⚠️ Event listener is already running');
      return;
    }

    this.isListening = true;
    console.log('🔗 Starting Flow blockchain event subscription...');

    try {
      await this.startEventSubscription();
    } catch (error) {
      console.error('❌ Failed to start event subscription:', error);
      this.isListening = false;
    }
  }

  private async startEventSubscription(): Promise<void> {
    const fcl = await import('@onflow/fcl');
    
    fcl.config({
      'accessNode.api': 'https://rest-testnet.onflow.org'
    });

    const eventTypes = [
      `A.${this.contractAddress}.NocenaChallengeHandler.TriggerDailyChallenge`,
      `A.${this.contractAddress}.NocenaChallengeHandler.TriggerWeeklyChallenge`,
      `A.${this.contractAddress}.NocenaChallengeHandler.TriggerMonthlyChallenge`
    ];

    console.log('📡 Subscribing to challenge events...');

    // Get current block height to start from
    const currentBlock = await this.getCurrentBlock();

    try {
      // Create the subscription
      const subscription = await fcl.send([
        fcl.subscribeEvents({
          eventTypes,
          startHeight: currentBlock,
          heartbeatInterval: 3000 // 3 second heartbeat
        })
      ]);

      console.log('✅ Event subscription created');

      // Use streamConnection to listen for events
      subscription.streamConnection.on('data', (data: any) => {
        if (data.events && data.events.length > 0) {
          console.log(`📊 Received ${data.events.length} events`);
          
          data.events.forEach((event: any) => {
            const challengeEvent = this.parseFlowEvent(event);
            if (challengeEvent) {
              this.processChallengeEvent(challengeEvent);
            }
          });
        }
      });

      subscription.streamConnection.on('error', (error: any) => {
        console.error('❌ Stream connection error:', error);
      });

      console.log('✅ Event subscription active');
    } catch (error) {
      console.error('❌ Event subscription setup error:', error);
      throw error;
    }
  }

  private async getCurrentBlock(): Promise<number> {
    try {
      const fcl = await import('@onflow/fcl');
      fcl.config({
        'accessNode.api': 'https://rest-testnet.onflow.org'
      });
      
      const response = await fcl.send([fcl.getBlock(true)]);
      const latestBlock = await fcl.decode(response);
      return latestBlock.height;
    } catch (error) {
      console.error('❌ Failed to get current block:', error);
      return 0;
    }
  }

  private parseFlowEvent(event: any): ChallengeEvent | null {
    try {
      const eventType = event.type.split('.').pop();
      
      if (eventType?.includes('TriggerDailyChallenge')) {
        return { type: 'daily', blockHeight: event.blockHeight, data: event.data };
      } else if (eventType?.includes('TriggerWeeklyChallenge')) {
        return { type: 'weekly', blockHeight: event.blockHeight, data: event.data };
      } else if (eventType?.includes('TriggerMonthlyChallenge')) {
        return { type: 'monthly', blockHeight: event.blockHeight, data: event.data };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to parse event:', error);
      return null;
    }
  }

  private async processChallengeEvent(event: ChallengeEvent): Promise<void> {
    const eventKey = `${event.blockHeight}-${event.type}`;
    
    if (this.processedEvents.has(eventKey)) {
      return;
    }

    try {
      await this.triggerChallengeGeneration(event.type);
      console.log(`✅ ${event.type} challenge generated`);
      
      // Enable public challenge button for weekly events
      if (event.type === 'weekly') {
        await this.enablePublicChallengeButton();
      }
      
      this.processedEvents.add(eventKey);
    } catch (error) {
      console.error(`❌ Failed to process ${event.type} challenge:`, error);
    }
  }

  private async triggerChallengeGeneration(challengeType: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    try {
      // Import and run the challenge generation script directly
      const scriptPath = path.join(__dirname, `../scripts/generate${challengeType.charAt(0).toUpperCase() + challengeType.slice(1)}Challenge.ts`);
      const module = await import(scriptPath);
      
      // Call the correct function name
      const functionName = `generate${challengeType.charAt(0).toUpperCase() + challengeType.slice(1)}Challenge`;
      const generateFunction = module[functionName];
      
      if (typeof generateFunction === 'function') {
        await generateFunction();
      } else {
        throw new Error(`Function ${functionName} not found in module`);
      }
    } catch (error) {
      console.error(`Failed to run ${challengeType} challenge script:`, error);
      throw error;
    }
  }

  private async enablePublicChallengeButton(): Promise<void> {
    try {
      // Mark all existing active public challenges as inactive (hides from map only)
      const UPDATE_PUBLIC_CHALLENGES = gql`
        mutation {
          updatePublicChallenge(
            input: {
              filter: { isActive: true },
              set: { isActive: false }
            }
          ) {
            numUids
          }
        }
      `;

      const result = await this.apolloClient.mutate({
        mutation: UPDATE_PUBLIC_CHALLENGES,
      });

      const updatedCount = result.data?.updatePublicChallenge?.numUids || 0;
      console.log(`🗺️ Weekly cycle: hidden ${updatedCount} challenges from map, button enabled`);
      
      // Enable button for users to generate new challenges
      const buttonStateFile = path.join(__dirname, '../data/button-state.json');
      const buttonState = {
        enabled: true
      };
      
      await fs.mkdir(path.dirname(buttonStateFile), { recursive: true });
      await fs.writeFile(buttonStateFile, JSON.stringify(buttonState, null, 2));
    } catch (error) {
      console.error('❌ Failed to enable challenge button:', error);
    }
  }

  stopListening(): void {
    if (!this.isListening) return;
    
    this.isListening = false;
    console.log('🛑 Flow event listener stopped');
  }
}
