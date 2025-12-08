import SharedAddStudent from "@shared/AddStudent.shared";
import { useRouter } from "expo-router";
import React from "react";

export default function AdminAddStudentScreen() {
  const router = useRouter();

  return (
    <>
      <SharedAddStudent viewMode="admin" onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
