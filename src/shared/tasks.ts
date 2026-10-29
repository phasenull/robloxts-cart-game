import { Trove } from "@rbxts/trove"

/**
 * Short-lived troves owned by a long-lived one (an effect per pickup, a timer per cart): cleaning the owner cleans every
 * scope still open, and a closed scope drops out instead of staying in the owner until it is cleaned.
 */
export class Scopes {
	private readonly open = new Set<Trove>()

	constructor(trove: Trove) {
		trove.add(() => {
			for (const scope of this.open) scope.destroy()
			this.open.clear()
		})
	}

	create(): Trove {
		const scope = new Trove()
		this.open.add(scope)
		return scope
	}

	close(scope: Trove) {
		if (!this.open.delete(scope)) return
		scope.destroy()
	}
}

/**
 * task.spawn / delay / defer owned by a trove: cleaning the trove cancels every thread still pending or running.
 * Unlike `trove.add(task.delay(...))`, a finished thread drops out, so a long-lived module trove doesn't keep one entry
 * per call for the whole server life. Use it for work started per event (a spawn, a purchase, a honk).
 */
export class Tasks {
	private readonly live = new Set<thread>()

	/** Without a trove, the owner calls cancelAll (a React component does it in its effect cleanup: useTasks). */
	constructor(trove?: Trove) {
		trove?.add(() => this.cancelAll())
	}

	cancelAll() {
		const current = coroutine.running()
		for (const thread of this.live) if (thread !== current) task.cancel(thread)
		this.live.clear()
	}

	spawn<A extends unknown[]>(callback: (...args: A) => void, ...args: A): thread {
		return task.spawn(() => this.run(callback, args))
	}

	delay<A extends unknown[]>(seconds: number, callback: (...args: A) => void, ...args: A): thread {
		const thread = task.delay(seconds, () => this.run(callback, args))
		this.live.add(thread)
		return thread
	}

	defer<A extends unknown[]>(callback: (...args: A) => void, ...args: A): thread {
		const thread = task.defer(() => this.run(callback, args))
		this.live.add(thread)
		return thread
	}

	cancel(thread: thread) {
		if (!this.live.has(thread)) return
		this.live.delete(thread)
		task.cancel(thread)
	}

	private run<A extends unknown[]>(callback: (...args: A) => void, args: A) {
		const current = coroutine.running()
		this.live.add(current)
		try {
			callback(...args)
		} finally {
			this.live.delete(current)
		}
	}
}
