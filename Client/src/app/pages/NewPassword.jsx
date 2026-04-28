import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { resetPasswordWithToken } from "../services/api";

export default function NewPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      minLength: password.length >= 8,
      hasLetter: /[A-Za-z]/.test(password),
      hasNumber: /\d/.test(password),
    }),
    [password]
  );

  const isPasswordStrong =
    passwordChecks.minLength &&
    passwordChecks.hasLetter &&
    passwordChecks.hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or expired reset link.");
      return;
    }

    if (!password.trim()) {
      toast.error("Enter a new password.");
      return;
    }

    if (!isPasswordStrong) {
      toast.error("Password must be at least 8 characters with letters and numbers.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await resetPasswordWithToken(token, password);

      toast.success("Password reset successful");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  const Requirement = ({ met, children }) => (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2
        size={16}
        className={met ? "text-green-600" : "text-gray-300"}
      />
      <span className={met ? "text-green-700" : "text-gray-500"}>
        {children}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">
          Set New Password
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />

              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-gray-50 border rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Password requirements
            </p>

            <div className="space-y-1">
              <Requirement met={passwordChecks.minLength}>
                At least 8 characters
              </Requirement>
              <Requirement met={passwordChecks.hasLetter}>
                Contains a letter
              </Requirement>
              <Requirement met={passwordChecks.hasNumber}>
                Contains a number
              </Requirement>
              <Requirement
                met={
                  confirmPassword &&
                  password === confirmPassword &&
                  isPasswordStrong
                }
              >
                Passwords match
              </Requirement>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}