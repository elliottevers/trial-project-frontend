import {MessageHolder} from "./MessageHolder";
import {OpenAIGeneratedQuestion} from "./OpenAIResponse";
import {OpenAIProxyClient} from "./OpenAIProxyClient";

export class Generator {
  domain: string;

  messageHolder: MessageHolder;

  openAIProxyClient: OpenAIProxyClient;

// {
//   "domain": "corporate finance",
//   "seenWords": ["convertible bond", "share"]
// }

  generateQuestion(domain: string, seenWords: string[]) {
    this.openAIProxyClient.generateQuestion(
      this.domain,
      this.messageHolder.seen,
    )
  }
}