// app/root.tsxはUIで最初に表示されるコンポーネント
import {useEffect} from "react";
import {json, redirect} from "@remix-run/node";
import {
    Form,
    Link,
    Links,
    Meta,
    NavLink,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
    useNavigation,
    useSubmit,
} from "@remix-run/react";

// cssの読み込み
import type {LinksFunction, LoaderFunctionArgs} from "@remix-run/node";
import appStylesHref from "./app.css?url";
// every routeはlink関数をexportできるが、それらは集められてapp/root.tsxの <Links/> 内でrenderされる
export const links: LinksFunction = () => [
    {rel: "stylesheet", href: appStylesHref},
];

import {createEmptyContact, getContacts} from "./data";

// web semanticsでは、POSTリクエストを送信するとデータが変更されることを意味する
// Remixもそれに従い、action終了後にページ上のデータを自動的に再検証するヒントとしてactionを使う
export const action = async () => {
    const contact = await createEmptyContact();
    return redirect(`/contacts/${contact.id}/edit`);
    //return json({contact});
};



// URL parameterを引数として受け取ることができる
// 今回は、contactsのリストを取得するためのloaderなので、引数はなし
//export const loader = async () => {
//    const contacts = await getContacts();
//    return json({contacts});
//};


// 検索フォームに入力された値を取得するために、引数を受け取る
// Formがmethod="post"ではないため、FormDataではなくURLSearchParamsにデータを入れている
// 同様に、POSTではなくGETなので、action関数を呼ばない
export const loader = async ({
    request,
}: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const contacts = await getContacts(q);
    // qも返すことで、検索フォームに入力された値を保持する
    // qを返すことで、ページをリロードしても検索フォームに入力された値が保持される
    // 言い換えるとqを返さないと、リロードした時した時、sidebarのリストはフィルターされているのに、検索フォームには何も文字が表示されていない状態になる
    return json({contacts, q});
};


export default function App() {
    const {contacts, q} = useLoaderData<typeof loader>();
    // useNavigationは、現在の状態を"idle", "loading", "submitting"のどれかで返す
    const navigation = useNavigation();
    const submit = useSubmit();

    
    // 何も起きていない状態では、 navigate.location は undefined になる
    const searching = navigation.location &&
        new URLSearchParams(navigation.location.search).has("q");

    // 検索フォームに入力して検索した後に、Backボタンを押すと、検索フォームに入力した値が保持されているのに、sidebarのリストがフィルターされていない
    // これを解決するために、useEffectを使って、検索フォームに入力された値を保持する
    useEffect(() => {
        const searchField = document.getElementById("q");
        if (searchField instanceof HTMLInputElement) {
            searchField.value = q || "";
        }
    }, [q]);

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body>
                <div id="sidebar">
                    <h1>Remix Contacts</h1>
                    <div>
                        {/* FormはclassicalなHTMLではlinkと同じようにURLの遷移ができる他にも、GET/POSTを選んだりrequest bodyを変更できる */}
                        {/* Remixでも同様に、serverにリクエストを送る代わりにrouteのaction関数へ送信する */}
                        <Form id="search-form"
                            onChange={(event) => {
                                /// 文字を入力するたびに履歴に追加されたら困るので、最初の検索の時だけreplaceをfalseにする
                                const isFirstSearch = q === null;
                                // 文字を入力するたびにsubmitする
                                // event.currentTargetはFormについているDOMノード
                                submit(event.currentTarget, {replace: !isFirstSearch})
                            }}
                            role="search">
                            <input
                                id="q"
                                aria-label="Search contacts"
                                className={searching ? "loading" : ""}
                                defaultValue={q || ""}
                                placeholder="Search"
                                type="search"
                                name="q"
                            />
                            <div id="search-spinner" aria-hidden hidden={!searching} />
                        </Form>
                        <Form method="post">
                            <button type="submit">New</button>
                        </Form>
                    </div>
                    <nav>
                        {contacts.length ? (
                            <ul>
                                {contacts.map((contact) => (
                                    <li key={contact.id}>
                                        {/* toで指定したURLにいる時にisActiveはTrueになり、データをロード中の時はisPendingがTrueになる */}
                                        <NavLink
                                            className={({isActive, isPending}) =>
                                                isActive
                                                    ? "active"
                                                    : isPending
                                                        ? "pending"
                                                        : ""
                                            }
                                            to={`contacts/${contact.id}`}
                                        >
                                            <Link to={`contacts/${contact.id}`}>
                                                {contact.first || contact.last ? (
                                                    <>
                                                        {contact.first} {contact.last}
                                                    </>
                                                ) : (
                                                    <i>No Name</i>
                                                )}{" "}
                                                {contact.favorite ? (
                                                    <span>★</span>
                                                ) : null}
                                            </Link>
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>
                                <i>No contacts</i>
                            </p>
                        )}
                    </nav>
                </div>
                {/* classNameにloading}を追加することでCSSでいい感じに表現してくれる */}
                <div
                    className={
                        navigation.state === "loading" && !searching ? "loading" : ""
                    }
                    id="detail">
                    <Outlet />
                </div>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}
