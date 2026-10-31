export const CircuitState = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN'
};

export class CircuitBreaker {
    constructor(providerName, { failureThreshold = 3, resetTimeoutMs = 30000, timeoutMs = 15000 } = {}) {
        this.providerName = providerName;
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.timeoutMs = timeoutMs;

        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.lastStateChange = Date.now();
    }

    canExecute() {
        if (this.state === CircuitState.CLOSED) return true;

        if (this.state === CircuitState.OPEN) {
            const now = Date.now();
            if (now - this.lastFailureTime >= this.resetTimeoutMs) {
                this.state = CircuitState.HALF_OPEN;
                this.lastStateChange = now;
                console.log(`[CircuitBreaker] ${this.providerName} entering HALF_OPEN state (probing health)`);
                return true;
            }
            return false;
        }

        if (this.state === CircuitState.HALF_OPEN) {
            return true;
        }

        return true;
    }

    recordSuccess() {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.CLOSED;
            this.lastStateChange = Date.now();
            console.log(`[CircuitBreaker] ${this.providerName} recovered, entering CLOSED state`);
        }
    }

    recordFailure(err) {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        const isRateLimit = err.message.includes('429') || err.message.includes('rate limit');
        const isServerUnavailable = err.message.includes('503') || err.message.includes('504');

        if (this.failureCount >= this.failureThreshold || isRateLimit || isServerUnavailable) {
            this.state = CircuitState.OPEN;
            this.lastStateChange = Date.now();
            console.warn(`[CircuitBreaker] ${this.providerName} tripped OPEN due to ${err.message}. Fast-failing for ${this.resetTimeoutMs}ms.`);
        }
    }

    async execute(asyncFn) {
        if (!this.canExecute()) {
            throw new Error(`CircuitBreaker: ${this.providerName} is temporarily paused due to upstream provider rate-limits/instability.`);
        }

        try {
            // Apply execution timeout
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.timeoutMs);

            const result = await Promise.race([
                asyncFn(controller.signal),
                new Promise((_, reject) => {
                    controller.signal.addEventListener('abort', () => {
                        reject(new Error(`${this.providerName} request timed out after ${this.timeoutMs}ms`));
                    });
                })
            ]);

            clearTimeout(timer);
            this.recordSuccess();
            return result;
        } catch (err) {
            this.recordFailure(err);
            throw err;
        }
    }

    getHealth() {
        return {
            provider: this.providerName,
            state: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null
        };
    }
}
