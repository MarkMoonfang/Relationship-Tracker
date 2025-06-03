import {ReactElement} from "react";
import {StageBase, StageResponse, InitialData, Message} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";

   //Utility: Clamp affection to stay within bounds
    function clampAffection(value: number): number {
        return Math.max(0, Math.min(value, 100)); // Clamp between 0 and 100
    }

/***
 The type that this stage persists message-level state in.
 This is primarily for readability, and not enforced.

 @description This type is saved in the database after each message,
  which makes it ideal for storing things like positions and statuses,
  but not for things like history, which is best managed ephemerally
  in the internal state of the Stage class itself.
 ***/
type MessageStateType = any;

/***
 The type of the stage-specific configuration of this stage.

 @description This is for things you want people to be able to configure,
  like background color.
 ***/
type ConfigType = any;

/***
 The type that this stage persists chat initialization state in.
 If there is any 'constant once initialized' static state unique to a chat,
 like procedurally generated terrain that is only created ONCE and ONLY ONCE per chat,
 it belongs here.
 ***/
type InitStateType = any;

/***
 The type that this stage persists dynamic chat-level state in.
 This is for any state information unique to a chat,
    that applies to ALL branches and paths such as clearing fog-of-war.
 It is usually unlikely you will need this, and if it is used for message-level
    data like player health then it will enter an inconsistent state whenever
    they change branches or jump nodes. Use MessageStateType for that.
 ***/
type ChatStateType = any;

/***
 A simple example class that implements the interfaces necessary for a Stage.
 If you want to rename it, be sure to modify App.js as well.
 @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/stage.ts
 ***/
export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    /***
     A very simple example internal state. Can be anything.
     This is ephemeral in the sense that it isn't persisted to a database,
     but exists as long as the instance does, i.e., the chat page is open.
     ***/
    myInternalState: {[key: string]: any};

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        /***
         This is the first thing called in the stage,
         to create an instance of it.
         The definition of InitialData is at @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/initial.ts
         Character at @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/character.ts
         User at @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/user.ts
         ***/
        super(data);
        const {
            characters,         // @type:  { [key: string]: Character }
            users,                  // @type:  { [key: string]: User}
            config,                                 //  @type:  ConfigType
            messageState,                           //  @type:  MessageStateType
            environment,                     // @type: Environment (which is a string)
            initState,                             // @type: null | InitStateType
            chatState                              // @type: null | ChatStateType
        } = data;
        this.myInternalState = messageState != null ? messageState : {'someKey': 'someValue'};
        this.myInternalState['numUsers'] = Object.keys(users).length;
        this.myInternalState['numChars'] = Object.keys(characters).length;
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
        /***
         This is called immediately after the constructor, in case there is some asynchronous code you need to
         run on instantiation.
         ***/
        return {
            /*** @type boolean @default null
             @description The 'success' boolean returned should be false IFF (if and only if), some condition is met that means
              the stage shouldn't be run at all and the iFrame can be closed/removed.
              For example, if a stage displays expressions and no characters have an expression pack,
              there is no reason to run the stage, so it would return false here. ***/
            success: true,
            /*** @type null | string @description an error message to show
             briefly at the top of the screen, if any. ***/
            error: null,
            initState: null,
            chatState: null,
        };
    }

    async setState(state: MessageStateType): Promise<void> {
        /***
         This can be called at any time, typically after a jump to a different place in the chat tree
         or a swipe. Note how neither InitState nor ChatState are given here. They are not for
         state that is affected by swiping.
         ***/
        if (state != null) {
            this.myInternalState = {...this.myInternalState, ...state};
        }
    }
    // work-in-progress logic block for the Stage
    // THis will go insdie the Stage class, in beforePrompt and afterResponse

    //MESSAGE-LEVEL STATE
    //we track only the affection score for now

    // --- BEFORE PROMPT ---
   async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    const affectionScore = this.myInternalState['affection'] ?? 50;
    let stageDirections = null;

    if (affectionScore < 25) {
        stageDirections = "{{char}} keeps a clear emotional distance from {{user}}, masking distrust behind short or guarded responses.";
    } else if (affectionScore < 45) {
        stageDirections = "{{char}} responds warily, showing signs of tension and hesitation around {{user}}.";
    } else if (affectionScore <= 55) {
        stageDirections = "{{char}} responds neutrally, neither warm nor cold, but observant of {{user}}'s actions.";
    } else if (affectionScore <= 74) {
        stageDirections = "{{char}} shows brief moments of warmth or trust, glancing at {{user}} with softening eyes or a relaxed posture.";
    } else if (affectionScore <= 89) {
        stageDirections = "{{char}} treats {{user}} as a trusted companion, responding with vulnerability or emotional openness.";
    } else {
        stageDirections = "{{char}} looks to {{user}} with deep emotional reliance, visibly more relaxed and willing to engage closely.";
    }

    return {
        stageDirections,
        messageState: { affection: affectionScore },
        chatState: null,
        systemMessage: `[Affection: ${affectionScore}]`, // for debugging
        error: null
    };
}

// --- AFTER RESPONSE --- //
async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    const affectionScore = this.myInternalState['affection'] ?? 50;
    const content = botMessage.content.toLowerCase();
    let delta = 0;
    const logs: string[] = [];

    if (content.includes("thank you") || content.includes("i trust you") || content.includes("i feel safe")) {
        delta += 3; logs.push("+3: expression of trust or gratitude");
    }
    if (content.includes("smile") || content.includes("laughs") || content.includes("relaxes")) {
        delta += 2; logs.push("+2: character relaxed or warm");
    }
    if (content.includes("scowl") || content.includes("knife") || content.includes("step back") || content.includes("growl")) {
        delta -= 3; logs.push("-3: defensive or fearful reaction");
    }
    if (content.includes("silent") || content.includes("coldly") || content.includes("suspicious")) {
        delta -= 2; logs.push("-2: emotional distance");
    }

    // Decay near limits
    let updated = affectionScore;
    if (affectionScore >= 90 && delta > 0) delta = 1;
    if (affectionScore <= 10 && delta < 0) delta = -1;

    updated = clampAffection(affectionScore + delta);
    this.myInternalState['affection'] = updated; // persist it

    return {
        messageState: { affection: updated },
        chatState: null,
        systemMessage: `[Delta: ${delta} | New: ${updated}]\n${logs.join("\n")}`,
        error: null
    };
}

  render(): ReactElement {
    return (
        <div className="your-stage-wrapper">
            <h2>Relationship Tracker</h2>
            <p>Key: {this.myInternalState['someKey']}</p>
            <p>
                There {this.myInternalState['numUsers'] === 1 ? 'is' : 'are'}{' '}
                {this.myInternalState['numUsers']} human{this.myInternalState['numUsers'] !== 1 ? 's' : ''} and{' '}
                {this.myInternalState['numChars']} bot{this.myInternalState['numChars'] !== 1 ? 's' : ''} present.
            </p>
        </div>
    );
} //<--- end of render() --->

} // <--- end of class Stage --->