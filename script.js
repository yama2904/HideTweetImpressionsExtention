// 非表示にしたID一覧
var hidedUserIds = new Array();

// ユーザIDを取得
function getUserId(element) {
    var spans = Array.from(element.getElementsByTagName("span"));
    var span = spans.filter(x => {
        return x.innerText.startsWith("@")
                && x.parentNode.parentNode.tagName.toLowerCase() === "a";
    })[0];

    return span != null ? span.innerText : null;
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

// リプしている全てのIDを取得（重複は除去しない）
function getReplyIds(timelineParent) {
    // 戻り値初期化
    var ids = new Array();

    // リプ欄は2個目以降なのでlet i = 1;
    for (let i = 1; i < timelineParent.children.length; i++) {
        var id = getUserId(timelineParent.children[i]);
        if (id != null) {
            ids.push(id);
        }
    }

    return ids;
}

// ツイート主にリプされたID一覧を取得
function getRepliedbyTweeter(replyIds, tweeterId) {
    // 戻り値初期化
    var ids = new Array();

    // 1番目にリプはありえないのでlet i = 1;
    for (let i = 1; i < replyIds.length; i++) {
        // ツイート主のIDの場合は1つ前のIDがリプされた想定
        if (replyIds[i] === tweeterId && ids.indexOf(replyIds[i - 1]) === -1) {
            ids.push(replyIds[i - 1]);
        }
    }

    return ids;
}

// 自分のツイートを引用リツイートしているか
function isQuoteTweet(timelineParent, userId) {
    for (let i = 0; i < timelineParent.children.length; i++) {
        var spans = Array.from(timelineParent.children[i].getElementsByTagName("span"));
        var userIdSpans = spans.filter(x => {
            return x.innerText === userId;
        });
    }

    return userIdSpans.length >= 2;
}

// 指定したユーザを非表示
function hideUser(timelineParent, userId) {
    for (let i = 0; i < timelineParent.children.length; i++) {
        var child = timelineParent.children[i];
        if (userId === getUserId(child) && child.style.display !== "none") {
            child.style.display = "none";
        }
    }
}

// インプ稼ぎを消す
function hideImpressions(timelineParent, tweeterId) {
    /* 削除
    // 認証済みアカウント一覧取得
    var authAccounts = getAuthAccounts(timelineParent);

    // 認証済みアカウントが存在しない場合は処理終了
    if (authAccounts === undefined || authAccounts === null || authAccounts.length === 0) {
        return;
    }
    */

    // リプ欄のユーザ一覧取得
    var replyIds = getReplyIds(timelineParent);

    // ツイート主からリプされたID一覧取得
    var repliedIds = getRepliedbyTweeter(replyIds, tweeterId);

    // リプ欄の各ユーザに対して非表示チェック、非表示処理を実施
    for (let i = 0; i < replyIds.length; i++) {
        var id = replyIds[i];
        
        // ツイート主からリプされたIDの場合は無条件でOK
        if (repliedIds.indexOf(id) >= 0) continue;

        // ツイート主と同じユーザはスキップ
        if (id == tweeterId) {
            continue;
        }

        // 自分のツイートを引用リツイートしている場合は非表示対象
        var hide = isQuoteTweet(timelineParent, id);

        // 2回以上返信している場合は非表示対象
        var count = replyIds.reduce((acc, value) => value === id ? acc + 1 : acc, 0);
        if (count >= 2) {
            hide = true;
        }

        // 非表示実行
        if (hide) {
            hideUser(timelineParent, id);

            // 非表示済みリストに追加、ログ出力
            if (hidedUserIds.indexOf(id) === -1) {
                hidedUserIds.push(id);
                console.log(id + "を非表示");
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

        // タイムラインの親要素
        var timelineParent = section.getElementsByTagName("div")[0].getElementsByTagName("div")[0];

        // ツイート主のユーザID取得
        var tweeterId = getUserId(timelineParent.getElementsByTagName("div")[0]);
        
        // インプ稼ぎを消す
        hideImpressions(timelineParent, tweeterId);

        // スクロール等をして返信が増えた場合にも処理を行う
        const observer = new MutationObserver(() => hideImpressions(timelineParent, tweeterId));
        observer.observe(timelineParent, {
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