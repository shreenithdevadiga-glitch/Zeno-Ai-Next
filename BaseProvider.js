export class BaseProvider {
    constructor(name, config = {}) {
        this.name = name;
        this.config = config;
    }

    getApiKey() {
        return this.config?.apiKey || null;
    }

    async chat(messages, options = {}) {
        throw new Error(`Method 'chat' must be implemented in provider ${this.name}`);
    }

    async streamChat(messages, options = {}, onToken) {
        throw new Error(`Method 'streamChat' must be implemented in provider ${this.name}`);
    }

    async checkHealth() {
        return { ok: false, error: 'Health check not implemented' };
    }

    sanitizeError(error) {
        let msg = error?.message || 'Unknown provider error';
        // Strip any accidental exposed key substrings
        msg = msg.replace(/(sk-[a-zA-Z0-9_-]{8,})|(key=[a-zA-Z0-9_-]{8,})/gi, '[REDACTED]');
        return msg;
    }
}
