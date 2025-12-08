import SharedListClasses from "@shared/ListClasses.shared";
import { useRouter } from "expo-router";
import React from "react";

export default function ManagerListClassesScreen() {
  const router = useRouter();

  return (
    <SharedListClasses
      viewMode="manager"
      onAddClass={() => router.push("/classes/add")}
      onEditClass={(classData) =>
        router.push({
          pathname: "/classes/edit",
          params: classData,
        })
      }
    />
  );
}
