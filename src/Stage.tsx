import { ReactElement } from "react";
import { StageBase, StageResponse, InitialData, Message } from "@chub-ai/stages-ts";
import { LoadResponse } from "@chub-ai/stages-ts/dist/types/load";
import { Client } from "@gradio/client";

// Utility function for combo & weight logic (CHANGE 7)
function calculateEmotionDelta(
  emotions: { label: string; confidence: number }[],
  emotionWeights: { [key: string]: number },
  emotionCombos: { [key: string]: number },
  logs: string[]
): number {
  let delta = 0;
  const filtered = emotions.filter((e) => e.confidence >= 0.25);
  const primary = filtered.map(e => e.label);
  const usedCombos = new Set<string>();

  for (let i = 0; i < primary.length; i++) {
    for (let j = i + 1; j < primary.length; j++) {
      const comboKey = [primary[i], primary[j]].sort().join("+"); // CHANGE 6
      const comboBonus = emotionCombos[comboKey];
      if (comboBonus !== undefined) {
        delta += comboBonus;
        usedCombos.add(primary[i]);
        usedCombos.add(primary[j]);
        logs.push(`Using combo: ${comboKey} = ${comboBonus}`);
      }
    }
  }

  for (const emotion of filtered) {
    const key = emotion.label.toLowerCase();
    if (!usedCombos.has(key)) {
      const weight = emotionWeights[key] ?? 0;
      delta += weight;
      logs.push(`Adding ${key}: ${weight}`);
    }
  }

  return Math.round(Math.max(-4, Math.min(4, delta)));
}

