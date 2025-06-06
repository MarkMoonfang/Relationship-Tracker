import {ReactElement} from "react";
import {StageBase, StageResponse, InitialData, Message} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";

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
    private llm: any; // Store reference to LLM helper

    // Clamp affection score to range [0, 100]
    private clampAffection(value: number): number {
        return Math.max(0, Math.min(100, value));
    }

    // Constructor called once at stage instantiation
    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType> & { llm?: any }) {
        super(data);
        this.charactersMap = data.characters;
        this.llm = data.llm ?? null;
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
        const content = botMessage.content.toLowerCase();
        const affection: { [id: string]: number } = this.myInternalState['affection'] ?? {};
        const botId = botMessage.anonymizedId;
        const logs: string[] = [];
        let delta = 0;

        if (!(botId in affection)) affection[botId] = 50; // Default affection if unknown

        try {
            const schema = {
                type: "object",
                properties: {
                    delta: { type: "integer" },
                    reason: { type: "string" }
                },
                required: ["delta"]
            };

            // Use the LLM helper to extract JSON from the message content
            if (this.llm?.extractJSONFromMessage) {
                const result = await this.llm.extractJSONFromMessage(content, schema);
                if (result?.delta !== undefined) {
                    delta = result.delta;
                    logs.push(`Delta from LLM: ${delta}`);
                    if (result.reason) logs.push(`Reason: ${result.reason}`);
                }
            } else {
                logs.push("No LLM helper available.");
            }
        } catch (e) {
            logs.push("LLM JSON extraction failed, defaulting to heuristics");

            // Fallback heuristics
            if (content.includes("thank you") || content.includes("i trust you") || content.includes("i feel safe")) {
                delta += 3; logs.push("+3: expression of trust or gratitude");
            }
            if (content.includes("smile") || content.includes("laughs") || content.includes("relaxes")) {
                delta += 2; logs.push("+2: character relaxed or warm");
            }
            if (
                (content.includes("scowl") || content.includes("step back") || content.includes("knife")) &&
                !content.includes("smile") && !content.includes("laugh") && !content.includes("giggle")
            ) {
                delta -= 3; logs.push("-3: defensive or fearful reaction");
            }
            if (content.includes("silent") || content.includes("coldly") || content.includes("suspicious")) {
                delta -= 2; logs.push("-2: emotional distance");
            }
            if (content.includes("growls at") || content.includes("growling in warning")) {
                delta -= 3; logs.push("-3: hostile growl");
            }
        }

        // Decay near boundaries
        if (affection[botId] >= 90 && delta > 0) delta = 1;
        if (affection[botId] <= 10 && delta < 0) delta = -1;

        // Apply affection delta
        affection[botId] = this.clampAffection(affection[botId] + delta);
        this.myInternalState['affection'] = affection;

        // Optional debug log in render
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
