import { auth } from "@/lib/auth/server";
import LogoutButton from "./LogoutButton";

export default async function AccountPage() {
    const session = await auth.getSession();
    const user = session.data?.user;

    return (
        <>
            <div className="flex flex-column flex-1">
                {user ? (
                    <>
                        <p>{user.name}</p>
                        <p>{user.email}</p>
                    </>
                ) : (
                    <p>Not signed in</p>
                )}
            </div>

            <LogoutButton />
        </>
    );
}
