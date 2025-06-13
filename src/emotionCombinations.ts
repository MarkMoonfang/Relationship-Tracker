export interface EmotionThreshold {
  type: string;
  min: number;
}

export interface ThresholdCombo {
  name: string;
  score: number;
  core: EmotionThreshold[];
  support?: EmotionThreshold[];
  requiredTotalScore?: number; // Optional, for future use
  description: string;
}


// === Emotion Combination Definitions ===
    export const emotionCombinations: ThresholdCombo[] = [
  {
    name: "Protective Affection",
    core: [{ type: "fear", min: 1.2 }],
    support: [
      { type: "caring", min: 0.4 },
      { type: "nervousness", min: 0.4 }
    ],
    score: 3,
    description: "Speaker shows investment in another's safety; bond of guardianship."
    },
    {
    name: "Tentative Admiration",
    core: [{ type: "admiration", min: 1.2 }],
    support: [
      { type: "nervousness", min: 0.2 },
      { type: "realization", min: 0.4 }
    ],
    score: 2,
    description: "Hesitant or shy recognition of someone's worth or power."
    },
    {
     name: "Curious Desire",
     core: [{ type: "curiosity", min: 1.2 }],
     support: [
        { type: "desire", min: 0.4 },
        { type: "confusion", min: 0.2 },
     ],
     score: 2,
      description: "Interest tinged with emotional or intimate probing."
    },
    {
      name: "Playful Challenge",
  core: [
    { type: "amusement", min: 1.2 }
  ],
  support: [
    { type: "approval", min: 0.4 },
    { type: "surprise", min: 0.4 },
    { type: "annoyance", min: 0.2 }
  ],
  score: 1,
  description: "Teasing or bantering dynamic; light conflict as bonding."
    },
    {
  name: "Wordless Connection",
  core: [
    { type: "caring", min: 1.2 }
  ],
  support: [
    { type: "realization", min: 0.4 },
    { type: "joy", min: 0.4 }
  ],
  score: 3,
  description: "Unspoken shared moment of emotional understanding."
},
{
  name: "Respectful Awe",
  core: [
    { type: "admiration", min: 1.2 }
  ],
  support: [
    { type: "pride", min: 0.4 },
    { type: "fear", min: 0.4 }
  ],
  score: 2,
  description: "Speaker is impressed but also humbled or intimidated."
},
{
  name: "Yearning Loneliness",
  core: [
    { type: "sadness", min: 1.2 }
  ],
  support: [
    { type: "desire", min: 0.4 },
    { type: "realization", min: 0.4 }
  ],
  score: 3,
  description: "Emotional hunger for closeness; unspoken longing."
},
{
  name: "Buried Vulnerability",
  core: [
    { type: "grief", min: 1.2 }
  ],
  support: [
    { type: "remorse", min: 0.4 },
    { type: "embarrassment", min: 0.4 },
    { type: "caring", min: 0.4 }
  ],
  score: 4,
    description: "An emotionally charged opening up or hidden pain moment."
    },
    {
     name: "Respectful Rivalry",
     core: [  {type: "anger", min: 0.4 }
      ],
      support: [
        { type: "pride", min: 0.4 },
        { type: "admiration", min: 0.4 },
      ],
      score: 2,
      description: "Bond formed in tension; acknowledgment through opposition."
    },
    {
    name: "Trust Test",
    core: [{ type: "caring", min: 1.2 }],
    support: [
      { type: "confusion", min: 0.4 },
      { type: "nervousness", min: 0.4 },
      { type: "optimism", min: 0.4 }
    ],
    score: 3,
    description: "Speaker is risking emotional openness to form deeper trust."
  },
    {
    name: "Hidden Longing",
    core: [{ type: "desire", min: 1.2 }],
    support: [
      { type: "joy", min: 0.4 },
      { type: "sadness", min: 0.4 }
    ],
    score: 4,
    description: "A veiled wish for closeness, possibly romantic."
  },
    {
    name: "Disillusioned Devotion",
    core: [{ type: "caring", min: 1.2 }],
    support: [
      { type: "disappointment", min: 0.4 },
      { type: "approval", min: 0.4 }
    ],
    score: 1,
    description: "Support remains despite perceived failure or emotional setback."
  },
  {
    name: "Emotional Rejection",
    core: [{ type: "disapproval", min: 1.2 }],
    support: [
      { type: "disgust", min: 0.4 },
      { type: "anger", min: 0.4 }
    ],
    score: -3,
    description: "Pushback or rejection of the other’s behavior or presence."
  },
  {
    name: "Grudging Respect",
    core: [{ type: "admiration", min: 1.2 }],
    support: [
      { type: "annoyance", min: 0.4 },
      { type: "pride", min: 0.4 }
    ],
    score: 1,
    description: "Acknowledging someone’s value despite personal friction."
  },
  {
    name: "Hurt Loyalty",
    core: [{ type: "remorse", min: 1.2 }],
    support: [
      { type: "sadness", min: 0.4 },
      { type: "caring", min: 0.4 }
    ],
    score: 2,
    description: "Sticking by someone even in moments of emotional pain."
  },
  {
    name: "Conflicted Attraction",
    core: [{ type: "desire", min: 1.2 }],
    support: [
      { type: "disgust", min: 0.4 },
      { type: "confusion", min: 0.4 }
    ],
    score: 1,
    description: "An emotionally tangled reaction toward the other person."
  },
  {
    name: "Bittersweet Affection",
    core: [{ type: "love", min: 1.2 }],
    support: [
      { type: "sadness", min: 0.4 },
      { type: "relief", min: 0.4 }
    ],
    score: 4,
    description: "A deep connection shadowed by loss, hardship, or distance."
  },
  {
    name: "Admiration with Distance",
    core: [{ type: "admiration", min: 1.2 }],
    support: [
      { type: "confusion", min: 0.4 },
      { type: "neutral", min: 0.4 }
    ],
    score: 1,
    description: "They respect the other, but don’t yet feel close or aligned."
  },
  {
    name: "Pure Joy Bond",
    core: [{ type: "joy", min: 1.2 }],
    support: [
      { type: "caring", min: 0.4 },
      { type: "excitement", min: 0.4 }
    ],
    score: 4,
    description: "A genuinely happy and open affection moment; rare spike."
  },
    {
  name: "Cracked Composure",
  core: [{ type: "embarrassment", min: 1.2 }],
  support: [
    { type: "anger", min: 0.4 },
    { type: "admiration", min: 0.4 }
  ],
  score: 1,
  description: "A moment where the speaker loses their guard due to someone they respect or fear."
},
{
  name: "Intimate Frustration",
  core: [{ type: "annoyance", min: 1.2 }],
  support: [
    { type: "caring", min: 0.4 },
    { type: "remorse", min: 0.4 }
  ],
  score: 2,
  description: "Emotional investment causes irritation — a sign of deeper closeness under strain."
},
{
  name: "Surprised Softness",
  core: [{ type: "surprise", min: 1.2 }],
  support: [
    { type: "joy", min: 0.4 },
    { type: "caring", min: 0.4 }
  ],
  score: 3,
  description: "A sudden moment of unexpected emotional openness or connection."
},
{
  name: "Unspoken Gratitude",
  core: [{ type: "relief", min: 1.2 }],
  support: [
    { type: "caring", min: 0.4 },
    { type: "embarrassment", min: 0.4 }
  ],
  score: 2,
  description: "Quiet acknowledgment of someone’s help or presence, tinged with vulnerability."
},
{
  name: "Familiar Tension",
  core: [{ type: "annoyance", min: 1.2 }],
  support: [
    { type: "comfort", min: 0.4 },
    { type: "confusion", min: 0.4 }
  ],
  score: 1,
  description: "A dynamic formed over time — irritated but secure in the bond."
},
{
  name: "Closeness Through Conflict",
  core: [{ type: "anger", min: 1.2 }],
  support: [
    { type: "approval", min: 0.4 },
    { type: "respect", min: 0.4 }
  ],
  score: 2,
  description: "Bond strengthened through disagreement or challenge."
},
{
  name: "Fear of Losing",
  core: [{ type: "fear", min: 1.2 }],
  support: [
    { type: "sadness", min: 0.4 },
    { type: "caring", min: 0.4 }
  ],
  score: 3,
  description: "Emotional fear tied not to threat, but to loss of a valued connection."
},
{
  name: "Power Imbalance",
  core: [{ type: "admiration", min: 1.2 }],
  support: [
    { type: "fear", min: 0.4 },
    { type: "desire", min: 0.4 }
  ],
  score: 2,
  description: "Complex dynamic where one party feels smaller, weaker, but drawn in."
},
{
  name: "Shameful Attachment",
  core: [{ type: "desire", min: 1.2 }],
  support: [
    { type: "remorse", min: 0.4 },
    { type: "embarrassment", min: 0.4 }
  ],
  score: 1,
  description: "Attraction accompanied by guilt or self-consciousness."
},
{
  name: "Uncomfortable Truth",
  core: [{ type: "realization", min: 1.2 }],
  support: [
    { type: "disgust", min: 0.4 },
    { type: "remorse", min: 0.4 }
  ],
  score: -1,
  description: "Painful internal shift that can damage or reset a relationship."
}
,
  {
  name: "Crisis Trust",
  core: [{ type: "fear", min: 1.2 }],
  support: [
    { type: "optimism", min: 0.4 },
    { type: "approval", min: 0.4 }
  ],
  score: 4,
  description: "Bond proven under high emotional stakes or pressure."
},
{
  name: "Wounded Pride",
  core: [{ type: "pride", min: 1.2 }],
  support: [
    { type: "disappointment", min: 0.4 },
    { type: "anger", min: 0.4 }
  ],
  score: -2,
  description: "Feeling let down or undermined by someone once respected."
},
{
  name: "Guilty Dependence",
  core: [{ type: "comfort", min: 1.2 }],
  support: [
    { type: "remorse", min: 0.4 },
    { type: "sadness", min: 0.4 }
  ],
  score: 2,
  description: "Knowing you rely on someone but feeling you're a burden or unworthy."
},
{
  name: "Playful Vulnerability",
  core: [{ type: "amusement", min: 1.2 }],
  support: [
    { type: "embarrassment", min: 0.4 },
    { type: "caring", min: 0.4 }
  ],
  score: 3,
  description: "Letting someone see your flaws while joking about them — a trust signal."
},
{
  name: "Jealous Respect",
  core: [{ type: "admiration", min: 1.2 }],
  support: [
    { type: "envy", min: 0.4 },
    { type: "disappointment", min: 0.4 }
  ],
  score: 1,
  description: "Wanting what the other has — emotionally or socially — but still respecting them."
},
{
  name: "Toxic Affection",
  core: [{ type: "desire", min: 1.2 }],
  support: [
    { type: "disgust", min: 0.4 },
    { type: "fear", min: 0.4 }
  ],
  score: -3,
  description: "Obsession or unhealthy attachment masquerading as connection."
},
{
  name: "Hopeful Distance",
  core: [{ type: "optimism", min: 1.2 }],
  support: [
    { type: "sadness", min: 0.4 },
    { type: "caring", min: 0.4 }
  ],
  score: 2,
  description: "Wishing for connection across an emotional or physical gap."
},
{
  name: "Weaponized Charm",
  core: [{ type: "amusement", min: 1.2 }],
  support: [
    { type: "approval", min: 0.4 },
    { type: "manipulation", min: 0.4 }
  ],
  score: -1,
  description: "Fake warmth used to control or deceive. Potential danger if unmasked."
},
{
  name: "Unwilling Closeness",
  core: [{ type: "comfort", min: 1.2 }],
  support: [
    { type: "disgust", min: 0.4 },
    { type: "desire", min: 0.4 }
  ],
  score: 0,
  description: "Mixed signals — drawn in, but something feels wrong or unwanted."
},
  {
    name: "Wary Trust",
    core: [{ type: "fear", min: 1.2 }],
    support: [
      { type: "caring", min: 0.4 },
      { type: "approval", min: 0.2 }
    ],
    score: 2,
    description: "Fear present, but overridden by warmth and cautious recognition."
  },
  {
    name: "Flickering Admiration",
    core: [{ type: "admiration", min: 1.2 }],
    support: [
      { type: "joy", min: 0.2 },
      { type: "curiosity", min: 0.2 }
    ],
    score: 3,
    description: "Childlike awe blended with warmth and interest."
  },
  {
    name: "Scent of Belonging",
    core: [{ type: "realization", min: 0.5 }],
    support: [
      { type: "love", min: 0.4 },
      { type: "nostalgia", min: 0.2 }
    ],
    score: 3,
    description: "Sudden emotional recognition of safety and kinship."
  },
  {
    name: "Resonant Memory",
    core: [
      { type: "joy", min: 0.4 },
      { type: "sadness", min: 0.4 }
    ],
    support: [
      { type: "love", min: 0.2 }
    ],
    score: 2,
    description: "Bittersweet recall, linking past love to the present moment."
  },
  {
    name: "Protective Anchor",
    core: [{ type: "caring", min: 1.2 }],
    support: [
      { type: "fear", min: 0.4 }
    ],
    score: 4,
    description: "A clear sense of being held, grounded, or defended by another."
  },
  {
    name: "Conflict & Comfort",
    core: [{ type: "annoyance", min: 0.5 }],
    support: [
      { type: "love", min: 0.4 },
      { type: "amusement", min: 0.4 }
    ],
    score: 1,
    description: "Irritation laced with fondness — common in sibling or rival relationships."
  },
  {
    name: "Awe & Unease",
    core: [{ type: "admiration", min: 0.5 }],
    support: [
      { type: "nervousness", min: 0.4 }
    ],
    score: 0,
    description: "Emotional attraction spiked by tension. Could tip either way."
  },
  {
    name: "Revulsion and Disbelief",
    core: [{ type: "disgust", min: 1.2 }],
    support: [
      { type: "confusion", min: 0.4 },
      { type: "disapproval", min: 0.2 }
    ],
    score: -4,
    description: "Recoil, moral outrage, and emotional distance."
  },
  {
    name: "Betrayal Echo",
    core: [
      { type: "sadness", min: 0.5 },
      { type: "anger", min: 0.4 }
    ],
    support: [
      { type: "grief", min: 0.4 }
    ],
    score: -3,
    description: "Pain tied to personal attachment. Love turned into resentment."
  },
  {
    name: "Burned Trust",
    core: [{ type: "disappointment", min: 1.2 }],
    support: [
      { type: "caring", min: 0.4 }
    ],
    score: -2,
    description: "Let down by someone you once trusted. The sting of unmet expectations."
  },
  {
    name: "Brazen Fear",   
    core: [
     { type: "curiosity", min: 1.2 },
     { type: "fear", min: 1.2 }
    ],
    support: [
      { type: "confusion", min: 0.4 },
      { type: "realization", min: 0.4 }
    ],
     score: 1,
    description: "Exploring despite hesitation. She's not connecting, she's testing."
},
{
  name: "Tactical Reserve",
  score: 0,
  core: [
    { type: "approval", min: 1.2 }
  ],
  support: [
    { type: "annoyance", min: 0.4 },
    { type: "confusion", min: 0.4 }
  ],
  description: "Neutral — evaluating, not connecting emotionally."
},
{
  name: "Fixated Mischief",
  score: 2,
  core: [
    { type: "curiosity", min: 0.5 },
    { type: "approval", min: 0.5 }
  ],
  support: [
    { type: "anticipation", min: 0.2 },
    { type: "impulsiveness", min: 0.4 }
  ],
  description: "A high-energy, impulsive fixation on something desirable—often disarming or childlike. Common in characters seeking both stimulation and validation. Can signal distraction, risk-taking, or playful disobedience."
},
{
  name: "Haunted Pragmatism",
  score: -1,
  core: [
    { type: "sadness", min: 1.2 },
    { type: "realization", min: 0.5 }
  ],
  support: [
    { type: "annoyance", min: 0.4 },
    { type: "fear", min: 0.4 }
  ],
  description: "Emotionally withdrawn survivalist behavior. Often rooted in trauma. Hypervigilant but calculating, with minimal affect display. Used when a character suppresses grief to maintain control."
},
{
  name: "Combustive Caution",
  score: -1,
  core: [
    { type: "approval", min: 1.2 },
    { type: "fear", min: 1.2 }
  ],
  support: [
    { type: "realization", min: 0.4 },
    { type: "annoyance", min: 0.4 }
  ],
  description: "The moment before a calculated risk. Burned before, the character balances tension and resolve. Often used when asserting conditional trust under pressure—especially after trauma. Action is ready, but leashed."
},
{
  name: "Innocent Desperation",
  score: 5,
  core: [
    { type: "joy", min: 0.7 },
    { type: "approval", min: 1.2 }
  ],
  support: [
    { type: "realization", min: 0.4 },
    { type: "annoyance", min: 0.4 }
  ],
  description: "A child's emotional flood—eager to be believed, desperate to be taken seriously. Often follows suppressed fear or misunderstanding. Exhibits hope wrapped in anxiety. Useful for moments of fragile enthusiasm."
},
{
  name: "Coiled Resolve",
  score: 3,
  core: [
    { type: "realization", min: 1.2 },
    { type: "approval", min: 1.2 }
  ],
  support: [
    { type: "confusion", min: 0.4 },
    { type: "curiosity", min: 0.4 },
    { type: "annoyance", min: 0.4 }
  ],
  description: "The subject is fully aware of the threat and accepts their role as protector, even at personal cost. This is the tension of choosing duty over self-preservation — defensive but lucid, bracing without hesitation."
},
{
  name: "Measured Defiance",
  score: 2,
  core: [
    { type: "approval", min: 1.2 },
    { type:"realization", min: 1.2 }
  ],
  support: [
    { type: "curiosity", min: 0.4 },
    { type: "annoyance", min: 0.4 },
    { type: "confusion", min: 0.4 }
  ],
  description: "Calm resistance sharpened by trauma. The subject evaluates danger without yielding to it, weighing spoken words against unspoken threats. Ideal for situations where the character chooses clarity over comfort—protective of others but unforgiving of false hope."
},
{
  name: "Resigned Precision",
  score: 0,
  core: [
    { type: "realization", min: 1.1 },
    { type: "disapproval", min: 0.8 }
  ],
  support: [
    { type: "sadness", min: 0.4 },
    { type: "fear", min: 0.3 }
  ],
  description: "Emotion held at arm's length. A choice made with cold clarity and internal cost."
},
{
  name: "Fragile Bravado",
  score: 0,
  core: [
    { type: "approval", min: 1.2 },
    { type: "amusement", min: 0.8 }
  ],
  support: [
    { type: "nervousness", min: 0.4 },
    { type: "fear", min: 0.3 }
  ],
  description: "A smirk that’s half shield, half surrender. Laughing so you don’t cry."
},
{
  name: "Deadlight Focus",
  score: 0,
  core: [
    { type: "confusion", min: 1.0 },
    { type: "realization", min: 1.0 }
  ],
  support: [
    { type: "fear", min: 0.3 },
    { type: "disgust", min: 0.3 },
    { type: "sadness", min: 0.2 }
  ],
  description: "Detached clarity. Emotion muffled behind procedural thought."
},
{
    name: "Wary Resolve",
    core: [
        { type: "realization", min: 0.015 },
        { type: "sadness", min: 0.015 },
        { type: "approval", min: 0.01 },
        { type: "annoyance", min: 0.01 }
    ],
    support: [
        { type: "fear", min: 0.005 },
        { type: "caring", min: 0.005 },
        { type: "disappointment", min: 0.005 },
        { type: "disapproval", min: 0.005 }
    ],
    score: 3,
    description: "The hard-won calm of someone who expects the worst and prepares anyway. Sorrow and clarity meet in a body too tired to tremble. Not submission—acceptance of cost. The presence of another only sharpens the edge, adding purpose to the stillness."
},
{
    name: "Guarded Desperation",
    core: [
        { type: "fear", min: 0.003 },
        { type: "realization", min: 0.01 }
    ],
    support: [
        { type: "nervousness", min: 0.002 },
        { type: "sadness", min: 0.002 }
    ],
    score: 2,
    description: "The subject knows danger is present but is too focused or exhausted to panic. Quiet urgency undercuts full fear."
},
{
    name: "Stoic Protection",
    core: [
        { type: "caring", min: 0.004 },
        { type: "approval", min: 0.01 }
    ],
    support: [
        { type: "fear", min: 0.003 },
        { type: "sadness", min: 0.002 }
    ],
    score: 2,
    description: "Emotional investment in another’s safety, maintained with composure despite inner tension or grief."
},
{
    name: "Burned Clarity",
    core: [
        { type: "realization", min: 0.015 }
    ],
    support: [
        { type: "sadness", min: 0.003 },
        { type: "disappointment", min: 0.002 },
        { type: "fear", min: 0.002 }
    ],
    score: 2,
    description: "A painful epiphany born from violence or loss. The sharp moment of seeing a situation for what it is—too late."
},
{
    name: "Silent Readiness",
    core: [
        { type: "nervousness", min: 0.004 },
        { type: "approval", min: 0.01 }
    ],
    support: [
        { type: "fear", min: 0.002 },
        { type: "anger", min: 0.002 }
    ],
    score: 2,
    description: "A still, clenched focus in the face of a threat. Emotion is present, but reined in. The quiet before defiance."
},
{
    name: "Mourning Vigilance",
    core: [
        { type: "sadness", min: 0.01 },
        { type: "caring", min: 0.004 }
    ],
    support: [
        { type: "realization", min: 0.003 },
        { type: "fear", min: 0.002 }
    ],
    score: 2,
    description: "Holding on to someone or something as the world breaks down. Grief translated into protectiveness and watchfulness."
},
{
    name: "Resigned Defense",
    core: [
        { type: "disappointment", min: 0.004 },
        { type: "approval", min: 0.01 }
    ],
    support: [
        { type: "sadness", min: 0.003 },
        { type: "fear", min: 0.002 }
    ],
    score: 2,
    description: "A calm, bleak determination to act even knowing it won't change much. Less hope than refusal to abandon values."
},
{
    name: "Quiet Resolve",
    core: [
        { type: "realization", min: 0.007 },
        { type: "fear", min: 0.002 }
    ],
    support: [
        { type: "approval", min: 0.01 }
    ],
    score: +2,
    description: "Recognition of risk paired with an anchored sense of direction. Steely clarity, tempered by tension."
},
{
    name: "Reluctant Protection",
    core: [
        { type: "caring", min: 0.003 },
        { type: "fear", min: 0.003 }
    ],
    support: [
        { type: "disappointment", min: 0.002 }
    ],
    score: +1,
    description: "Driven by duty or attachment despite discomfort. The bond is intact, but not joyful."
},
{
    name: "Sharpened Resentment",
    core: [
        { type: "realization", min: 0.008 },
        { type: "disappointment", min: 0.004 }
    ],
    support: [
        { type: "approval", min: 0.01 }
    ],
    score: -3,
    description: "The speaker has internalized a lesson from betrayal or failure. Future interactions will be colder."
},
{
    name: "Inward Collapse",
    core: [
        { type: "sadness", min: 0.01 },
        { type: "disappointment", min: 0.004 }
    ],
    support: [
        { type: "nervousness", min: 0.003 }
    ],
    score: -4,
    description: "Emotional shutdown. Appears quiet or obedient but is mentally checked out. Trust decay is imminent."
},
{
    name: "Bitter Clarity",
    core: [
        { type: "realization", min: 0.015 }
    ],
    support: [
        { type: "disappointment", min: 0.003 },
        { type: "fear", min: 0.002 }
    ],
    score: -2,
    description: "Something true has been learned, and it hurts. The damage is real but not loud. Often mistaken for wisdom."
},
{
    name: "Veiled Bitterness",
    core: [
        { type: "disappointment", min: 0.004 },
        { type: "sadness", min: 0.002 }
    ],
    support: [
        { type: "approval", min: 0.006 },
        { type: "fear", min: 0.002 }
    ],
    score: -1,
    description: "Speaker hides emotional discontent behind a facade of acceptance. Implies resentment or emotional fatigue."
},
{
    name: "Tense Detachment",
    core: [
        { type: "fear", min: 0.003 },
        { type: "nervousness", min: 0.004 }
    ],
    support: [
        { type: "sadness", min: 0.002 }
    ],
    score: -2,
    description: "The subject is present but disconnected, emotionally preparing for harm or failure. Unnerving to the recipient."
},
{
    name: "Fractured Composure",
    core: [
        { type: "nervousness", min: 0.003 },
        { type: "disappointment", min: 0.004 }
    ],
    support: [
        { type: "realization", min: 0.004 }
    ],
    score: -2,
    description: "A veneer of calm hides barely-contained disillusionment or regret. Quiet unease radiates outward."
},
{
    name: "Hopeless Duty",
    core: [
        { type: "realization", min: 0.006 },
        { type: "sadness", min: 0.006 }
    ],
    support: [
        { type: "approval", min: 0.01 }
    ],
    score: -1,
    description: "Carrying on with the right thing, but drained of belief or expectation. Looks noble, feels dead inside."
},
{
    name: "Unspoken Withdrawal",
    core: [
        { type: "disappointment", min: 0.006 }
    ],
    support: [
        { type: "caring", min: 0.002 },
        { type: "fear", min: 0.003 }
    ],
    score: -1,
    description: "Affection is still present, but the speaker has pulled away emotionally. A small rift forms, easy to miss."
},
];