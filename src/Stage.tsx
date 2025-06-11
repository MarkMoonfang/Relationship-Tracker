import { ReactElement } from "react";
import { StageBase, StageResponse, InitialData, Message } from "@chub-ai/stages-ts";
import { LoadResponse } from "@chub-ai/stages-ts/dist/types/load";
import { Client } from "@gradio/client";
import { emotionCombinations } from "./emotionCombinations";
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
  }; // Emotion weights for each emotion type
  async setState(state: MessageStateType): Promise<void> {
    if (state != null) {
      this.myInternalState = { ...this.myInternalState, ...state };
    }
  }
  async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    const affection = this.myInternalState['affection'] ?? {};
    const directions: string[] = [];
    for (const charId of Object.keys(this.charactersMap)) {
      const score = affection[charId] ?? 50; // Default to neutral if not set
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
      } // Add more nuanced directions based on affection score
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
  let delta = 0;
    const allEmotions: { label: string; confidence: number }[] = prediction.data[0].confidences
      .map((e: { label: string; score: number }) => ({
        label: e.label,
        confidence: e.score
      }))
      .filter((e: { label: string; confidence: number }) => !isNaN(e.confidence));


     console.log("🧪 Ravenok response:", prediction.data);


    const filtered = allEmotions.filter(e => e.confidence >= 0.01 && e.label !== "neutral");
    const primary = filtered.map(e => e.label);
    const usedCombos = new Set<string>();
let comboScore = 0;
for (const combo of emotionCombinations) {
  const lowerLabels = filtered.map(e => e.label.toLowerCase());
  const labelToScore: Record<string, number> = {};
  filtered.forEach(e => labelToScore[e.label.toLowerCase()] = e.confidence);

  let allCorePresent = true;
  let totalConfidence = 0;

  for (const core of combo.core) {
    const match = lowerLabels.includes(core.type.toLowerCase());
    const score = labelToScore[core.type.toLowerCase()] ?? 0;

    if (!match || score < core.min) {
      allCorePresent = false;
      break;
    } else {
      totalConfidence += score;
    }
  }

  let allSupportValid = true; 
  if (combo.support) {
    for (const support of combo.support) {
      const match = lowerLabels.includes(support.type.toLowerCase());
      const score = labelToScore[support.type.toLowerCase()] ?? 0;

      if (!match || score < support.min) {
        allSupportValid = false;
        break;
      } else {
        totalConfidence += score;
      } // Add support emotion confidence to total
    } // Check support emotions if they exist
  } // Check if all core emotions are present and valid

  // Optional: future-proof with requiredTotalScore
  const passesTotal = combo.requiredTotalScore
    ? totalConfidence >= combo.requiredTotalScore
    : true;

  if (allCorePresent && allSupportValid && passesTotal) {
    comboScore += combo.score;

    // Track used components to exclude from individual emotion scoring
    combo.core.forEach((core) => usedCombos.add(core.type.toLowerCase()));
    combo.support?.forEach((support) => usedCombos.add(support.type.toLowerCase()));
    logs.push(`Combo: ${combo.name} (${[...combo.core.map(c => c.type), ...(combo.support?.map(s => s.type) ?? [])].join(' + ')})`);
  }
}
    // Skip emotions used in combos
const individualEmotions = filtered.filter(e => !usedCombos.has(e.label.toLowerCase()));
for (const emotion of individualEmotions) {
  const key = emotion.label.toLowerCase();
  const weight = this.emotionWeights[key] ?? 0;
  delta += weight;
  logs.push(`Adding ${key}: ${weight}`);
} // Add combo score after individual emotions
  delta += comboScore;
    delta = Math.max(-4, Math.min(4, Math.round(delta)));
    affection[botId] = this.clampAffection(affection[botId] + delta);
    this.myInternalState['affection'] = affection;
    this.myInternalState['affectionLog'] = `[Delta for ${botId}: ${delta} | New: ${affection[botId]}]\n` + logs.join("\n");
  } catch (err) {
    logs.push("❌ Emotion classification failed");
    this.myInternalState['affectionLog'] = logs.join("\n");
  } // Log the emotion breakdown
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
  const emotionThreshold = narratorEmotionLog?.threshold ?? 0.2;

  const allEmotions = narratorEmotionLog?.emotions ?? [];
  const filtered = narratorEmotionLog?.filtered ?? [];
  const comboMatches = narratorEmotionLog?.comboMatches ?? [];
  const usedComboLabels: Set<string> = new Set(narratorEmotionLog?.usedComboLabels ?? []);

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

          {/* === COMBO SECTION === */}
          <h4>🧩 Emotion Combinations</h4>
          {comboMatches.length > 0 ? (
            <ul>
              {comboMatches.map((combo: any, i: number) => (
                <li key={i}>
                  <strong>{combo.name}</strong>: {combo.score} — <em>{combo.description}</em>
                </li>
              ))}
            </ul>
          ) : <p>No combinations detected.</p>}

          {/* === FILTERED SOLO EMOTIONS === */}
          <h4>🎯 Individual Emotions (above threshold)</h4>
          {filtered
            .filter((e: any) => !usedComboLabels.has(e.label.toLowerCase()))
            .sort((a: any, b: any) => b.confidence - a.confidence)
            .map((e: any, i: number) => (
              <div key={i}>
                {e.label}: {(e.confidence * 100).toFixed(1)}%
              </div>
            ))} 
          {/* === LEFTOVER / LOW CONFIDENCE === */}
          <h4>🕳️ Low-Confidence Emotions</h4>
          {allEmotions
            .filter((e: any) => e.confidence < emotionThreshold)
            .sort((a: any, b: any) => b.confidence - a.confidence)
            .map((e: any, i: number) => (
              <div key={i} style={{ color: "#888" }}>
                {e.label}: {(e.confidence * 100).toFixed(1)}%
              </div>
            ))} 
        </div>
      )} 
      {logOutput && <pre>{logOutput}</pre>}
    </div>
  );
}
}