import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { CorrectionResponse } from "@/lib/ai/schema";
import { CheckCircle2, Lightbulb, Sparkles } from "lucide-react";

interface CorrectionCardProps {
  correction: CorrectionResponse;
}

export function CorrectionCard({ correction }: CorrectionCardProps) {
  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-lg font-semibold text-green-900 leading-relaxed">
              {correction.correctedText}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {correction.koreanExplanation}
          </p>
        </div>
      </CardContent>

      {correction.alternatives && correction.alternatives.length > 0 && (
        <CardFooter className="flex flex-col items-start gap-2 pt-3 border-t">
          <p className="text-xs font-medium text-muted-foreground">
            다른 표현 방식:
          </p>
          <div className="flex flex-col gap-2 w-full">
            {correction.alternatives.map((alt, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Badge
                  variant={alt.type === "Formal" ? "default" : alt.type === "Casual" ? "secondary" : "outline"}
                  className="text-xs shrink-0"
                >
                  {alt.type}
                </Badge>
                <span className="text-sm text-foreground">{alt.text}</span>
              </div>
            ))}
          </div>
        </CardFooter>
      )}

      {/* Insight Section - Recurring Mistake Pattern Alert */}
      {correction.insight && (
        <div className="border-t bg-yellow-50/50 p-4">
          <Alert className="bg-yellow-50 border-yellow-200">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="ml-2">
              <div className="space-y-3">
                {/* Insight Message */}
                <div className="text-sm text-yellow-900 whitespace-pre-line leading-relaxed">
                  {correction.insight}
                </div>

                {/* Practice Button - Placeholder for Phase 2 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-yellow-100 border-yellow-300 text-yellow-900 hover:bg-yellow-200 hover:text-yellow-900"
                  disabled
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  연습 문제 풀기 (준비 중)
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  );
}
