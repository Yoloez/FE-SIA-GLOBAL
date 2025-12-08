import SharedAddSubject from "@shared/AddSubjects.shared";
import { useRouter } from "expo-router";
import React from "react";

export default function ManagerAddSubjectScreen() {
  const router = useRouter();

  return <SharedAddSubject viewMode="manager" onBack={() => router.back()} onSuccess={() => router.back()} />;
}
