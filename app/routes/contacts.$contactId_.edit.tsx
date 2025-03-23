/// _をつけることで contacts.$contactId.tsxの内部でネストされないことを示す
import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {Form, useLoaderData, useNavigate} from "@remix-run/react";
import invariant from "tiny-invariant";


import {getContact, updateContact} from "../data";

// JavaScriptがない場合、formが送信されるとブラウザはFormDataを作成し、それをサーバーに送信する
// Remixhあそれを防ぎ、FormDataを含むリクエストをactionk関数に送信する
export const action = async ({
    params,
    request,
}: ActionFunctionArgs) => {
    invariant(params.contactId, "Missing contactId param");
    const formData = await request.formData();
    // 各フィールドには↓の方法でアクセスできる
    const firstName = formData.get("first");
    const lastName = formData.get("last");
    const updates = Object.fromEntries(formData);
    updates.first; // "Some"
    updates.last; // "Name"
    await updateContact(params.contactId, updates);
    // redirectしている
    // 純粋なHTMLでは、client side routingがなければ、POSTリクエストのあとサーバーがリダイレクトすると、新しいページが最新のデータを取得してレンダリングする
    // Remixは同様に、action関数が終了した後にデータを再検証する
    // そのため、このアプリではsidebarが反映された
    // javascriptがない場合、redirectは通常通りだが、今回はclient side redirectなのでスクロールの位置やコンポーネントの状態などのクライアントの情報を保持する
    return redirect(`/contacts/${params.contactId}`);
};

export const loader = async ({
    params,
}: LoaderFunctionArgs) => {
    invariant(params.contactId, "Missing contactId param");
    const contact = await getContact(params.contactId);
    if (!contact) {
        throw new Response("Not Found", {status: 404});
    }
    return json({contact});
};

export default function EditContact() {
    const {contact} = useLoaderData<typeof loader>();
    const navigate = useNavigate();

    return (
        <Form key={contact.id} id="contact-form" method="post">
            <p>
                <span>Name</span>
                <input
                    aria-label="First name"
                    defaultValue={contact.first}
                    name="first"
                    placeholder="First"
                    type="text"
                />
                <input
                    aria-label="Last name"
                    defaultValue={contact.last}
                    name="last"
                    placeholder="Last"
                    type="text"
                />
            </p>
            <label>
                <span>Twitter</span>
                <input
                    defaultValue={contact.twitter}
                    name="twitter"
                    placeholder="@jack"
                    type="text"
                />
            </label>
            <label>
                <span>Avatar URL</span>
                <input
                    aria-label="Avatar URL"
                    defaultValue={contact.avatar}
                    name="avatar"
                    placeholder="https://example.com/avatar.jpg"
                    type="text"
                />
            </label>
            <label>
                <span>Notes</span>
                <textarea
                    defaultValue={contact.notes}
                    name="notes"
                    rows={6}
                />
            </label>
            <p>
                <button type="submit">Save</button>
                { /* navigate(-1)でブラウザの履歴が一つ戻される */ }
                {/* type=buttonだと、buttonがformを送信しないため、event.preventDefault()が必要ない */}
                <button onClick={() => navigate(-1)} type="button">Cancel</button>
            </p>
        </Form>
    );
}
