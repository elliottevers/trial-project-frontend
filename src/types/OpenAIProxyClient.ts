import {OpenAIGeneratedQuestion, OpenAIScoredUserAnswer} from "./OpenAIResponse";
import axios, {AxiosResponse} from "axios";

export class OpenAIProxyClient {

  baseUrl: string;

  constructor(url: string, port: number) {
    this.baseUrl = url + ':' + port;
  }

  // Promise<OpenAIGeneratedQuestion>

  generateQuestion(domain: string, seenWords: string[]): Promise<AxiosResponse<OpenAIGeneratedQuestion>> {
    return axios.post(
      this.baseUrl + '/generateQuestion',
      // 'http://localhost:3001/generateQuestion',
      {
        domain,
        seenWords
      }
    )
  }

  scoreUserAnswer(domain: string, word: string, userAnswer: string): Promise<AxiosResponse<OpenAIScoredUserAnswer>> {
    return axios.post(
      this.baseUrl + '/scoreUserAnswer',
      {
        domain,
        word,
        userAnswer
      }
    )
  }
}