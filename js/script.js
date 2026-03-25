/* ===== LOCAL STORAGE FUNCTIONS ===== */

function saveData() {
    const data = {
        bestScore: window.bestScore,
        totalGames: window.totalGames,
        allScores: window.allScores,
        todayGames: window.todayGames,
        lastDate: new Date().toDateString()
    };
    localStorage.setItem('numberQuestData', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('numberQuestData');
    if (saved) {
        const data = JSON.parse(saved);
        window.bestScore = data.bestScore || Infinity;
        window.totalGames = data.totalGames || 0;
        window.allScores = data.allScores || [];
        
        // Reset today games if new day
        if (data.lastDate !== new Date().toDateString()) {
            window.todayGames = 0;
        } else {
            window.todayGames = data.todayGames || 0;
        }
    } else {
        window.bestScore = Infinity;
        window.totalGames = 0;
        window.allScores = [];
        window.todayGames = 0;
    }
    updateStats();
}

function clearData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
        localStorage.removeItem('numberQuestData');
        window.bestScore = Infinity;
        window.totalGames = 0;
        window.allScores = [];
        window.todayGames = 0;
        updateStats();
        alert('All data cleared! 🗑️');
    }
}

function updateStats() {
    const bestScore = window.bestScore === Infinity ? '∞' : window.bestScore;
    document.getElementById('bestScore').textContent = bestScore;
    document.getElementById('totalGames').textContent = window.totalGames;
    document.getElementById('todayGames').textContent = window.todayGames;

    if (window.allScores.length > 0) {
        const avg = Math.round(window.allScores.reduce((a, b) => a + b, 0) / window.allScores.length);
        document.getElementById('avgScore').textContent = avg;
    }

    if (window.totalGames > 0) {
        const winRate = Math.round((window.allScores.length / window.totalGames) * 100);
        document.getElementById('winRate').textContent = winRate + '%';
    }
}

/* ===== GAME VARIABLES ===== */
let randomNumber = Math.floor(Math.random() * 100) + 1;
let attempts = 0;
let gameOver = false;
let guessHistory = [];
let gameRange = 100; // Can be modified by difficulty
let activePowerUps = []; // Currently active power-ups
let dailyChallengeProgress = {}; // Track daily challenge progress

/* ===== SOUND FUNCTION ===== */
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'correct') {
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } else if (type === 'incorrect') {
            oscillator.frequency.value = 400;
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    } catch (e) {
        // Audio not available
    }
}

/* ===== CONFETTI FUNCTION ===== */
function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff8c42', '#38ef7d', '#6bcf7f'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-20px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animation = `confetti ${2 + Math.random() * 2}s ease-in forwards`;
        confetti.style.opacity = '1';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

