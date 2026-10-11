import { auth } from "@/lib/auth/server";
import "../peices/options-list.css"

export default async function AccountPage() {
    const session = await auth.getSession();
    const user = session.data?.user;

    return (
        <>
            <div className="options-list">
                {user ? (
                    <>
                        <div>
                            <b>Username:</b>
                            <p>{user.name}</p>
                        </div>
                        <div>
                            <b>Email:</b>
                            <p>{user.email}</p>
                        </div>
                    </>
                ) : (
                    <p>Not signed in</p>
                )}
            </div>
        </>
    );
}
