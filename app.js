// ⛧ WORM CHAT - التطبيق الرئيسي ⛧

let currentUser = null;
let currentRoom = 'general';
let typingTimeout = null;
let notificationSound = null;

const EMOJIS = ['😀','😂','😍','🤔','😎','🥳','😢','😡','👍','👎','❤️','🔥','⭐','💯','🎉','💀','👻','🤖','⛧','🖤','💜','💙','💚','💛','🧡','🤍'];

// ==================== التهيئة ====================
document.addEventListener('DOMContentLoaded', async () => {
    // تحميل البيانات من GitHub
    const remoteData = await fetchMessagesFromGitHub();
    Object.assign(MESSAGES_DB, remoteData);
    
    // تحميل الصوت
    notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4B/f3+Af39/gIB/f39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gA==');
    
    initEmojiPicker();
    checkLogin();
});

// ==================== تسجيل الدخول ====================
function checkLogin() {
    const savedUser = localStorage.getItem('worm_chat_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('loginModal').style.display = 'none';
        initChat();
    } else {
        document.getElementById('loginModal').style.display = 'flex';
        initAvatarSelection();
    }
}

function initAvatarSelection() {
    const avatars = ['🦊', '🐱', '🐶', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🐙', '🦖', '🐉', '👹'];
    const container = document.getElementById('avatarSelection');
    container.innerHTML = avatars.map(a => 
        `<span class="avatar-option" onclick="selectAvatar('${a}')">${a}</span>`
    ).join('');
    window.selectedAvatar = avatars[0];
    container.querySelector('.avatar-option').classList.add('selected');
}

function selectAvatar(avatar) {
    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');
    window.selectedAvatar = avatar;
}

function login() {
    const username = document.getElementById('usernameInput').value.trim();
    const alias = document.getElementById('aliasInput').value.trim();
    const rank = document.getElementById('rankSelect').value;
    
    if (!username) {
        alert('الرجاء إدخال اسم المستخدم');
        return;
    }
    
    currentUser = {
        id: 'user_' + Date.now(),
        name: username,
        alias: alias || username,
        rank: rank || '🟢 مبتدئ',
        avatar: window.selectedAvatar || '👤'
    };
    
    localStorage.setItem('worm_chat_user', JSON.stringify(currentUser));
    document.getElementById('loginModal').style.display = 'none';
    initChat();
    showNotification('تم تسجيل الدخول بنجاح ⛧');
}

// ==================== تهيئة المحادثة ====================
function initChat() {
    loadRoom(currentRoom);
    setupRoomListeners();
    updateOnlineUsers();
    setInterval(updateOnlineUsers, 5000);
}

function loadRoom(roomId) {
    currentRoom = roomId;
    const messages = loadFromDatabase(roomId);
    document.getElementById('currentRoomName').textContent = 
        `${ROOMS_DB.find(r => r.id === roomId)?.icon || '💬'} ${ROOMS_DB.find(r => r.id === roomId)?.name || roomId}`;
    
    renderMessages(messages);
    scrollToBottom();
    
    // تحديث الغرفة النشطة
    document.querySelectorAll('.room').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-room="${roomId}"]`)?.classList.add('active');
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">⛧</div>
                <h4>لا توجد رسائل بعد</h4>
                <p>كن أول من يكتب!</p>
            </div>`;
        return;
    }
    
    container.innerHTML = messages
        .filter(msg => !msg.deleted)
        .map(msg => createMessageHTML(msg))
        .join('');
}

function createMessageHTML(msg) {
    const isSelf = currentUser && msg.sender === currentUser.name;
    const time = new Date(msg.timestamp).toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    return `
        <div class="message ${isSelf ? 'self' : 'other'}" data-id="${msg.id}">
            <div class="message-header">
                <span class="message-avatar">${msg.avatar || '👤'}</span>
                <span class="message-sender">${msg.sender}</span>
                ${msg.rank ? `<span class="message-rank">${msg.rank}</span>` : ''}
                ${msg.alias ? `<span style="opacity:0.6;font-size:0.8em;">(@${msg.alias})</span>` : ''}
                <span class="message-time">${time}</span>
            </div>
            <div class="message-body">${formatMessage(msg.message)}</div>
            ${isSelf ? `
                <div class="message-actions">
                    <button class="delete-btn" onclick="deleteMessage('${msg.id}')">🗑️</button>
                </div>` : ''}
        </div>
    `;
}