/* ===== MAIN GAME FUNCTION ===== */
function checkGuess() {
    if (gameOver) return;

    const input = document.getElementById('guessInput');
    const guess = parseInt(input.value);
    const messageBox = document.getElementById('message');

    if (isNaN(guess) || guess < 1 || guess > 100) {
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 400);
        messageBox.textContent = '❌ Enter a number between 1 and 100!';
        messageBox.className = 'message error';
        setTimeout(() => {
            messageBox.textContent = '';
        }, 3000);
        return;
    }

    attempts++;
    guessHistory.push(guess);
    document.getElementById('attempts').textContent = attempts;

    if (guess === randomNumber) {
        createConfetti();
        playSound('correct');
        
        // Check if new best score
        const isNewBest = attempts < window.bestScore;
        if (isNewBest) {
            window.bestScore = attempts;
            document.getElementById('highScoreBox').style.display = 'block';
            document.getElementById('newBestScore').textContent = `${attempts} tries! 🎉`;
        }

        messageBox.innerHTML = `<div>🏆 CONGRATULATIONS! 🏆</div><div>You found ${randomNumber} in ${attempts} tries!</div>`;
        messageBox.className = 'message correct';
        const guessBtn = document.getElementById('guessBtn');
        const resetBtn = document.getElementById('resetBtn');
        const hintBtn = document.getElementById('hintBtn');
        
        if (guessBtn) guessBtn.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'block';
        
        // Show hint button if power-up is owned
        if (hintBtn && window.purchasedItems.includes('hint-system')) {
            hintBtn.style.display = 'block';
        }
        
        input.disabled = true;
        gameOver = true;
        
        window.totalGames++;
        window.todayGames++;
        window.allScores.push(attempts);
        saveData();
        updateStats();
        updateDifficultyInfo();
    } else {
        playSound('incorrect');
        const diff = Math.abs(guess - randomNumber);
        let tempMsg = '';
        
        if (diff < 3) {
            tempMsg = '🔥🔥🔥 BURNING HOT! 🔥🔥🔥';
        } else if (diff < 8) {
            tempMsg = '🔥 Very Hot! 🔥';
        } else if (diff < 15) {
            tempMsg = '🌡️ Warm';
        } else if (diff < 30) {
            tempMsg = '❄️ Cold';
        } else {
            tempMsg = '🥶 Freezing! 🥶';
        }

        if (guess > randomNumber) {
            messageBox.innerHTML = `<div>⬇️ SMALLER!</div><div>${tempMsg}</div>`;
            messageBox.className = 'message toohigh';
        } else {
            messageBox.innerHTML = `<div>⬆️ BIGGER!</div><div>${tempMsg}</div>`;
            messageBox.className = 'message toolow';
        }
    }

    input.value = '';
    input.focus();
}

/* ===== KEYBOARD SUPPORT ===== */
function handleKeyPress(event) {
    if (event.key === 'Enter' && !gameOver) {
        checkGuess();
    }
}

/* ===== DIFFICULTY INFO ===== */
function updateDifficultyInfo() {
    const info = document.getElementById('difficultyInfo');
    let difficulty = '';
    let stars = '';

    if (attempts <= 4) {
        difficulty = '🤯 ABSOLUTELY GENIUS!';
        stars = '⭐⭐⭐⭐⭐';
    } else if (attempts <= 6) {
        difficulty = '✨ INCREDIBLE!';
        stars = '⭐⭐⭐⭐';
    } else if (attempts <= 9) {
        difficulty = '👏 EXCELLENT!';
        stars = '⭐⭐⭐';
    } else if (attempts <= 13) {
        difficulty = '💪 GOOD JOB!';
        stars = '⭐⭐';
    } else {
        difficulty = '🎯 COMPLETED!';
        stars = '⭐';
    }

    info.innerHTML = `${difficulty}<div class="stars">${stars}</div>`;
}

/* ===== RESET GAME ===== */
function resetGame() {
    randomNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    gameOver = false;
    guessHistory = [];
    document.getElementById('attempts').textContent = '0';
    document.getElementById('guessInput').value = '';
    document.getElementById('guessInput').disabled = false;
    document.getElementById('message').textContent = '';
    document.getElementById('difficultyInfo').textContent = '';
    document.getElementById('highScoreBox').style.display = 'none';
    document.getElementById('guessBtn').style.display = 'block';
    document.getElementById('resetBtn').style.display = 'none';
    document.getElementById('guessInput').focus();
}

/* ===== SHOP & COSMETICS DATA ===== */
const shopItems = [
    { id: 'hint-system', name: 'Hint System', icon: '💡', desc: 'Get range hints', price: 30 },
    { id: 'easier-mode', name: 'Easier Mode', icon: '📉', desc: '1-50 range', price: 50 },
    { id: 'second-chance', name: '2nd Chance', icon: '♻️', desc: 'Retry round', price: 60 }
];

const cosmeticItems = [
    { id: 'dark-theme', name: 'Dark Theme', icon: '🌙', desc: 'Dark mode', price: 15 },
    { id: 'neon-theme', name: 'Neon Theme', icon: '⚡', desc: 'Neon colors', price: 25 },
    { id: 'forest-theme', name: 'Forest Theme', icon: '🌳', desc: 'Nature colors', price: 25 },
    { id: 'sunset-theme', name: 'Sunset Theme', icon: '🌅', desc: 'Warm colors', price: 25 },
    { id: 'cyber-theme', name: 'Cyber Theme', icon: '🤖', desc: 'Futuristic', price: 35 }
];

