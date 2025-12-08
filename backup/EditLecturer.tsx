import SharedEditLecturer from "@shared/EditLecturer.shared";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function ManagerEditLecturerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialData = {
    name: params.name as string,
    employee_id_number: params.nip as string,
    email: params.email as string,
    profile_image: params.image as string,
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedEditLecturer viewMode="manager" lecturerId={params.id as string} initialData={initialData} onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