function formatMessage(text) {
    // تحويل الروابط
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#6c5ce7;">$1</a>');
    // تحويل الرموز التعبيرية الكبيرة
    text = text.replace(/(\p{Emoji})/gu, '<span style="font-size:1.2em;">$1</span>');
    return text;
}

// ==================== إرسال الرسائل ====================
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || !currentUser) return;
    
    const newMessage = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        room: currentRoom,
        sender: currentUser.name,
        alias: currentUser.alias,
        rank: currentUser.rank,
        avatar: currentUser.avatar,
        message: message,
        timestamp: Date.now(),
        deleted: false
    };
    
    saveToDatabase(currentRoom, newMessage);
    input.value = '';
    loadRoom(currentRoom);
    playNotificationSound();
    
    document.getElementById('typingIndicator').textContent = '';
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function handleTyping() {
    const indicator = document.getElementById('typingIndicator');
    indicator.textContent = `${currentUser.name} يكتب الآن...`;
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        indicator.textContent = '';
    }, 2000);
}

// ==================== حذف الرسائل ====================
function deleteMessage(messageId) {
    let db = JSON.parse(localStorage.getItem('worm_chat_db') || '{}');
    if (db[currentRoom]) {
        db[currentRoom] = db[currentRoom].map(msg => 
            msg.id === messageId ? {...msg, deleted: true} : msg
        );
        localStorage.setItem('worm_chat_db', JSON.stringify(db));
        loadRoom(currentRoom);
        showNotification('تم حذف الرسالة 🗑️');
    }
}

// ==================== الغرف ====================
function setupRoomListeners() {
    document.querySelectorAll('.room').forEach(room => {
        room.addEventListener('click', () => {
            loadRoom(room.dataset.room);
        });
    });
}

function createRoom() {
    const roomName = prompt('اسم الغرفة الجديدة:');
    if (roomName) {
        const roomId = 'room_' + Date.now();
        const roomIcon = prompt('أيقونة الغرفة (إيموجي):', '💬');
        
        const newRoom = {
            id: roomId,
            name: roomName,
            icon: roomIcon || '💬'
        };
        
        ROOMS_DB.push(newRoom);
        
        const roomsList = document.getElementById('roomsList');
        const roomEl = document.createElement('div');
        roomEl.className = 'room';
        roomEl.dataset.room = roomId;
        roomEl.innerHTML = `
            <span class="room-icon">${newRoom.icon}</span>
            <span>${newRoom.name}</span>
            <span class="online-count">0</span>
        `;
        roomEl.addEventListener('click', () => loadRoom(roomId));
        roomsList.appendChild(roomEl);
        
        // حفظ الغرفة الجديدة
        localStorage.setItem('worm_chat_rooms', JSON.stringify(ROOMS_DB));
        showNotification('تم إنشاء الغرفة ⛧');
    }
}

// ==================== الإيموجي ====================
function initEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.innerHTML = EMOJIS.map(emoji => 
        `<span class="emoji-item" onclick="insertEmoji('${emoji}')">${emoji}</span>`
    ).join('');
}

function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
}

function insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    input.value += emoji;
    input.focus();
}

// ==================== المستخدمين المتصلين ====================
function updateOnlineUsers() {
    // محاكاة عدد المستخدمين (في الإصدار الحقيقي: WebSocket)
    const count = Math.floor(Math.random() * 10) + 1;
    document.getElementById('onlineUsers').textContent = `${count} متصل`;
    
    // تحديث قائمة المستخدمين الوهمية
    const fakeUsers = [
        { name: 'Ghost', avatar: '', rank: 'خبير' },
        { name: 'Shadow', avatar: '', rank: ' محترف' },
        { name: 'Phantom', avatar: '', rank: ' أسطورة' },
    ];
    
    if (currentUser) {
        fakeUsers.unshift(currentUser);
    }
    
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = fakeUsers.slice(0, count).map(user => `
        <div class="user-item">
            <span class="user-avatar">${user.avatar}</span>
            <div>
                <div class="user-name">${user.name}</div>
                <div class="user-rank">${user.rank}</div>
            </div>
            ${user.name === currentUser?.name ? '<span style="font-size:0.7em;color:var(--success);">(أنت)</span>' : ''}
        </div>
    `).join('');
}

// ==================== وظائف مساعدة ====================
function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function playNotificationSound() {
    if (notificationSound) {
        notificationSound.currentTime = 0;
        notificationSound.play().catch(() => {});
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    localStorage.setItem('worm_chat_theme', theme);
}

// تحميل الثيم المحفوظ
if (localStorage.getItem('worm_chat_theme') === 'light') {
    document.body.classList.add('light-theme');
}