const achievements = [
    { id: 'first-victory', name: 'First Victory', icon: '🏅', desc: 'Win your first game', reward: 100 },
    { id: 'speed-racer', name: 'Speed Racer', icon: '⚡', desc: 'Win in 3 tries', reward: 200 },
    { id: 'perfect', name: 'Perfect!', icon: '💯', desc: 'Win in 1 try', reward: 500 },
    { id: 'collector', name: 'Collector', icon: '🎯', desc: 'Win 10 games', reward: 300 },
    { id: 'millionaire', name: 'Millionaire', icon: '💰', desc: 'Earn 1000 coins', reward: 500 },
    { id: 'level-master', name: 'Level Master', icon: '👑', desc: 'Reach level 5', reward: 400 },
    { id: 'streak-king', name: 'Streak King', icon: '🔥', desc: '5-game streak', reward: 300 },
    { id: 'shop-master', name: 'Shop Master', icon: '🛍️', desc: 'Buy 5 items', reward: 250 },
    { id: 'challenge-master', name: 'Challenge Master', icon: '🎯', desc: 'Complete 3 daily challenges', reward: 400 },
    { id: 'power-addict', name: 'Power Addict', icon: '⚡', desc: 'Use 10 power-ups', reward: 300 }
];

const dailyChallenges = [
    { id: 'daily-win', name: 'Daily Win', icon: '✅', desc: 'Win any game', reward: 100, check: () => true },
    { id: 'speed-run', name: 'Speed Run', icon: '⏱️', desc: 'Win in under 5 tries', reward: 150, check: (attempts) => attempts < 5 },
    { id: 'three-wins', name: 'Three Timer', icon: '🎯', desc: 'Win 3 games today', reward: 200, check: (attempts, todayGames) => todayGames >= 3 }
];

/* ===== UPDATED LOCAL STORAGE FUNCTIONS ===== */
function saveData() {
    const data = {
        bestScore: window.bestScore,
        totalGames: window.totalGames,
        allScores: window.allScores,
        todayGames: window.todayGames,
        lastDate: new Date().toDateString(),
        coins: window.coins,
        level: window.level,
        xp: window.xp,
        streak: window.streak,
        purchasedItems: window.purchasedItems,
        equippedCosmetic: window.equippedCosmetic,
        unlockedAchievements: window.unlockedAchievements,
        powerUpsUsed: window.powerUpsUsed || 0,
        dailyChallengesCompleted: window.dailyChallengesCompleted || {}
    };
    localStorage.setItem('numberQuestData', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('numberQuestData');
    if (saved) {
        const data = JSON.parse(saved);
        window.bestScore = data.bestScore || Infinity;
        window.totalGames = data.totalGames || 0;
        window.allScores = data.allScores || [];
        window.coins = data.coins || 0;
        window.level = data.level || 1;
        window.xp = data.xp || 0;
        window.streak = data.streak || 0;
        window.purchasedItems = data.purchasedItems || [];
        window.equippedCosmetic = data.equippedCosmetic || null;
        window.unlockedAchievements = data.unlockedAchievements || [];
        window.powerUpsUsed = data.powerUpsUsed || 0;
        window.dailyChallengesCompleted = data.dailyChallengesCompleted || {};
        
        // Reset today games if new day
        if (data.lastDate !== new Date().toDateString()) {
            window.todayGames = 0;
        } else {
            window.todayGames = data.todayGames || 0;
        }
    } else {
        window.bestScore = Infinity;
        window.totalGames = 0;
        window.allScores = [];
        window.todayGames = 0;
        window.coins = 0;
        window.level = 1;
        window.xp = 0;
        window.streak = 0;
        window.purchasedItems = [];
        window.equippedCosmetic = null;
        window.unlockedAchievements = [];
        window.powerUpsUsed = 0;
        window.dailyChallengesCompleted = {};
    }
    updateStats();
    updateTopBar();
}

function clearData() {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
        localStorage.removeItem('numberQuestData');
        window.bestScore = Infinity;
        window.totalGames = 0;
        window.allScores = [];
        window.todayGames = 0;
        window.coins = 0;
        window.level = 1;
        window.xp = 0;
        window.streak = 0;
        window.purchasedItems = [];
        window.equippedCosmetic = null;
        window.unlockedAchievements = [];
        window.powerUpsUsed = 0;
        window.dailyChallengesCompleted = {};
        updateStats();
        updateTopBar();
        alert('All data cleared! 🗑️');
    }
}

