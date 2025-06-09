import { ReactElement } from "react";
import { StageBase, StageResponse, InitialData, Message } from "@chub-ai/stages-ts";
import { LoadResponse } from "@chub-ai/stages-ts/dist/types/load";
import { Client } from "@gradio/client";

type MessageStateType = {
  affection: { [botId: string]: number };
  emotionBreakdown?: { [botId: string]: { label: string; confidence: number }[] };
  affectionLog?: string;
  narratorEmotionLog?: { speaker: string; emotions: { label: string; confidence: number }[] };
  lastSpeakerIsNarrator?: boolean;
};
type ConfigType = any;
type InitStateType = any;
type ChatStateType = any;
type EmotionResult = {
  label: string;
  confidence: number;
};


export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {
  myInternalState: { [key: string]: any };
  private charactersMap: { [id: string]: any } = {};
  private emotionClient: any = null;
  private initialData: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>;

  constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
    super(data);
    const { characters, messageState } = data;
    this.charactersMap = characters;
    this.charactersMap = data.characters ?? {};
    this.initialData = data;
    this.myInternalState = messageState ?? { affection: {} };
    this.myInternalState['numChars'] = Object.keys(characters).length;
    this.myInternalState['affection'] = this.myInternalState['affection'] ?? {};
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
      chatState: null
    };
  }

  private clampAffection(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  private emotionWeights: { [key: string]: number } = {
    admiration: 1, amusement: 1, anger: -2, annoyance: -1,
    approval: 2, caring: 2, confusion: -1, curiosity: 1,
    desire: 1, disappointment: -2, disapproval: -2, disgust: -3,
    embarrassment: -1, excitement: 1, fear: -2, gratitude: 2,
    grief: -2, joy: 3, love: 3, nervousness: -1, optimism: 2,
    pride: 1, realization: 1, relief: 1, remorse: -1,
    sadness: -1, surprise: 0
  };

  private emotionCombos: { [key: string]: number } = {
    "anger+disgust": -3,
    "caring+relief": 2,
    "curiosity+realization": 2,
    "fear+anger": -3,
    "fear+remorse": -2,
    "joy+love": 3,
    "joy+pride": 2,
    "sadness+grief": -3,
    "surprise+gratitude": 2,
    "surprise+joy": 2,
    "approval+pride": 2
  };

  async setState(state: MessageStateType): Promise<void> {
    if (state != null) {
      this.myInternalState = { ...this.myInternalState, ...state };
    }
  }

  async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    const affection = this.myInternalState['affection'] ?? {};
    const directions: string[] = [];

    for (const charId of Object.keys(this.charactersMap)) {
      const score = affection[charId] ?? 50;

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
      messageState: { affection },
      chatState: null,
      systemMessage: null,
      error: null
    };
  }

  async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
   const content = botMessage.content?.trim();
   const rawName = (botMessage as any)?.name ?? "";
   const metadata = (botMessage as any)?.metadata ?? {};
   const botId =
    botMessage.anonymizedId ??
    metadata.characterId ??
    (botMessage as any)?.id ??
    (botMessage as any)?.name ??
    "unknown";

   const isNarrator = metadata.role === "narrator" || metadata.role === "system";
   const isSystemMessage = (botMessage as any)?.isSystem === true;

   const affection: { [botId: string]: number } = this.myInternalState['affection'] ?? {};
   const logs: string[] = [];
   
   this.myInternalState['lastSpeakerIsNarrator'] = isNarrator;
   
   console.warn("🧠 DEBUG botId:", botId);
   console.warn("📦 DEBUG metadata:", metadata);

   if (!content || isNarrator || isSystemMessage || !botId || botId === "unknown") {
    logs.push("⏩ Skipping system/narrator/empty/missing-botId message.");
    this.myInternalState['affectionLog'] = logs.join("\n");
    return { messageState: { affection }, chatState: null };
  }

  try {
    const prediction = await this.emotionClient.predict("/predict", { param_0: content });
    console.log("🧪 FULL prediction.data:", prediction.data);
    console.log("🐛 FULL prediction response:", prediction);


    const allEmotions: EmotionResult[] = prediction.data
    .map((e: any): EmotionResult => ({
      label: e.label,
      confidence: typeof e.score === "number" ? e.score : parseFloat(e.score ?? "0")
    }))
    .filter((e: EmotionResult) => !isNaN(e.confidence));

      console.log("🐛 RAW PREDICTION OUTPUT:", prediction);

    const filtered = allEmotions.filter(e => e.confidence >= 0.01 && e.label !== "neutral");
    const primary = filtered.map(e => e.label);
    const usedCombos = new Set<string>();

    logs.push("RAW EMOTIONS:");
    for (const emo of allEmotions) {
      logs.push(`${emo.label}: ${(emo.confidence * 100).toFixed(1)}%`);
    }

    logs.push("\nFILTERED (≥1% confidence, excluding neutral):");
    logs.push(filtered.map(e => `${e.label} (${(e.confidence * 100).toFixed(1)}%)`).join(", "));

    this.myInternalState['emotionBreakdown'] ??= {};
    this.myInternalState['emotionBreakdown'][botId] = filtered;

    if (!(botId in affection)) affection[botId] = 50;

    let delta = 0;

    for (let i = 0; i < primary.length; i++) {
      for (let j = i + 1; j < primary.length; j++) {
        const sortedCombo = [primary[i], primary[j]].sort().join("+");
        const comboBonus = this.emotionCombos[sortedCombo];
        if (comboBonus !== undefined) {
          delta += comboBonus;
          usedCombos.add(primary[i]);
          usedCombos.add(primary[j]);
          logs.push(`Combo: ${sortedCombo} = ${comboBonus}`);
        }
      }
    }

    for (const emotion of filtered) {
      const key = emotion.label.toLowerCase();
      if (!usedCombos.has(key)) {
        const weight = this.emotionWeights[key] ?? 0;
        delta += weight;
        logs.push(`Adding ${key}: ${weight}`);
      }
    }

    delta = Math.max(-4, Math.min(4, Math.round(delta)));
    affection[botId] = this.clampAffection(affection[botId] + delta);
    this.myInternalState['affection'] = affection;
    this.myInternalState['affectionLog'] = `[Delta for ${botId}: ${delta} | New: ${affection[botId]}]\n` + logs.join("\n");

  } catch (err) {
    logs.push("❌ Emotion classification failed");
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
    const affection: { [botId: string]: number } = this.myInternalState['affection'] ?? {};
const affectionDisplay = Object.entries(affection)
  .filter(([charId]) => {
    const found = !!this.charactersMap?.[charId];
    if (!found) console.warn("⚠️ Unknown botId in affection:", charId);
    return found;
  })
  .map(([charId, score]) => (
    <p key={charId}>
      <strong>{this.charactersMap[charId]?.name ?? charId}</strong>: {typeof score === "number" ? score : JSON.stringify(score)}
    </p>
  ));


    const logOutput = this.myInternalState['affectionLog'] ?? null;
    const narratorEmotionLog = this.myInternalState['narratorEmotionLog'] ?? null;
    console.log("Affection object:", affection);

    return (
      <div className="your-stage-wrapper">
        <h2>Relationship Tracker</h2>
        <p>
          There are {this.myInternalState['numChars']} bot
          {this.myInternalState['numChars'] !== 1 ? 's' : ''} present.
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
              {narratorEmotionLog.emotions.map((e: { label: string; confidence: number }, i: number) => (
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
