/*
# 注意点

## HTMLはFirefoxで開きましょう

CORS(Cross-Origin Resource Sharing)問題があるのでChromeなどで開きたい場合はセキュリティを無効化させましょう．
実際にサーバに置く場合，HTTPリクエストヘッダに内容を追加すれば回避できます．

## このファイルを変更してもcontents.htmlの表示は変わりません

contents.htmlはこのファイルを読み込んでおらずmain.min.jsを読み込んでいます．
main.min.jsはこのmain.jsxをBabel CLIを使いトランスコンパイルしたものです．
もし，このファイルを変更してチェックしたいのであれば，main.min.jsを読み込まず
このmain.jsxと，"js/babel.min.js"またはJSXTransformerを一緒に読み込んでください．
babel.min.jsの使い方: https://github.com/babel/babel-standalone

## APIキーについて

Appクラスのconstructor内のthis.state.keyにYouTube Data APIのキーを入力してください．
*/

// Appコンポーネント
class App extends React.Component {
  // ステートの初期化
  constructor(props) {
    super(props);
    this.state = {
      api: "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video",
      channel: "UCRYoWNgkS4KA4BQfAjfxNIg",
      key: "",
      list1_option: {
        maxResults: 3,
        order: "viewCount",
      },
      list2_option: {
        maxResults: 12,
        order: "date",
      }
    }
  }

  // 出力に関するメソッド
  render() {
    const url1 = this.state.api + "&maxResults=" + this.state.list1_option.maxResults + "&order=" + this.state.list1_option.order + "&channelId=" + this.state.channel + "&key=" + this.state.key;
    const url2 = this.state.api + "&maxResults=" + this.state.list2_option.maxResults + "&channelId=" + this.state.channel + "&key=" + this.state.key;

    return(
      <article>
        <section id="popularVideoList">
          <h2>人気の動画</h2>
          <List1 url={url1} />
          {/* List1は人気の動画のリスト */}
        </section>
        <section id="allVideoList">
          <h2>すべての動画</h2>
          <List2 url={url2} option={this.state.list2_option} />
          {/* List2はすべての動画のリスト，フィルタ機能を持っています． */}
        </section>
      </article>
    );
  }
}

// List1コンポーネント
class List1 extends React.Component {
  constructor(props) {
    super(props);
    this.state = ({
      data: [],
      loaded: false,
    });
  }

  componentDidMount() {
    // YouTube Data APIから情報を取得し，data[]に入れます．
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      crossDomain: true,
      cache: false,
    })
    .then(
      (data) => {
        this.setState({
          data: data,
          loaded: true,
        });
      }
    );
  }

  render() {
    return(
      this.state.loaded ? <Cards data={this.state.data} /> : <p>読み込み中です…</p>
    );
  }
}

// List2コンポーネント
class List2 extends React.Component {
  constructor(props) {
    super(props);
    // page -> 今のページ番号, q -> 検索キーワード
    // prev -> YouTube Data APIのprevPageToken, next -> nextPageToken
    this.state = ({
      url: this.props.url + "&order=" + this.props.option.order,
      order: this.props.option.order,
      data: [],
      loaded: false,
      page: 0,
      q: null,
      prev: null,
      next: null,
    });
    // 子コンポーネントからステートを変更するためのバインド
    this.changeList = this.changeList.bind(this);
    this.changeQ = this.changeQ.bind(this);
    this.changeOrder = this.changeOrder.bind(this);
    this.changePage = this.changePage.bind(this);
  }

  componentDidMount() {
    $.ajax({
      url: this.props.url + "&order=" + this.props.option.order,
      dataType: 'json',
      crossDomain: true,
      cache: false,
    })
    .then(
      (data) => {
        this.state.data = data;
        this.state.prev = (typeof(this.state.data.prevPageToken)!="undefined" ? this.state.data.prevPageToken : null);
        if(typeof(this.state.data.nextPageToken)!="undefined") {
          // YouTube Data APIのよくわからない仕様なのですが，
          // 次のページがないのにPageTokenが発行されることがありました．
          // そのため表示数以下のitemsが返ってきたときnextPageTokenを
          // nullにすることにしました．
          if(this.state.data.items.length == this.props.option.maxResults) {
            this.state.next = this.state.data.nextPageToken;
          } else {
            this.state.next = null;
          }
        } else {
          this.state.next = null;
        }
        this.setState({
          loaded: true,
        });
      }
    );
  }

  // 指定されたURLのデータを取得してdataに格納．
  changeList(URL) {
    $.ajax({
      url: URL,
      dataType: 'json',
      crossDomain: true,
      cache: false,
    })
    .then(
      (data) => {
        this.state.data = data;
        this.state.prev = (typeof(this.state.data.prevPageToken)!="undefined" ? this.state.data.prevPageToken : null);
        if(typeof(this.state.data.nextPageToken)!="undefined") {
          if(this.state.data.items.length == this.props.option.maxResults) {
            this.state.next = this.state.data.nextPageToken;
          } else {
            this.state.next = null;
          }
        } else {
          this.state.next = null;
        }
        this.setState({
          loaded: true,
        });
      },
      // エラーのときステートを初期値に戻す．
      () => {
        this.setState({
          loaded: false,
          page: 0,
          prev: null,
          next: null,
        });
      }
    );
  }

  // 子コンポーネントからのステートの変更をもとにステートのURLを変更する．
  changeURL() {
    this.state.url = this.props.url + "&order=" + this.state.order;
    // キーワードが入力されていないときqのないURLを作る．
    if(this.state.q != null) {
      this.state.url = this.state.url + "&q=" + this.state.q;
    }
    // ページを初期値にリセット．
    this.state.page = 0;
    this.changeList(this.state.url);
  }

