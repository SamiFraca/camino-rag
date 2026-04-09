<template>
  <div class="layout">
    <aside class="scene-panel">
      <div class="scene-title">
        <span class="pilgrim-icon">🚶</span>
        <span>Camino Guide</span>
      </div>
      <ClientOnly>
        <CaminoCharacter :is-talking="isTalking" />
      </ClientOnly>
      <div class="status-badge" :class="{ talking: isTalking }">
        {{ isTalking ? 'Planning your route...' : 'Ready to guide you' }}
      </div>
    </aside>

    <main class="chat-panel">
      <header class="chat-header">
        <h1>Camino de Santiago Planner</h1>
        <p>Ask me to plan your pilgrimage route</p>
      </header>

      <div class="messages" ref="messagesEl">
        <div v-if="messages.length === 0" class="empty-state">
          <p>Try asking:</p>
          <button
            v-for="hint in hints"
            :key="hint"
            class="hint-btn"
            @click="sendMessage(hint)"
          >{{ hint }}</button>
        </div>

        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="message"
          :class="msg.role"
        >
          <div class="bubble">
            <pre>{{ msg.content }}</pre>
          </div>
        </div>

        <div v-if="isTalking" class="message assistant">
          <div class="bubble loading">
            <span /><span /><span />
          </div>
        </div>
      </div>

      <form class="input-row" @submit.prevent="sendMessage()">
        <textarea
          v-model="input"
          placeholder="e.g. Plan a 5-day Camino route for a beginner"
          rows="2"
          :disabled="isTalking"
          @keydown.enter.exact.prevent="sendMessage()"
        />
        <button type="submit" :disabled="isTalking || !input.trim()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'

const input = ref('')
const isTalking = ref(false)
const messagesEl = ref<HTMLElement | null>(null)

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const messages = ref<Message[]>([])

const hints = [
  'Plan a 4-day Camino route for a beginner',
  'Plan a 7-day Camino route for an experienced pilgrim',
  'What is the best route starting from Porto?'
]

async function sendMessage(text?: string) {
  const question = (text ?? input.value).trim()
  if (!question || isTalking.value) return

  input.value = ''
  messages.value.push({ role: 'user', content: question })
  isTalking.value = true

  await nextTick()
  scrollToBottom()

  try {
    const { answer } = await $fetch<{ answer: string }>('/api/ask', {
      method: 'POST',
      body: { question }
    })
    messages.value.push({ role: 'assistant', content: answer })
  } catch {
    messages.value.push({ role: 'assistant', content: '⚠️ Something went wrong. Please try again.' })
  } finally {
    isTalking.value = false
    await nextTick()
    scrollToBottom()
  }
}

function scrollToBottom() {
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.scene-panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  gap: 16px;
}

.scene-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-accent);
}

.pilgrim-icon {
  font-size: 1.4rem;
}

.status-badge {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.status-badge.talking {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 20px 28px;
  border-bottom: 1px solid var(--color-border);
}

.chat-header h1 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.chat-header p {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-top: 40px;
}

.hint-btn {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  text-align: left;
  transition: border-color 0.2s;
}

.hint-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.message {
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 0.9rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.message.user .bubble {
  background: var(--color-user-bubble);
  border-bottom-right-radius: 4px;
}

.message.assistant .bubble {
  background: var(--color-bot-bubble);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 4px;
}

.bubble pre {
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble.loading {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 14px 18px;
}

.bubble.loading span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-text-muted);
  animation: bounce 1.2s infinite;
}

.bubble.loading span:nth-child(2) { animation-delay: 0.2s; }
.bubble.loading span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40% { transform: translateY(-6px); opacity: 1; }
}

.input-row {
  display: flex;
  gap: 10px;
  padding: 16px 28px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
}

textarea {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  border-radius: var(--radius);
  padding: 10px 14px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

textarea:focus {
  border-color: var(--color-accent);
}

textarea:disabled {
  opacity: 0.5;
}

button[type="submit"] {
  width: 44px;
  height: 44px;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius);
  color: #000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  align-self: flex-end;
  transition: background 0.2s;
}

button[type="submit"]:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

button[type="submit"]:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
