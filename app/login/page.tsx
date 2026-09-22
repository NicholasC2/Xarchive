import "../peices/form.css"

export default function Login() {
    return (
        <form>
            <label>Username:</label>
            <input type="text" />
            <label>Password:</label>
            <input type="password" />
            <input type="submit" value="Log in" />
        </form>
    )
}