import SharedEditClasses from "@shared/EditClasses.shared";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function ManagerEditClassesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Kelas",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />
      <SharedEditClasses
        viewMode="admin"
        classId={params.id_class as string}
        initialData={{
          code_class: params.code_class as string,
          code_subject: params.code_subject as string,
          name_subject: params.name_subject as string,
          member_class: params.member_class as string,
          id_academic_period: params.id_academic_period as string,
          day_of_week: params.day_of_week as string,
          start_time: params.start_time as string,
          end_time: params.end_time as string,
        }}
        onBack={() => router.back()}
        onSuccess={() => router.back()}
      />
    </>
  );
}
