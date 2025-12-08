import SharedAddStudent from "@shared/AddStudent.shared";
import { useRouter } from "expo-router";
import React from "react";

export default function ManagerAddStudentScreen() {
  const router = useRouter();

  return (
    <>
      <SharedAddStudent viewMode="manager" onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
