"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
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
  context: string | null;
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

  const handleDeleteWord = async (id: string) => {
    if (!confirm("이 표현을 삭제하시겠습니까?")) return;

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
              나만의 표현노트
            </h1>
            <p className="text-muted-foreground mt-1">
              저장한 표현: {words.length}개
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="표현 검색..."
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
                : "아직 저장한 표현이 없습니다"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-muted-foreground mt-4">
                일기를 쓰면서 텍스트를 드래그하여 표현을 저장해보세요.
              </p>
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
                      {word.sourceType === "manual" && (
                        <Badge variant="outline" className="text-xs">
                          직접 추가
                        </Badge>
                      )}
                    </div>
                    {word.meaning && (
                      <p className="text-muted-foreground mb-2">
                        {word.meaning}
                      </p>
                    )}
                    {(word.context || word.example) && (
                      <div className="p-3 bg-muted/50 rounded-lg mb-2 text-sm">
                        {word.context && (
                          <div className="text-xs text-muted-foreground mb-1 font-medium">
                            내가 쓴 문장
                          </div>
                        )}
                        <p className="italic">"{word.context || word.example}"</p>
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
