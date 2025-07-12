
import { Card, CardContent } from "@/components/ui/card";

export function LoadingCard() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading assignment details...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
