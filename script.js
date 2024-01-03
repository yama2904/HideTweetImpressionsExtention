// 非表示にしたID一覧
var hidedUserIds = new Array();

// ユーザIDを取得
function getUserId(element) {
    var spans = Array.from(element.getElementsByTagName("span"));
    var span = spans.filter(x => {
        return x.innerText.startsWith("@")
                && x.parentNode.parentNode.tagName.toLowerCase() === "a";
    })[0];

    return span.innerText;
}

// 認証済みアカウントであるか
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

// 自分のツイートを引用リツイートしているか
function isQuoteTweet(element, userId) {
    var spans = Array.from(element.getElementsByTagName("span"));
    var userIdSpans = spans.filter(x => {
        return x.innerText === userId;
    });

    return userIdSpans.length >= 2;
}

// 認証済みアカウント一覧取得
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

// インプ稼ぎを消す
function hideImpressions(parent, sourceId) {
    // ツイートに返信しているユーザID一覧
    var replyIds = new Array();

    // 認証済みアカウント一覧取得
    var authAccounts = getAuthAccounts(parent);

    // 認証済みアカウントが存在しない場合は処理終了
    if (authAccounts === undefined || authAccounts === null || authAccounts.length === 0) {
        return;
    }

    // 認証済みアカウント全てに対して処理を行う
    for (let i = 0; i < authAccounts.length; i++) {
        var authAccount = authAccounts[i];

        // 返信しているアカウントのユーザID取得
        var userId = getUserId(authAccount);

        // ツイート主と同じユーザはスキップ
        if (userId == sourceId) {
            continue;
        }

        // 自分のツイートを引用リツイートしている場合は非表示対象
        var hide = isQuoteTweet(authAccount, userId);

        // 同じユーザが2回以上返信しているか
        if (replyIds.indexOf(userId) === -1) {
            replyIds.push(userId);
        }
        else {
            // 2回以上返信しているユーザも非表示対象
            hide = true;
        }

        // 非表示IDリストに追加
        if (hide) {
            if (hidedUserIds.indexOf(userId) === -1) {
                hidedUserIds.push(userId);
                console.log(userId + "を非表示");
            }
        }
    }

    // 上記で取得した非表示IDリストを元に非表示実行
    for (let i = 0; i < authAccounts.length; i++) {
        var authAccount = authAccounts[i];
        
        // ユーザID取得
        var userId = getUserId(authAccount);

        // 非表示IDリストに存在するユーザの場合は非表示
        if (hidedUserIds.indexOf(userId) >= 0) {
            if (authAccount.style.display !== "none") {
                authAccount.style.display = "none";
            }
        }
    }
}

function main() {
    // HTMLの動的読み込みのラグを考慮するためにタイマーでループして処理する
    const jsInitCheckTimer = setInterval(jsLoaded, 500);

    function jsLoaded() {
        // sectionタグが取得できなかった場合は読み込みが未完了
        var section = document.getElementsByTagName("section")[0];
        if (section === undefined || section === null) {
            return;
        }

        // 読み込みが完了しているためタイマーを停止
        clearInterval(jsInitCheckTimer);

        // 返信欄の親要素
        var parent = section.getElementsByTagName("div")[0].getElementsByTagName("div")[0];

        // ツイート主のユーザID取得
        var sourceId = getUserId(parent.getElementsByTagName("div")[0]);
        
        // インプ稼ぎを消す
        hideImpressions(parent, sourceId);

        // スクロール等をして返信が増えた場合にも処理を行う
        const observer = new MutationObserver(() => hideImpressions(parent, sourceId));
        observer.observe(parent, {
            childList: true
        });
    }
}

// 現在開いているURL
var openingUrl;

// 画面遷移で検知するイベント
const observer = new MutationObserver(() => {
    // ツイートの詳細画面の場合は発火
    var url = location.href;
    if (url.match("(https://twitter.com/.+/status/.+|https://x.com/.+/status/.+)")) {
        if (url !== openingUrl) {
            main();
        }
    }

    // URL更新
    openingUrl = url;
});

// 全ての要素の変更を監視
observer.observe(document, {
    childList: true,
    subtree: true
});