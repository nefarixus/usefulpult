export type WordTopic = "aesthetic" | "nature" | "emotions" | "space" | "mixed";

export const WORD_LISTS: Record<Exclude<WordTopic, "mixed">, string[]> = {
  aesthetic: [
    "petrichor", "solitude", "ember", "velvet", "lumen", "wanderlust",
    "serendipity", "eclipse", "mellow", "hazy", "opal", "gossamer", "azure",
    "reverie", "moonlit", "cascade", "amber", "twilight", "whisper", "halcyon",
    "nebula", "cove", "linger", "bloom", "drift", "hush", "glow", "solace",
    "meadow", "aurora", "velour", "silhouette", "mirage", "flicker", "tender",
    "wistful", "lull", "sable", "dawn", "dusk", "feather", "frost", "honey",
    "ivory", "jade", "lush", "misty", "nectar", "opaline", "pearl", "quiet",
    "ripple", "satin", "shimmer", "still", "sunlit", "tranquil", "wander",
    "zephyr", "ethereal", "lilac", "marigold",
  ],
  nature: [
    "forest", "river", "mountain", "meadow", "thunder", "canyon", "glacier",
    "tide", "dune", "wildflower", "moss", "cliff", "valley", "waterfall",
    "prairie", "reef", "tundra", "orchard", "marsh", "monsoon", "blossom",
    "evergreen", "driftwood", "boulder", "ravine", "grove", "delta", "oasis",
    "savanna", "brook", "foliage", "summit", "coral", "lagoon", "willow",
    "thicket", "horizon", "canopy", "wetland", "highland",
  ],
  emotions: [
    "joy", "calm", "longing", "hope", "wonder", "bliss", "courage",
    "gratitude", "tenderness", "curiosity", "serenity", "delight", "warmth",
    "yearning", "comfort", "awe", "relief", "trust", "contentment", "empathy",
    "nostalgia", "elation", "peace", "resolve", "wistfulness", "tenacity",
    "gentleness", "devotion", "wonderment", "fondness", "harmony", "patience",
    "kindness", "gratefulness", "ease", "lightness", "clarity", "freedom",
    "belonging", "stillness",
  ],
  space: [
    "galaxy", "nebula", "orbit", "comet", "meteor", "cosmos", "stardust",
    "eclipse", "supernova", "asteroid", "quasar", "pulsar", "constellation",
    "satellite", "gravity", "void", "lunar", "solar", "celestial",
    "interstellar", "wormhole", "singularity", "cosmic", "starlight",
    "nebulous", "zenith", "meteorite", "cratered", "planetary", "orbital",
    "astral", "luminous", "infinite", "boundless", "drift", "spacetime",
    "expanse", "galactic", "orbiting", "starbound",
  ],
};

// Kept for anything that imported the old flat export directly.
export const AESTHETIC_WORDS = WORD_LISTS.aesthetic;