function updateStats() {
    const bestScore = window.bestScore === Infinity ? '∞' : window.bestScore;
    if (document.getElementById('bestScore')) {
        document.getElementById('bestScore').textContent = bestScore;
    }
    if (document.getElementById('totalGames')) {
        document.getElementById('totalGames').textContent = window.totalGames;
    }
    if (document.getElementById('todayGames')) {
        document.getElementById('todayGames').textContent = window.todayGames;
    }
    if (window.allScores.length > 0) {
        const avg = Math.round(window.allScores.reduce((a, b) => a + b, 0) / window.allScores.length);
        if (document.getElementById('avgScore')) {
            document.getElementById('avgScore').textContent = avg;
        }
    }
    if (window.totalGames > 0) {
        const winRate = Math.round((window.allScores.length / window.totalGames) * 100);
        if (document.getElementById('winRate')) {
            document.getElementById('winRate').textContent = winRate + '%';
        }
    }
}

function updateTopBar() {
    const coinsEl = document.getElementById('coins');
    const levelEl = document.getElementById('level');
    const streakEl = document.getElementById('streak');
    const xpText = document.getElementById('xpText');
    const currentLevelEl = document.getElementById('currentLevel');
    const levelBarFill = document.getElementById('levelBarFill');

    if (coinsEl) coinsEl.textContent = window.coins || 0;
    if (levelEl) levelEl.textContent = window.level || 1;
    if (currentLevelEl) currentLevelEl.textContent = window.level || 1;
    if (streakEl) streakEl.textContent = window.streak || 0;

    // Update XP bar
    const maxXp = 100 * window.level;
    const xpPercent = ((window.xp || 0) / maxXp) * 100;
    if (levelBarFill) levelBarFill.style.width = Math.min(xpPercent, 100) + '%';
    if (xpText) xpText.textContent = `${window.xp || 0}/${maxXp} XP`;
}

// Add coins with animation and multipliers
function addCoins(amount) {
    // Apply streak multiplier
    const streakMultiplier = 1 + (Math.min(window.streak || 0, 5) * 0.1); // Up to 1.5x
    const multipliedAmount = Math.floor(amount * streakMultiplier);
    
    window.coins = (window.coins || 0) + multipliedAmount;
    
    const bonus = multipliedAmount > amount ? ` (${streakMultiplier.toFixed(1)}x!)` : '';
    showBonus(`+${multipliedAmount} 💰${bonus}`, '💰');
    updateTopBar();
}

// Use hint power-up
function useHint() {
    if (activePowerUps.includes('hint-system')) {
        const guessInput = document.getElementById('guessInput');
        const guess = parseInt(guessInput.value || 0);
        
        if (guess === 0) {
            alert('Enter a number first to get a hint!');
            return;
        }
        
        const diff = Math.abs(randomNumber - guess);
        let hint = '';
        
        if (diff === 0) hint = 'That\'s the number! 🎯';
        else if (diff < 5) hint = `Very close! Within ±5`;
        else if (diff < 15) hint = `Getting warm... Within ±15`;
        else if (diff < 30) hint = `Medium distance... Within ±30`;
        else hint = `Far away... Outside ±30`;
        
        showBonus(`HINT: ${hint}`, '💡');
    } else {
        alert('Buy Hint System from shop first!');
    }
}

