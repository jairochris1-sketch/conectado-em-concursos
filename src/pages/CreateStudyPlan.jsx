import React from "react";
import SubjectManager from "@/components/study/SubjectManager";
import WeeklyTrailBoard from "@/components/study/WeeklyTrailBoard";

export default function CreateStudyPlan() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <SubjectManager />
      <WeeklyTrailBoard />
    </div>
  );
}