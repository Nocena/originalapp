import { FlowEventListener } from './flowEventListener';

const flowListener = new FlowEventListener();

export class FlowService {
  static async checkEvents(): Promise<void> {
    await (flowListener as any).checkForChallengeEvents();
  }

  static async startListener(): Promise<void> {
    await flowListener.startListening();
  }

  static async stopListener(): Promise<void> {
    await flowListener.stopListening();
  }
}
