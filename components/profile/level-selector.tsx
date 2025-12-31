"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type UserLevel = "detailed" | "concise";

interface UserProfile {
  userId: string;
  level: UserLevel;
  learningGoal: string | null;
  createdAt: string;
  updatedAt: string;
}

export function LevelSelector() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDetailed, setIsDetailed] = useState(true); // true = detailed, false = concise
  const [learningGoal, setLearningGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Fetch user profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        setIsDetailed(data.data.level === "detailed");
        setLearningGoal(data.data.learningGoal || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "프로필 불러오기 실패",
        description: "프로필을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const level: UserLevel = isDetailed ? "detailed" : "concise";

      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level,
          learningGoal: learningGoal || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        toast({
          title: "저장 완료",
          description: "학습 레벨이 업데이트되었습니다.",
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "저장 실패",
        description: "프로필 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">설명 스타일 설정</h2>
        <p className="text-sm text-muted-foreground">
          원하는 설명 스타일을 선택하세요
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isDetailed}
            onChange={(e) => setIsDetailed(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
          />
          <div className="flex-1">
            <div className="font-medium">초보자를 위한 자세한 설명</div>
            <p className="text-xs text-muted-foreground">
              {isDetailed
                ? "한국어 위주로 단어 하나하나 자세하게 설명합니다"
                : "핵심만 간결하게 설명합니다"}
            </p>
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">학습 목표 (선택사항)</label>
        <input
          type="text"
          value={learningGoal}
          onChange={(e) => setLearningGoal(e.target.value)}
          placeholder="예: 비즈니스 영어 회화 향상"
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? "저장 중..." : "저장"}
      </button>

      {profile && (
        <div className="text-xs text-muted-foreground">
          마지막 업데이트: {new Date(profile.updatedAt).toLocaleString("ko-KR")}
        </div>
      )}
    </div>
  );
}
