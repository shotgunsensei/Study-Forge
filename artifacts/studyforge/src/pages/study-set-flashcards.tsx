import { useState } from "react";
import { useGetStudySet, getGetStudySetQueryKey, useUpdateFlashcardStatus } from "@workspace/api-client-react";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, RotateCcw, Check, X, BrainCircuit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
type FlashcardStatusBodyStatus = "new" | "known" | "review";

export default function StudySetFlashcards() {
  const [, params] = useRoute("/sets/:id/flashcards");
  const id = parseInt(params?.id || "0", 10);
  
  const { data: set, isLoading } = useGetStudySet(id, { 
    query: { enabled: !!id, queryKey: getGetStudySetQueryKey(id) } 
  });
  
  const updateStatus = useUpdateFlashcardStatus();
  const queryClient = useQueryClient();

  useDocumentMeta(set ? `${set.title} Flashcards` : "Flashcards");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Skeleton className="h-96 w-full max-w-2xl rounded-2xl" />
      </div>
    );
  }

  if (!set || set.flashcards.length === 0) {
    return <div className="text-center py-20">No flashcards available.</div>;
  }

  const cards = set.flashcards;
  const currentCard = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(curr => curr + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(curr => curr - 1);
      setIsFlipped(false);
    }
  };

  const handleStatus = async (status: FlashcardStatusBodyStatus) => {
    try {
      await updateStatus.mutateAsync({
        id,
        cardId: currentCard.id,
        data: { status }
      });
      // Locally patch
      queryClient.setQueryData(getGetStudySetQueryKey(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          flashcards: old.flashcards.map((c: any) => 
            c.id === currentCard.id ? { ...c, status } : c
          )
        };
      });
      toast.success(`Marked as ${status}`);
      handleNext();
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <Link href={`/sets/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Set
          </Button>
        </Link>
        <div className="text-sm font-medium text-muted-foreground">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] perspective-1000">
        <div 
          className={`relative w-full h-full max-h-[500px] cursor-pointer transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front */}
          <div className="absolute inset-0 bg-card border-2 border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center backface-hidden shadow-lg hover-elevate">
            <div className="absolute top-4 left-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Question</div>
            <p className="text-2xl md:text-4xl font-medium">{currentCard.front}</p>
            <div className="absolute bottom-4 flex items-center gap-2 text-muted-foreground text-sm">
              <RotateCcw className="h-4 w-4" /> Click to flip
            </div>
          </div>
          
          {/* Back */}
          <div className="absolute inset-0 bg-primary/5 border-2 border-primary/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180 shadow-lg hover-elevate">
            <div className="absolute top-4 left-4 text-xs font-semibold text-primary uppercase tracking-widest">Answer</div>
            <p className="text-xl md:text-3xl">{currentCard.back}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        
        {isFlipped && (
          <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-4">
            <Button variant="destructive" onClick={() => handleStatus("review")} className="bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white">
              <X className="mr-2 h-4 w-4" /> Needs Review
            </Button>
            <Button variant="default" onClick={() => handleStatus("known")} className="bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white">
              <Check className="mr-2 h-4 w-4" /> Known
            </Button>
          </div>
        )}

        <Button variant="outline" onClick={handleNext} disabled={currentIndex === cards.length - 1}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}