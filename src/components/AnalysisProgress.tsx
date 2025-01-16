import { Progress } from "@/components/ui/progress";

export interface AnalysisStage {
  label: string;
  progress: number;
}

interface AnalysisProgressProps {
  stages: AnalysisStage[];
  currentStage: number;
}

export const AnalysisProgress = ({ stages, currentStage }: AnalysisProgressProps) => {
  const totalStages = stages.length;
  const progress = ((currentStage + 1) / totalStages) * 100;
  const currentStageInfo = stages[currentStage] || stages[stages.length - 1];

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-500">
        <span>{currentStageInfo.label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="text-xs text-gray-400">
        Stage {currentStage + 1} of {totalStages}
      </div>
    </div>
  );
}; 