import SharedAddClasses from "@shared/AddClasses.shared";
import { useRouter } from "expo-router";
import React from "react";

export default function ManagerAddClassesScreen() {
  const router = useRouter();

  return <SharedAddClasses viewMode="manager" onBack={() => router.back()} onSuccess={() => router.back()} />;
}