// Add XP and level up if needed
function addXP(amount) {
    window.xp = (window.xp || 0) + amount;
    const maxXp = 100 * window.level;
    
    while (window.xp >= maxXp) {
        window.xp -= maxXp;
        window.level += 1;
        showBonus(`LEVEL UP! 🎉`, '👑');
    }
    updateTopBar();
}

// Show bonus popup
function showBonus(text, icon) {
    const popup = document.getElementById('bonusPopup');
    if (!popup) return;
    
    const bonusIcon = document.querySelector('.bonus-icon');
    const bonusText = document.querySelector('.bonus-text');
    
    if (bonusIcon) bonusIcon.textContent = icon;
    if (bonusText) bonusText.textContent = text;
    
    popup.classList.remove('show');
    void popup.offsetWidth; // Trigger reflow
    popup.classList.add('show');
}

/* ===== SHOP FUNCTIONS ===== */
function openShop() {
    const modal = document.getElementById('shopModal');
    if (modal) {
        modal.classList.add('active');
        const shopCoinsDisplay = document.getElementById('shopCoins');
        if (shopCoinsDisplay) {
            shopCoinsDisplay.textContent = window.coins || 0;
        }
        renderShopItems();
        renderCosmeticItems();
    }
}

function closeShop() {
    const modal = document.getElementById('shopModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function switchTab(tab) {
    // Update buttons
    document.querySelectorAll('.shop-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    
    // Update content
    document.querySelectorAll('.shop-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const contentEl = document.getElementById(`${tab}-content`);
    if (contentEl) {
        contentEl.classList.add('active');
    }
}

function renderShopItems() {
    const container = document.getElementById('shopItems');
    if (!container) return;
    
    container.innerHTML = '';
    shopItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        const isPurchased = window.purchasedItems.includes(item.id);
        const btnText = isPurchased ? 'OWNED' : 'BUY';
        const btnDisabled = isPurchased || window.coins < item.price ? 'disabled' : '';
        
        div.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-desc">${item.desc}</div>
            <div class="shop-item-price">${item.price} 💰</div>
            <button class="shop-item-btn" onclick="buyItem('${item.id}')" ${btnDisabled}>
                ${btnText}
            </button>
        `;
        container.appendChild(div);
    });
}

function renderCosmeticItems() {
    const container = document.getElementById('cosmeticItems');
    if (!container) return;
    
    container.innerHTML = '';
    cosmeticItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cosmetic-item';
        const isPurchased = window.purchasedItems.includes(item.id);
        const isEquipped = window.equippedCosmetic === item.id;
        const btnText = isEquipped ? 'EQUIPPED' : isPurchased ? 'EQUIP' : 'BUY';
        const btnDisabled = isEquipped || (!isPurchased && window.coins < item.price) ? 'disabled' : '';
        
        div.innerHTML = `
            <div class="cosmetic-icon">${item.icon}</div>
            <div class="cosmetic-name">${item.name}</div>
            <div class="cosmetic-desc">${item.desc}</div>
            <div class="cosmetic-price">${item.price} 💰</div>
            <button class="cosmetic-btn" onclick="buyCosmetic('${item.id}')" ${btnDisabled}>
                ${btnText}
            </button>
        `;
        container.appendChild(div);
    });
}

function buyItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (window.purchasedItems.includes(itemId)) {
        alert('Already owned!');
        return;
    }
    
    if (window.coins < item.price) {
        alert('Not enough coins! 💰');
        return;
    }
    
    window.coins -= item.price;
    window.purchasedItems.push(itemId);
    
    // Track power-up usage for achievement
    window.powerUpsUsed = (window.powerUpsUsed || 0) + 1;
    
    saveData();
    updateTopBar();
    renderShopItems();
    showBonus(`Bought ${item.name}!`, item.icon);
    checkAchievements();
}

function buyCosmetic(itemId) {
    const item = cosmeticItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (!window.purchasedItems.includes(itemId)) {
        if (window.coins < item.price) {
            alert('Not enough coins! 💰');
            return;
        }
        window.coins -= item.price;
        window.purchasedItems.push(itemId);
    }
    
    window.equippedCosmetic = itemId;
    saveData();
    updateTopBar();
    renderCosmeticItems();
    showBonus(`Applied ${item.name}!`, item.icon);
}

/* ===== ACHIEVEMENTS FUNCTIONS ===== */
function openAchievements() {
    const modal = document.getElementById('achievementsModal');
    if (modal) {
        modal.classList.add('active');
        renderAchievements();
    }
}

function closeAchievements() {
    const modal = document.getElementById('achievementsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function renderAchievements() {
    const container = document.getElementById('achievementsList');
    if (!container) return;
    
    container.innerHTML = '';
    achievements.forEach(ach => {
        const isUnlocked = window.unlockedAchievements.includes(ach.id);
        const div = document.createElement('div');
        div.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        div.innerHTML = `
            <div class="achievement-icon">${ach.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${ach.name}</div>
                <div class="achievement-desc">${ach.desc}</div>
            </div>
            <div class="achievement-reward">+${ach.reward} XP</div>
        `;
        container.appendChild(div);
    });
}

function unlockAchievement(achievementId) {
    if (window.unlockedAchievements.includes(achievementId)) return;
    
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return;
    
    window.unlockedAchievements.push(achievementId);
    addXP(achievement.reward);
    showBonus(`Achievement: ${achievement.name}!`, achievement.icon);
    saveData();
}

function checkAchievements() {
    // First Victory
    if (window.totalGames === 1) {
        unlockAchievement('first-victory');
    }
    
    // Speed Racer
    if (window.attempts <= 3) {
        unlockAchievement('speed-racer');
    }
    
    // Perfect
    if (window.attempts === 1) {
        unlockAchievement('perfect');
    }
    
    // Collector
    if (window.totalGames === 10) {
        unlockAchievement('collector');
    }
    
    // Millionaire
    if (window.coins >= 1000) {
        unlockAchievement('millionaire');
    }
    
    // Level Master
    if (window.level >= 5) {
        unlockAchievement('level-master');
    }
    
    // Streak King
    if (window.streak >= 5) {
        unlockAchievement('streak-king');
    }
    
    // Shop Master
    if (window.purchasedItems.length >= 5) {
        unlockAchievement('shop-master');
    }
    
    // Challenge Master (3+ daily challenges completed)
        const todayKey = new Date().toDateString();
        if (!window.dailyChallengesCompleted) window.dailyChallengesCompleted = {};
        if (!window.dailyChallengesCompleted[todayKey]) window.dailyChallengesCompleted[todayKey] = 0;
        window.dailyChallengesCompleted[todayKey]++;
        
        if (window.dailyChallengesCompleted[todayKey] >= 3) {
            unlockAchievement('challenge-master');
        }
    
    // Power Addict (10+ power-ups used)
        if ((window.powerUpsUsed || 0) >= 10) {
            unlockAchievement('power-addict');
        }
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'correct') {
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } else if (type === 'incorrect') {
            oscillator.frequency.value = 400;
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    } catch (e) {
        // Audio not available
    }
}

/* ===== CONFETTI FUNCTION ===== */
function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff8c42', '#38ef7d', '#6bcf7f'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-20px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animation = `confetti ${2 + Math.random() * 2}s ease-in forwards`;
        confetti.style.opacity = '1';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

/* ===== MAIN GAME FUNCTION ===== */
function checkGuess() {
    if (gameOver) return;

    const input = document.getElementById('guessInput');
    const guess = parseInt(input.value);
    const messageBox = document.getElementById('message');

    if (isNaN(guess) || guess < 1 || guess > 100) {
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 400);
        messageBox.textContent = '❌ Enter a number between 1 and 100!';
        messageBox.className = 'message error';
        setTimeout(() => {
            messageBox.textContent = '';
        }, 3000);
        return;
    }

    attempts++;
    guessHistory.push(guess);
    if (document.getElementById('attempts')) {
        document.getElementById('attempts').textContent = attempts;
    }

    if (guess === randomNumber) {
        createConfetti();
        playSound('correct');
        
        // Calculate reward coins (generous rewards!)
        const rewardCoins = Math.max(150 - (attempts * 15), 25);
        addCoins(rewardCoins);
        
        // FIRST WIN BONUS! 🎉
        if (window.totalGames === 0) {
            addCoins(100);
            showBonus('FIRST WIN BONUS! +100 💰', '🎉');
        }
        
        // Streak bonus multiplier
        if ((window.streak || 0) > 0) {
            showBonus(`STREAK x${(1 + Math.min(window.streak, 5) * 0.1).toFixed(1)}!`, '🔥');
        }
        
        // Add XP based on attempts (fewer attempts = more XP)
        const rewardXP = Math.max(75 - (attempts * 8), 20);
        addXP(rewardXP);
        
        // Update streak and check for streak bonuses
        window.streak = (window.streak || 0) + 1;
        
        // Streak milestone bonuses
        if (window.streak === 3) {
            addCoins(50);
            showBonus('3 STREAK BONUS! +50 💰', '🔥');
        } else if (window.streak === 5) {
            addCoins(100);
            showBonus('5 STREAK MILESTONE! +100 💰', '🔥');
        } else if (window.streak === 10) {
            addCoins(250);
            showBonus('10 STREAK MASTER! +250 💰', '👑');
        }
        
        // Check if new best score
        const isNewBest = attempts < window.bestScore;
        if (isNewBest) {
            window.bestScore = attempts;
            const highScoreBox = document.getElementById('highScoreBox');
            if (highScoreBox) {
                highScoreBox.style.display = 'block';
                const newBest = document.getElementById('newBestScore');
                if (newBest) newBest.textContent = `${attempts} tries! 🎉`;
            }
        }

        messageBox.innerHTML = `<div>🏆 CONGRATULATIONS! 🏆</div><div>You found ${randomNumber} in ${attempts} tries!</div>`;
        messageBox.className = 'message correct';
        const guessBtn = document.getElementById('guessBtn');
        const resetBtn = document.getElementById('resetBtn');
        if (guessBtn) guessBtn.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'block';
        input.disabled = true;
        gameOver = true;
        
        window.totalGames++;
        window.todayGames++;
        window.allScores.push(attempts);
        saveData();
        updateStats();
        updateTopBar();
        updateDifficultyInfo();
        checkAchievements();
    } else {
        window.streak = 0; // Reset streak on loss
        playSound('incorrect');
        const diff = Math.abs(guess - randomNumber);
        let tempMsg = '';
        
        if (diff < 3) {
            tempMsg = '🔥🔥🔥 BURNING HOT! 🔥🔥🔥';
        } else if (diff < 8) {
            tempMsg = '🔥 Very Hot! 🔥';
        } else if (diff < 15) {
            tempMsg = '🌡️ Warm';
        } else if (diff < 30) {
            tempMsg = '❄️ Cold';
        } else {
            tempMsg = '🥶 Freezing! 🥶';
        }

        if (guess > randomNumber) {
            messageBox.innerHTML = `<div>⬇️ SMALLER!</div><div>${tempMsg}</div>`;
            messageBox.className = 'message toohigh';
        } else {
            messageBox.innerHTML = `<div>⬆️ BIGGER!</div><div>${tempMsg}</div>`;
            messageBox.className = 'message toolow';
        }
    }

    updateTopBar();
    input.value = '';
    input.focus();
}

/* ===== KEYBOARD SUPPORT ===== */
function handleKeyPress(event) {
    if (event.key === 'Enter' && !gameOver) {
        checkGuess();
    }
}

/* ===== DIFFICULTY INFO ===== */
function updateDifficultyInfo() {
    const info = document.getElementById('difficultyInfo');
    if (!info) return;
    
    let difficulty = '';
    let stars = '';

    if (attempts <= 4) {
        difficulty = '🤯 ABSOLUTELY GENIUS!';
        stars = '⭐⭐⭐⭐⭐';
    } else if (attempts <= 6) {
        difficulty = '✨ INCREDIBLE!';
        stars = '⭐⭐⭐⭐';
    } else if (attempts <= 9) {
        difficulty = '👏 EXCELLENT!';
        stars = '⭐⭐⭐';
    } else if (attempts <= 13) {
        difficulty = '💪 GOOD JOB!';
        stars = '⭐⭐';
    } else {
        difficulty = '🎯 COMPLETED!';
        stars = '⭐';
    }

    info.innerHTML = `${difficulty}<div class="stars">${stars}</div>`;
}

/* ===== RESET GAME ===== */
function resetGame() {
    // Reset game variables
    gameRange = 100; // Reset range
    
    // Apply easier mode if owned
    if (window.purchasedItems.includes('easier-mode')) {
        gameRange = 50;
    }
    
    randomNumber = Math.floor(Math.random() * gameRange) + 1;
    attempts = 0;
    gameOver = false;
    guessHistory = [];
    activePowerUps = []; // Reset active power-ups
    
    // Add hint system to active power-ups if owned
    if (window.purchasedItems.includes('hint-system')) {
        activePowerUps.push('hint-system');
    }
    
    document.getElementById('attempts').textContent = '0';
    document.getElementById('guessInput').value = '';
    document.getElementById('guessInput').disabled = false;
    document.getElementById('message').textContent = '';
    document.getElementById('difficultyInfo').textContent = '';
    
    const highScoreBox = document.getElementById('highScoreBox');
    if (highScoreBox) highScoreBox.style.display = 'none';
    
    const guessBtn = document.getElementById('guessBtn');
    const resetBtn = document.getElementById('resetBtn');
    const hintBtn = document.getElementById('hintBtn');
    
    if (guessBtn) guessBtn.style.display = 'block';
    if (resetBtn) resetBtn.style.display = 'none';
    if (hintBtn) hintBtn.style.display = 'none'; // Hide until game is playing
    
    // Update range display if easier mode is active
    const rangeStat = document.querySelector('.stat-box:nth-child(2) .stat-value');
    if (rangeStat) rangeStat.textContent = `1-${gameRange}`;
    
    document.getElementById('guessInput').focus();
}

/* ===== MODAL CLOSE ON OUTSIDE CLICK ===== */
function closeModalOnClickOutside(event, modalId) {
    const modal = document.getElementById(modalId);
    if (event.target === modal) {
        modal.classList.remove('active');
    }
}

// Global click handlers for modals
document.addEventListener('click', function(event) {
    const shopModal = document.getElementById('shopModal');
    const achievementsModal = document.getElementById('achievementsModal');
    
    if (shopModal && event.target === shopModal) {
        closeShop();
    }
    if (achievementsModal && event.target === achievementsModal) {
        closeAchievements();
    }
});

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Game Loaded!');
    
    loadData();
    updateTopBar();
    document.getElementById('guessInput')?.focus();
    
    // Give starting bonus if first time
    if (window.totalGames === 0 && window.coins === 0) {
        window.coins = 50;
        saveData();
        updateTopBar();
    }
    
    // Setup modal close buttons
    const shopModal = document.getElementById('shopModal');
    const achievementsModal = document.getElementById('achievementsModal');
    
    if (shopModal) {
        console.log('✅ Shop Modal Found');
        switchTab('powerups'); // Default tab
    }
    
    if (achievementsModal) {
        console.log('✅ Achievements Modal Found');
    }
    
    // Make functions global so onclick works
    window.openShop = openShop;
    window.closeShop = closeShop;
    window.openAchievements = openAchievements;
    window.closeAchievements = closeAchievements;
    window.switchTab = switchTab;
    window.checkGuess = checkGuess;
    window.resetGame = resetGame;
    window.handleKeyPress = handleKeyPress;
    window.useHint = useHint;
    window.buyItem = buyItem;
    window.buyCosmetic = buyCosmetic;
});