  // 子コンポーネントからステートのキューを変更する．
  changeQ(q) {
    this.state.q = q;
    this.changeURL();
  }

  // 子コンポーネントからステートのオーダーを変更する．
  changeOrder(order) {
    this.state.order = order;
    this.changeURL();
  }

  // 子コンポーネントからステートのページを変更する．
  changePage(direction) {
    let URL;

    if(direction=="prev") {
      URL = this.state.url + "&pageToken=" + this.state.prev;
      this.state.page--;
    } else if(direction=="next") {
      URL = this.state.url + "&pageToken=" + this.state.next;
      this.state.page++;
    } else {
      URL = this.state.url;
      this.state.page = 0;
    }

    this.changeList(URL);
  }

  render() {
    // ステートのdataに入れるまでに先にrenderメソッドが実行されるため，if文を使用．
    if(this.state.loaded) {
      return(
        <div>
          <h3>フィルタ</h3>
          <SearchBox changeQ={this.changeQ} />
          <SelectMenu order={this.state.order} changeOrder={this.changeOrder} />
          <h3>一覧</h3>
          <Cards data={this.state.data} />
          <Page page={this.state.page} prev={this.state.prev} next={this.state.next} changePage={this.changePage} />
        </div>
      );
    } else {
      return (
        <p>読み込み中です…</p>
      );
    }
  }
}

// 検索ボックスのコンポーネント
class SearchBox extends React.Component {
  changeKeyword(e) {
    // ボタンをクリックしたときにページがリロードされるのを回避します．
    e.preventDefault();
    let keyword = e.target.elements[0].value;

    // キーワードがないときkeywordをnullにします．
    if(keyword=="") {
      keyword = null;
    }

    // 親コンポーネントでステートのURLとqを変更します．
    // のでそのままです．
    this.props.changeQ(keyword);
  }

  // アロー関数について．
  // https://qiita.com/mejileben/items/69e5facdb60781927929
  render() {
    return(
      <div id="searchBox" className="d-flex align-items-center">
        <p className="align-self-center">検索:</p>
        <form className="input-group flex-grow-1" onSubmit={(e) => this.changeKeyword(e)}>
          <input type="text" className="form-control" placeholder="検索キーワードを入力してください" aria-label="search" aria-describedby="basic-addon2" />
          <div className="input-group-append">
            <button className="btn btn-outline-secondary" type="submit">検索</button>
          </div>
        </form>
      </div>
    );
  }
}

// ソートのコンポーネント
class SelectMenu extends React.Component {
  changeValue(e) {
    // 親コンポーネントでステートのオーダーとURLを変更します．
    this.props.changeOrder(e.target.value);
  }

  render() {
    return(
      <div id="selectMenu" className="d-flex align-items-center" value={this.props.order}>
        <p className="align-self-center">ソート:</p>
        <select className="custom-select flex-grow-1" onChange={(e) => this.changeValue(e)}>
          <option value="date">アップロード日順</option>
          <option value="rating">レート順</option>
          <option value="viewCount">再生回数順</option>
        </select>
      </div>
    );
  }
}

// カードを表示するコンポーネント
class Cards extends React.Component {
  // renderの書き方一覧
  // https://www.yoheim.net/blog.php?q=20180409
  render() {
    // JavaScriptでmapの速度について．
    // https://qiita.com/itagakishintaro/items/29e301f3125760b81302
    let cards = this.props.data.items.map((item, index) => {
      // 動画説明文のMCSのリンク集を削除して変数descriptionに格納します．
      let val = item.snippet.description.indexOf("--");
      let description = (val!=-1 ? item.snippet.description.slice(0, val) : item.snippet.description);
      // APIの時刻情報を日本の表示に変換して変数dtに格納します．
      let dt_tmp = new Date(item.snippet.publishedAt);
      let dt = dt_tmp.getFullYear()+"年"+(dt_tmp.getMonth()+1)+"月"+dt_tmp.getDate()+"日";
      return(
        <div className="card" key={index}>
          <a href={"https://youtu.be/"+item.id.videoId}><img className="card-img-top" src={item.snippet.thumbnails.medium.url} alt="thumbnail" /></a>
          <div className="card-body">
            <a href={"https://youtu.be/"+item.id.videoId}><h4>{item.snippet.title}</h4></a>
            <p className="card-text">{description}</p>
            <p className="card-text"><small className="text-muted">{dt}</small></p>
          </div>
        </div>
      );
    });
    return(
      <div className="card-columns">
        {cards}
      </div>
    );
  }
}

// ページの切り替えボタンのコンポーネントです．
class Page extends React.Component {
  changePage(direction, e) {
    // 見出しのトップまで戻るアニメーションです．
    $("html,body").animate({scrollTop:$("#allVideoList").offset().top - 10});

    // 親コンポーネントでステートのpageを変更します．
    this.props.changePage(direction);
  }

  render() {
    return(
      <div id="pageChanger" className="d-flex flex-row justify-content-between">
        {/* 戻るボタン */}
        <button type="button" id="prevButton" className="btn btn-outline-secondary" style={{visibility: this.props.prev!=null ? 'visible' : 'hidden' }} onClick={(e) => this.changePage("prev", e)}>戻る</button>
        {/* はじめのページへ戻るボタン */}
        <button type="button" id="resetButton" className="btn btn-outline-dark" style={{visibility: this.props.page!=0 ? 'visible' : 'hidden' }} onClick={(e) => this.changePage("top", e)}>最初のページ</button>
        {/* 次へボタン */}
        <button type="button" id="nextButton" className="btn btn-outline-primary" style={{visibility: this.props.next!=null ? 'visible' : 'hidden' }} onClick={(e) => this.changePage("next", e)}>次へ</button>
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
);
