import React from "react";
import "../styles//MyQuizzes.css";
import MyQuizzes from "../components/MyQuizzes";

export default function MyQuizzesPage() {
  const quizzes = [
    { id: "1", title: "Quiz 1", questions: 2, createdAt: "2025-11-01" },
    { id: "2", title: "Quiz 2", questions: 3, createdAt: "2025-11-01" },
  ];

  return (
    <MyQuizzes
      quizzes={quizzes}
      onCreate={() => console.log("Create")}
      onEdit={(id) => console.log("Edit", id)}
      onDuplicate={(id) => console.log("Duplicate", id)}
      onDelete={(id) => console.log("Delete", id)}
    />
  );
}
