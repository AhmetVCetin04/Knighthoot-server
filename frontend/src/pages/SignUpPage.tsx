import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import SignUp from "../components/SignUp";
import '../styles.css'
import '../index.css';

function SignUpPage() {
  const navigate = useNavigate();
  const { userType } = useParams<{ userType: "student" | "teacher" }>();
  const resolved = userType === "teacher" ? "teacher" : "student";

  return (
    <SignUp
      userType={resolved}
      onNavigateToLogin={() => navigate("/login")}
    />
  );
}
export default SignUpPage;
