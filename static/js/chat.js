(function() {
    const api = '/api/';
    const csrf = () => document.querySelector('[name=csrfmiddlewaretoken]')?.value || getCookie('csrftoken');

    function getCookie(name) { return document.cookie.split('; ').find(c => c.startsWith(name + '='))?.split('=')[1]; }

    const App = {
        init() {
            const roomId = document.body.dataset.roomId;
            if (roomId) this.initChat(roomId);
            this.initDarkMode();
        },
        initChat(roomId) {
            const ws = new WebSocket(`ws://${location.host}/ws/chat/${roomId}/`);
            const form = document.getElementById('messageForm');
            const input = document.getElementById('messageInput');
            const messagesDiv = document.getElementById('messages');

            ws.onopen = () => { console.log('Chat connected'); };
            ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.type === 'message') this.appendMessage(data.message);
                if (data.type === 'typing') this.showTyping(data.user);
                if (data.type === 'seen') this.markSeen(data.message_id);
            };
            ws.onclose = () => { console.log('Chat disconnected, reconnecting...'); setTimeout(() => this.initChat(roomId), 2000); };

            form?.addEventListener('submit', (e) => {
                e.preventDefault();
                const content = input.value.trim();
                if (!content) return;
                ws.send(JSON.stringify({type: 'message', content}));
                this.appendMessage({sender: 'me', content, status: 'sent', created_at: new Date()});
                input.value = '';
            });

            input?.addEventListener('input', () => {
                ws.send(JSON.stringify({type: 'typing', is_typing: input.value.length > 0}));
            });
        },
        appendMessage(msg) {
            const div = document.createElement('div');
            div.className = `message ${msg.sender === 'me' ? 'sent' : 'received'}`;
            div.textContent = msg.content;
            const messagesDiv = document.getElementById('messages');
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        },
        showTyping(user) {
            const status = document.getElementById('partnerStatus');
            if (status) { status.textContent = `${user} is typing...`; setTimeout(() => status.textContent = 'Online', 3000); }
        },
        initDarkMode() {
            const btn = document.getElementById('themeToggle');
            btn?.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
            });
            const saved = localStorage.getItem('theme');
            if (saved) document.documentElement.setAttribute('data-theme', saved);
        }
    };
    window.OmniRoute = App;
    document.addEventListener('DOMContentLoaded', () => App.init());
})();
