# Context Management & AI Content Generation in EdTech
## Deep Research Report — March 2026

---

## Table of Contents
1. [Context Layering in Adaptive Learning Platforms](#1-context-layering-in-adaptive-learning-platforms)
2. [AI Content Generation Context Patterns](#2-ai-content-generation-context-patterns)
3. [Knowledge Tracing / Learner Modeling](#3-knowledge-tracing--learner-modeling)
4. [Roadmap/Curriculum Context](#4-roadmapcurriculum-context)
5. [Quest/Lesson-Level Context](#5-questlesson-level-context)
6. [Context Sharing Between Learning Paths](#6-context-sharing-between-learning-paths)
7. [Practical LLM Context Management](#7-practical-llm-context-management)
8. [Synthesized Architecture for Plan2Skill](#8-synthesized-architecture-for-plan2skill)

---

## 1. Context Layering in Adaptive Learning Platforms

### 1.1 Industry Landscape

Modern adaptive learning platforms consistently use a **multi-layer context architecture**. Here is how the leaders structure it:

#### Duolingo (Birdbrain)
- **Architecture**: PyTorch-based deep learning model processing 1.25B daily exercises
- **Context layers**:
  - **Learner ability estimate** — continuous, updated per-interaction via IRT-style joint modeling
  - **Exercise difficulty estimate** — per-exercise, decomposed into component difficulties
  - **Memory half-life per word/concept** — modeled via Half-Life Regression (HLR): `h = 2^(Theta * x)` where x = learning history features
  - **Session context** — real-time feedback loop, 14ms exercise delivery (rewritten Session Generator in Scala)
  - **Lexeme features** — per-vocabulary-item tags (e.g., `camera.N.SG`) capturing inherent difficulty
- **Key insight**: Birdbrain simultaneously estimates BOTH learner ability AND exercise difficulty at every interaction. When a learner gets something wrong, ability goes down AND difficulty goes up.
- **Sources**: [Duolingo Birdbrain Blog](https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain/), [IEEE Spectrum](https://spectrum.ieee.org/duolingo)

#### Khan Academy (Khanmigo)
- **Architecture**: GPT-4o via API, Go-based backend, Langfuse for LLM observability
- **Context layers**:
  - **Content library context** — exercises, steps, hints, solutions (human-generated) retrieved BEFORE LLM responds
  - **Learner account data** — courses enrolled, preferred language, personal interests
  - **Exercise state** — current problem, student's submitted answer, step-by-step progress
  - **Conversation history** — multi-turn tutoring dialogue
  - **Safety/moderation layer** — guardrails for age-appropriate interaction
- **Key insight**: Khanmigo's accuracy improves significantly when it retrieves human-generated hints/solutions BEFORE making calculations. This led to an architectural change: always gather content library context first.
- **Sources**: [Khan Academy Help Center](https://support.khanacademy.org/hc/en-us/articles/13888935335309), [Langfuse Case Study](https://langfuse.com/customers/khan-academy), [7-Step Prompt Engineering](https://blog.khanacademy.org/khan-academys-7-step-approach-to-prompt-engineering-for-khanmigo/)

#### Knewton Alta (now Wiley)
- **Architecture**: Knowledge graph + probabilistic knowledge state engine
- **Context layers**:
  - **Knowledge graph** — maps pedagogical relationships between all concepts
  - **Probabilistic knowledge state** — moved beyond binary "mastered/not mastered" to probability distributions per concept
  - **Prerequisite chain** — directed graph of concept dependencies
  - **Remediation context** — when a learner fails, traces back to prerequisite gaps
- **Key insight**: The probabilistic approach to knowledge state (not binary) is critical — humans learn incrementally, and the model must reflect that.
- **Sources**: [Knewton Alta](https://www.wiley.com/en-us/grow/teach-learn/teacher-resources/courseware/knewton-alta/resources/alta-blog-what-is-adaptive-learning/), [Knewton Dev Docs](https://dev.knewton.com/)

#### Squirrel AI
- **Architecture**: Fine-grained knowledge point decomposition + knowledge graph
- **Context layers**:
  - **Knowledge points** — ultra-fine-grained (10,000+ for middle school math alone)
  - **Knowledge graph** — links between related knowledge points
  - **Learner gap analysis** — precisely targets which fine-grained concepts are missing
  - **Cognitive diagnosis engine** — processes 10M+ data points daily, 85%+ prediction accuracy
- **Key insight**: The granularity matters enormously. 10,000+ knowledge points for ONE subject lets you precisely target gaps rather than re-teaching broad topics.
- **Sources**: [Squirrel AI](https://squirrelai.com/), [Wikipedia](https://en.wikipedia.org/wiki/Squirrel_AI)

#### SchoolAI (Dot/Sidekick)
- **Architecture**: Agent graph with dozens of specialized nodes, GPT-4o + GPT-4.1
- **Context layers**:
  - **Student input** — raw query/answer
  - **Agent graph nodes** — each node is a specialized processor (models, tools, or guardrails)
  - **Teacher-defined context** — classroom goals, lesson parameters
  - **Observable state** — every interaction visible to teachers
- **Key insight**: Not a single prompt-and-response loop. Every input passes through a DAG of specialized nodes before a response is generated.
- **Sources**: [OpenAI SchoolAI Case Study](https://openai.com/index/schoolai/)

#### Google LearnLM
- **Architecture**: Gemini-based, fine-tuned on learning science principles
- **Context layers**:
  - **Pedagogical principles** — 7 learning science benchmarks baked into the model via fine-tuning
  - **Grade-level adaptation** — adjusts material complexity to learner level
  - **Personalization pipeline** — replaces generic examples with personalized ones
  - **Content representations** — multiple views of same content adapted to learner
- **Key insight**: LearnLM is fine-tuned, not just prompted. The learning science is in the weights, not just the context. Students were 5.5% more likely to solve novel problems vs. human tutors alone.
- **Sources**: [LearnLM Paper](https://storage.googleapis.com/deepmind-media/LearnLM/LearnLM_paper.pdf), [Google Cloud](https://cloud.google.com/solutions/learnlm)

### 1.2 Synthesized Context Layer Model

From all platforms, the universal layers are:

```
Layer 0: DOMAIN MODEL (static)
├── Skill taxonomy / knowledge graph
├── Prerequisite dependencies
├── Content library (exercises, explanations, hints)
└── Difficulty calibration data

Layer 1: LEARNER PROFILE (slow-changing)
├── Knowledge state per skill (probabilistic, not binary)
├── Learning speed / style indicators
├── Goals and preferences
├── Historical performance aggregates
└── Demographic/accessibility needs

Layer 2: ROADMAP/COURSE CONTEXT (session-spanning)
├── Current position in curriculum
├── Completed milestones
├── Active learning objectives
├── Remediation history
└── Cross-course skill transfer data

Layer 3: SESSION CONTEXT (current session)
├── Current lesson/quest state
├── Attempts in this session
├── Hints given
├── Time-on-task
├── Mistakes made (with types)
└── Engagement signals

Layer 4: INTERACTION CONTEXT (current turn)
├── Current exercise/question
├── Student's latest answer
├── Immediate feedback needed
└── Real-time difficulty adjustment
```

---

## 2. AI Content Generation Context Patterns

### 2.1 Prompt Architecture for Educational Content

#### Duolingo's "Mad Lib" Template System
The most concrete example comes from Duolingo's exercise generation:

```
FIXED RULES (in system prompt):
- "The exercise must have two answer options"
- Character limits per field
- Grammar rule constraints
- Safety guardrails

VARIABLE PARAMETERS (injected per generation):
- Target language + CEFR level
- Specific vocabulary words to incorporate
- Grammar structures to demonstrate
- Theme/context (e.g., "nostalgic memories")
- Exercise type (multiple choice, fill-in, etc.)

HUMAN INPUT (per batch):
- Learning Designer specifies pedagogical intent
- Theme selection
- Grammar focus areas
```

**Key pattern**: The LLM generates DRAFTS that humans review. "Our Spanish teaching experts always have the final say." LLM is an assistant, not a replacement.

**Source**: [Duolingo LLM Lessons Blog](https://blog.duolingo.com/large-language-model-duolingo-lessons/), [ZenML Case Study](https://www.zenml.io/llmops-database/ai-powered-lesson-generation-system-for-language-learning)

#### Duolingo Roleplay Architecture
For the conversational Max features, Duolingo uses a **multi-prompt chain**:

```
NOT one big prompt, but SEPARATE focused prompts:
- Prompt A: optimized for forming questions
- Prompt B: optimized for statements that entice more info
- Prompt C: optimized for changing the subject
- Prompt D: optimized for closing the conversation

Each character response uses a DIFFERENT prompt
depending on conversation state.
```

Human experts write the scenarios and initial messages. The AI model is told where to take the conversation. Initial prompt is aligned with where the user is in their course.

**Source**: [Duolingo Max Blog](https://blog.duolingo.com/duolingo-max/)

#### PAPPL Multi-Layered Prompt System
The PAPPL platform (Stanford/arXiv 2508.14109) provides the most detailed prompt layering:

```
LAYER 1 - Question Context:
- Current problem statement
- Correct solution (hidden from student)
- Related prerequisite concepts

LAYER 2 - Instructor Context:
- Instructor-provided explanations
- Common misconception notes for this topic
- Pedagogical approach guidance

LAYER 3 - Student History:
- This student's previous attempts on this question
- Recurring misconception patterns detected
- Previously delivered hints (to avoid repetition)
- Mastery level on related skills

LAYER 4 - Constraints:
- "Never reveal the solution"
- "Use guiding questions (Socratic method)"
- Low temperature for consistency
- Response format requirements

OUTPUT: Progressively targeted hint
```

**Key insight**: Hints become progressively more specific when repeated misconceptions persist. The system tracks which hints were already given to avoid repetition.

**Source**: [PAPPL arXiv Paper](https://arxiv.org/html/2508.14109v1)

### 2.2 Context Compression Strategies

#### Hierarchical Memory Architecture
The industry consensus is a 3-tier memory system:

```
TIER 1 — Working Memory (full fidelity)
├── Last N messages verbatim (typically 5-10 turns)
├── Current exercise state
├── Active hints and feedback
└── Token budget: 30-50% of context window

TIER 2 — Session Summary (compressed)
├── Summary of earlier conversation turns
├── Key decisions made
├── Mistakes categorized by type
├── Skills practiced this session
└── Token budget: 10-20% of context window

TIER 3 — Long-term Profile (extracted facts)
├── Knowledge state vector per skill
├── Persistent preferences
├── Historical performance aggregates
├── Key misconception patterns
└── Token budget: 5-10% of context window
```

**Compression approaches**:

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Sliding Window** | Keep last N messages, drop older | Simple, always-current | Loses critical early context |
| **Progressive Summarization** | Summarize old messages, keep recent verbatim | Good balance | Summarization can hallucinate |
| **Fact Extraction** | Extract key facts from history into structured data | Precise, compact | May miss nuance |
| **Semantic Retrieval (RAG)** | Store all history in vector DB, retrieve relevant | Scales infinitely | Retrieval quality varies |
| **Hybrid** | Combine sliding window + summarization + RAG | Best of all worlds | Complex to implement |

**Source**: [Maxim Context Management](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/)

#### Anthropic's Context Engineering Principles
From Anthropic's engineering blog (September 2025):

> "Good context engineering means finding the **smallest possible set of high-signal tokens** that maximize the likelihood of some desired outcome."

Three core techniques:
1. **Compaction** — Summarize conversation nearing window limit, restart with summary
2. **Structured Note-Taking** — Agent writes persistent notes OUTSIDE context window, retrieves later
3. **Sub-agent Architecture** — Specialized agents handle focused tasks, return condensed summaries (1,000-2,000 tokens)

Additional techniques:
- **Tool Result Clearing** — Remove raw tool outputs deep in history (safest, lightest)
- **Progressive Disclosure** — Don't load everything upfront; discover through exploration
- **Metadata Leveraging** — Use file hierarchies, naming conventions as navigation signals

**Source**: [Anthropic Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

---

## 3. Knowledge Tracing / Learner Modeling

### 3.1 Model Comparison

| Model | Type | Strengths | Weaknesses | Best For |
|-------|------|-----------|------------|----------|
| **BKT** | Bayesian | Interpretable, proven, simple | Binary mastery, no temporal decay | Prerequisite-based curricula |
| **IRT** | Statistical | Item difficulty + learner ability jointly | Static, no learning over time | Assessment/placement |
| **DKT** | Deep Learning (RNN) | Captures temporal patterns, sequence-aware | Black box, needs lots of data | Large-scale platforms |
| **HLR** | Regression | Models memory decay, personalized scheduling | Per-item, not structural | Spaced repetition |
| **FSRS** | ML + Forgetting Curve | Open source, personalized, state-of-art | Newer, less battle-tested | Modern SRS apps |
| **LLM-KT** | LLM-based | Zero-shot, no training data needed | Less accurate than specialized models | Cold-start, new domains |

**Source**: [DKT Survey](https://dl.acm.org/doi/10.1145/3729605.3729620), [EDM 2025](https://educationaldatamining.org/EDM2025/proceedings/2025.EDM.industry-papers.46/index.html)

### 3.2 Duolingo's HLR (Half-Life Regression)

The most concrete learner model with published details:

```python
# Probability of recall
p(recall) = 2^(-delta / h)

# Where:
#   delta = time since last practice (days)
#   h = half-life of memory for this item

# Half-life estimation:
h = 2^(theta @ x)

# Where:
#   theta = learned model weights
#   x = feature vector per learner-item pair:
#     - lexeme_tag (e.g., "camera.N.SG")
#     - number of times practiced
#     - number of times correct
#     - time since last practice
#     - total history length
```

Results on 13M learning traces:
- **9.5%** retention improvement for practice sessions
- **12%** improvement in overall activity
- Error rate nearly HALF that of Leitner system

**Source**: [HLR Paper](https://research.duolingo.com/papers/settles.acl16.pdf), [HLR GitHub](https://github.com/duolingo/halflife-regression)

### 3.3 LECTOR: LLM-Enhanced Spaced Repetition

The most modern approach combining LLMs with knowledge tracing (arXiv 2508.03275):

```python
# Learner profile vector (per learner, evolving):
profile_i(t) = [
    success_rate_i(t),       # Overall success rate
    learning_speed_i(t),     # How fast they learn
    retention_i(t),          # How well they retain
    semantic_sensitivity_i(t) # How prone to confusion
]

# Learning state vector (per learner-concept pair):
S_i_j(t) = (
    d_i_j,      # Concept difficulty (static)
    h_i_j(t),   # Memory half-life
    rho_i_j(t), # Repetition count
    mu_i_j(t),  # Mastery level [0,1]
    sigma_i_j(t) # Semantic interference magnitude [0,1]
)

# Retention decay:
R_i_j(t + dt) = exp(-dt / (tau * alpha * beta))
# Where:
#   tau = mastery scaling factor
#   alpha = semantic interference modulation (from LLM)
#   beta = personalization component

# LLM semantic similarity (via ICL, no fine-tuning):
Phi(c_i, c_j) = LLM(pi_semantic(c_i, c_j))
# Builds n x n semantic interference matrix
```

**Key innovation**: LLM assesses semantic similarity between concepts to detect confusion pairs. If "affect" and "effect" are semantically close, the system schedules them further apart to reduce interference.

**Source**: [LECTOR Paper](https://arxiv.org/html/2508.03275v1)

### 3.4 FSRS (Free Spaced Repetition Scheduler)

Modern open-source state-of-art, used in Anki:

```
Model: DSR (Difficulty, Stability, Retrievability)
- Difficulty: inherent item hardness
- Stability: current memory strength
- Retrievability: probability of recall right now

FSRS-6 innovations:
- Optimizable parameter for forgetting curve flatness
- Personalized curve shape per user
- Improved same-day review handling
```

Available in: JavaScript, Python, Rust, Go, and more.

**Source**: [FSRS GitHub](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler)

### 3.5 How Knowledge Tracing Feeds Content Generation

The pipeline from knowledge tracing to AI content generation:

```
[Knowledge Tracer] → knowledge_state{skill_id: probability}
    ↓
[Gap Analyzer] → identifies weakest skills + prerequisite gaps
    ↓
[Content Selector] → chooses exercise type + difficulty level
    ↓
[Context Assembler] → builds prompt with:
    - Target skill + difficulty
    - Learner's misconception history for this skill
    - Related skills context
    - Prerequisite chain
    ↓
[LLM Generator] → generates exercise/explanation
    ↓
[Quality Filter] → validates correctness, safety, pedagogy
    ↓
[Learner] → interacts
    ↓
[Knowledge Tracer] → updates state (loop)
```

---

## 4. Roadmap/Curriculum Context

### 4.1 Knowledge Graph / Skill Graph Patterns

#### Structure
Based on research across Knewton, Squirrel AI, and academic papers:

```typescript
// Skill Graph Node
interface SkillNode {
  id: string;
  name: string;
  description: string;
  domain: string;           // e.g., "javascript", "react"
  bloomLevel: BloomLevel;   // remember | understand | apply | analyze | evaluate | create
  difficulty: number;       // 0-1, calibrated from learner data

  // Knowledge point granularity (Squirrel AI pattern)
  knowledgePoints: string[]; // fine-grained sub-concepts
}

// Edges
interface SkillEdge {
  from: string;       // prerequisite skill
  to: string;         // dependent skill
  type: 'prerequisite' | 'related' | 'builds_on' | 'similar_to';
  strength: number;   // 0-1, how critical the dependency is
}

// Learner's state on the graph
interface LearnerSkillState {
  skillId: string;
  mastery: number;          // 0-1, probabilistic (Knewton pattern)
  lastPracticed: Date;
  halfLife: number;         // memory decay rate (HLR pattern)
  attemptCount: number;
  errorPatterns: string[];  // recurring misconception IDs
  bloomAchieved: BloomLevel;
}
```

**Source**: [ACE KG Paper](https://jedm.educationaldatamining.org/index.php/JEDM/article/view/737), [KG Learning Recommendations](https://arxiv.org/html/2403.03008v1)

#### Prerequisite-Aware Content Generation

When generating content for a skill, the system must include:

```
CONTEXT FOR GENERATION:
1. Target skill definition + knowledge points
2. Prerequisite skills that were already mastered (don't re-explain)
3. Prerequisite skills that are WEAK (may need remediation)
4. The learner's Bloom level for this skill
5. Previous attempts + error patterns for this specific skill
6. Related skills from different domains (cross-transfer)
```

### 4.2 Milestone-Based Progression

Pattern from curriculum design research:

```typescript
interface Milestone {
  id: string;
  roadmapId: string;
  position: number;         // order in roadmap
  requiredSkills: {
    skillId: string;
    minMastery: number;     // threshold to pass
    bloomLevel: BloomLevel; // what level required
  }[];

  // AI generation context
  generationContext: {
    theme: string;          // narrative theme for this section
    difficulty: DifficultyRange;
    focusSkills: string[];  // primary skills to practice
    reviewSkills: string[]; // skills to reinforce from earlier
  };
}
```

### 4.3 Cross-Roadmap Knowledge Transfer

This is the LEAST solved problem in the industry. Findings:

- **Near-transfer** (JavaScript → TypeScript): Relatively straightforward — shared skill IDs in the taxonomy map directly
- **Far-transfer** (math problem-solving → debugging): Very hard — requires abstract skill mapping
- **Industry approach**: Most platforms DON'T do cross-domain transfer well

Practical pattern:

```typescript
interface SharedSkillTaxonomy {
  // Abstract skills that span domains
  abstractSkills: {
    id: string;            // e.g., "decomposition", "pattern-recognition"
    domains: string[];     // which domains this appears in
    bloomLevel: BloomLevel;
  }[];

  // Mapping from domain-specific to abstract
  skillMapping: {
    domainSkillId: string;
    abstractSkillId: string;
    transferCoefficient: number; // 0-1, how much mastery transfers
  }[];
}

// When starting a new roadmap:
function initializeFromTransfer(
  learnerProfile: LearnerProfile,
  newRoadmap: Roadmap,
  existingStates: LearnerSkillState[]
): LearnerSkillState[] {
  return newRoadmap.skills.map(skill => {
    const transferable = findTransferableSkills(skill, existingStates);
    const initialMastery = transferable.reduce(
      (acc, t) => Math.max(acc, t.mastery * t.transferCoefficient),
      0 // default: no prior knowledge
    );
    return { skillId: skill.id, mastery: initialMastery, /* ... */ };
  });
}
```

---

## 5. Quest/Lesson-Level Context

### 5.1 Per-Quest Context Structure

Based on PAPPL and platform analysis:

```typescript
interface QuestContext {
  // Static context (loaded once)
  quest: {
    id: string;
    skillTargets: string[];
    difficulty: number;
    exerciseCount: number;
    narrative: {
      theme: string;
      characterId: string;
      scenarioDescription: string;
    };
  };

  // Dynamic context (updated per-exercise)
  session: {
    startedAt: Date;
    exercisesCompleted: number;
    currentStreak: number;     // consecutive correct

    // Per-exercise tracking
    attempts: {
      exerciseId: string;
      userAnswer: string;
      isCorrect: boolean;
      timeSpent: number;       // seconds
      hintsUsed: number;
      hintTexts: string[];     // actual hints given (avoid repetition!)
      errorType?: string;      // categorized misconception
      timestamp: Date;
    }[];

    // Aggregated signals
    averageTimePerExercise: number;
    errorRate: number;
    dominantErrorTypes: string[];
    engagementSignal: 'focused' | 'struggling' | 'rushing' | 'disengaged';
  };

  // Learner context (from profile)
  learner: {
    knowledgeState: Record<string, number>; // skillId -> mastery
    recentMistakes: { skillId: string; errorType: string; count: number }[];
    preferredHintStyle: 'direct' | 'socratic' | 'example-based';
    streakDays: number;
  };
}
```

### 5.2 Real-Time Context During a Session

The critical challenge: context accumulates during a quest. Here is how to handle it:

```
EXERCISE 1:
  Context sent to LLM: quest_definition + learner_profile + exercise_1
  Tokens: ~800

EXERCISE 5 (after 4 attempts):
  Context sent to LLM: quest_definition + learner_profile +
    summary_of_exercises_1_to_4 + exercise_5
  Tokens: ~1200

EXERCISE 10 (after 9 attempts):
  Context sent to LLM: quest_definition + learner_profile +
    compressed_session_summary + last_3_exercises_verbatim + exercise_10
  Tokens: ~1500 (capped via compression)
```

**Pattern**: Use the **receding horizon** approach:
- Always keep last 2-3 exercises verbatim
- Compress older exercises into a structured summary
- Summary includes: skills practiced, error types, hints given, mastery trajectory

### 5.3 Attempt History Feedback Loop

The PAPPL pattern (from Stanford research):

```
[Student submits answer]
    ↓
[System records attempt with metadata]
    ↓
[Learner-State Analyzer]
  - Aggregates all attempts for this exercise
  - Detects recurring misconceptions
  - Checks if same error type appeared 3+ times
    ↓
[Hint Engine assembles context]
  - Current question + correct solution (hidden)
  - Instructor notes for this topic
  - Student's error history (compressed)
  - Previously delivered hints (to avoid repetition)
    ↓
[LLM generates targeted hint]
  - Low temperature (consistent, not creative)
  - Socratic questioning format
  - NEVER reveals the answer
    ↓
[System updates learner profile]
  - Updates mastery for relevant skills
  - Logs new misconception if detected
  - Adjusts difficulty for remaining exercises
```

**Critical detail from Khanmigo**: If students request 3+ consecutive hints without showing effort, the system "zooms out" and asks what part they're stuck on, preventing hint-dependency.

**Source**: [PAPPL Paper](https://arxiv.org/html/2508.14109v1), [Khanmigo System Prompt](https://gist.github.com/25yeht/c940f47e8658912fc185595c8903d1ec)

---

## 6. Context Sharing Between Learning Paths

### 6.1 Shared Skill Taxonomies

#### Bloom's Taxonomy Integration
Modern platforms map all skills to Bloom's cognitive levels:

```
Level 1: REMEMBER  — Recall facts, terms, basic concepts
Level 2: UNDERSTAND — Explain ideas, interpret, summarize
Level 3: APPLY     — Use knowledge in new situations
Level 4: ANALYZE   — Break down, find relationships
Level 5: EVALUATE  — Justify decisions, critique
Level 6: CREATE    — Produce original work, design
```

**Practical application**: A learner who achieved "Apply" level in JavaScript variables should start at "Understand" (not "Remember") for TypeScript variables, since the abstract concept transfers even though the syntax differs.

**Source**: [Bloom's Taxonomy in AI](https://www.tandfonline.com/doi/full/10.1080/03004279.2024.2332469)

#### Cross-Domain Inference Patterns

```typescript
// Abstract skill taxonomy (domain-agnostic)
const abstractSkills = {
  'logical-reasoning': {
    indicators: ['can decompose problems', 'identifies patterns'],
    transfersTo: ['debugging', 'algorithm-design', 'data-modeling'],
    bloomFloor: 'analyze'  // minimum Bloom level for this skill
  },
  'syntax-familiarity': {
    indicators: ['reads code fluently', 'spots syntax errors'],
    transfersTo: ['new-language-syntax', 'framework-apis'],
    bloomFloor: 'remember'
  },
  'system-thinking': {
    indicators: ['understands side effects', 'traces data flow'],
    transfersTo: ['architecture', 'state-management', 'api-design'],
    bloomFloor: 'analyze'
  }
};

// Transfer coefficient matrix
//                     JS    TS    React  Node  Python
// JS                 1.0   0.85  0.6    0.7   0.3
// TS                 0.85  1.0   0.6    0.7   0.3
// React              0.4   0.4   1.0    0.2   0.1
// Node               0.5   0.5   0.2    1.0   0.3
// Python             0.3   0.3   0.1    0.3   1.0
```

### 6.2 Practical Implementation

Most platforms use a simplified approach:

1. **Tag skills with abstract categories** (e.g., "loops" appears in JS, Python, Java)
2. **When starting new course**: Check if learner has mastery in overlapping abstract skills
3. **Apply transfer coefficient**: `initial_mastery = existing_mastery * coefficient`
4. **Validate quickly**: Give a short assessment to confirm the transfer actually happened
5. **Adjust**: If assessment shows lower than predicted mastery, reset to observed level

**Key finding**: Near-transfer (related domains) works well with 0.7-0.9 coefficients. Far-transfer (unrelated domains) is unreliable and most platforms simply don't attempt it.

---

## 7. Practical LLM Context Management

### 7.1 Context Budgets Per Generation Tier

Based on model routing research and pricing analysis:

```typescript
// Model Tier Configuration
const MODEL_TIERS = {
  // TIER 1: Cheap model for routine generation
  routine: {
    model: 'gpt-4o-mini',  // or Claude Haiku
    costPer1MTokens: { input: 0.15, output: 0.60 },
    maxContextTokens: 4000,
    useCases: [
      'quiz_question_generation',
      'simple_hint_generation',
      'exercise_validation',
      'progress_summary',
      'vocabulary_drill'
    ],
    contextBudget: {
      systemPrompt: 800,      // 20%
      skillContext: 600,       // 15%
      learnerProfile: 400,    // 10%
      exerciseContent: 1200,  // 30%
      fewShotExamples: 600,   // 15%
      responseBuffer: 400     // 10%
    }
  },

  // TIER 2: Mid-tier for personalized content
  personalized: {
    model: 'gpt-4o',  // or Claude Sonnet
    costPer1MTokens: { input: 2.50, output: 10.00 },
    maxContextTokens: 8000,
    useCases: [
      'personalized_explanation',
      'misconception_diagnosis',
      'adaptive_lesson_planning',
      'detailed_feedback',
      'roleplay_conversation'
    ],
    contextBudget: {
      systemPrompt: 1200,     // 15%
      skillContext: 1000,     // 12.5%
      learnerProfile: 800,   // 10%
      sessionHistory: 1600,  // 20%
      exerciseContent: 1600, // 20%
      fewShotExamples: 800,  // 10%
      responseBuffer: 1000   // 12.5%
    }
  },

  // TIER 3: Expensive model for complex generation
  complex: {
    model: 'gpt-4o',  // or Claude Opus, with extended thinking
    costPer1MTokens: { input: 2.50, output: 10.00 },
    maxContextTokens: 16000,
    useCases: [
      'curriculum_planning',
      'assessment_design',
      'complex_code_review',
      'learning_path_optimization',
      'multi_skill_integration'
    ],
    contextBudget: {
      systemPrompt: 2000,     // 12.5%
      skillGraphContext: 2400, // 15%
      learnerProfile: 1600,  // 10%
      fullSessionHistory: 3200, // 20%
      contentLibrary: 3200,  // 20%
      fewShotExamples: 1600, // 10%
      responseBuffer: 2000   // 12.5%
    }
  }
};
```

### 7.2 System Prompt vs User Prompt vs Few-Shot

Based on Khanmigo, Duolingo, and Anthropic patterns:

```
SYSTEM PROMPT (cached, static prefix):
├── Role definition ("You are an adaptive coding tutor...")
├── Pedagogical principles (Socratic method, never reveal answers)
├── Safety guardrails (crisis hotline, PII restrictions)
├── Response format requirements (JSON schema, markdown)
├── Tone and personality constraints
└── Tool usage instructions

---------- cache boundary ----------

USER PROMPT (dynamic, per-request):
├── SECTION 1: Skill Context
│   ├── Target skill definition
│   ├── Prerequisite chain (mastered/weak)
│   └── Related skills
│
├── SECTION 2: Learner Context
│   ├── Knowledge state summary
│   ├── Recent misconception patterns
│   ├── Learning speed indicator
│   └── Preferred hint style
│
├── SECTION 3: Session Context
│   ├── Compressed session history
│   ├── Last 2-3 exercises verbatim
│   └── Current engagement signal
│
├── SECTION 4: Current Task
│   ├── Exercise/question to generate or evaluate
│   ├── Student's answer (if evaluating)
│   └── Specific instruction for this generation
│
└── SECTION 5: Few-Shot Examples (if needed)
    ├── 1-3 diverse canonical examples
    └── Edge case examples for tricky scenarios
```

**Key rules from Anthropic and Khan Academy**:
1. **Static content first, dynamic last** — enables prompt caching
2. **Few-shot > laundry list of rules** — show, don't tell
3. **Right altitude** — specific enough to guide, flexible enough for heuristics
4. **Minimal viable tools** — fewer tools = less ambiguity for the model

### 7.3 Context Caching Strategies

```typescript
// Cache Layers for Educational AI

// LAYER 1: System prompt cache (platform-wide)
// Cached by: model provider (automatic)
// TTL: Until prompt changes
// Savings: 80-90% latency, up to 90% cost on cached prefix
const systemPromptCache = {
  strategy: 'prefix_matching',
  requirements: [
    'System prompt must be >= 1024 tokens',
    'Must be identical prefix across requests',
    'Static content FIRST, dynamic LAST',
  ],
  invalidation: 'On system prompt update only'
};

// LAYER 2: Skill context cache (per-skill)
// Cached by: application (Redis/memory)
// TTL: Until skill definition changes
const skillContextCache = {
  key: 'skill:{skillId}:context',
  content: {
    definition: string,
    prerequisites: SkillNode[],
    commonMisconceptions: string[],
    exampleExercises: Exercise[],
    difficultyMetrics: DifficultyData
  },
  ttl: '24h',  // Skills don't change often
  invalidation: 'On skill update event'
};

// LAYER 3: Learner context cache (per-learner)
// Cached by: application (Redis/memory)
// TTL: Short — learner state changes frequently!
const learnerContextCache = {
  key: 'learner:{learnerId}:context',
  content: {
    knowledgeState: Record<string, number>,
    recentMistakes: MistakePattern[],
    sessionSummary: string,
    preferences: LearnerPreferences
  },
  ttl: '5m',  // Short! Learner progresses constantly
  invalidation: [
    'On exercise completion',
    'On session end',
    'On profile update'
  ]
};

// LAYER 4: Generated content cache (per-cohort)
// Cached by: application (database)
// TTL: Long — same content can serve similar learners
const generatedContentCache = {
  key: 'content:{skillId}:{difficulty}:{exerciseType}:{hash}',
  content: {
    exercise: GeneratedExercise,
    qualityScore: number,
    timesUsed: number,
    successRate: number
  },
  ttl: '30d',
  invalidation: [
    'On quality score drop below threshold',
    'On skill definition update',
    'On max-usage reached (freshness)'
  ]
};
```

### 7.4 Avoiding Stale Context

```typescript
// Staleness Detection Patterns

interface ContextFreshness {
  // Strategy 1: TTL-based
  lastUpdated: Date;
  ttl: number; // ms
  isStale(): boolean {
    return Date.now() - this.lastUpdated > this.ttl;
  }

  // Strategy 2: Version-based
  version: number;
  currentVersion: number;
  isStale(): boolean {
    return this.version < this.currentVersion;
  }

  // Strategy 3: Event-based
  invalidateOn: string[]; // event names
  // Cache auto-invalidated when these events fire
}

// Practical rules:
// - Learner knowledge state: invalidate on EVERY exercise completion
// - Skill definitions: invalidate on admin update (rare)
// - Session summary: invalidate every 5 exercises or 5 minutes
// - Generated content cache: invalidate when success rate drops
// - System prompts: invalidate on deployment only
```

### 7.5 Model Routing for Education

Based on RouteLLM and industry patterns:

```typescript
interface ModelRouter {
  route(request: GenerationRequest): ModelConfig {
    // Rule 1: Complexity-based routing
    if (request.type === 'quiz_mcq' && request.difficulty < 0.5) {
      return MODEL_TIERS.routine; // Cheap model
    }

    // Rule 2: Personalization depth
    if (request.requiresHistory || request.misconceptionCount > 0) {
      return MODEL_TIERS.personalized; // Mid-tier
    }

    // Rule 3: Multi-step reasoning
    if (request.type === 'code_review' || request.type === 'curriculum_plan') {
      return MODEL_TIERS.complex; // Expensive model
    }

    // Rule 4: Cascade fallback
    // Try cheap first, if confidence < threshold, escalate
    const cheapResult = await generate(MODEL_TIERS.routine, request);
    if (cheapResult.confidence < 0.7) {
      return await generate(MODEL_TIERS.personalized, request);
    }
    return cheapResult;
  }
}
```

**Industry data on routing savings**:
- 30-70% cost reduction while maintaining quality
- Using cheap model for 70% of routine tasks, expensive for 30% = best ROI
- Cascade routing (try cheap first, escalate if needed) saves 85% on some benchmarks

**Source**: [RouteLLM](https://lmsys.org/blog/2024-07-01-routellm/), [LLM Cost Guide](https://www.getmaxim.ai/articles/the-technical-guide-to-managing-llm-costs-strategies-for-optimization-and-roi/)

---

## 8. Synthesized Architecture for Plan2Skill

Based on all research above, here is a recommended architecture:

### 8.1 Context Assembly Pipeline

```
REQUEST: Generate exercise for User X, Skill Y, Quest Z

Step 1: RESOLVE CONTEXT LAYERS
├── [Cache Hit?] Load skill context from cache
│   └── Miss → Query skill graph, build context, cache it
├── [Cache Hit?] Load learner context from cache
│   └── Miss → Query learner profile + knowledge state, cache it
├── [Cache Hit?] Load session context from cache
│   └── Miss → Build from current quest state
└── Merge all layers into ContextBundle

Step 2: SELECT MODEL TIER
├── Analyze request complexity
├── Check if personalization is needed
├── Route to appropriate model tier
└── Get token budget for selected tier

Step 3: ASSEMBLE PROMPT
├── System prompt (static, cacheable prefix)
│   ├── Role + pedagogical principles
│   ├── Safety guardrails
│   └── Response format
├── Skill context (from cache)
│   ├── Target skill + prerequisites
│   └── Common misconceptions
├── Learner context (from cache, short TTL)
│   ├── Knowledge state summary
│   ├── Recent error patterns
│   └── Preferences
├── Session context (dynamic)
│   ├── Compressed earlier exercises
│   ├── Last 2-3 exercises verbatim
│   └── Current engagement signal
└── Task-specific instruction

Step 4: TOKEN BUDGET CHECK
├── Count assembled tokens
├── If over budget:
│   ├── Compress session history further
│   ├── Reduce few-shot examples
│   ├── Trim skill context to essentials
│   └── NEVER trim safety guardrails
└── Verify within budget

Step 5: GENERATE
├── Send to LLM
├── Parse response
├── Validate quality (format, safety, correctness)
└── Return or retry

Step 6: UPDATE STATE
├── Record generation metadata (model, tokens, cost)
├── Update session context cache
└── If exercise completed: update learner context cache
```

### 8.2 Data Model Summary

```typescript
// The complete context bundle passed to AI service
interface AIContextBundle {
  // Layer 0: Domain (cached long-term)
  domain: {
    skill: SkillDefinition;
    prerequisites: { skill: SkillDefinition; learnerMastery: number }[];
    relatedSkills: { skill: SkillDefinition; transferCoef: number }[];
    contentLibrary: { hints: string[]; examples: Exercise[] };
  };

  // Layer 1: Learner Profile (cached short-term)
  learner: {
    id: string;
    knowledgeState: Map<string, number>; // skillId -> mastery [0,1]
    recentErrors: { skillId: string; type: string; count: number }[];
    learningSpeed: number;
    preferredStyle: string;
    bloomLevels: Map<string, BloomLevel>;
  };

  // Layer 2: Roadmap (cached medium-term)
  roadmap: {
    id: string;
    currentMilestone: number;
    completedSkills: string[];
    activeObjectives: string[];
    narrativeTheme: string;
  };

  // Layer 3: Session (rebuilt per-request)
  session: {
    questId: string;
    exerciseIndex: number;
    compressedHistory: string; // summarized older exercises
    recentExercises: ExerciseAttempt[]; // last 2-3 verbatim
    sessionStats: {
      duration: number;
      correctRate: number;
      avgTimePerExercise: number;
      hintsUsed: number;
    };
  };

  // Layer 4: Current Task
  task: {
    type: 'generate_exercise' | 'evaluate_answer' | 'generate_hint' | 'generate_explanation';
    targetDifficulty: number;
    exerciseType: string;
    studentAnswer?: string;
    maxTokens: number;
  };

  // Meta
  modelTier: 'routine' | 'personalized' | 'complex';
  tokenBudget: number;
  cacheKeys: string[]; // for invalidation tracking
}
```

### 8.3 Key Architectural Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Knowledge state model | Probabilistic (0-1 per skill) | Knewton proved binary is insufficient |
| Skill granularity | 50-200 knowledge points per domain | Squirrel AI shows finer = better targeting |
| Context compression | Hybrid (sliding window + summary + RAG) | No single approach works for all cases |
| Content generation | Template + LLM hybrid | Duolingo's "Mad Lib" approach is proven |
| Model routing | 3-tier (cheap/mid/expensive) | 70% of tasks can use cheap model |
| Caching strategy | 4-layer (system/skill/learner/content) | Different TTLs for different volatility |
| Human oversight | Required for new content types | Duolingo and Khan Academy both require it |
| Cross-domain transfer | Near-transfer only (>0.7 coefficient) | Far-transfer is unreliable |
| Spaced repetition | FSRS-style (DSR model) | Open source, state-of-art, personalizable |
| Prompt structure | Static prefix + dynamic suffix | Enables prompt caching (80-90% savings) |

---

## Sources

### Platform References
- [Duolingo Birdbrain](https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain/)
- [Duolingo LLM Lessons](https://blog.duolingo.com/large-language-model-duolingo-lessons/)
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/)
- [Duolingo HLR Paper](https://research.duolingo.com/papers/settles.acl16.pdf)
- [Duolingo HLR GitHub](https://github.com/duolingo/halflife-regression)
- [Khan Academy Khanmigo Help Center](https://support.khanacademy.org/hc/en-us/articles/13888935335309)
- [Khan Academy 7-Step Prompt Engineering](https://blog.khanacademy.org/khan-academys-7-step-approach-to-prompt-engineering-for-khanmigo/)
- [Khan Academy + Langfuse](https://langfuse.com/customers/khan-academy)
- [Khanmigo Lite System Prompt](https://gist.github.com/25yeht/c940f47e8658912fc185595c8903d1ec)
- [Knewton Alta](https://www.wiley.com/en-us/grow/teach-learn/teacher-resources/courseware/knewton-alta/resources/alta-blog-what-is-adaptive-learning/)
- [Squirrel AI](https://squirrelai.com/)
- [SchoolAI + OpenAI](https://openai.com/index/schoolai/)
- [Google LearnLM](https://cloud.google.com/solutions/learnlm)

### Research Papers
- [PAPPL: Personalized AI-Powered Progressive Learning](https://arxiv.org/html/2508.14109v1)
- [LECTOR: LLM-Enhanced Spaced Repetition](https://arxiv.org/html/2508.03275v1)
- [Knowledge Graphs as LLM Context for Learning](https://arxiv.org/html/2403.03008v1)
- [Personalized Learning Path Planning with LLMs](https://arxiv.org/html/2407.11773v1)
- [LLM Agents for Education Survey](https://www.arxiv.org/pdf/2503.11733)
- [DKT Literature Review](https://dl.acm.org/doi/10.1145/3729605.3729620)
- [Practical DKT Evaluation (EDM 2025)](https://educationaldatamining.org/EDM2025/proceedings/2025.EDM.industry-papers.46/index.html)
- [LLMs for Learner Performance Modeling](https://arxiv.org/html/2403.14661v1)
- [ACE: AI-Assisted Educational Knowledge Graphs](https://jedm.educationaldatamining.org/index.php/JEDM/article/view/737)
- [FSRS (Free Spaced Repetition Scheduler)](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler)
- [Bloom's Taxonomy in AI Learning](https://www.tandfonline.com/doi/full/10.1080/03004279.2024.2332469)

### Engineering Resources
- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic: Claude for Education](https://www.anthropic.com/news/introducing-claude-for-education)
- [OpenAI: Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- [OpenAI: Prompt Caching 201](https://developers.openai.com/cookbook/examples/prompt_caching_201/)
- [OpenAI: Study Mode](https://openai.com/index/chatgpt-study-mode/)
- [Context Window Management Guide](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/)
- [RouteLLM Framework](https://lmsys.org/blog/2024-07-01-routellm/)
- [LLM Cost Management Guide](https://www.getmaxim.ai/articles/the-technical-guide-to-managing-llm-costs-strategies-for-optimization-and-roi/)
- [Context Engineering Survey (arXiv)](https://arxiv.org/html/2507.13334v1)
