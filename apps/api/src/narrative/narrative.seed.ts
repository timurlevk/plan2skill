import { PrismaClient } from '@prisma/client';

// ═══════════════════════════════════════════
// NARRATIVE SEED — Story Bible v1 + Season 1 + 5 episodes
// Run: npx ts-node apps/api/src/narrative/narrative.seed.ts
// ═══════════════════════════════════════════

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding narrative system...');

  // ─── Story Bible v1 ───────────────────────────────────────────

  const storyBible = await prisma.storyBible.create({
    data: {
      version: 1,
      worldName: 'Lumen',
      worldRules: {
        corePhysics: 'Knowledge is a living energy called Lux. When someone learns, Lux flows into the world.',
        magic: 'Lux crystallizes into skills, abilities, and tangible power. The more one learns, the brighter they shine.',
        conflict: 'The Dimming — an entropy force that erodes knowledge and causes the Great Library to fragment.',
        resolution: 'Heroes restore Lux by learning, practicing, and sharing knowledge. Every quest completed pushes back the Dimming.',
        rules: [
          'No violence or character death',
          'Sage never lies or deceives',
          'Diversity is canonical — heroes come from all backgrounds',
          'Learning is always portrayed positively, never as punishment',
          'Failure is reframed as discovery, never as loss',
        ],
      },
      characters: {
        sage: {
          name: 'The Sage',
          role: 'Guide and mentor',
          personality: 'Warm, wise, occasionally humorous. Speaks with quiet confidence.',
          appearance: 'Silver-blue hair, friendly eyes, casual blazer over scholarly robes',
          speechPattern: 'Short, encouraging sentences. Uses metaphors from the world of Lumen.',
          knownFacts: [
            'Has been guardian of the Great Library since before the Dimming',
            'Can sense Lux flow in all living things',
            'Believes every hero has a unique gift to offer',
          ],
        },
      },
      geography: {
        overview: 'Lumen is a realm of five interconnected lands, each representing a domain of knowledge.',
        lands: [
          {
            name: 'The Code Spires',
            domain: 'Technology & Programming',
            description: 'Crystalline towers that hum with logic. Data flows like rivers between structures.',
            landmark: 'The Compiler Gate — where raw ideas become working reality',
          },
          {
            name: 'The Resonance Fields',
            domain: 'Communication & Language',
            description: 'Rolling meadows where words take physical form. Sentences bloom like flowers.',
            landmark: 'The Echo Well — speaks back in any language',
          },
          {
            name: 'The Forge Peaks',
            domain: 'Engineering & Creation',
            description: 'Mountains of raw material waiting to be shaped. Sparks of innovation drift like snow.',
            landmark: 'The Anvil of Iteration — where prototypes are born',
          },
          {
            name: 'The Insight Depths',
            domain: 'Analysis & Strategy',
            description: 'Deep caverns illuminated by bioluminescent data crystals.',
            landmark: 'The Pattern Pool — reflects hidden connections',
          },
          {
            name: 'The Harmony Gardens',
            domain: 'Design & Creativity',
            description: 'Living gardens where aesthetics and function grow intertwined.',
            landmark: 'The Palette Spring — colors that evoke emotion',
          },
        ],
        centralHub: {
          name: 'The Great Library',
          description: 'The heart of Lumen. Once a unified repository of all knowledge, now fragmented by the Dimming.',
          currentState: 'Partially restored. Each hero who learns helps rebuild a section.',
        },
      },
      toneGuide: {
        ratio: '70% epic grandeur, 30% warm humor',
        style: 'Accessible fantasy prose. Short paragraphs. Vivid but concise imagery.',
        bannedContent: [
          'Violence or combat descriptions',
          'Character death or permanent loss',
          'Fear-based motivation',
          'Guilt or shame language',
          'Real-world religious references',
          'Romantic content',
        ],
        encouragedContent: [
          'Discovery and wonder',
          'Teamwork and collaboration metaphors',
          'Personal growth analogies',
          'Humor through wordplay and situational comedy',
          'Callbacks to earlier episodes',
        ],
      },
    },
  });

  console.log(`Created Story Bible v1: ${storyBible.id}`);

  // ─── Season 1: "The First Fragment" ───────────────────────────

  const season1 = await prisma.season.create({
    data: {
      storyBibleId: storyBible.id,
      seasonNumber: 1,
      title: 'The First Fragment',
      description: 'A new hero arrives in Lumen as the Sage discovers the first Fragment of the shattered Great Library. Together, they begin the quest to restore knowledge to the realm.',
      status: 'active',
      arcOutline: {
        acts: [
          {
            act: 1,
            title: 'Awakening',
            episodes: '1-10',
            summary: 'Hero arrives in Lumen, meets Sage, learns about the Dimming, discovers their first skill.',
            threads: ['hero_arrival', 'sage_introduction', 'dimming_explained', 'first_fragment_hint'],
          },
          {
            act: 2,
            title: 'The Search',
            episodes: '11-25',
            summary: 'Hero explores the five lands seeking Fragment clues. Each land reveals a piece of the puzzle.',
            threads: ['fragment_hunt', 'land_exploration', 'growing_skills', 'dimming_advances'],
          },
          {
            act: 3,
            title: 'Restoration',
            episodes: '26-35',
            summary: 'Hero assembles the Fragment and restores the first wing of the Great Library.',
            threads: ['fragment_assembly', 'library_restoration', 'hero_recognition', 'season2_tease'],
          },
        ],
        totalEpisodes: 35,
      },
      stateTracker: {
        currentAct: 1,
        currentEpisode: 5,
        activeThreads: [
          {
            threadId: 'hero_arrival',
            title: 'Hero arrives in Lumen',
            status: 'resolved',
            openedAtEpisode: 1,
            resolvedAtEpisode: 2,
          },
          {
            threadId: 'sage_introduction',
            title: 'Meeting the Sage',
            status: 'resolved',
            openedAtEpisode: 1,
            resolvedAtEpisode: 3,
          },
          {
            threadId: 'dimming_explained',
            title: 'Understanding the Dimming',
            status: 'active',
            openedAtEpisode: 2,
          },
          {
            threadId: 'first_fragment_hint',
            title: 'Clues about the First Fragment',
            status: 'active',
            openedAtEpisode: 4,
          },
        ],
        characterStates: [
          {
            characterId: 'sage',
            name: 'The Sage',
            currentLocation: 'Great Library — Main Hall',
            currentMood: 'hopeful',
            lastAppearance: 5,
            knownFacts: [
              'Has been guarding the Library alone',
              'Sensed the hero\'s arrival through Lux fluctuations',
              'Knows the Fragment is hidden in the Code Spires',
            ],
          },
        ],
        establishedFacts: [
          'Lumen\'s knowledge is powered by Lux',
          'The Dimming caused the Great Library to shatter',
          'Fragments of the Library are scattered across the five lands',
          'The hero can channel Lux through learning',
          'The Code Spires hold the first Fragment clue',
        ],
        recentSummaries: [],
        constraints: [
          'Hero has not yet visited any land beyond the Great Library',
          'Sage has not revealed the full scope of the Dimming',
          'No other characters introduced yet',
        ],
      } satisfies Record<string, unknown> as any,
    },
  });

  console.log(`Created Season 1: ${season1.id}`);

  // ─── 5 Seed Episodes (published) ─────────────────────────────

  const episodes = [
    {
      episodeNumber: 1,
      globalNumber: 1,
      title: 'A Light in the Threshold',
      contextSentence: 'In the space between worlds, a new presence stirs.',
      body: 'The first thing you notice is the light. Not harsh or blinding, but warm — like sunlight through amber glass. It pulses gently, as if breathing. You stand in a vast hall of impossible architecture: shelves that spiral into clouds, corridors that fold into themselves, and everywhere — everywhere — the soft glow of knowledge waiting to be discovered.\n\nThis is the Great Library of Lumen. Or what remains of it.\n\nWhole wings lie dark and dormant. Shelves stand empty where volumes once hummed with living wisdom. But here, in this central hall, the light persists. And it seems to grow brighter the moment you arrive.',
      cliffhanger: 'From the shadows between two towering bookshelves, a figure steps forward. Silver-blue hair catches the amber light. A warm voice speaks: "I have been waiting for you."',
      sageReflection: 'Every journey begins with a single step through an unfamiliar door. The bravest thing a hero can do is simply show up.',
      summary: 'The hero arrives in the Great Library of Lumen, finding it partially ruined. The light of Lux responds to their presence. A mysterious figure — the Sage — emerges to greet them.',
      category: 'standard',
      act: 1,
    },
    {
      episodeNumber: 2,
      globalNumber: 2,
      title: 'The Sage\'s Welcome',
      contextSentence: 'In the amber glow of the Great Library, two paths converge.',
      body: 'The Sage moves with the quiet confidence of someone who has read every book twice and understood them on the third pass. Silver-blue hair frames kind eyes that seem to see not just who you are, but who you might become.\n\n"I am called the Sage," they say, settling into a chair that appears to have grown from the Library floor itself. "And this" — a gesture encompasses the vast, wounded hall — "was once the heart of all knowledge in Lumen."\n\nThey explain: Lumen is a realm where learning has weight, shape, and color. Knowledge is not abstract here — it is a living energy called Lux. And Lux has been fading.\n\n"We call it the Dimming," the Sage says, and for the first time, something heavy crosses their expression. "But that is a story for tomorrow."',
      cliffhanger: 'The Sage pauses, then looks at you with renewed warmth. "Tonight, let me show you something beautiful." They reach toward a dark shelf — and at their touch, a single book begins to glow.',
      sageReflection: 'Knowledge is not something you simply acquire — it is something that wakes up inside you. All you need is the courage to reach for it.',
      summary: 'The Sage introduces themselves and explains that Lumen is powered by Lux, a living knowledge energy. They mention the Dimming but defer the full explanation. The Sage demonstrates that Lux can be awakened.',
      category: 'standard',
      act: 1,
    },
    {
      episodeNumber: 3,
      globalNumber: 3,
      title: 'What the Dimming Took',
      contextSentence: 'Morning light reveals the true scale of what was lost.',
      body: 'In daylight — or what passes for it in a realm of pure knowledge — the damage is unmistakable. You walk with the Sage through corridors where shelves stand like bare trees in winter. Empty. Silent. Waiting.\n\n"The Great Library once held the accumulated wisdom of every hero who ever walked Lumen," the Sage explains. "Mathematics and melody. Code and composition. Strategy and storytelling. All of it, alive, interconnected."\n\nThey stop at a vast window overlooking five distant lands, each glowing faintly on the horizon.\n\n"When the Dimming came, the Library shattered. Its fragments scattered across the realm — one to each land." The Sage turns to you. "But here is what the Dimming could not take: the capacity to learn. As long as one hero keeps learning, Lux cannot die."',
      cliffhanger: 'Through the window, one of the five lands flickers — the crystalline towers of the Code Spires pulse with a light that wasn\'t there yesterday. The Sage notices it too, and their eyes widen. "It seems the realm already knows you\'re here."',
      sageReflection: 'The greatest power is not what you already know — it is your willingness to learn what you do not yet understand.',
      summary: 'The Sage shows the hero the full extent of the Dimming\'s damage. The Great Library\'s fragments are scattered across five lands. The hero learns that learning itself generates Lux. The Code Spires respond to the hero\'s presence.',
      category: 'lore_drop',
      act: 1,
    },
    {
      episodeNumber: 4,
      globalNumber: 4,
      title: 'The Whispering Shelf',
      contextSentence: 'Deep in the Library, something long silent begins to speak.',
      body: 'You discover it by accident — or perhaps by Lux. Wandering the Library\'s quiet halls while the Sage prepares for the journey ahead, you pass a shelf tucked into an alcove you hadn\'t noticed before. Unlike the empty shelves elsewhere, this one holds a single, slim volume.\n\nIt hums when you approach. Not with sound, exactly, but with something you feel behind your eyes — like remembering a word you forgot you knew.\n\nThe book\'s cover is blank. But when you open it, words appear one at a time, as if being written in real time by an invisible hand: "THE FIRST FRAGMENT LIES WHERE LOGIC BECOMES LIGHT."\n\nYou read the line three times. Then you close the book, and it\'s gone — dissolved into a fine mist of golden Lux that settles on your hands like warm rain.',
      cliffhanger: 'You find the Sage in the main hall, already packing a satchel. "The Code Spires," they say before you can speak. "I felt the Lux shift. You found something, didn\'t you?"',
      sageReflection: 'Sometimes the most important discoveries find us — but only when we are curious enough to wander where we have not been.',
      summary: 'The hero discovers a mysterious book in a hidden alcove. It reveals a clue: "The First Fragment lies where logic becomes light." The book dissolves into Lux. The Sage senses the discovery and prepares for a journey to the Code Spires.',
      category: 'standard',
      act: 1,
    },
    {
      episodeNumber: 5,
      globalNumber: 5,
      title: 'First Steps to the Spires',
      contextSentence: 'The path from the Library leads toward crystalline towers on the horizon.',
      body: 'The road from the Great Library unfolds like a sentence being written — each step revealing the next. Beside you, the Sage walks with an easy stride, pointing out features of the landscape as if narrating a beloved story.\n\n"See those formations?" They gesture toward clusters of translucent crystal growing from the ground like frozen fountains. "Data blooms. They appear wherever structured thinking has left its mark on the land."\n\nYou touch one. It is warm. Inside, you can see patterns — nested loops, branching paths, elegant structures that feel almost like music made visible.\n\nAhead, the Code Spires grow larger with every step. Their towers catch the light and refract it into cascading spectrums. You can hear them now: a low, harmonic thrum, like a server room made beautiful.\n\n"We\'ll arrive by tomorrow," the Sage says. "Rest tonight. You will need your curiosity sharp."',
      cliffhanger: 'That night, camped beneath a canopy of data blooms, you notice something: the crystals nearest to you glow slightly brighter than the rest. The Sage, watching from across the fire, smiles knowingly but says nothing.',
      sageReflection: 'The journey itself teaches. Every step between here and your goal is not wasted time — it is preparation your future self will thank you for.',
      summary: 'The hero and Sage travel toward the Code Spires. They encounter data blooms — crystalline formations created by structured thinking. The hero seems to have a natural affinity for Lux, causing nearby crystals to glow brighter.',
      category: 'standard',
      act: 1,
    },
  ];

  for (const ep of episodes) {
    const wordCount = ep.body.split(/\s+/).length;
    await prisma.episode.create({
      data: {
        seasonId: season1.id,
        episodeNumber: ep.episodeNumber,
        globalNumber: ep.globalNumber,
        title: ep.title,
        contextSentence: ep.contextSentence,
        body: ep.body,
        cliffhanger: ep.cliffhanger,
        sageReflection: ep.sageReflection,
        summary: ep.summary,
        category: ep.category,
        wordCount,
        readTimeSeconds: Math.ceil(wordCount / 3.5),
        act: ep.act,
        status: 'published',
        publishedAt: new Date(),
      },
    });
  }

  console.log(`Created ${episodes.length} seed episodes`);
  console.log('Narrative seed complete!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
