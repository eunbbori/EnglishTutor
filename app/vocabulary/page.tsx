"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface VocabularyWord {
  id: string;
  word: string;
  meaning: string | null;
  example: string | null;
  memo: string | null;
  sourceType: string;
  createdAt: string;
}

export default function VocabularyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWord, setNewWord] = useState({
    word: "",
    meaning: "",
    example: "",
    memo: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch vocabulary
  useEffect(() => {
    if (status === "authenticated") {
      fetchVocabulary();
    }
  }, [status]);

  const fetchVocabulary = async () => {
    try {
      const response = await fetch("/api/vocabulary");
      if (response.ok) {
        const data = await response.json();
        setWords(data.words);
      }
    } catch (error) {
      console.error("Failed to fetch vocabulary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.word.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWord),
      });

      if (response.ok) {
        await fetchVocabulary();
        setNewWord({ word: "", meaning: "", example: "", memo: "" });
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to add word:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm("이 단어를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/vocabulary/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWords(words.filter((w) => w.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete word:", error);
    }
  };

  // Filter words by search query
  const filteredWords = words.filter(
    (w) =>
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.meaning?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              나만의 단어장
            </h1>
            <p className="text-muted-foreground mt-1">
              저장한 단어: {words.length}개
            </p>
          </div>
        </div>

        {/* Add Word Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              단어 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 단어 추가</DialogTitle>
              <DialogDescription>
                단어와 뜻을 입력하세요. 예문과 메모는 선택사항입니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  단어 *
                </label>
                <Input
                  placeholder="예: grateful"
                  value={newWord.word}
                  onChange={(e) =>
                    setNewWord({ ...newWord, word: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">뜻</label>
                <Input
                  placeholder="예: 감사하는"
                  value={newWord.meaning}
                  onChange={(e) =>
                    setNewWord({ ...newWord, meaning: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">예문</label>
                <Textarea
                  placeholder="예: I'm grateful for your help."
                  value={newWord.example}
                  onChange={(e) =>
                    setNewWord({ ...newWord, example: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">메모</label>
                <Textarea
                  placeholder="자유롭게 메모하세요"
                  value={newWord.memo}
                  onChange={(e) =>
                    setNewWord({ ...newWord, memo: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                취소
              </Button>
              <Button onClick={handleAddWord} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "추가"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="단어 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Word List */}
      {filteredWords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "검색 결과가 없습니다"
                : "아직 저장한 단어가 없습니다"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                첫 단어 추가하기
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredWords.map((word) => (
            <Card key={word.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{word.word}</h3>
                      <Badge variant="outline" className="text-xs">
                        {word.sourceType === "manual" ? "직접 추가" : "일기"}
                      </Badge>
                    </div>
                    {word.meaning && (
                      <p className="text-muted-foreground mb-2">
                        {word.meaning}
                      </p>
                    )}
                    {word.example && (
                      <div className="p-3 bg-muted/50 rounded-lg mb-2 italic text-sm">
                        "{word.example}"
                      </div>
                    )}
                    {word.memo && (
                      <p className="text-sm text-muted-foreground">
                        📝 {word.memo}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(word.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteWord(word.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
