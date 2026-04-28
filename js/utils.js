// Вспомогательные функции
window.FC_UTILS = (function() {
    var loaderInterval = null;
    
    function getUserId() {
        var webApp = getWebApp();
        var uid = webApp.initDataUnsafe && webApp.initDataUnsafe.user && webApp.initDataUnsafe.user.id;
        if (uid) return uid.toString();
        uid = localStorage.getItem('fc_user_id');
        if (!uid) {
            uid = 'anon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('fc_user_id', uid);
        }
        return uid;
    }
    
    function getWebApp() {
        try {
            return window.Telegram.WebApp;
        } catch(e) {
            return {
                initDataUnsafe: {},
                ready: function(){},
                expand: function(){},
                openTelegramLink: function(url){ window.open(url, '_blank'); },
                openLink: function(url){ window.open(url, '_blank'); },
                showPopup: function(opts){ alert(opts.message || ''); },
                switchInlineQuery: function(query, chatTypes) {
                    window.open('https://t.me/' + FC_CONFIG.BOT_USERNAME + '?start=share', '_blank');
                }
            };
        }
    }
    
    function showMessage(type, msg) {
        var el = document.getElementById(type);
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        setTimeout(function() { el.classList.remove('show'); }, 4000);
    }
    
    function showError(msg) { showMessage('error', msg); }
    function showSuccess(msg) { showMessage('success', msg); }
    
    function showScreen(id) {
        ['home-screen', 'created-screen', 'vote-screen', 'results-screen', 'loader'].forEach(function(s) {
            var el = document.getElementById(s);
            if (el) el.classList.add('hidden');
        });
        var target = document.getElementById(id);
        if (target) target.classList.remove('hidden');
        
        if (id !== 'loader' && loaderInterval) {
            clearInterval(loaderInterval);
            loaderInterval = null;
        }
    }
    
    function showLoader() {
        showScreen('loader');
        var dots = document.getElementById('loader-dots');
        if (dots) {
            var count = 0;
            if (loaderInterval) clearInterval(loaderInterval);
            loaderInterval = setInterval(function() {
                count = (count + 1) % 4;
                dots.textContent = '.'.repeat(count);
            }, 500);
        }
    }
    
    function jsonp(url, callback) {
        var cbName = 'fc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        
        window[cbName] = function(data) {
            callback(null, data);
            delete window[cbName];
        };
        
        var separator = url.indexOf('?') === -1 ? '?' : '&';
        var scriptUrl = url + separator + 'callback=' + cbName;
        
        var script = document.createElement('script');
        script.src = scriptUrl;
        script.onerror = function() {
            callback(new Error('Network error'), null);
            delete window[cbName];
            document.head.removeChild(script);
        };
        document.head.appendChild(script);
    }
    
    return {
        getUserId: getUserId,
        getWebApp: getWebApp,
        showError: showError,
        showSuccess: showSuccess,
        showScreen: showScreen,
        showLoader: showLoader,
        jsonp: jsonp
    };
})();
