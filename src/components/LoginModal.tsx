import React from "react";
import { X, Mail, Lock, User, ShieldCheck, Chrome } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, token: string) => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [isRegister, setIsRegister] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        // Create user in firebase auth
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const firebaseUser = userCredential.user;

        // Update profile display name
        await updateProfile(firebaseUser, { displayName: name.trim() });

        // Create doc in firestore 'users' collection
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userData = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          profilePhoto: "",
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, userData);

        // Auto log in user and invoke onSuccess
        onSuccess(
          {
            id: firebaseUser.uid,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            createdAt: userData.createdAt
          },
          firebaseUser.uid
        );
        onClose();
      } else {
        // Sign in user in firebase auth
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const firebaseUser = userCredential.user;

        // Provide standard local object back to App.tsx
        onSuccess(
          {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "TruthLens Auditor",
            email: firebaseUser.email,
            createdAt: new Date().toISOString()
          },
          firebaseUser.uid
        );
        onClose();
      }
    } catch (err: any) {
      console.error("Auth process error:", err);
      let errMsg = err.message || "Failed to process request";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "This email address is already in use.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Password must be at least 6 characters long.";
      } else if (err.code === "auth/invalid-credential") {
        errMsg = "Incorrect email address or password.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Invalid email format.";
      } else if (err.code === "auth/popup-closed-by-user") {
        errMsg = "Sign-in popup closed before completion.";
      } else if (err.code === "auth/cancelled-popup-request") {
        errMsg = "Sign-in popup cancelled.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Create doc in firestore 'users' collection if not exists
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let profileData = userDocSnap.exists() ? userDocSnap.data() : null;
      if (!profileData) {
        profileData = {
          name: firebaseUser.displayName || "TruthLens Auditor",
          email: firebaseUser.email || "",
          profilePhoto: firebaseUser.photoURL || "",
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, profileData);
      }

      onSuccess(
        {
          id: firebaseUser.uid,
          name: profileData.name,
          email: profileData.email,
          createdAt: profileData.createdAt
        },
        firebaseUser.uid
      );
      onClose();
    } catch (err: any) {
      console.error("Google login error:", err);
      let errMsg = err.message || "Failed to sign in with Google";
      if (err.code === "auth/popup-closed-by-user") {
        errMsg = "Sign-in popup closed before completion.";
      } else if (err.code === "auth/cancelled-popup-request") {
        errMsg = "Sign-in popup cancelled.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" id="login-modal">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isRegister ? "Create TruthLens Account" : "Access AI Verification"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isRegister ? "Join TruthLens AI to track, save, and favorite reports" : "Log in to unlock saved reports and customized AI insights"}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className={`p-3 text-xs font-medium rounded-lg mb-4 text-center ${error.includes("complete") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm transition-all focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm transition-all focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm transition-all focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 font-semibold text-white rounded-xl shadow-md shadow-blue-500/10 active:scale-98 text-sm transition-all flex items-center justify-center gap-1 cursor-pointer disabled:bg-blue-400"
          >
            {loading ? "Authenticating..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500 font-bold">Or continue with</span>
          </div>
        </div>

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 font-bold text-slate-700 rounded-xl shadow-sm active:scale-[0.98] text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Chrome className="w-4 h-4 text-rose-500 shrink-0" />
          <span>Continue with Google</span>
        </button>

        {/* Footer Toggle */}
        <div className="text-center mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {isRegister ? "Already have an account?" : "New to TruthLens AI?"}{" "}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isRegister ? "Login here" : "Sign up and build report logs"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
