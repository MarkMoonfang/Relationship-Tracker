import {ReactElement} from "react";
import {StageBase, StageResponse, InitialData, Message} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";

// Define types for state and config

/*** Message-level state (tracked per message) ***/
type MessageStateType = any;

/*** Configuration schema (optional) ***/
type ConfigType = any;

/*** Initialization state (persisted once per chat) ***/
type InitStateType = any;

/*** Chat-wide dynamic state ***/
type ChatStateType = any;

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {
    myInternalState: { [key: string]: any };
    private charactersMap: { [id: string]: any } = {};

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

    private clampAffection(value: number): number {
        return Math.max(0, Math.min(100, value));
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
        this.myInternalState['affection'] = {}; // Reset affection per new session
        return {
            success: true,
            error: null,
            initState: null,
            chatState: null
        };
    }

    async setState(state: MessageStateType): Promise<void> {
        if (state != null) {
            this.myInternalState = { ...this.myInternalState, ...state };
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
            systemMessage: `[Affection Scores]\n` + Object.entries(affection).map(([k, v]) => `${k}: ${v}`).join('\n'),
            error: null
        };
    }

    async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        const content = botMessage.content.toLowerCase();
        const affection: { [id: string]: number } = this.myInternalState['affection'] ?? {};
        const botId = botMessage.anonymizedId;
        const logs: string[] = [];
        let delta = 0;

        if (!(botId in affection)) affection[botId] = 50;

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

        if (affection[botId] >= 90 && delta > 0) delta = 1;
        if (affection[botId] <= 10 && delta < 0) delta = -1;

        affection[botId] = this.clampAffection(affection[botId] + delta);
        this.myInternalState['affection'] = affection;

        return {
            messageState: { affection },
            chatState: null,
            systemMessage: `[Delta for ${botId}: ${delta} | New: ${affection[botId]}]\n` + logs.join("\n"),
            error: null
        };
    }

    render(): ReactElement {
        const affection = this.myInternalState['affection'] ?? {};
        const affectionDisplay = Object.entries(affection).map(([charId, score]) => (
            <p key={charId}><strong>{this.charactersMap?.[charId]?.name ?? charId}</strong>: {score as number}</p>
        ));

        return (
            <div className="your-stage-wrapper">
                <h2>Relationship Tracker</h2>
                <p>
                    There {this.myInternalState['numUsers'] === 1 ? 'is' : 'are'}{' '}
                    {this.myInternalState['numUsers']} human{this.myInternalState['numUsers'] !== 1 ? 's' : ''} and{' '} // Display number of users and characters
                    {this.myInternalState['numChars']} bot{this.myInternalState['numChars'] !== 1 ? 's' : ''} present. // Display number of users and characters
                </p>    
                {affectionDisplay}  
            </div> // <-- end of return statement
        ); // <-- end of return statement
    } // <-- end of render method
} // <-- end of Stage class