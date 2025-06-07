import { ReactElement } from "react";
import { StageBase, StageResponse, InitialData, Message } from "@chub-ai/stages-ts";
import { LoadResponse } from "@chub-ai/stages-ts/dist/types/load";
import { Client } from "@gradio/client";

// Define the shape of our state and config

type MessageStateType = { [key: string]: number };
type ConfigType = any;
type InitStateType = any;
type ChatStateType = any;

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {
  myInternalState: { [key: string]: any };
  private charactersMap: { [id: string]: any } = {};
  private emotionClient: any = null;

  constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
    super(data);
    const {
      characters,
      users,
      messageState
    } = data;
    this.charactersMap = characters;
    this.myInternalState = messageState != null ? messageState : {};
    this.myInternalState['numUsers'] = Object.keys(users).length;
    this.myInternalState['numChars'] = Object.keys(characters).length;
    this.myInternalState['affection'] = this.myInternalState['affection'] ?? {};
  }

  private clampAffection(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
    try {
      this.emotionClient = await Client.connect("ravenok/emotions");
    } catch (e) {
      console.error("Failed to load emotion client", e);
    }
    this.myInternalState['affection'] = {};
    return {
      success: true,
      error: null,
      initState: null,
      chatState: null,
    };
  }

  async setState(state: MessageStateType): Promise<void> {
    if (state != null) {
      this.myInternalState = { ...this.myInternalState, ...state };
    }
  }

  private emotionWeights: { [key: string]: number } = {
    admiration: 1,
    amusement: 1,
    anger: -2,
    annoyance: -1,
    approval: 2,
    caring: 2,
    confusion: -1,
    curiosity: 1,
    desire: 1,
    disappointment: -2,
    disapproval: -2,
    disgust: -3,
    embarrassment: -1,
    excitement: 1,
    fear: -2,
    gratitude: 2,
    grief: -2,
    joy: 3,
    love: 3,
    nervousness: -1,
    optimism: 2,
    pride: 1,
    realization: 1,
    relief: 1,
    remorse: -1,
    sadness: -1,
    surprise: 0,
    neutral: 0,
  };

  private emotionCombos: { [key: string]: number } = {
    "surprise+joy": 2,
    "surprise+gratitude": 2,
    "joy+love": 3,
    "fear+anger": -3,
    "fear+remorse": -2,
    "joy+pride": 2,
    "sadness+grief": -3,
    "anger+disgust": -3,
    "caring+relief": 2,
    "curiosity+realization": 2,
    "approval+pride": 2,
  };

  async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    const affection: { [id: string]: number } = this.myInternalState['affection'] ?? {};
    const characters = Object.keys(this.charactersMap);
    const directions: string[] = [];

    for (const charId of characters) {
      if (!(charId in affection)) affection[charId] = 50;
      const score = affection[charId];

      if (score < 25) {
        directions.push(`{{char:${charId}}} keeps a clear emotional distance from {{user}}, masking distrust behind short or guarded responses.`);
      } else if (score < 45) {
        directions.push(`{{char:${charId}}} responds warily, showing signs of tension and hesitation around {{user}}.`);
      } else if (score <= 55) {
        directions.push(`{{char:${charId}}} behaves according to their default personality, unaffected by {{user}} yet.`);
      } else if (score <= 74) {
        directions.push(`{{char:${charId}}} shows brief moments of warmth or trust, glancing at {{user}} with softening eyes or a relaxed posture.`);
      } else if (score <= 89) {
        directions.push(`{{char:${charId}}} treats {{user}} as a trusted companion, responding with vulnerability or emotional openness.`);
      } else {
        directions.push(`{{char:${charId}}} looks to {{user}} with deep emotional reliance, visibly more relaxed and willing to engage closely.`);
      }
    }

    return {
      stageDirections: directions.join('\n'),
      messageState:  affection ,
      chatState: null,
      systemMessage: null,
      error: null
    };
  }

  async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    const content = botMessage.content.toLowerCase();
    const botId = botMessage.anonymizedId;
    const affection: { [id: string]: number } = this.myInternalState['affection'] ?? {};
    const logs: string[] = [];

    if (!(botId in affection)) affection[botId] = 50;

    let delta = 0;
    try {
      const prediction = await this.emotionClient.predict("/predict", {
        param_0: content,
      });

      const allEmotions: { label: string; confidence: number }[] = prediction.data[0].confidences;
      const filtered = allEmotions.filter(e => e.confidence >= 0.25);
      const primary = filtered.map(e => e.label);

      const usedCombos = new Set<string>();

      // Combo logic
      for (let i = 0; i < primary.length; i++) {
        for (let j = i + 1; j < primary.length; j++) {
          const comboKey = `${primary[i]}+${primary[j]}`;
          const reverseKey = `${primary[j]}+${primary[i]}`;
          const comboBonus = this.emotionCombos[comboKey] ?? this.emotionCombos[reverseKey];
          if (comboBonus !== undefined) {
            delta += comboBonus;
            usedCombos.add(primary[i]);
            usedCombos.add(primary[j]);
            logs.push(`Combo ${comboKey} → ${comboBonus}`);
          }
        }
      }

      for (const emotion of filtered) {
        const key = emotion.label.toLowerCase();
        if (!usedCombos.has(key)) {
          const weight = this.emotionWeights[key] ?? 0;
          const score = weight * emotion.confidence;
          delta += score;
          logs.push(`${key}: ${weight} × ${emotion.confidence.toFixed(2)} → ${score.toFixed(2)}`);
        }
      }
    } catch (e: unknown) {
      console.warn("Emotion classification failed", e);
      logs.push("Emotion classification failed");
    }

    delta = Math.round(Math.max(-4, Math.min(4, delta)));
    affection[botId] = this.clampAffection(affection[botId] + delta);
    this.myInternalState['affection'] = affection;
    this.myInternalState['affectionLog'] = `[Delta for ${botId}: ${delta} | New: ${affection[botId]}]\n` + logs.join("\n");

    return {
      messageState:  affection ,
      chatState: null,
      systemMessage: null,
      error: null
    };
  }

  render(): ReactElement {
    const affection = this.myInternalState['affection'] ?? {};
    const affectionDisplay = Object.entries(affection).map(([charId, score]) => (
      <p key={charId}><strong>{this.charactersMap?.[charId]?.name ?? charId}</strong>: {score as number}</p>
    ));

    const logOutput = this.myInternalState['affectionLog'] ?? null;

    return (
      <div className="your-stage-wrapper">
        <h2>Relationship Tracker</h2>
        <p>
          There {this.myInternalState['numUsers'] === 1 ? 'is' : 'are'}{' '}
          {this.myInternalState['numUsers']} human{this.myInternalState['numUsers'] !== 1 ? 's' : ''} and{' '}
          {this.myInternalState['numChars']} bot{this.myInternalState['numChars'] !== 1 ? 's' : ''} present.
        </p>
        {affectionDisplay}
        {logOutput && <pre>{logOutput}</pre>}
      </div>
    );
  }
}
