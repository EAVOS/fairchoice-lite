<!-- v13 fix copy and share -->
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FairChoice Lite</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: #ffffff;
            min-height: 100vh;
            padding: 16px;
        }
        #app { max-width: 400px; margin: 0 auto; }
        h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center; }
        .input-field {
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            border: none;
            margin: 8px 0;
            font-size: 16px;
            background: rgba(255,255,255,0.1);
            color: #fff;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.4); }
        textarea.input-field { resize: vertical; min-height: 60px; }
        .btn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin: 8px 0;
            transition: all 0.15s ease;
        }
        .btn:active { transform: scale(0.97); opacity: 0.85; }
        .btn-primary { background: #39ff14; color: #1a1a2e; }
        .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
        .btn-share { background: rgba(255,215,0,0.2); color: #ffd700; border: 1px solid rgba(255,215,0,0.3); }
        .poll-card { background: rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; margin: 8px 0; font-size: 16px; }
        .error-msg { color: #ff4444; text-align: center; padding: 8px; display: none; font-size: 14px; }
        .error-msg.show { display: block; }
        .voter-count { text-align: center; color: rgba(255,255,255,0.5); font-size: 14px; margin-top: 12px; }
        .hidden { display: none !important; }
    </style>
</head>
<body>
    <div id="app">
        <div id="home-screen">
            <h1>📊 FairChoice Lite v13</h1>
            <input type="text" id="question" class="input-field" placeholder="Что выбираем?">
            <textarea id="options" class="input-field" placeholder="Пицца, Суши, Бургер" rows="3"></textarea>
            <button class="btn btn-primary" id="create-btn">🚀 Быстрый выбор</button>
            <p id="error" class="error-msg"></p>
        </div>
        <div id="vote-screen" class="hidden">
            <h1 id="question-display"></h1>
            <div id="rankings"></div>
            <button class="btn btn-secondary" id="shuffle-btn">🎲 Перемешать</button>
            <button class="btn btn-primary" id="vote-btn">✅ Проголосовать</button>
        </div>
        <div id="results-screen" class="hidden">
            <h1>🏆 Результаты</h1>
            <div id="results-display"></div>
            <button class="btn btn-share" id="share-btn">📤 Поделиться</button>
            <button class="btn btn-secondary" id="new-poll-btn">🔄 Новый опрос</button>
        </div>
        <div id="loader" class="hidden" style="text-align:center;padding:40px;">
            <p style="color:rgba(255,255,255,0.6);">Загрузка...</p>
        </div>
    </div>
    <script>
    var GAS_URL = 'https://script.google.com/macros/s/AKfycbzhGa9stV7xabSoaujaEGtM6zq57Ndu_b0vxVX_O33gNshk1YuwEWBxE6hrwylZmhtKGQ/exec';
    var webApp = window.Telegram.WebApp;
    webApp.ready();
    webApp.expand();

    var currentPoll = null;
    var currentOptions = [];

    function getUserId() {
        var uid = webApp.initDataUnsafe && webApp.initDataUnsafe.user && webApp.initDataUnsafe.user.id;
        if (uid) return uid.toString();
        uid = localStorage.getItem('fc_user_id');
        if (!uid) {
            uid = 'anon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('fc_user_id', uid);
        }
        return uid;
    }

    var userId = getUserId();

    function showError(msg) {
        var e = document.getElementById('error');
        e.textContent = msg;
        e.classList.add('show');
        setTimeout(function() { e.classList.remove('show'); }, 3000);
    }

    function showScreen(id) {
        ['home-screen', 'vote-screen', 'results-screen', 'loader'].forEach(function(s) {
            document.getElementById(s).classList.add('hidden');
        });
        document.getElementById(id).classList.remove('hidden');
    }

    function createPoll() {
        var q = document.getElementById('question').value.trim();
        var r = document.getElementById('options').value.trim();
        if (!q || !r) { showError('Заполни оба поля'); return; }
        currentOptions = r.split(/[,\n]/).map(function(o) { return o.trim(); }).filter(function(o) { return o.length > 0; });
        if (currentOptions.length < 2) { showError('Нужно минимум 2 варианта'); return; }
        if (currentOptions.length > 3) {
            currentOptions = currentOptions.sort(function() { return Math.random() - 0.5; }).slice(0, 3);
        }
        document.getElementById('question-display').textContent = q;
        renderRankings();
        showScreen('vote-screen');
    }

    function renderRankings() {
        var c = document.getElementById('rankings');
        var medals = ['🥇', '🥈', '🥉'];
        c.innerHTML = currentOptions.map(function(o, i) {
            return '<div class="poll-card">' + (medals[i] || '') + ' ' + o + '</div>';
        }).join('');
    }

    function shuffle() {
        currentOptions = currentOptions.sort(function() { return Math.random() - 0.5; });
        renderRankings();
    }

    function submitVote() {
        var loader = document.getElementById('loader');
        var vote = document.getElementById('vote-screen');
        vote.classList.add('hidden');
        loader.classList.remove('hidden');
        var q = document.getElementById('question-display').textContent;
        var cb = 'fc_' + Date.now();

        window[cb] = function(data) {
            currentPoll = data;
            renderResults();
            loader.classList.add('hidden');
            showScreen('results-screen');
            delete window[cb];
        };

        var p = new URLSearchParams({
            action: 'createAndVote',
            question: q,
            options: JSON.stringify(currentOptions),
            userId: userId,
            rankings: JSON.stringify({ first: 0, second: 1, third: 2 }),
            callback: cb
        });

        var s = document.createElement('script');
        s.src = GAS_URL + '?' + p.toString();
        s.onerror = function() {
            loader.classList.add('hidden');
            vote.classList.remove('hidden');
            showError('Сервер перегружен. Попробуй через минуту.');
            delete window[cb];
        };
        document.head.appendChild(s);
    }

    function renderResults() {
        var c = document.getElementById('results-display');
        if (!currentPoll || !currentPoll.scores) { c.innerHTML = '<p>Нет результатов</p>'; return; }
        var sorted = Object.entries(currentPoll.scores).sort(function(a, b) { return b[1] - a[1]; });
        var medals = ['🥇', '🥈', '🥉'];
        c.innerHTML = sorted.map(function(e, i) {
            return '<div class="poll-card">' + (medals[i] || '') + ' ' + currentPoll.options[e[0]] + ' — <strong>' + e[1] + ' очков</strong></div>';
        }).join('');
        c.innerHTML += '<p class="voter-count">👥 Проголосовало: ' + (currentPoll.totalVoters || 0) + ' человек</p>';
    }

    function shareResults() {
        if (!currentPoll) return;
        var sorted = Object.entries(currentPoll.scores).sort(function(a, b) { return b[1] - a[1]; });
        var medals = ['🥇', '🥈', '🥉'];
        var text = sorted.map(function(e, i) {
            return (medals[i] || '') + ' ' + currentPoll.options[e[0]] + ' \u2014 ' + e[1] + ' \u043E\u0447\u043A\u043E\u0432';
        }).join('\n');
        var shareText = '\uD83D\uDDF3\uFE0F ' + currentPoll.question + '\n\n' + text + '\n\n\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u0430\u0442\u044C: t.me/FairChoiceBot';

        var ta = document.createElement('textarea');
        ta.value = shareText;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);

        webApp.showPopup({
            title: '\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E!',
            message: '\u0422\u0435\u043A\u0441\u0442 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D. \u041E\u0442\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0435\u0433\u043E \u0432 \u0447\u0430\u0442.',
            buttons: [{ type: 'ok' }]
        });
    }

    document.getElementById('create-btn').addEventListener('click', createPoll);
    document.getElementById('shuffle-btn').addEventListener('click', shuffle);
    document.getElementById('vote-btn').addEventListener('click', submitVote);
    document.getElementById('share-btn').addEventListener('click', shareResults);
    document.getElementById('new-poll-btn').addEventListener('click', function() { location.reload(); });
    </script>
</body>
</html>