type MessageStateType = {
  affection: { [userId: string]: { [botId: string]: number } };
  emotionBreakdown?: { [botId: string]: { label: string; confidence: number }[] };
  affectionLog?: string;
};
type ConfigType = any;
type InitStateType = any;
type ChatStateType = any;

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {
  myInternalState: { [key: string]: any };
  private charactersMap: { [id: string]: any } = {};
  private emotionClient: any = null;
  private initialData: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>;


  constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
    super(data);
    const { characters, users, messageState } = data;
    this.charactersMap = characters;
    this.myInternalState = messageState != null ? messageState : { affection: {} };
    this.myInternalState['numUsers'] = Object.keys(users).length;
    this.myInternalState['numChars'] = Object.keys(characters).length;
    this.myInternalState['affection'] = this.myInternalState['affection'] ?? {};
    this.initialData = data;
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
    admiration: 1, amusement: 1, anger: -2, annoyance: -1,
    approval: 2, caring: 2, confusion: -1, curiosity: 1,
    desire: 1, disappointment: -2, disapproval: -2, disgust: -3,
    embarrassment: -1, excitement: 1, fear: -2, gratitude: 2,
    grief: -2, joy: 3, love: 3, nervousness: -1, optimism: 2,
    pride: 1, realization: 1, relief: 1, remorse: -1,
    sadness: -1, surprise: 0, neutral: 0
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
    const affection: { [userId: string]: { [botId: string]: number } } = this.myInternalState['affection'] ?? {};
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

  async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
  const content = botMessage.content.toLowerCase();
  const botId = botMessage.anonymizedId;
  const userId = Object.keys(this.initialData.users)[0] ?? "default";

  const affection: { [userId: string]: { [botId: string]: number } } = this.myInternalState['affection'] ?? {};
  const logs: string[] = [];

  const rawName = (botMessage as any)?.name ?? "";
  const metadata = (botMessage as any)?.metadata ?? {};
  const isNarrator =
    rawName.toLowerCase().includes("narrator") ||
    rawName.toLowerCase().includes("system") ||
    metadata?.role === "narrator";

  this.myInternalState['lastSpeakerIsNarrator'] = isNarrator;

  // 🛑 If botId is missing or unrecognized, skip affection
  if (!botId || !this.charactersMap[botId]) {
    logs.push(`🛑 Skipping affection tracking for unknown botId: ${botId}`);

    // Try to still log emotions if possible
    try {
      const prediction = await this.emotionClient.predict("/predict", {
        param_0: content,
      });

      let rawEmotions: any[] = [];

      if (Array.isArray(prediction?.data)) {
        const p0 = prediction.data[0];
        if (Array.isArray(p0?.confidences)) rawEmotions = p0.confidences;
        else if (Array.isArray(p0)) rawEmotions = p0;
        else rawEmotions = prediction.data;
      }

      const allEmotions = rawEmotions.map((e: any) => ({
        label: e.label ?? e[0],
        confidence: typeof e.confidence === "number"
          ? e.confidence
          : typeof e.score === "number"
          ? e.score
          : parseFloat(e.confidence ?? e.score ?? "0")
      })).filter((e: { label: string; confidence: number }) => !isNaN(e.confidence));

      const filtered = allEmotions.filter(e => e.confidence >= 0.1);

      logs.push("Narrator/Unknown Entity Emotion Log:");
      logs.push(filtered.map(e => `${e.label} (${(e.confidence * 100).toFixed(1)}%)`).join(", "));

      this.myInternalState['narratorEmotionLog'] = {
        speaker: rawName || botId || "Unknown",
        emotions: filtered,
      };

    } catch (err) {
      logs.push("Failed to get emotion for unknown entity.");
    }

    this.myInternalState['affectionLog'] = logs.join("\n");
    return {
      messageState: { affection },
      chatState: null,
      systemMessage: null,
      error: null
    };
  }

  try {
    const prediction = await this.emotionClient.predict("/predict", {
      param_0: content,
    });

    let rawEmotions: any[] = [];

    if (Array.isArray(prediction?.data)) {
      const p0 = prediction.data[0];
      if (Array.isArray(p0?.confidences)) rawEmotions = p0.confidences;
      else if (Array.isArray(p0)) rawEmotions = p0;
      else rawEmotions = prediction.data;
    }

    const allEmotions = rawEmotions.map((e: any) => ({
      label: e.label ?? e[0],
      confidence: typeof e.confidence === "number"
        ? e.confidence
        : typeof e.score === "number"
        ? e.score
        : parseFloat(e.confidence ?? e.score ?? "0")
    })).filter((e: { label: string; confidence: number }) => !isNaN(e.confidence));

    logs.push("RAW EMOTIONS:");
    for (const emo of allEmotions) {
      logs.push(`${emo.label}: ${(emo.confidence * 100).toFixed(1)}%`);
    }

    const filtered = allEmotions.filter((e) => e.confidence >= 0.1);
    logs.push("\nFILTERED (≥10% confidence):");
    logs.push(filtered.map(e => `${e.label} (${(e.confidence * 100).toFixed(1)}%)`).join(", "));

    this.myInternalState['emotionBreakdown'] ??= {};
    this.myInternalState['emotionBreakdown'][botId] = filtered;

    if (!isNarrator) {
      if (!(userId in affection)) affection[userId] = {};
      if (!(botId in affection[userId])) affection[userId][botId] = 50;

      const delta = calculateEmotionDelta(filtered, this.emotionWeights, this.emotionCombos, logs);
      affection[userId][botId] = this.clampAffection(affection[userId][botId] + delta);

      this.myInternalState['affection'] = affection;
      this.myInternalState['affectionLog'] = `[Delta for ${botId}: ${delta} | New: ${affection[userId][botId]}]\n` + logs.join("\n");
    } else {
      logs.push("📎 Narrator message detected — skipping affection change.");
      this.myInternalState['narratorEmotionLog'] = {
        speaker: rawName || botId,
        emotions: filtered,
      };
      this.myInternalState['affectionLog'] = `[Narrator: No affection update for ${botId}]\n` + logs.join("\n");
    }

  } catch (e: any) {
    console.warn("Emotion classification failed", e);
    logs.push("Emotion classification failed");
    this.myInternalState['affectionLog'] = logs.join("\n");
  }

  return {
    messageState: { affection },
    chatState: null,
    systemMessage: null,
    error: null
  };
}

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
