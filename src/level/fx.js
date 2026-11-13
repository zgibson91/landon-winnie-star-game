// Particle helpers (pooled emitters).
export class FX {
  constructor(scene) {
    this.scene = scene;
    this.sparks = scene.add.particles(0, 0, 'spark', {
      emitting: false, lifespan: { min: 300, max: 650 }, speed: { min: 80, max: 260 }, scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 }, blendMode: 'ADD', gravityY: 300,
    }).setDepth(60);
    this.stars = scene.add.particles(0, 0, 'starpt', {
      emitting: false, lifespan: { min: 600, max: 1000 }, speed: { min: 60, max: 200 }, scale: { start: 1.1, end: 0 },
      rotate: { min: 0, max: 360 }, alpha: { start: 1, end: 0 }, gravityY: 120,
    }).setDepth(61);
    this.dust = scene.add.particles(0, 0, 'dust', {
      emitting: false, lifespan: 380, speedX: { min: -70, max: 70 }, speedY: { min: -60, max: -10 }, scale: { start: 0.9, end: 0.2 },
      alpha: { start: 0.55, end: 0 }, tint: 0xffffff,
    }).setDepth(47);
    this.embers = scene.add.particles(0, 0, 'spark', {
      emitting: false, lifespan: { min: 500, max: 900 }, speedY: { min: -160, max: -60 }, speedX: { min: -20, max: 20 },
      scale: { start: 0.6, end: 0 }, alpha: { start: 0.9, end: 0 }, blendMode: 'ADD', tint: 0xffd27a,
    }).setDepth(32);
    this.tw = scene.add.particles(0, 0, 'starpt', {
      emitting: false, lifespan: 900, speed: 0, scale: { start: 0, end: 0.8, ease: 'Sine.easeOut' }, alpha: { start: 0.7, end: 0 }, tint: 0xd6ccff,
    }).setDepth(21);
  }
  burst(x, y, tint = 0xffffff, n = 10) { this.sparks.setParticleTint(tint); this.sparks.explode(n, x, y); }
  starBurst(x, y, n = 16, tint = 0xfff1a8) { this.stars.setParticleTint(tint); this.stars.explode(n, x, y); }
  puff(x, y, n = 6, tint = 0xffffff) { this.dust.setParticleTint(tint); this.dust.explode(n, x, y); }
  emberAt(x, y) { this.embers.emitParticleAt(x, y, 1); }
  twinkle(x, y) { this.tw.emitParticleAt(x, y, 1); }
  ring(x, y, color, radius, dur = 500) {
    const g = this.scene.add.circle(x, y, 10, color, 0.18).setStrokeStyle(6, color, 0.9).setDepth(62);
    this.scene.tweens.add({ targets: g, radius, alpha: 0, duration: dur, ease: 'Cubic.easeOut', onUpdate: () => g.setRadius(g.radius), onComplete: () => g.destroy() });
  }
}
