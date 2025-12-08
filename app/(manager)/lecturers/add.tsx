import SharedAddLecturer from "@shared/AddLecturer.shared";
import { useRouter } from "expo-router";
import React from "react";

export default function ManagerAddLecturerScreen() {
  const router = useRouter();

  return (
    <>
      <SharedAddLecturer viewMode="manager" onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
