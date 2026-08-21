(function exposeDreamScene(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DreamScene = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeDreamSceneAPI() {
  const MOTIFS = [
    {
      id: 'echo',
      baseHue: 276,
      labels: ['Memory echo', 'Reunion echo', 'Echoes at dusk'],
      signals: [
        ['grandfather', 5], ['grandpa', 5], ['grandmother', 5], ['grandma', 5], ['ancestor', 4],
        ['family', 3], ['mother', 3], ['father', 3], ['friend', 2], ['missed', 3], ['miss ', 2],
        ['remember', 3], ['young version', 4], ['cry', 3], ['goodbye', 2]
      ]
    },
    {
      id: 'tide',
      baseHue: 204,
      labels: ['Tidal threshold', 'Moonlit water', 'The inward shore'],
      signals: [['ocean', 5], ['sea', 5], ['water', 4], ['wave', 4], ['river', 4], ['lake', 4], ['rain', 2], ['swim', 3], ['flood', 4]]
    },
    {
      id: 'ember',
      baseHue: 14,
      labels: ['Ember field', 'Ash-lit horizon', 'Fire under night'],
      signals: [['fire', 5], ['flame', 5], ['burn', 4], ['smoke', 4], ['ash', 4], ['volcano', 5], ['heat', 3], ['red sky', 3]]
    },
    {
      id: 'grove',
      baseHue: 142,
      labels: ['Listening grove', 'The growing dark', 'Garden after rain'],
      signals: [['forest', 5], ['tree', 4], ['garden', 4], ['flower', 3], ['woods', 5], ['root', 3], ['leaf', 3], ['plant', 2]]
    },
    {
      id: 'sky',
      baseHue: 226,
      labels: ['Open sky', 'Cloud passage', 'Above the sleeping world'],
      signals: [['fly', 5], ['flying', 5], ['flight', 5], ['cloud', 4], ['sky', 3], ['star', 3], ['space', 5], ['planet', 4], ['moon', 2]]
    },
    {
      id: 'passage',
      baseHue: 43,
      labels: ['The turning path', 'Threshold road', 'A distant passage'],
      signals: [['gate', 5], ['door', 4], ['road', 4], ['path', 4], ['bridge', 4], ['station', 4], ['train', 4], ['leave', 2], ['leaving', 3], ['journey', 3], ['car', 1]]
    }
  ];

  const RIDGES = [
    'polygon(0 58%, 12% 34%, 25% 50%, 39% 18%, 54% 45%, 69% 12%, 83% 40%, 100% 24%, 100% 100%, 0 100%)',
    'polygon(0 38%, 15% 52%, 30% 27%, 46% 57%, 61% 31%, 76% 48%, 89% 20%, 100% 39%, 100% 100%, 0 100%)',
    'polygon(0 62%, 18% 28%, 35% 44%, 49% 25%, 64% 56%, 79% 30%, 100% 52%, 100% 100%, 0 100%)'
  ];

  function hashText(value) {
    let hash = 2166136261;
    const text = String(value || '');
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function signalPattern(signal) {
    const words = String(signal || '').trim().split(/\s+/).filter(Boolean);
    const phrase = words
      .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('\\s+');
    const grammaticalEnding = words.length === 1 ? '(?:s|es|ed|ing)?' : '';
    return new RegExp(`(?:^|[^a-z0-9])${phrase}${grammaticalEnding}(?=$|[^a-z0-9])`, 'i');
  }

  function scoreMotif(text, motif) {
    return motif.signals.reduce((score, [signal, weight]) => score + (signalPattern(signal).test(text) ? weight : 0), 0);
  }

  function hsl(hue, saturation, lightness) {
    const normalized = ((Math.round(hue) % 360) + 360) % 360;
    return `hsl(${normalized} ${Math.round(saturation)}% ${Math.round(lightness)}%)`;
  }

  function createDreamScene(transcript, dreamID = '') {
    const normalized = String(transcript || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const hash = hashText(`${dreamID}|${normalized}`);
    const ranked = MOTIFS
      .map((motif, index) => ({ motif, score: scoreMotif(normalized, motif), index }))
      .sort((left, right) => right.score - left.score || left.index - right.index);
    const selected = ranked[0].score > 0
      ? ranked[0].motif
      : { id: 'nocturne', baseHue: 252, labels: ['Unwritten night', 'The quiet between', 'A private horizon'] };
    const hueOffset = (hash % 37) - 18;
    const hue = selected.baseHue + hueOffset;
    const saturation = 32 + ((hash >>> 6) % 17);
    const label = selected.labels[(hash >>> 11) % selected.labels.length];

    return {
      motif: selected.id,
      label,
      signature: `dreamscape-${hash.toString(16).padStart(8, '0')}`,
      palette: {
        skyTop: hsl(hue - 7, saturation, 7 + ((hash >>> 2) % 3)),
        skyBottom: hsl(hue + 8, saturation + 4, 16 + ((hash >>> 4) % 4)),
        horizon: hsl(hue + 14, saturation + 2, 23 + ((hash >>> 9) % 5)),
        ground: hsl(hue + 3, Math.max(18, saturation - 10), 14 + ((hash >>> 13) % 4)),
        accent: hsl(hue + 34, 54 + ((hash >>> 16) % 12), 67 + ((hash >>> 20) % 7)),
        glow: hsl(hue + 22, 48, 78),
        panel: hsl(hue + 1, Math.max(24, saturation - 5), 16),
        panelDeep: hsl(hue - 5, Math.max(22, saturation - 8), 9),
        listener: hsl(hue + 8, Math.max(24, saturation - 2), 24),
        dreamer: hsl(hue + 52, 28 + ((hash >>> 18) % 11), 46)
      },
      motion: {
        driftSeconds: 8 + (hash % 11),
        pulseSeconds: 3 + ((hash >>> 5) % 5),
        starOpacity: Number((0.35 + ((hash >>> 10) % 36) / 100).toFixed(2)),
        ambientOffset: (hash >>> 15) % 41
      },
      ridge: RIDGES[(hash >>> 22) % RIDGES.length]
    };
  }

  return { createDreamScene };
});
