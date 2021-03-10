import { EventEmitter } from 'events';

import { IDisposable } from '@/renderer/IDisposable';

type CallbackData = {
    idx: number;
    now: number;
    frames: Frame[];
    callback: (idx: number) => void;
};

/**
 * Minecraftでは 1秒 = 20tick
 */
const MC_TICK = 20;

export class TickTimer extends EventEmitter implements IDisposable {
    // ちょっと早くしてる(本来は1000)
    private readonly interval = 950 / MC_TICK;

    private isDispose = false;

    private before = 0;

    private callbacks: CallbackData[] = [];

    public Start() {
        this.before = performance.now();
        this.loop();
    }

    public Add(frames: Frame[], callback: CallbackData['callback']) {
        this.callbacks.push({
            idx: 0,
            now: 0,
            frames,
            callback
        });
    }

    public Dispose() {
        this.isDispose = true;
        this.removeAllListeners();
        this.callbacks.length = 0;
    }

    public on(event: 'tick', listener: () => void): this;
    public on(event: string | symbol, listener: (...args: unknown[]) => void) {
        return super.on(event, listener);
    }

    public off(event: 'tick', listener: () => void): this;
    public off(event: string | symbol, listener: (...args: unknown[]) => void) {
        return super.off(event, listener);
    }

    public emit(event: 'tick'): boolean;
    public emit(event: string | symbol, ...args: unknown[]) {
        return super.emit(event, ...args);
    }

    private loop() {
        if (this.isDispose) return;

        const now = performance.now();
        const elapsed = now - this.before;
        setTimeout(this.loop.bind(this), 5);
        if (elapsed < this.interval) return;
        this.before = now;

        this.emit('tick');

        for (const cb of this.callbacks) {
            cb.now++;
            if (cb.now >= cb.frames[cb.idx].time) {
                cb.idx++;
                if (cb.idx > cb.frames.length - 1) cb.idx = 0;

                cb.callback(cb.idx);
                cb.now = 0;
            }
        }
    }
}
