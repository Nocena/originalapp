import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface ChallengeEvent {
  type: 'daily' | 'weekly' | 'monthly';
  txId: string;
  blockHeight?: string;
}

interface BlockState {
  lastProcessedBlock: number;
}

export class FlowEventListener {
  private readonly contractAddress = '7a6655221a6d9363';
  private isListening = false;
  private intervalId?: NodeJS.Timeout;
  private processedEvents = new Set<string>(); // Store "txId-eventType" instead of just txId
  private stateFile = path.join(__dirname, '../data/block-state.json');
  private lastProcessedBlock = 287491600; // Start from block before our latest events

  async startListening(): Promise<void> {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log('🔗 Starting Flow blockchain event listener...');
    
    // Load last processed block
    await this.loadState();
    
    this.intervalId = setInterval(() => {
      this.checkForChallengeEvents();
    }, 60000);
    
    await this.checkForChallengeEvents();
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) return;
    
    this.isListening = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log('🛑 Stopped Flow blockchain event listener');
  }

  private async loadState(): Promise<void> {
    try {
      const data = await fs.readFile(this.stateFile, 'utf-8');
      const state: BlockState = JSON.parse(data);
      this.lastProcessedBlock = state.lastProcessedBlock;
      console.log(`📂 Loaded state: last processed block ${this.lastProcessedBlock}`);
    } catch (error) {
      console.log(`📂 No state file found, starting from block ${this.lastProcessedBlock}`);
      await this.saveState();
    }
  }

  private async saveState(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.stateFile), { recursive: true });
      const state: BlockState = { lastProcessedBlock: this.lastProcessedBlock };
      await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('❌ Failed to save state:', error);
    }
  }

  async checkForChallengeEvents(): Promise<void> {
    console.log('🔍 Checking for challenge events...');
    try {
      const currentBlock = await this.getCurrentBlock();
      const events = await this.getEventsSinceLastBlock(currentBlock);
      console.log(`📊 Found ${events.length} events`);
      
      for (const event of events) {
        console.log(`📝 Event: ${event.type} - TX: ${event.txId}`);
        const eventKey = `${event.txId}-${event.type}`;
        if (!this.processedEvents.has(eventKey)) {
          await this.processChallengeEvent(event);
          this.processedEvents.add(eventKey);
        } else {
          console.log(`⏭️ Event ${event.type} from ${event.txId} already processed`);
        }
      }

      // Update last processed block
      if (currentBlock > this.lastProcessedBlock) {
        this.lastProcessedBlock = currentBlock;
        await this.saveState();
      }
    } catch (error) {
      console.error('❌ Error checking for challenge events:', error);
    }
  }

  private async getCurrentBlock(): Promise<number> {
    try {
      const { stdout } = await execAsync('flow blocks get latest --network testnet');
      const blockMatch = stdout.match(/Height\s+(\d+)/);
      return blockMatch ? parseInt(blockMatch[1]) : this.lastProcessedBlock;
    } catch (error) {
      console.error('❌ Failed to get current block:', error);
      return this.lastProcessedBlock;
    }
  }

  private async getEventsSinceLastBlock(currentBlock: number): Promise<ChallengeEvent[]> {
    const startBlock = this.lastProcessedBlock;
    const endBlock = Math.min(currentBlock, startBlock + 100); // Limit range to avoid timeouts
    
    const command = `flow events get A.${this.contractAddress}.NocenaChallengeHandler.TriggerDailyChallenge A.${this.contractAddress}.NocenaChallengeHandler.TriggerWeeklyChallenge A.${this.contractAddress}.NocenaChallengeHandler.TriggerMonthlyChallenge --network testnet --start ${startBlock} --end ${endBlock}`;
    
    console.log(`🔧 Checking blocks ${startBlock} to ${endBlock}`);
    
    try {
      const { stdout } = await execAsync(command);
      return this.parseEventOutput(stdout);
    } catch (error) {
      console.error('Flow CLI error:', error);
      return [];
    }
  }

  private parseEventOutput(output: string): ChallengeEvent[] {
    const events: ChallengeEvent[] = [];
    const lines = output.split('\n');
    
    let currentEvent: Partial<ChallengeEvent> | null = null;
    let currentBlockHeight: string | undefined;
    
    for (const line of lines) {
      if (line.includes('Events Block #')) {
        currentBlockHeight = line.match(/Events Block #(\d+):/)?.[1];
      }
      
      if (line.includes('Type\tA.')) {
        if (line.includes('TriggerDailyChallenge')) {
          currentEvent = { type: 'daily', blockHeight: currentBlockHeight };
        } else if (line.includes('TriggerWeeklyChallenge')) {
          currentEvent = { type: 'weekly', blockHeight: currentBlockHeight };
        } else if (line.includes('TriggerMonthlyChallenge')) {
          currentEvent = { type: 'monthly', blockHeight: currentBlockHeight };
        }
      }
      
      if (line.includes('Tx ID') && currentEvent) {
        const txId = line.split('\t')[1]?.trim();
        if (txId) {
          currentEvent.txId = txId;
          events.push(currentEvent as ChallengeEvent);
          currentEvent = null;
        }
      }
    }
    
    return events;
  }

  private async processChallengeEvent(event: ChallengeEvent): Promise<void> {
    console.log(`🎯 Processing ${event.type} challenge event (TX: ${event.txId})`);
    
    try {
      await this.triggerChallengeGeneration(event.type);
      
      // Enable public challenge button for weekly events
      if (event.type === 'weekly') {
        await this.enablePublicChallengeButton();
      }
      
      console.log(`✅ ${event.type} challenge generated successfully`);
    } catch (error) {
      console.error(`❌ Failed to generate ${event.type} challenge:`, error);
    }
  }

  private async enablePublicChallengeButton(): Promise<void> {
    console.log('🔘 Enabling public challenge button for all users...');
    
    try {
      // Store the weekly event timestamp for frontend to check
      const buttonStateFile = path.join(__dirname, '../data/button-state.json');
      const buttonState = {
        enabled: true,
        lastWeeklyEvent: new Date().toISOString(),
        weekId: this.getCurrentWeekId()
      };
      
      await fs.writeFile(buttonStateFile, JSON.stringify(buttonState, null, 2));
      console.log('✅ Public challenge button enabled for all users');
    } catch (error) {
      console.error('❌ Failed to enable public challenge button:', error);
    }
  }

  private getCurrentWeekId(): string {
    const now = new Date();
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - (now.getUTCDay() + 6) % 7);
    monday.setUTCHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0]; // Returns "2025-11-04"
  }

  private async triggerChallengeGeneration(challengeType: string): Promise<void> {
    console.log(`🚀 Generating ${challengeType} challenge...`);
    
    const command = `pnpm tsx src/scripts/generate${challengeType.charAt(0).toUpperCase() + challengeType.slice(1)}Challenge.ts`;
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: '/Users/cadenpiper/Code/Nocena/nocena-monorepo/apps/backend'
      });
      
      if (stderr) {
        console.error(`stderr for ${challengeType}:`, stderr);
      }
      
      console.log(`${challengeType} challenge output:`, stdout);
      console.log(`📝 ${challengeType} challenge created successfully`);
    } catch (error) {
      console.error(`Failed to run ${challengeType} challenge script:`, error);
      throw error;
    }
  }
}
