import {ReactElement} from "react";
import {StageBase, StageResponse, InitialData, Message} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";
import { Client } from "@gradio/client";

// Message-level state (tracked per message)
type MessageStateType = any;

// Configuration schema (optional)
type ConfigType = any;

// Initialization state (persisted once per chat)
type InitStateType = any;

// Chat-wide dynamic state
type ChatStateType = any;

// Emotion weight map (adjustable as needed)
const emotionWeights: { [key: string]: number } = {
    admiration: 2,
    amusement: 1,
    anger: -3,
    annoyance: -2,
    approval: 2,
    caring: 3,
    confusion: -1,
    curiosity: 1,
    desire: 2,
    disappointment: -2,
    disapproval: -2,
    disgust: -3,
    embarrassment: -1,
    excitement: 2,
    fear: -3,
    gratitude: 3,
    grief: -2,
    joy: 3,
    love: 3,
    nervousness: -1,
    optimism: 2,
    pride: 1,
    realization: 1,
    relief: 2,
    remorse: -1,
    sadness: -1,
    surprise: 0,
    neutral: 0,
};

const emotionCombos: { [combo: string]: number } = {
    "surprise+curiosity": 1,
    "surprise+realization": 2,
    "surprise+joy": 2,
    "surprise+gratitude": 2,
    "surprise+fear": -2,
    "surprise+disgust": -2,
    "surprise+anger": -3,
    "fear+joy": 1,
    "fear+gratitude": 1,
    "anger+remorse": 1,
    "remorse+relief": 2,
    "disgust+relief": 1,
    "love+pride": 2,
    "love+approval": 2,
    "joy+gratitude": 2,
    "sadness+comfort": 2,
    "sadness+grief": -1,
    "sadness+love": 1,
    "desire+approval": 2,
    "confusion+realization": 2,
    "confusion+curiosity": 1,
    "approval+pride": 1,
    "desire+curiosity": 1
};

// Main Stage class definition
export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {
    myInternalState: { [key: string]: any };
    private charactersMap: { [id: string]: any } = {};
    private emotionClient: any = null;

    private clampAffection(value: number): number {
        return Math.max(0, Math.min(100, value));
    }

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        super(data);
        this.charactersMap = data.characters;
        const { characters, users, messageState } = data;
        this.myInternalState = messageState != null ? messageState : {};
        this.myInternalState['numUsers'] = Object.keys(users).length;
        this.myInternalState['numChars'] = Object.keys(characters).length;
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
        try {
            this.emotionClient = await Client.connect("ravenok/emotions");
        } catch (e) {
            console.warn("Failed to connect to emotion classifier", e);
        }

        this.myInternalState['affection'] = {};
        return {
            success: true,
            error: null,
            initState: null,
            chatState: null
        };
    }

    async setState(state: MessageStateType): Promise<void> {
        if (state != null) {
            this.myInternalState['affection'] = state.affection ?? this.myInternalState['affection'];
        }
    }

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

        this.myInternalState['affection'] = affection;
        return {
            stageDirections: directions.join('\n'),
            messageState: { affection },
            chatState: null,
            systemMessage: null,
            error: null
        };
    }

    async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        const content = botMessage.content;
        const affection: { [id: string]: number } = this.myInternalState['affection'] ?? {};
        const botId = botMessage.anonymizedId;
        const logs: string[] = [];
        let delta = 0;

        if (!(botId in affection)) affection[botId] = 50;

        try {
            if (this.emotionClient != null) {
                const prediction = await this.emotionClient.predict("/predict", { param_0: content });
                const allEmotions: { label: string; confidence: number }[] = prediction.data[0].confidences;

                const filtered = allEmotions.filter(e => e.confidence >= 0.25);
                const primary = filtered.map(e => e.label.toLowerCase());
                const usedCombos = new Set<string>();

                // Combo bonuses (exclusive if matched)
                for (let i = 0; i < primary.length; i++) {
                    for (let j = i + 1; j < primary.length; j++) {
                        const comboKey = `${primary[i]}+${primary[j]}`;
                        const reverseKey = `${primary[j]}+${primary[i]}`;
                        const comboBonus = emotionCombos[comboKey] ?? emotionCombos[reverseKey];
                        if (comboBonus !== undefined) {
                            delta += comboBonus;
                            usedCombos.add(primary[i]);
                            usedCombos.add(primary[j]);
                        }
                    }
                }

                // Add individual emotions not used in combos
                for (const emotion of filtered) {
                    const key = emotion.label.toLowerCase();
                    if (!usedCombos.has(key)) {
                        delta += (emotionWeights[key] ?? 0) * emotion.confidence;
                    }
                }

                logs.push(`Filtered emotions: ${primary.join(", ")}`);
                logs.push(`Final weighted delta: ${delta.toFixed(2)}`);
            } else {
                logs.push("No HuggingFace client available");
            }
        } catch (e) {
            logs.push("Emotion classification failed");
        }

        delta = Math.round(Math.max(-4, Math.min(4, delta)));

        if (affection[botId] >= 90 && delta > 0) delta = 1;
        if (affection[botId] <= 10 && delta < 0) delta = -1;

        affection[botId] = this.clampAffection(affection[botId] + delta);
        this.myInternalState['affection'] = affection;
        this.myInternalState['affectionLog'] = `[Delta for ${botId}: ${delta} | New: ${affection[botId]}]\n` + logs.join("\n");

        return {
            messageState: { affection },
            chatState: null,
            systemMessage: null,
            error: null
        };
    }

    render(): ReactElement {
        const affection = this.myInternalState['affection'] ?? {};
        const logOutput = this.myInternalState['affectionLog'] ?? null;
        const affectionDisplay = Object.entries(affection).map(([charId, score]) => (
            <p key={charId}><strong>{this.charactersMap?.[charId]?.name ?? charId}</strong>: {score as number}</p>
        ));

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
