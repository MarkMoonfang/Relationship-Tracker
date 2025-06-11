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
    core: [{ type: "fear", min: 0.6 }],
    support: [
      { type: "caring", min: 0.3 },
      { type: "nervousness", min: 0.3 }
    ],
    score: 3,
    description: "Speaker shows investment in another's safety; bond of guardianship."
    },
    {
    name: "Tentative Admiration",
    core: [{ type: "admiration", min: 0.6 }],
    support: [
      { type: "nervousness", min: 0.2 },
      { type: "realization", min: 0.3 }
    ],
    score: 2,
    description: "Hesitant or shy recognition of someone's worth or power."
    },
    {
     name: "Curious Desire",
     core: [{ type: "curiosity", min: 0.6 }],
     support: [
        { type: "desire", min: 0.3 },
        { type: "confusion", min: 0.2 },
     ],
     score: 2,
      description: "Interest tinged with emotional or intimate probing."
    },
    {
      name: "Playful Challenge",
  core: [
    { type: "amusement", min: 0.6 }
  ],
  support: [
    { type: "approval", min: 0.3 },
    { type: "surprise", min: 0.3 },
    { type: "annoyance", min: 0.2 }
  ],
  score: 1,
  description: "Teasing or bantering dynamic; light conflict as bonding."
    },
    {
  name: "Wordless Connection",
  core: [
    { type: "caring", min: 0.6 }
  ],
  support: [
    { type: "realization", min: 0.3 },
    { type: "joy", min: 0.3 }
  ],
  score: 3,
  description: "Unspoken shared moment of emotional understanding."
},
{
  name: "Respectful Awe",
  core: [
    { type: "admiration", min: 0.6 }
  ],
  support: [
    { type: "pride", min: 0.3 },
    { type: "fear", min: 0.3 }
  ],
  score: 2,
  description: "Speaker is impressed but also humbled or intimidated."
},
{
  name: "Yearning Loneliness",
  core: [
    { type: "sadness", min: 0.6 }
  ],
  support: [
    { type: "desire", min: 0.3 },
    { type: "realization", min: 0.3 }
  ],
  score: 3,
  description: "Emotional hunger for closeness; unspoken longing."
},
{
  name: "Buried Vulnerability",
  core: [
    { type: "grief", min: 0.6 }
  ],
  support: [
    { type: "remorse", min: 0.3 },
    { type: "embarrassment", min: 0.3 },
    { type: "caring", min: 0.3 }
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
        { type: "admiration", min: 0.3 },
      ],
      score: 2,
      description: "Bond formed in tension; acknowledgment through opposition."
    },
    {
    name: "Trust Test",
    core: [{ type: "caring", min: 0.6 }],
    support: [
      { type: "confusion", min: 0.3 },
      { type: "nervousness", min: 0.3 },
      { type: "optimism", min: 0.3 }
    ],
    score: 3,
    description: "Speaker is risking emotional openness to form deeper trust."
  },
    {
    name: "Hidden Longing",
    core: [{ type: "desire", min: 0.6 }],
    support: [
      { type: "joy", min: 0.3 },
      { type: "sadness", min: 0.3 }
    ],
    score: 4,
    description: "A veiled wish for closeness, possibly romantic."
  },
    {
    name: "Disillusioned Devotion",
    core: [{ type: "caring", min: 0.6 }],
    support: [
      { type: "disappointment", min: 0.3 },
      { type: "approval", min: 0.3 }
    ],
    score: 1,
    description: "Support remains despite perceived failure or emotional setback."
  },
  {
    name: "Emotional Rejection",
    core: [{ type: "disapproval", min: 0.6 }],
    support: [
      { type: "disgust", min: 0.3 },
      { type: "anger", min: 0.3 }
    ],
    score: -3,
    description: "Pushback or rejection of the other’s behavior or presence."
  },
  {
    name: "Grudging Respect",
    core: [{ type: "admiration", min: 0.6 }],
    support: [
      { type: "annoyance", min: 0.3 },
      { type: "pride", min: 0.3 }
    ],
    score: 1,
    description: "Acknowledging someone’s value despite personal friction."
  },
  {
    name: "Hurt Loyalty",
    core: [{ type: "remorse", min: 0.6 }],
    support: [
      { type: "sadness", min: 0.3 },
      { type: "caring", min: 0.3 }
    ],
    score: 2,
    description: "Sticking by someone even in moments of emotional pain."
  },
  {
    name: "Conflicted Attraction",
    core: [{ type: "desire", min: 0.6 }],
    support: [
      { type: "disgust", min: 0.3 },
      { type: "confusion", min: 0.3 }
    ],
    score: 1,
    description: "An emotionally tangled reaction toward the other person."
  },
  {
    name: "Bittersweet Affection",
    core: [{ type: "love", min: 0.6 }],
    support: [
      { type: "sadness", min: 0.3 },
      { type: "relief", min: 0.3 }
    ],
    score: 4,
    description: "A deep connection shadowed by loss, hardship, or distance."
  },
  {
    name: "Detached Analysis",
    core: [{ type: "curiosity", min: 0.6 }],
    support: [
      { type: "neutral", min: 0.3 },
      { type: "realization", min: 0.3 }
    ],
    score: 0,
    description: "Observation without investment; analytical distance."
  },
  {
    name: "Admiration with Distance",
    core: [{ type: "admiration", min: 0.6 }],
    support: [
      { type: "confusion", min: 0.3 },
      { type: "neutral", min: 0.3 }
    ],
    score: 1,
    description: "They respect the other, but don’t yet feel close or aligned."
  },
  {
    name: "Pure Joy Bond",
    core: [{ type: "joy", min: 0.6 }],
    support: [
      { type: "caring", min: 0.3 },
      { type: "excitement", min: 0.3 }
    ],
    score: 4,
    description: "A genuinely happy and open affection moment; rare spike."
  },
    {
  name: "Cracked Composure",
  core: [{ type: "embarrassment", min: 0.6 }],
  support: [
    { type: "anger", min: 0.3 },
    { type: "admiration", min: 0.3 }
  ],
  score: 1,
  description: "A moment where the speaker loses their guard due to someone they respect or fear."
},
{
  name: "Intimate Frustration",
  core: [{ type: "annoyance", min: 0.6 }],
  support: [
    { type: "caring", min: 0.3 },
    { type: "remorse", min: 0.3 }
  ],
  score: 2,
  description: "Emotional investment causes irritation — a sign of deeper closeness under strain."
},
{
  name: "Surprised Softness",
  core: [{ type: "surprise", min: 0.6 }],
  support: [
    { type: "joy", min: 0.3 },
    { type: "caring", min: 0.3 }
  ],
  score: 3,
  description: "A sudden moment of unexpected emotional openness or connection."
},
{
  name: "Unspoken Gratitude",
  core: [{ type: "relief", min: 0.6 }],
  support: [
    { type: "caring", min: 0.3 },
    { type: "embarrassment", min: 0.3 }
  ],
  score: 2,
  description: "Quiet acknowledgment of someone’s help or presence, tinged with vulnerability."
},
{
  name: "Familiar Tension",
  core: [{ type: "annoyance", min: 0.6 }],
  support: [
    { type: "comfort", min: 0.3 },
    { type: "confusion", min: 0.3 }
  ],
  score: 1,
  description: "A dynamic formed over time — irritated but secure in the bond."
},
{
  name: "Closeness Through Conflict",
  core: [{ type: "anger", min: 0.6 }],
  support: [
    { type: "approval", min: 0.3 },
    { type: "respect", min: 0.3 }
  ],
  score: 2,
  description: "Bond strengthened through disagreement or challenge."
},
{
  name: "Fear of Losing",
  core: [{ type: "fear", min: 0.6 }],
  support: [
    { type: "sadness", min: 0.3 },
    { type: "caring", min: 0.3 }
  ],
  score: 3,
  description: "Emotional fear tied not to threat, but to loss of a valued connection."
},
{
  name: "Power Imbalance",
  core: [{ type: "admiration", min: 0.6 }],
  support: [
    { type: "fear", min: 0.3 },
    { type: "desire", min: 0.3 }
  ],
  score: 2,
  description: "Complex dynamic where one party feels smaller, weaker, but drawn in."
},
{
  name: "Shameful Attachment",
  core: [{ type: "desire", min: 0.6 }],
  support: [
    { type: "remorse", min: 0.3 },
    { type: "embarrassment", min: 0.3 }
  ],
  score: 1,
  description: "Attraction accompanied by guilt or self-consciousness."
},
{
  name: "Uncomfortable Truth",
  core: [{ type: "realization", min: 0.6 }],
  support: [
    { type: "disgust", min: 0.3 },
    { type: "remorse", min: 0.3 }
  ],
  score: -1,
  description: "Painful internal shift that can damage or reset a relationship."
}
,
  {
  name: "Crisis Trust",
  core: [{ type: "fear", min: 0.6 }],
  support: [
    { type: "optimism", min: 0.3 },
    { type: "approval", min: 0.3 }
  ],
  score: 4,
  description: "Bond proven under high emotional stakes or pressure."
},
{
  name: "Wounded Pride",
  core: [{ type: "pride", min: 0.6 }],
  support: [
    { type: "disappointment", min: 0.3 },
    { type: "anger", min: 0.3 }
  ],
  score: -2,
  description: "Feeling let down or undermined by someone once respected."
},
{
  name: "Guilty Dependence",
  core: [{ type: "comfort", min: 0.6 }],
  support: [
    { type: "remorse", min: 0.3 },
    { type: "sadness", min: 0.3 }
  ],
  score: 2,
  description: "Knowing you rely on someone but feeling you're a burden or unworthy."
},
{
  name: "Playful Vulnerability",
  core: [{ type: "amusement", min: 0.6 }],
  support: [
    { type: "embarrassment", min: 0.3 },
    { type: "caring", min: 0.3 }
  ],
  score: 3,
  description: "Letting someone see your flaws while joking about them — a trust signal."
},
{
  name: "Jealous Respect",
  core: [{ type: "admiration", min: 0.6 }],
  support: [
    { type: "envy", min: 0.3 },
    { type: "disappointment", min: 0.3 }
  ],
  score: 1,
  description: "Wanting what the other has — emotionally or socially — but still respecting them."
},
{
  name: "Toxic Affection",
  core: [{ type: "desire", min: 0.6 }],
  support: [
    { type: "disgust", min: 0.3 },
    { type: "fear", min: 0.3 }
  ],
  score: -3,
  description: "Obsession or unhealthy attachment masquerading as connection."
},
{
  name: "Hopeful Distance",
  core: [{ type: "optimism", min: 0.6 }],
  support: [
    { type: "sadness", min: 0.3 },
    { type: "caring", min: 0.3 }
  ],
  score: 2,
  description: "Wishing for connection across an emotional or physical gap."
},
{
  name: "Cold Affection",
  core: [{ type: "approval", min: 0.6 }],
  support: [
    { type: "neutral", min: 0.3 },
    { type: "remorse", min: 0.3 }
  ],
  score: 1,
  description: "Attachment expressed through restraint or formality."
},
{
  name: "Weaponized Charm",
  core: [{ type: "amusement", min: 0.6 }],
  support: [
    { type: "approval", min: 0.3 },
    { type: "manipulation", min: 0.3 }
  ],
  score: -1,
  description: "Fake warmth used to control or deceive. Potential danger if unmasked."
},
{
  name: "Unwilling Closeness",
  core: [{ type: "comfort", min: 0.6 }],
  support: [
    { type: "disgust", min: 0.3 },
    { type: "desire", min: 0.3 }
  ],
  score: 0,
  description: "Mixed signals — drawn in, but something feels wrong or unwanted."
},
  {
    name: "Wary Trust",
    core: [{ type: "fear", min: 0.6 }],
    support: [
      { type: "caring", min: 0.3 },
      { type: "approval", min: 0.2 }
    ],
    score: 2,
    description: "Fear present, but overridden by warmth and cautious recognition."
  },
  {
    name: "Flickering Admiration",
    core: [{ type: "admiration", min: 0.6 }],
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
      { type: "love", min: 0.3 },
      { type: "nostalgia", min: 0.2 }
    ],
    score: 3,
    description: "Sudden emotional recognition of safety and kinship."
  },
  {
    name: "Resonant Memory",
    core: [
      { type: "joy", min: 0.4 },
      { type: "sadness", min: 0.3 }
    ],
    support: [
      { type: "love", min: 0.2 }
    ],
    score: 2,
    description: "Bittersweet recall, linking past love to the present moment."
  },
  {
    name: "Protective Anchor",
    core: [{ type: "caring", min: 0.6 }],
    support: [
      { type: "fear", min: 0.3 }
    ],
    score: 4,
    description: "A clear sense of being held, grounded, or defended by another."
  },
  {
    name: "Conflict & Comfort",
    core: [{ type: "annoyance", min: 0.5 }],
    support: [
      { type: "love", min: 0.3 },
      { type: "amusement", min: 0.3 }
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
    name: "Cold Respect",
    core: [{ type: "approval", min: 0.6 }],
    support: [
      { type: "neutral", min: 0.4 }
    ],
    score: -1,
    description: "Recognition without warmth. Respect absent emotional investment."
  },
  {
    name: "Revulsion and Disbelief",
    core: [{ type: "disgust", min: 0.6 }],
    support: [
      { type: "confusion", min: 0.3 },
      { type: "disapproval", min: 0.2 }
    ],
    score: -4,
    description: "Recoil, moral outrage, and emotional distance."
  },
  {
    name: "Betrayal Echo",
    core: [
      { type: "sadness", min: 0.5 },
      { type: "anger", min: 0.3 }
    ],
    support: [
      { type: "grief", min: 0.3 }
    ],
    score: -3,
    description: "Pain tied to personal attachment. Love turned into resentment."
  },
  {
    name: "Burned Trust",
    core: [{ type: "disappointment", min: 0.6 }],
    support: [
      { type: "caring", min: 0.3 }
    ],
    score: -2,
    description: "Let down by someone you once trusted. The sting of unmet expectations."
  },
  {
    name: "Brazen Fear",   
    core: [
     { type: "curiosity", min: 0.6 },
     { type: "fear", min: 0.6 }
    ],
    support: [
      { type: "confusion", min: 0.3 },
      { type: "realization", min: 0.3 }
    ],
     score: 1,
    description: "Exploring despite hesitation. She's not connecting, she's testing."
},
{
  name: "Tactical Reserve",
  score: 0,
  core: [
    { type: "approval", min: 0.6 }
  ],
  support: [
    { type: "annoyance", min: 0.3 },
    { type: "confusion", min: 0.3 }
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
    { type: "impulsiveness", min: 0.3 }
  ],
  description: "A high-energy, impulsive fixation on something desirable—often disarming or childlike. Common in characters seeking both stimulation and validation. Can signal distraction, risk-taking, or playful disobedience."
},
{
  name: "Haunted Pragmatism",
  score: -1,
  core: [
    { type: "sadness", min: 0.6 },
    { type: "realization", min: 0.5 }
  ],
  support: [
    { type: "annoyance", min: 0.3 },
    { type: "fear", min: 0.4 }
  ],
  description: "Emotionally withdrawn survivalist behavior. Often rooted in trauma. Hypervigilant but calculating, with minimal affect display. Used when a character suppresses grief to maintain control."
},
{
  name: "Combustive Caution",
  score: -1,
  core: [
    { type: "approval", min: 0.6 },
    { type: "fear", min: 0.6 }
  ],
  support: [
    { type: "realization", min: 0.3 },
    { type: "annoyance", min: 0.3 }
  ],
  description: "The moment before a calculated risk. Burned before, the character balances tension and resolve. Often used when asserting conditional trust under pressure—especially after trauma. Action is ready, but leashed."
},
{
  name: "Innocent Desperation",
  score: 5,
  core: [
    { type: "joy", min: 0.7 },
    { type: "approval", min: 0.6 }
  ],
  support: [
    { type: "realization", min: 0.3 },
    { type: "annoyance", min: 0.3 }
  ],
  description: "A child's emotional flood—eager to be believed, desperate to be taken seriously. Often follows suppressed fear or misunderstanding. Exhibits hope wrapped in anxiety. Useful for moments of fragile enthusiasm."
}
];
