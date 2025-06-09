import { ReactElement } from "react";
import { StageBase, StageResponse, InitialData, Message } from "@chub-ai/stages-ts";
import { LoadResponse } from "@chub-ai/stages-ts/dist/types/load";
import { Client } from "@gradio/client";

// ----- Type Definitions -----
type MessageStateType = {
  affection: { [userId: string]: { [botId: string]: number } };
  emotionBreakdown?: { [botId: string]: { label: string; confidence: number }[] };
  affectionLog?: string;
  narratorEmotionLog?: {
    speaker: string;
    emotions: { label: string; confidence: number }[];
  };
  lastSpeakerIsNarrator?: boolean;
};
type ConfigType = any;
type InitStateType = any;
type ChatStateType = any;

// ----- Stage Class -----
export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {
  myInternalState: { [key: string]: any };
  private charactersMap: { [id: string]: any } = {};
  private emotionClient: any = null;
  private initialData: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>;

  constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
    super(data);
    const { characters, users, messageState } = data;
    this.charactersMap = characters;
    this.initialData = data;
    this.myInternalState = messageState ?? { affection: {} };
    this.myInternalState['numUsers'] = Object.keys(users).length;
    this.myInternalState['numChars'] = Object.keys(characters).length;
    this.myInternalState['affection'] = this.myInternalState['affection'] ?? {};
  }

  // ----- Load Hartmann Emotion Model -----
  async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
    try {
      this.emotionClient = await Client.connect("j-hartmann/emotion-english-distilroberta-base");
    } catch (e) {
      console.error("Failed to load Hartmann model", e);
    }
    this.myInternalState['affection'] = {};
    return {
      success: true,
      error: null,
      initState: null,
      chatState: null
    };
  }

  // ----- Clamp Utility -----
  private clampAffection(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  // ----- Expanded Umbrella Delta Calculator -----
  private calculateExpandedDelta(
    emotions: { label: string; confidence: number }[],
    logs: string[]
  ): number {
    let delta = 0;
    const expansionMap: { [core: string]: string[] } = {
      joy: ['joy', 'love', 'pride', 'amusement', 'excitement', 'admiration', 'desire', 'approval', 'caring'],
      sadness: ['sadness', 'remorse', 'grief', 'disappointment', 'embarrassment'],
      anger: ['anger', 'disapproval', 'annoyance'],
      fear: ['fear', 'nervousness', 'anticipation'],
      surprise: ['surprise', 'realization', 'confusion'],
      disgust: ['disgust'],
      neutral: [] // skip
    };

    for (const emotion of emotions) {
      const umbrella = emotion.label.toLowerCase();
      const expanded = expansionMap[umbrella] ?? [];
      for (const sub of expanded) {
        const weight = this.emotionWeights[sub] ?? 0;
        delta += weight * emotion.confidence;
        logs.push(`➕ ${umbrella} ➝ ${sub} × ${(emotion.confidence * 100).toFixed(0)}% = ${(weight * emotion.confidence).toFixed(2)}`);
      }
    }

    return Math.round(Math.max(-4, Math.min(4, delta)));
  }

  // ----- Emotion Weights -----
  private emotionWeights: { [key: string]: number } = {
    admiration: 1, amusement: 1, anger: -2, annoyance: -1,
    approval: 2, caring: 2, confusion: -1, curiosity: 1,
    desire: 1, disappointment: -2, disapproval: -2, disgust: -3,
    embarrassment: -1, excitement: 1, fear: -2, gratitude: 2,
    grief: -2, joy: 3, love: 3, nervousness: -1, optimism: 2,
    pride: 1, realization: 1, relief: 1, remorse: -1,
    sadness: -1, surprise: 0, neutral: 0
  };

  // ----- State Setter -----
  async setState(state: MessageStateType): Promise<void> {
    if (state != null) {
      this.myInternalState = { ...this.myInternalState, ...state };
    }
  }

  // ----- Stage Behavior Before Bot Response -----
  async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    const affection = this.myInternalState['affection'] ?? {};
    const characters = Object.keys(this.charactersMap);
    const directions: string[] = [];

    for (const charId of characters) {
      for (const userId of Object.keys(affection)) {
        const score = affection[userId][charId] ?? 50;

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
    }

    return {
      stageDirections: directions.join('\n'),
      messageState: { affection },
      chatState: null,
      systemMessage: null,
      error: null
    };
  }

  // ----- Core Logic: Handle Bot Message and Update State -----
  async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    const content = botMessage.content.toLowerCase();
    const botId = botMessage.anonymizedId;
    const userId = Object.keys(this.initialData.users)[0] ?? "default";
    const logs: string[] = [];

    const rawName = (botMessage as any)?.name ?? "";
    const metadata = (botMessage as any)?.metadata ?? {};
    const isNarrator =
      rawName.toLowerCase().includes("narrator") ||
      rawName.toLowerCase().includes("system") ||
      metadata?.role === "narrator";

    this.myInternalState['lastSpeakerIsNarrator'] = isNarrator;

    try {
      const prediction = await this.emotionClient.predict("/predict", { text: content });

      const allEmotions = prediction.data.map((e: any) => ({
        label: e.label,
        confidence: typeof e.score === "number" ? e.score : parseFloat(e.score ?? "0")
      })).filter((e: { label: string, confidence: number }) => !isNaN(e.confidence));

      const filtered = allEmotions.filter(e => e.confidence >= 0.1);

      logs.push("Hartmann Emotion Output:");
      logs.push(filtered.map(e => `${e.label} (${(e.confidence * 100).toFixed(1)}%)`).join(", "));

      this.myInternalState['emotionBreakdown'] ??= {};
      this.myInternalState['emotionBreakdown'][botId] = filtered;

      if (isNarrator || !botId || !this.charactersMap[botId]) {
        this.myInternalState['narratorEmotionLog'] = {
          speaker: rawName || botId || "Unknown",
          emotions: filtered
        };
        logs.push("📎 Narrator or unknown bot — affection unchanged.");
        this.myInternalState['affectionLog'] = logs.join("\n");
        return { messageState: this.myInternalState['affection'], chatState: null };
      }

      const affection = this.myInternalState['affection'] ?? {};
      if (!(userId in affection)) affection[userId] = {};
      if (!(botId in affection[userId])) affection[userId][botId] = 50;

      const delta = this.calculateExpandedDelta(filtered, logs);
      affection[userId][botId] = this.clampAffection(affection[userId][botId] + delta);

      this.myInternalState['affection'] = affection;
      this.myInternalState['affectionLog'] = `[Delta for ${botId}: ${delta} | New: ${affection[userId][botId]}]\n` + logs.join("\n");

      return {
        messageState: { affection },
        chatState: null,
        systemMessage: null,
        error: null
      };

    } catch (e) {
      console.warn("Emotion classification failed", e);
      this.myInternalState['affectionLog'] = "Emotion classification failed";
      return { messageState: this.myInternalState['affection'], chatState: null };
    }
  }

  // ----- UI Render -----
  render(): ReactElement {
    const affection: { [userId: string]: { [botId: string]: number } } = this.myInternalState['affection'] ?? {};
    const affectionDisplay = Object.entries(affection).flatMap(([userId, bots]) =>
      Object.entries(bots)
        .filter(([charId]) => !!this.charactersMap?.[charId])
        .map(([charId, score]) => (
          <p key={`${userId}-${charId}`}>
            <strong>{this.charactersMap[charId].name}</strong>: {String(score)} (user: {userId})
          </p>
        ))
    );

    const logOutput = this.myInternalState['affectionLog'] ?? null;
    const narratorEmotionLog = this.myInternalState['narratorEmotionLog'] ?? null;

    return (
      <div className="your-stage-wrapper">
        <h2>Relationship Tracker</h2>
        <p>
          There {this.myInternalState['numUsers'] === 1 ? 'is' : 'are'}{' '}
          {this.myInternalState['numUsers']} human{this.myInternalState['numUsers'] !== 1 ? 's' : ''} and{' '}
          {this.myInternalState['numChars']} bot{this.myInternalState['numChars'] !== 1 ? 's' : ''} present.
        </p>

        {affectionDisplay}

        {this.myInternalState['lastSpeakerIsNarrator'] && (
          <p style={{ fontStyle: 'italic', color: '#666' }}>
            Narrator message — relationship values unchanged.
          </p>
        )}

        {narratorEmotionLog && (
          <div style={{ marginTop: "1em", padding: "0.5em", background: "#f7f7f7", border: "1px solid #ccc" }}>
            <strong>Narrator Emotional Readout:</strong>
            <p>Speaker: <code>{narratorEmotionLog.speaker}</code></p>
            <ul>
              {narratorEmotionLog.emotions.map((e: any, i: number) => (
                <li key={i}>{e.label}: {(e.confidence * 100).toFixed(1)}%</li>
              ))}
            </ul>
          </div>
        )}

        {logOutput && <pre>{logOutput}</pre>}
      </div>
    );
  }
}
