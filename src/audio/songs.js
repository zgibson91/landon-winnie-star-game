// Original songs. Melody tokens are 8th notes ("-" holds the previous note, "." is a rest).
// Each chord is one bar of 4 beats. The loop length is the number of chords.
export const SONGS = {
  title: {
    bpm: 104, bass: 'bounce', arp: 'updown', arpInst: 'pluck', arpOct: 1,
    chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'Am', 'Em', 'F', 'C', 'Dm7', 'G', 'Csus4', 'C'],
    drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.' },
    voices: [
      { inst: 'lead', notes: 'E5 - G5 - C6 - B5 A5 | G5 - - D5 G5 - A5 B5 | C6 - B5 A5 E5 - A5 - | F5 - A5 G5 F5 - E5 - | E5 - G5 - C6 - D6 E6 | D6 - B5 G5 D6 - - - | C6 - A5 F5 A5 - C6 - | B5 - - - D6 - . . | C6 - - B5 A5 - E5 - | G5 - - F5 E5 - B4 - | C5 - F5 - A5 - C6 - | G5 - - - E5 - . . | F5 - A5 - D6 - C6 - | B5 - G5 - D6 - B5 - | C6 - - - F6 - E6 - | C6 - - - - - . .' },
      { inst: 'bell', notes: '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | C6 - . . . . . . | B5 - . . . . . . | A5 - . . . . . . | G5 - . . . . . .', shift: 12, vel: 0.5 },
    ],
  },
  hub: {
    bpm: 88, bass: 'slow', arp: 'wide', arpInst: 'marimba', arpOct: 0, arpEvery: 2, padVel: 1.2,
    chords: ['Fmaj7', 'Em7', 'Dm7', 'C', 'Fmaj7', 'Am7', 'Bbmaj7', 'C7'],
    drums: { shaker: '..o...o...o...o.', kick: 'x.......x.......' },
    voices: [
      { inst: 'bell', notes: 'A5 - C6 - . . G5 - | E5 - - - G5 . . . | F5 - A5 - D6 - C6 - | G5 - - - . . . . | A5 - C6 - F6 - E6 - | D6 - C6 - G5 - - - | Bb5 - A5 - G5 - F5 - | E5 - G5 - C6 - - -', vel: 0.9 },
    ],
  },
  sun: {
    bpm: 124, bass: 'pulse', arp: 'up', arpInst: 'pluck', arpOct: 1,
    chords: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A', 'G', 'D', 'Em', 'A', 'G', 'D', 'Em7', 'A'],
    drums: { kick: 'x...x...x...x...', clap: '....x.......x...', hat: 'o.x.o.x.o.x.o.x.' },
    voices: [
      { inst: 'lead', notes: 'F#5 - A5 - D6 - A5 - | E5 - A5 - C#6 - B5 A5 | B5 - D6 - F#6 - E6 D6 | B5 - - - G5 A5 B5 - | A5 - F#5 - A5 - D6 - | C#6 - B5 - A5 - E5 - | G5 - B5 - D6 - B5 G5 | A5 - - - . . . . | B5 - - A5 G5 - D5 - | F#5 - - E5 D5 - A4 - | G5 - - F#5 E5 - B4 - | C#5 - E5 - A5 - - - | B5 - D6 - G6 - F#6 - | F#6 - E6 - D6 - A5 - | B5 - A5 - G5 - E5 - | A5 - - - C#6 - E6 -' },
    ],
  },
  arcturus: {
    bpm: 100, bass: 'bounce', arp: 'updown', arpInst: 'marimba', arpOct: 1,
    chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B7'],
    drums: { kick: 'x.....x...x.....', snare: '....x.......x...', shaker: 'oooooooooooooooo' },
    voices: [{ inst: 'lead', notes: 'B4 - E5 - G5 - F#5 E5 | E5 - - - G5 - A5 - | B5 - - - D6 - B5 - | A5 - - - F#5 - D5 - | B4 - E5 - G5 - B5 - | C6 - B5 - G5 - E5 - | A5 - G5 - E5 - C5 - | D#5 - F#5 - B5 - - -' }],
  },
  betelgeuse: {
    // 120 bpm: one bar = 2 s = one full star pulse. The "boom" lands on every downbeat.
    bpm: 120, bass: 'drive', arp: 'up', arpInst: 'pluck', arpOct: 1, arpEvery: 2,
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E', 'Dm', 'Am', 'F', 'E', 'Dm', 'Am', 'Bb', 'E'],
    drums: { boom: 'x...............', kick: '........x.......', snare: '....x.......x...', hat: '..x...x...x...xo' },
    voices: [
      { inst: 'lead', notes: 'A4 - C5 - E5 - - - | F5 - E5 - C5 - A4 - | G4 - C5 - E5 - G5 - | F5 - E5 - D5 - - - | A5 - - - E5 - A5 - | C6 - B5 - A5 - F5 - | G5 - F5 - D5 - B4 - | G#4 - B4 - E5 - - - | F5 - - - A5 - D6 - | C6 - - - A5 - E5 - | F5 - A5 - C6 - A5 - | G#5 - - - B5 - E6 - | D6 - - - A5 - F5 - | E5 - - - C5 - A4 - | D5 - F5 - Bb5 - A5 - | G#5 - - - - - . .' },
    ],
  },
  boss: {
    bpm: 140, bass: 'drive', arp: 'up', arpInst: 'pluck', arpOct: 1,
    chords: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A'],
    drums: { kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'xoxoxoxoxoxoxoxo' },
    voices: [{ inst: 'lead', notes: 'D5 - F5 - A5 - D6 - | Bb5 - A5 - F5 - D5 - | E5 - G5 - C6 - E6 - | C#6 - - - A5 - - - | D6 - - C6 Bb5 - A5 - | F5 - - G5 A5 - Bb5 - | G5 - Bb5 - D6 - G6 - | E6 - - - C#6 - A5 -' }],
  },
  credits: {
    bpm: 96, bass: 'pulse', arp: 'wide', arpInst: 'pluck', arpOct: 1,
    chords: ['C', 'Am', 'F', 'G', 'C', 'Em', 'F', 'G'],
    drums: { kick: 'x.......x.......', snare: '....x.......x...', shaker: '..o...o...o...o.' },
    voices: [{ inst: 'bell', notes: 'G5 - E5 - C6 - - - | A5 - C6 - E6 - D6 - | C6 - A5 - F5 - A5 - | B5 - - - D6 - - - | E6 - D6 - C6 - G5 - | B5 - - - G5 - E5 - | F5 - A5 - C6 - F6 - | E6 - D6 - B5 - - -' }],
  },
};
