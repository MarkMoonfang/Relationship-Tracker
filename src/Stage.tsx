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

// Main Stage class definition
export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {
    myInternalState: { [key: string]: any }; // Ephemeral internal state during session
    private charactersMap: { [id: string]: any } = {}; // Stores bot ID to bot data
    private emotionClient: any = null; // HuggingFace emotion classifier

    // Clamp affection score to range [0, 100]
    private clampAffection(value: number): number {
        return Math.max(0, Math.min(100, value));
    }

    // Constructor called once at stage instantiation
    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        super(data);
        this.charactersMap = data.characters;
        const {
            characters,
            users,
            messageState
        } = data;

        this.myInternalState = messageState != null ? messageState : {};
        this.myInternalState['numUsers'] = Object.keys(users).length;
        this.myInternalState['numChars'] = Object.keys(characters).length;
    }

    // Load runs at the start of a new chat/branch
    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
        try {
            this.emotionClient = await Client.connect("lloorree/SamLowe-roberta-base-go_emotions");
        } catch (e) {
            console.warn("Failed to connect to emotion classifier", e);
        }

        this.myInternalState['affection'] = {}; // Reset affection values
        return {
            success: true,
            error: null,
            initState: null,
            chatState: null
        };
    }

    // Called when jumping across branches or restoring state
    async setState(state: MessageStateType): Promise<void> {
        if (state != null) {
            this.myInternalState['affection'] = state.affection ?? this.myInternalState['affection'];
        }
    }

    // Called before the user's message is sent to the LLM
    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        const affection: { [id: string]: number } = this.myInternalState['affection'] ?? {};
        const characters = Object.keys(this.charactersMap);
        const directions: string[] = [];

        for (const charId of characters) {
            if (!(charId in affection)) affection[charId] = 50; // Set default if missing
            const score = affection[charId];

            // Add character-specific emotional behavior
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

    // Called after bot replies to update affection based on message tone
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
                const emotionLabel = prediction.data[0].label.toLowerCase();

                const emotionMap: { [key: string]: number } = {
                    trust: +3,
                    joy: +2,
                    love: +2,
                    gratitude: +3,
                    approval: +2,
                    caring: +2,
                    amusement: +1,
                    surprise: +1,
                    optimism: +1,
                    sadness: -1,
                    fear: -2,
                    anger: -3,
                    disgust: -3,
                    disapproval: -2,
                    annoyance: -1,
                    disappointment: -1,
                    embarrassment: -1,
                    nervousness: -1,
                    remorse: -2,
                    grief: -2
                };

                delta = emotionMap[emotionLabel] ?? 0;
                logs.push(`HF Emotion: ${emotionLabel}`);
                logs.push(`Mapped delta: ${delta}`);
            } else {
                logs.push("No HuggingFace client available");
            }
        } catch (e) {
            logs.push("Emotion classification failed");
        }

        if (affection[botId] >= 90 && delta > 0) delta = 1;
        if (affection[botId] <= 10 && delta < 0) delta = -1;

        affection[botId] = this.clampAffection(affection[botId] + delta);
        this.myInternalState['affection'] = affection;
        this.myInternalState['affectionLog'] = logs.length > 0 ? `[Delta for ${botId}: ${delta} | New: ${affection[botId]}]\n` + logs.join("\n") : null;

        return {
            messageState: { affection },
            chatState: null,
            systemMessage: null,
            error: null
        };
    }

    // Visual panel render function (debug only)
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
