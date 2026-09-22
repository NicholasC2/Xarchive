import "../peices/form.css"

export default function Login() {
    return (
        <form>
            <label>Username:</label>
            <input type="text" />
            <label>Email:</label>
            <input type="email" />
            <label>Password:</label>
            <input type="password" />
            <label>Confirm Password:</label>
            <input type="password" />
            <input type="submit" value="Sign Up" />
        </form>
    )
}