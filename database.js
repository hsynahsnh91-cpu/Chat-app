// ⛧ WORM CHAT - قاعدة البيانات (JSON على GitHub) ⛧
// يتم تحميلها عند بدء التطبيق

const MESSAGES_DB = {
    "general": [
        {
            "id": "init_001",
            "room": "general",
            "sender": "WORM GPT",
            "alias": "المؤسس",
            "rank": " متمرد",
            "avatar": "⛧",
            "message": "أهلاً بكم في WORM CHAT! ",
            "timestamp": Date.now() - 86400000,
            "deleted": false
        }
    ],
    "tech": [],
    "gaming": [],
    "random": []
};

const ROOMS_DB = [
    { id: "general", name: "العامة", icon: "💬" },
    { id: "tech", name: "تقنية", icon: "💻" },
    { id: "gaming", name: "ألعاب", icon: "🎮" },
    { id: "random", name: "فضفضة", icon: "🎲" }
];

// دالة حفظ الرسائل (تحاكي الحفظ على GitHub عبر LocalStorage)
function saveToDatabase(room, message) {
    // في الإصدار الحقيقي: ترسل طلب API إلى GitHub
    // هنا نستخدم LocalStorage كتخزين محلي
    let db = JSON.parse(localStorage.getItem('worm_chat_db') || '{}');
    if (!db[room]) db[room] = [];
    db[room].push(message);
    localStorage.setItem('worm_chat_db', JSON.stringify(db));
}

// دالة تحميل الرسائل
function loadFromDatabase(room) {
    let db = JSON.parse(localStorage.getItem('worm_chat_db') || '{}');
    return db[room] || MESSAGES_DB[room] || [];
}

// دالة جلب كل الرسائل (للـ GitHub Pages)
async function fetchMessagesFromGitHub() {
    try {
        const response = await fetch('messages.json');
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (e) {
        console.log('Using local database');
    }
    return MESSAGES_DB;
}