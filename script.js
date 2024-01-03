var hidedUserIds = new Array();

function getUserId(element) {
    var spans = Array.from(element.getElementsByTagName("span"));
    var span = spans.filter(x => {
        return x.innerText.startsWith("@")
                && x.parentNode.parentNode.tagName.toLowerCase() === "a";
    })[0];

    return span.innerText;
}

function isAuthAccount(element) {
    var svgs = Array.from(element.getElementsByTagName("svg"));
    var svg = svgs.find(x => {
        if (x.hasAttribute("aria-label") && x.getAttribute("aria-label") === "認証済みアカウント") {
            var gTag = x.children[0];
            if (gTag !== undefined && gTag !== null) {
                var pathTag = gTag.children[0];
                if (pathTag !== undefined && pathTag !== null) {
                    return gTag.tagName.toLowerCase() === "g" && pathTag.tagName.toLowerCase() === "path";
                }
            }
        }
    });

    return svg !== undefined && svg !== null;
}

function isQuoteTweet(element, userId) {
    var spans = Array.from(element.getElementsByTagName("span"));
    var userIdSpans = spans.filter(x => {
        return x.innerText === userId;
    });

    return userIdSpans.length >= 2;
}

function getAuthAccounts(parent) {
    var authAccounts = new Array();
    for (let i = 1; i < parent.children.length; i++) {
        var account = parent.children[i];
        if (isAuthAccount(account)) {
            authAccounts.push(account);
        }
    }

    return authAccounts;
}

function hideImpressions(parent, sourceId) {
    var replyIds = new Array();
    var authAccounts = getAuthAccounts(parent);

    if (authAccounts === undefined || authAccounts === null || authAccounts.length === 0) {
        return;
    }

    for (let i = 0; i < authAccounts.length; i++) {
        var authAccount = authAccounts[i];
        var userId = getUserId(authAccount);
        if (userId == sourceId) {
            continue;
        }

        var hide = isQuoteTweet(authAccount, userId);

        if (replyIds.indexOf(userId) === -1) {
            replyIds.push(userId);
        }
        else {
            hide = true;
        }

        if (hide) {
            if (hidedUserIds.indexOf(userId) === -1) {
                hidedUserIds.push(userId);
                console.log(userId + "を非表示");
            }
        }
    }

    for (let i = 0; i < authAccounts.length; i++) {
        var authAccount = authAccounts[i];
        var userId = getUserId(authAccount);
        if (hidedUserIds.indexOf(userId) >= 0) {
            if (authAccount.style.display !== "none") {
                authAccount.style.display = "none";
            }
        }
    }
}

function main() {
    const jsInitCheckTimer = setInterval(jsLoaded, 500);

    function jsLoaded() {
        var root = document.getElementsByTagName("main")[0];
        if (root === undefined || root === null) {
            return;
        }

        var section = root.getElementsByTagName("section")[0];
        if (section === undefined || section === null) {
            return;
        }

        clearInterval(jsInitCheckTimer);

        // ツイート主
        var parent = section.getElementsByTagName("div")[0].getElementsByTagName("div")[0];
        var sourceId = getUserId(parent.getElementsByTagName("div")[0]);
        
        hideImpressions(parent, sourceId);

        const observer = new MutationObserver(() => hideImpressions(parent, sourceId));

        observer.observe(parent, {
            childList: true
        });
    }
}

window.addEventListener("load", main, false);