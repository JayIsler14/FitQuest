import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPasswordWithToken } from "../services/api";

export default function NewPassword() {

    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("Submitting password reset");
        console.log("Token:", token);
        console.log("Password:", password);

        await resetPasswordWithToken(token, password);

        alert("Password reset successful");

        navigate("/login");
    };

    return (
        <form onSubmit={handleSubmit}>

            <h2>Set New Password</h2>

            <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">
                Reset Password
            </button>

        </form>
    );
}