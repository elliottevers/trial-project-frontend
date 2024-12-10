export interface ConversationMessage {
  role: string;
  message: string;
}

export class MessageHolder {
  public bootstrapMessage: string;
  public nextMessage: ConversationMessage[];
  public seen: string[];

  constructor(bootstrapMessage: string) {
    this.bootstrapMessage = bootstrapMessage;
  }

  setSeen(seen: string) {
    this.seen.push(seen)
  }
}